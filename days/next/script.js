document.addEventListener('DOMContentLoaded', function() {
  // Menu functionality (same as main page)
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

  // Time display (same as main page)
  function updateTime() {
    const options = {
      timeZone: 'America/New_York',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    document.getElementById('timeDisplay').textContent = 
      new Date().toLocaleString('en-US', options);
  }
  updateTime();
  setInterval(updateTime, 60000);

  // Main logic
  if (window.firebase?.db) {
    const { db } = window.firebase;
    const nextDayText = document.getElementById('nextDayText');
    const nextDaySchedule = document.getElementById('nextDaySchedule');

    function getDefaultSettings() {
      return {
        manualDay: null,
        schedule: "Regular Day",
        autoMode: true
      };
    }

    // Calculate next school day
    function getNextSchoolDate() {
      const today = new Date();
      let nextDay = new Date(today);
      
      // Skip weekends (0=Sunday, 6=Saturday)
      do {
        nextDay.setDate(nextDay.getDate() + 1);
      } while (nextDay.getDay() === 0 || nextDay.getDay() === 6);
      
      return nextDay;
    }

    // Calculate day number (1 or 2)
    function calculateDayNumber(date) {
      const startDate = new Date('2025-03-26'); // Your known Day 1
      const diffTime = date - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return (diffDays % 2) + 1; // Alternates between 1 and 2
    }

    // Firestore listener for next day settings
    import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
      .then(({ onSnapshot, doc }) => {
        // Real-time updates for next day
        const unsubscribe = onSnapshot(doc(db, "nextDaySettings", "current"), (docSnapshot) => {
          const data = docSnapshot.data() || getDefaultSettings();
          updateNextDayDisplay(data);
        });

        function updateNextDayDisplay(data) {
          const nextSchoolDate = getNextSchoolDate();
          
          // Clear previous state
          nextDayText.textContent = '';
          nextDaySchedule.innerHTML = '';

          // Always show schedule badge (including "Regular Day")
          const badge = document.createElement('span');
          badge.className = 'schedule-badge';
          badge.textContent = data.schedule || 'Regular Day';
          nextDaySchedule.appendChild(badge);

          // Day calculation logic
          if (data.autoMode !== false && !data.manualDay) {
            // Automatic day rotation
            const dayNumber = calculateDayNumber(nextSchoolDate);
            nextDayText.textContent = `Day ${dayNumber}`;
          } else {
            // Manual override
            nextDayText.textContent = `Day ${data.manualDay}`;
          }
        }
      })
      .catch(error => {
        console.error("Failed to load Firestore:", error);
        nextDayText.textContent = "Connection Error";
      });
  }
});
