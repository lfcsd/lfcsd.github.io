document.addEventListener('DOMContentLoaded', function() {
  // Menu functionality
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

  // Time display (EST)
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
    const announcementBar = document.getElementById('announcementBar');

    // ======================
    // DAY CALCULATION LOGIC (UPDATED FOR MIDNIGHT EST)
    // ======================
    const START_DATE = new Date('2025-03-26T00:00:00-05:00'); // Known Day 1 in EST

    function getCurrentESTDate() {
      const now = new Date();
      const estTime = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
      return new Date(estTime);
    }

    function calculateCurrentDay() {
      const estNow = getCurrentESTDate();
      const diffTime = estNow - START_DATE;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return (diffDays % 2) + 1; // Returns 1 or 2
    }

    function getNextDayNumber() {
      return calculateCurrentDay() === 1 ? 2 : 1;
    }

    function getNextSchoolDate() {
      const estNow = getCurrentESTDate();
      let nextDay = new Date(estNow);
      
      // Skip weekends (0=Sunday, 6=Saturday)
      do {
        nextDay.setDate(nextDay.getDate() + 1);
      } while (nextDay.getDay() === 0 || nextDay.getDay() === 6);
      
      return nextDay;
    }

    function getDefaultSettings() {
      return {
        manualDay: null,
        schedule: "Regular Day",
        autoMode: true
      };
    }

    // Initialize Firestore
    import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
      .then(({ onSnapshot, doc }) => {
        // Announcement listener
        onSnapshot(doc(db, "announcements", "current"), (docSnapshot) => {
          if (docSnapshot.exists() && docSnapshot.data().message) {
            const data = docSnapshot.data();
            announcementBar.textContent = data.message;
            announcementBar.style.backgroundColor = data.color || '#6a0dad';
            announcementBar.style.display = 'block';
            document.body.classList.add('has-announcement');
          } else {
            announcementBar.style.display = 'none';
            document.body.classList.remove('has-announcement');
          }
        }, (error) => {
          console.error("Announcement error:", error);
          announcementBar.style.display = 'none';
          document.body.classList.remove('has-announcement');
        });

        // Next day settings listener
        const unsubscribe = onSnapshot(doc(db, "nextDaySettings", "current"), 
          (docSnapshot) => {
            let data = getDefaultSettings();
            if (docSnapshot.exists()) {
              const docData = docSnapshot.data();
              data = {
                ...data,
                ...docData,
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

          // Day display logic - UPDATED FOR MIDNIGHT EST
          if (data.autoMode && data.manualDay === null) {
            // Automatic mode - calculate based on EST midnight
            nextDayText.textContent = `Day ${getNextDayNumber()}`;
          } else if (data.manualDay === 1 || data.manualDay === 2) {
            // Manual override
            nextDayText.textContent = `Day ${data.manualDay}`;
          } else {
            // Fallback to automatic calculation
            nextDayText.textContent = `Day ${getNextDayNumber()}`;
          }
        }
      })
      .catch(error => {
        console.error("Failed to load Firestore:", error);
        // Fallback display
        nextDayText.textContent = `Day ${getNextDayNumber()}`;
        nextDaySchedule.innerHTML = '<span class="schedule-badge">Regular Day</span>';
      });
  } else {
    console.error("Firebase not initialized!");
    nextDayText.textContent = "System Error";
  }
});
