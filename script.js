document.addEventListener('DOMContentLoaded', function() {
    // Initialize day display
    updateDayDisplay();
    
    // Setup menu toggle
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    menuBtn.addEventListener('click', function() {
        dropdownMenu.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!menuBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
});

function updateDayDisplay() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayTextElement = document.getElementById('dayText');
    const specialScheduleElement = document.getElementById('specialSchedule');
    
    // Check if it's a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayTextElement.textContent = 'No School';
        specialScheduleElement.innerHTML = '';
        return;
    }
    
    // Fetch current day/schedule from server
    fetch('get-day.php')
        .then(response => response.json())
        .then(data => {
            if (data.manual_day) {
                dayTextElement.textContent = `Day ${data.manual_day}`;
            } else {
                // Calculate automatic day if no manual override
                const startDate = new Date('2023-09-05'); // Adjust this to a known Day 1
                const diffTime = today - startDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const dayNumber = (diffDays % 2) + 1; // Alternates between 1 and 2
                dayTextElement.textContent = `Day ${dayNumber}`;
            }
            
            specialScheduleElement.innerHTML = data.special_schedule === 'Regular Day' 
                ? '<span class="schedule-badge">Regular Day</span>'
                : `<span class="schedule-badge">${data.special_schedule}</span>`;
        })
        .catch(error => {
            console.error('Error fetching day data:', error);
            // Fallback to automatic calculation
            const startDate = new Date('2023-09-05');
            const diffTime = today - startDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const dayNumber = (diffDays % 2) + 1;
            dayTextElement.textContent = `Day ${dayNumber}`;
            specialScheduleElement.innerHTML = '<span class="schedule-badge">Regular Day</span>';
        });
}
