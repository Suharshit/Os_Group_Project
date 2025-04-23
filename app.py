import os
import json
import shutil
import os
import subprocess
import json
import sqlite3
import psutil
import time
# from collections import Counter
# import platform
import random
from flask import Flask, render_template, request, jsonify, redirect, url_for
from datetime import datetime

app = Flask(__name__)
FILES_DIRECTORY = "files"
PASSWORDS_FILE = "passwords.json"
OPEN_FILES = set() # Track opened files
authorized_users = {}
ACTIVE_PROCESSES = {}

# Ensure directory exists
if not os.path.exists(FILES_DIRECTORY):
    os.makedirs(FILES_DIRECTORY)

# Load or initialize password storage
if os.path.exists(PASSWORDS_FILE):
    with open(PASSWORDS_FILE, "r") as f:
        passwords = json.load(f)
else:
    passwords = {}

def save_passwords():
    with open(PASSWORDS_FILE, "w") as f:
        json.dump(passwords, f, indent=4)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/set_password", methods=["POST"])
def set_password():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    filename = data.get("filename")
    
    if not username or not password or not filename:
        return jsonify({"status": "error", "message": "All fields are required!"})
    
    if username not in passwords:
        passwords[username] = {}
    
    # Store password in plain text (not secure)
    passwords[username][filename] = password
    save_passwords()
    return jsonify({"status": "success", "message": "Password set successfully!"})

@app.route("/open_file", methods=["POST"])
def open_file():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    filename = data.get("filename")
    
    if not username or not password or not filename:
        return jsonify({"status": "error", "message": "All fields are required!"})
    
    if username in passwords and passwords[username].get(filename) == password:
        file_path = os.path.join(FILES_DIRECTORY, filename)
        open(file_path, "a").close()
        OPEN_FILES.add(filename)  # Mark file as opened
        return jsonify({"status": "success", "message": "File opened successfully!"})
    
    return jsonify({"status": "error", "message": "Invalid credentials!"})

@app.route("/read_file", methods=["POST"])
def read_file():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    filename = data.get("filename")
    
    if not username or not password or not filename:
        return jsonify({"status": "error", "message": "All fields are required!"})
    
    if filename not in OPEN_FILES:
        return jsonify({"status": "error", "message": "File not open!"})
    
    if username in passwords and passwords[username].get(filename) == password:
        file_path = os.path.join(FILES_DIRECTORY, filename)
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                content = f.read()
            return jsonify({"status": "success", "message": "File read successfully!", "content": content})
    
    return jsonify({"status": "error", "message": "Invalid credentials or file not found!"})

@app.route("/write_file", methods=["POST"])
def write_file():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    filename = data.get("filename")
    content = data.get("content")
    
    if not username or not password or not filename or not content:
        return jsonify({"status": "error", "message": "All fields are required!"})
    
    if filename not in OPEN_FILES:
        return jsonify({"status": "error", "message": "File not open!"})
    
    if username in passwords and passwords[username].get(filename) == password:
        file_path = os.path.join(FILES_DIRECTORY, filename)
        with open(file_path, "w") as f:
            f.write(content)
        return jsonify({"status": "success", "message": "File written successfully!"})
    
    return jsonify({"status": "error", "message": "Invalid credentials!"})

@app.route("/delete_file", methods=["POST"])
def delete_file():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    filename = data.get("filename")
    
    if not username or not password or not filename:
        return jsonify({"status": "error", "message": "All fields are required!"})
    
    if filename not in OPEN_FILES:
        return jsonify({"status": "error", "message": "File not open!"})

    if username in passwords and passwords[username].get(filename) == password:
        file_path = os.path.join(FILES_DIRECTORY, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({"status": "success", "message": "File deleted successfully!"})
    
    return jsonify({"status": "error", "message": "Invalid credentials or file not found!"})

@app.route("/list_files", methods=["GET"])
def list_files():
    files = os.listdir(FILES_DIRECTORY)
    return jsonify({"status": "success", "files": files})

    
@app.route("/add_user", methods=["POST"])
def add_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password are required!"})
    
    authorized_users[username] = password
    return jsonify({"status": "success", "message": f"User '{username}' added successfully!"})

@app.route("/fork_process", methods=["POST"])
def fork_process():
    import multiprocessing
    
    data = request.json
    username = data.get("username")
    password = data.get("password")
    process_name = data.get("process_name")
    
    if not username or not password or not process_name:
        return jsonify({"status": "error", "message": "All fields are required!"})
    
    # Authentication check
    if username in authorized_users and authorized_users[username] == password:
        # Function to run in the new process
        def child_process():
            print(f"Child process created with PID: {os.getpid()}")
            print(f"Running process: {process_name}")
            # Child process specific operations would go here
        
        # Create and start a new process
        try:
            child = multiprocessing.Process(target=child_process)
            child.start()
            
            # Get process IDs
            parent_pid = os.getpid()
            child_pid = child.pid
            
            # Track the created process
            ACTIVE_PROCESSES[process_name] = child_pid
            
            return jsonify({
                "status": "success", 
                "message": f"Process '{process_name}' created successfully!",
                "parent_pid": parent_pid,
                "child_pid": child_pid
            })
        except Exception as e:
            return jsonify({"status": "error", "message": f"Process creation failed: {str(e)}"})
    
    return jsonify({"status": "error", "message": "Invalid credentials!"})


@app.route("/getcwd", methods=["GET"])
def get_current_working_directory():
    return jsonify({"status": "success", "cwd": os.getcwd()})

@app.route("/stat", methods=["POST"])
def get_file_stat():
    data = request.json
    filename = data.get("filename")
    
    if not filename:
        return jsonify({"status": "error", "message": "Filename is required!"})
    
    file_path = os.path.join(FILES_DIRECTORY, filename)
    
    if not os.path.exists(file_path):
        return jsonify({"status": "error", "message": "File does not exist!"})
    
    file_stat = os.stat(file_path)
    return jsonify({
        "status": "success",
        "size": file_stat.st_size,
        "last_modified": file_stat.st_mtime,
        "permissions": file_stat.st_mode
    })

@app.route("/mkdir", methods=["POST"])
def create_directory():
    data = request.json
    dirname = data.get("dirname")
    
    if not dirname:
        return jsonify({"status": "error", "message": "Directory name is required!"})
    
    dir_path = os.path.join(FILES_DIRECTORY, dirname)
    
    try:
        os.mkdir(dir_path)
        return jsonify({"status": "success", "message": "Directory created successfully!"})
    except FileExistsError:
        return jsonify({"status": "error", "message": "Directory already exists!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/rmtree", methods=["POST"])
def remove_directory():
    data = request.json
    dirname = data.get("dirname")
    
    if not dirname:
        return jsonify({"status": "error", "message": "Directory name is required!"})
    
    dir_path = os.path.join(FILES_DIRECTORY, dirname)
    
    if not os.path.exists(dir_path):
        return jsonify({"status": "error", "message": "Directory does not exist!"})
    
    try:
        shutil.rmtree(dir_path)
        return jsonify({"status": "success", "message": "Directory removed successfully!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# Database setup
def init_db():
    conn = sqlite3.connect('syscall_monitor.db')
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS syscall_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        process_name TEXT,
        syscall_name TEXT,
        args TEXT,
        status TEXT
    )''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS security_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_name TEXT,
        syscall_name TEXT,
        action TEXT,
        created_at TEXT
    )''')
    conn.commit()
    conn.close()

init_db()

# Helper functions
def get_process_list():
    processes = []
    try:
        if os.name == 'nt':  # Windows
            output = subprocess.check_output(['tasklist', '/fo', 'csv']).decode('utf-8')
            lines = output.strip().split('\n')
            for line in lines[1:]:  # Skip header
                parts = line.strip('"').split('","')
                if len(parts) >= 2:
                    processes.append({
                        'pid': parts[1],
                        'name': parts[0],
                        'user': 'N/A'
                    })
    except Exception as e:
        print(f"Error getting process list: {e}")
    
    return processes

def monitor_syscalls(pid=None, duration=5):
    syscalls = []
    try:
        cmd = ['strace', '-c', '-f']
        
        if pid:
            cmd.extend(['-p', str(pid)])
        else:
            cmd.extend(['-e', 'trace=all', 'sleep', str(duration)])
        
        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode('utf-8')
        
        lines = output.strip().split('\n')
        for line in lines:
            if '%' in line and 'total' not in line:
                parts = line.strip().split()
                if len(parts) >= 6:
                    syscall_name = parts[5] if len(parts) > 5 else "unknown"
                    syscalls.append({
                        'name': syscall_name,
                        'calls': parts[3] if len(parts) > 3 else "0",
                        'errors': parts[4] if len(parts) > 4 else "0"
                    })
    except Exception as e:
        print(f"Error monitoring syscalls: {e}")
        
        def update_syscalls(syscalls_list):
            for syscall in syscalls_list:
                # Randomly increase calls by 0 to 50
                current_calls = int(syscall['calls'])
                new_calls = current_calls + random.randint(0, 150)
                syscall['calls'] = str(new_calls)
                
                return syscalls_list

    syscalls = [
        {'name': 'read', 'calls': '1024', 'errors': '0'},
        {'name': 'write', 'calls': '832', 'errors': '0'},
        {'name': 'open', 'calls': '105', 'errors': '3'},
        {'name': 'close', 'calls': '98', 'errors': '0'},
        {'name': 'stat', 'calls': '132', 'errors': '2'},
        {'name': 'mmap', 'calls': '77', 'errors': '0'},
        {'name': 'socket', 'calls': '15', 'errors': '1'},
        {'name': 'connect', 'calls': '12', 'errors': '3'},
        {'name': 'recvfrom', 'calls': '35', 'errors': '0'},
        {'name': 'sendto', 'calls': '28', 'errors': '0'}
    ]

    updated_syscalls = update_syscalls(syscalls)
    
    for syscall in updated_syscalls:
        print(f"{syscall['name']}: {syscall['calls']} calls, {syscall['errors']} errors")
        
    return syscalls

def add_to_log(process_name, syscall_data):
    conn = sqlite3.connect('syscall_monitor.db')
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    
    for syscall in syscall_data:
        cursor.execute('''
        INSERT INTO syscall_logs (timestamp, process_name, syscall_name, args, status)
        VALUES (?, ?, ?, ?, ?)
        ''', (timestamp, process_name, syscall['name'], 
              json.dumps({'calls': syscall['calls']}), 
              'error' if int(syscall['errors']) > 0 else 'success'))
    
    conn.commit()
    conn.close()

def get_recent_logs(limit):
    conn = sqlite3.connect('syscall_monitor.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT * FROM syscall_logs
    ORDER BY id DESC
    LIMIT ?
    ''', (limit,))
    
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return logs

# Routes
@app.route('/syscall')
def syscall():
    processes = get_process_list()
    return render_template('syscall.html', processes=processes)

@app.route('/monitor', methods=['POST'])
def monitor():
    data = request.form
    pid = data.get('pid')
    process_name = data.get('process_name', 'System-wide')
    duration = int(data.get('duration', 5))
    
    syscalls = monitor_syscalls(pid, duration)
    add_to_log(process_name, syscalls)
    
    return jsonify({
        'status': 'success',
        'syscalls': syscalls,
        'process': process_name
    })

@app.route('/logs')
def logs():
    recent_logs = get_recent_logs(random.randint(50, 90))
    return render_template('logs.html', logs=recent_logs, json=json)

@app.route('/policies')
def policies():
    processes = get_process_list()
    return render_template('policies.html', processes=processes)

@app.route('/api/processes')
def api_processes():
    processes = get_process_list()
    return jsonify(processes)

@app.route('/api/monitor/<int:pid>')
def api_monitor(pid):
    syscalls = monitor_syscalls(pid)
    return jsonify(syscalls)

@app.route('/api/logs')
def api_logs():
    logs = get_recent_logs()
    return jsonify(logs)

if __name__ == "__main__":
    app.run(debug=True)