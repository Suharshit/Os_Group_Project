// Global variables
let riskChart = null;

// Map of high-risk system calls
const highRiskSyscalls = [
    'ptrace', 'exec', 'execve', 'fork', 'kill', 'socket', 'connect',
    'bind', 'listen', 'accept', 'clone', 'mount', 'umount'
];

// Map of medium-risk system calls
const mediumRiskSyscalls = [
    'open', 'openat', 'creat', 'unlink', 'rename', 'chown',
    'chmod', 'mkdir', 'rmdir', 'pipe', 'dup', 'setuid',
    'setgid'
];

// Function to determine risk level of a system call
function getRiskLevel(syscall) {
    const errorCount = parseInt(syscall.error);
    if (highRiskSyscalls.includes(syscall) || errorCount >= 4) {
        return 'high';
    } else if (mediumRiskSyscalls.includes(syscall) || errorCount == 2) {
        return 'medium';
    } else {
        return 'low';
    }
}

// Function to display risk badge
function getRiskBadge(risk) {
    switch (risk) {
        case 'high':
            return '<span class="status-badge error">High Risk</span>';
        case 'medium':
            return '<span class="status-badge warn" style="background-color: rgba(251, 188, 5, 0.2); color: #e37400;">Medium Risk</span>';
        default:
            return '<span class="status-badge success">Low Risk</span>';
    }
}

// Initialize charts
function initCharts() {
    const ctx = document.getElementById('risk-chart').getContext('2d');
    
    riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(52, 168, 83, 0.7)',
                    'rgba(251, 188, 5, 0.7)',
                    'rgba(234, 67, 53, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 168, 83, 1)',
                    'rgba(251, 188, 5, 1)',
                    'rgba(234, 67, 53, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'System Call Risk Distribution'
                }
            }
        }
    });
}

// Update chart with new data
function updateChart(syscalls) {
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    
    syscalls.forEach(call => {
        const risk = getRiskLevel(call.name);
        if (risk === 'high') highRisk++;
        else if (risk === 'medium') mediumRisk++;
        else lowRisk++;
    });
    
    // Update risk counts
    document.getElementById('high-risk').textContent = highRisk;
    document.getElementById('medium-risk').textContent = mediumRisk;
    document.getElementById('low-risk').textContent = lowRisk;
    
    // Update chart
    if (riskChart) {
        riskChart.data.datasets[0].data = [lowRisk, mediumRisk, highRisk];
        riskChart.update();
    }
}

// Display monitoring results
function displayResults(data) {
    const syscalls = data.syscalls;
    const processName = data.process || 'System-wide';
    
    // Clear previous results
    const tableBody = document.getElementById('syscalls-table');
    tableBody.innerHTML = '';
    
    // Sort syscalls by calls (descending)
    syscalls.sort((a, b) => parseInt(b.calls) - parseInt(a.calls));
    
    // Populate table
    syscalls.forEach(call => {
        const risk = getRiskLevel(call.name);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${call.name}</td>
            <td>${call.calls}</td>
            <td>${call.errors}</td>
            <td>${getRiskBadge(risk)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update process name
    document.getElementById('process-name').textContent = processName;
    
    // Show results section
    document.getElementById('results').classList.remove('hidden');
    
    // Update chart
    updateChart(syscalls);
}

// Handle form submission for monitoring
document.getElementById('monitor-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading spinner
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    
    // Get form data
    const formData = new FormData(this);
    const pid = formData.get('pid');
    const duration = formData.get('duration');
    
    // Get process name for display
    const processSelect = document.getElementById('process-select');
    const processName = pid ? 
        processSelect.options[processSelect.selectedIndex].text : 
        'System-wide monitoring';
    
    // Add process name to form data
    formData.append('process_name', processName);
    
    // Send API request
    fetch('/monitor', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Hide loading spinner
        document.getElementById('loading').classList.add('hidden');
        
        // Display results
        displayResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('loading').classList.add('hidden');
        alert('An error occurred while monitoring system calls. Please try again.');
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
});