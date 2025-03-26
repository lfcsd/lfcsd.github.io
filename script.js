document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin subdomain
    const isAdminPanel = window.location.hostname === 'admin.lfcsddays.com';
    
    // Show admin panel if on admin subdomain
    if (isAdminPanel) {
        document.getElementById('adminPanel').style.display = 'block';
    }
    
    // Initialize day display
    updateDayDisplay();
    
    // Check for manual overrides in localStorage
    checkForOverrides();
});

function updateDayDisplay() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayTextElement = document.getElementById('dayText');
    const specialScheduleElement = document.getElementById('specialSchedule');
    
    // Check if it's a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayTextElement.textContent = 'No School';
        specialScheduleElement.textContent = '';
        return;
    }
    
    // Check localStorage for manual override
    const manualDay = localStorage.getItem('manualDay');
    const specialSchedule = localStorage.getItem('specialSchedule') || 'Regular Day';
    
    if (manualDay) {
        dayTextElement.textContent = `Day ${manualDay}`;
        specialScheduleElement.textContent = specialSchedule;
        return;
    }
    
    // Calculate automatic day (alternating between Day 1 and Day 2 on weekdays)
    // This uses a fixed starting point (you may want to adjust this)
    const startDate = new Date('2025-03-26'); // Example start date (a known Day 1)
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayNumber = (diffDays % 2) + 1; // Alternates between 1 and 2
    
    dayTextElement.textContent = `Day ${dayNumber}`;
    specialScheduleElement.textContent = 'Regular Day';
}

function checkForOverrides() {
    const manualDay = localStorage.getItem('manualDay');
    const specialSchedule = localStorage.getItem('specialSchedule');
    
    if (manualDay) {
        document.getElementById('dayText').textContent = `Day ${manualDay}`;
    }
    
    if (specialSchedule) {
        document.getElementById('specialSchedule').textContent = specialSchedule;
    }
}

// Admin functions
function setDay(dayNumber) {
    localStorage.setItem('manualDay', dayNumber);
    document.getElementById('dayText').textContent = `Day ${dayNumber}`;
}

function setSpecialSchedule(scheduleType) {
    localStorage.setItem('specialSchedule', scheduleType);
    document.getElementById('specialSchedule').textContent = scheduleType;
}

function resetToAuto() {
    localStorage.removeItem('manualDay');
    localStorage.removeItem('specialSchedule');
    updateDayDisplay();
}
