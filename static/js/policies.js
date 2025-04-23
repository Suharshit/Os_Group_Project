// Custom system call selection
document.addEventListener('DOMContentLoaded', function() {
    const syscallSelect = document.getElementById('syscall-name');
    
    // Common system calls
    const commonSyscalls = [
        { name: 'open', description: 'Open a file' },
        { name: 'read', description: 'Read from a file' },
        { name: 'write', description: 'Write to a file' },
        { name: 'close', description: 'Close a file descriptor' },
        { name: 'socket', description: 'Create a socket' },
        { name: 'connect', description: 'Connect to a remote socket' },
        { name: 'accept', description: 'Accept a connection on a socket' },
        { name: 'bind', description: 'Bind a socket to an address' },
        { name: 'listen', description: 'Listen for connections on a socket' },
        { name: 'fork', description: 'Create a new process' },
        { name: 'exec', description: 'Execute a program' },
        { name: 'exit', description: 'Exit the current process' },
        { name: 'kill', description: 'Send a signal to a process' },
        { name: 'ptrace', description: 'Process trace' },
        { name: 'mmap', description: 'Map files or devices into memory' },
        { name: 'chown', description: 'Change file owner and group' },
        { name: 'chmod', description: 'Change file permissions' },
        { name: 'mkdir', description: 'Create a directory' },
        { name: 'rmdir', description: 'Remove a directory' },
        { name: 'rename', description: 'Rename a file' },
        { name: 'unlink', description: 'Delete a name from the filesystem' }
    ];
    
    // Add options for common system calls
    syscallSelect.innerHTML = '<option value="*">All System Calls</option>';
    
    commonSyscalls.forEach(syscall => {
        const option = document.createElement('option');
        option.value = syscall.name;
        option.textContent = `${syscall.name} - ${syscall.description}`;
        syscallSelect.appendChild(option);
    });
    
    // Custom option
    const customOption = document.createElement('option');
    customOption.value = "custom";
    customOption.textContent = "Custom system call...";
    syscallSelect.appendChild(customOption);
    
    // Handle custom selection
    syscallSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            const customName = prompt('Enter system call name:');
            if (customName && customName.trim() !== '') {
                // Add new option
                const newOption = document.createElement('option');
                newOption.value = customName.trim();
                newOption.textContent = customName.trim();
                newOption.selected = true;
                
                // Insert before the custom option
                syscallSelect.insertBefore(newOption, customOption);
            } else {
                // Revert to first option if canceled
                this.selectedIndex = 0;
            }
        }
    });
});