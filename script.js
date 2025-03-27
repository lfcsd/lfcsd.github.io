document.addEventListener('DOMContentLoaded', function() {
  const db = firebase.firestore();
  updateTime();

  updateTime();
  setInterval(updateTime, 60000);
  // Menu toggle functionality (keep your existing code)
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

  // Firestore listener with FORCED display
  db.collection("settings").doc("current").onSnapshot((doc) => {
    const data = doc.data() || {
      manualDay: null,
      schedule: "Regular Day", // Default value
      autoMode: true
    };
    
    // DEBUG: Log the received data
    console.log("Firestore data:", data);
    
    updateDisplay(data);
  });

  function updateDisplay(data) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayTextElement = document.getElementById('dayText');
    const specialScheduleElement = document.getElementById('specialSchedule');

    // DEBUG: Log current display state
    console.log("Updating display with:", data);

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayTextElement.textContent = 'No School';
      specialScheduleElement.innerHTML = '';
      return;
    }

    // ALWAYS create schedule badge - no conditions
    specialScheduleElement.innerHTML = `
      <span class="schedule-badge">
        ${data.schedule || 'Regular Day'}
      </span>
    `;

    // Day calculation
    if (data.autoMode !== false && !data.manualDay) {
      const startDate = new Date('2025-03-26');
      const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      dayTextElement.textContent = `Day ${(diffDays % 2) + 1}`;
    } else {
      dayTextElement.textContent = `Day ${data.manualDay}`;
    }
  }
});

// Time display function (add this near your other DOMContentLoaded code)
function updateTime() {
  const options = {
    timeZone: 'America/New_York',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };
  
  const now = new Date();
  const timeString = now.toLocaleString('en-US', options);
  document.getElementById('timeDisplay').textContent = timeString;
}
});
