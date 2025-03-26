document.addEventListener('DOMContentLoaded', function() {
    // Menu toggle and day display logic (same as before)
    // ...

    updateDayDisplay();
});

async function updateDayDisplay() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayTextElement = document.getElementById('dayText');
    const specialScheduleElement = document.getElementById('specialSchedule');

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayTextElement.textContent = 'No School';
        specialScheduleElement.innerHTML = '';
        return;
    }

    // Check for manual override
    const autoMode = localStorage.getItem('lfcsd_autoMode') !== 'false';
    const manualDay = localStorage.getItem('lfcsd_manualDay');
    const schedule = localStorage.getItem('lfcsd_schedule') || 'Regular Day';

    if (!autoMode && manualDay) {
        dayTextElement.textContent = `Day ${manualDay}`;
    } else {
        // Automatic day calculation
        const startDate = new Date('2023-09-05');
        const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const dayNumber = (diffDays % 2) + 1;
        dayTextElement.textContent = `Day ${dayNumber}`;
    }

    specialScheduleElement.innerHTML = schedule === 'Regular Day' 
        ? '<span class="schedule-badge">Regular Day</span>'
        : `<span class="schedule-badge">${schedule}</span>`;
}
