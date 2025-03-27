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

   import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
      .then(({ onSnapshot, doc }) => {
        const unsubscribe = onSnapshot(doc(db, "nextDaySettings", "current"), 
          (docSnapshot) => {
            let data = getDefaultSettings();
            if (docSnapshot.exists()) {
              const docData = docSnapshot.data();
              // Merge with defaults
              data = {
                ...data,
                ...docData,
                // Ensure manualDay is valid
                manualDay: (docData.manualDay === 1 || docData.manualDay === 2) ? docData.manualDay : null
              };
            }
            updateNextDayDisplay(data);
          },
          (error) => {
            console.error("Firestore error:", error);
            updateNextDayDisplay(getDefaultSettings());
          }
        );

        function updateNextDayDisplay(data) {
          nextDayText.textContent = '';
          nextDaySchedule.innerHTML = '';

          // Schedule badge
          const badge = document.createElement('span');
          badge.className = 'schedule-badge';
          badge.textContent = data.schedule || 'Regular Day';
          nextDaySchedule.appendChild(badge);

          // Day display logic - matches main page behavior exactly
          if (data.autoMode && data.manualDay === null) {
            // Automatic mode - calculate next day
            const dayNumber = calculateDayNumber(getNextSchoolDate());
            nextDayText.textContent = `Day ${dayNumber}`;
          } else if (data.manualDay === 1 || data.manualDay === 2) {
            // Manual override - show the set day
            nextDayText.textContent = `Day ${data.manualDay}`;
          } else {
            // Invalid state - fallback to calculation
            const dayNumber = calculateDayNumber(getNextSchoolDate());
            nextDayText.textContent = `Day ${dayNumber}`;
          }
        }
      })
      .catch(error => {
        console.error("Failed to load Firestore:", error);
        const dayNumber = calculateDayNumber(getNextSchoolDate());
        nextDayText.textContent = `Day ${dayNumber}`;
        nextDaySchedule.innerHTML = '<span class="schedule-badge">Regular Day</span>';
      });
  }
});
