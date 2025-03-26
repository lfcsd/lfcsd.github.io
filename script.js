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
    
    // Calculate automatic day (alternating between Day 1 and Day 2 on weekdays)
    const startDate = new Date('2025-03-26'); // Adjust this to a known Day 1
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayNumber = (diffDays % 2) + 1; // Alternates between 1 and 2
    
    dayTextElement.textContent = `Day ${dayNumber}`;
    specialScheduleElement.innerHTML = '<span class="schedule-badge">Regular Day</span>';
}
