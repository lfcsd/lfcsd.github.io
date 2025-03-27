document.addEventListener('DOMContentLoaded', function() {
  const db = firebase.firestore();
  
  // Menu toggle functionality
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');
  
  menuBtn.addEventListener('click', function() {
    dropdownMenu.classList.toggle('show');
  });
  
  document.addEventListener('click', function(event) {
    if (!menuBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.classList.remove('show');
    }
  });

  // Firestore listener
  db.collection("settings").doc("current").onSnapshot((doc) => {
    const data = doc.data() || {
      manualDay: null,
      schedule: "Regular Day",
      autoMode: true
    };
    
    updateDisplay(data);
  });

  function updateDisplay(data) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayTextElement = document.getElementById('dayText');
    const specialScheduleElement = document.getElementById('specialSchedule');

    // Clear previous content
    dayTextElement.textContent = '';
    specialScheduleElement.innerHTML = '';

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayTextElement.textContent = 'No School';
      return;
    }

    // Always show schedule badge - MODIFIED TO APPEAR ABOVE DAY TEXT
    const scheduleBadge = document.createElement('div');
    scheduleBadge.className = 'schedule-badge';
    scheduleBadge.textContent = data.schedule || 'Regular Day';
    specialScheduleElement.appendChild(scheduleBadge);

    // Day calculation
    if (data.autoMode && (data.manualDay === null || data.manualDay === undefined)) {
      const startDate = new Date('2025-03-26');
      const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      dayTextElement.textContent = `Day ${(diffDays % 2) + 1}`;
    } else {
      dayTextElement.textContent = `Day ${data.manualDay}`;
    }
  }
});
