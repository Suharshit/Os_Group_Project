// Initialize logs chart
document.addEventListener('DOMContentLoaded', function() {
    // Count syscalls by type
    const logRows = document.querySelectorAll('#logs-table tr');
    const syscallCounts = {};
    
    logRows.forEach(row => {
        const syscallName = row.cells[2].textContent;
        if (!syscallCounts[syscallName]) {
            syscallCounts[syscallName] = 0;
        }
        syscallCounts[syscallName]++;
    });
    
    // Get top 5 syscalls
    const sortedSyscalls = Object.entries(syscallCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const labels = sortedSyscalls.map(item => item[0]);
    const data = sortedSyscalls.map(item => item[1]);
    
    // Create chart
    const ctx = document.getElementById('calls-by-type').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Calls',
                data: data,
                backgroundColor: 'rgba(66, 133, 244, 0.7)',
                borderColor: 'rgba(66, 133, 244, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top 5 System Calls'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'System Call'
                    }
                }
            }
        }
    });
});