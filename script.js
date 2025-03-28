document.addEventListener('DOMContentLoaded', function() {
  // Verify Firebase is available
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }

  const { db } = window.firebase;

  // ======================
  // 1. MENU FUNCTIONALITY
  // ======================
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

  // ======================
  // 2. LIVE CLOCK (EST)
  // ======================
  function updateESTTime() {
    const options = {
      timeZone: 'America/New_York',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    const timeString = new Date().toLocaleString('en-US', options);
    document.getElementById('timeDisplay').textContent = timeString;
  }
  
  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // 3. ANNOUNCEMENT BAR
  // ======================
  const announcementBar = document.getElementById('announcementBar');

  // ======================
  // 4. DAY CALCULATION LOGIC (UPDATED FOR MIDNIGHT EST)
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

  // ======================
  // 5. FIRESTORE LISTENERS
  // ======================
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
    .then(({ onSnapshot, doc }) => {
      // Announcement listener
      onSnapshot(doc(db, "announcements", "current"), (docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().message) {
          const data = docSnapshot.data();
          announcementBar.textContent = data.message;
          announcementBar.style.backgroundColor = data.color || '#6a0dad';
          announcementBar.style.display = 'block';
          
          // Add class to body when announcement exists
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

      // Real-time updates for day/schedule
      onSnapshot(doc(db, "settings", "current"), (docSnapshot) => {
        const data = docSnapshot.data() || getDefaultSettings();
        updateDayDisplay(data);
      });

      function getDefaultSettings() {
        return {
          manualDay: null,
          schedule: "Regular Day",
          autoMode: true
        };
      }

      function updateDayDisplay(data) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const dayTextElement = document.getElementById('dayText');
        const specialScheduleElement = document.getElementById('specialSchedule');

        // Clear previous state
        dayTextElement.textContent = '';
        specialScheduleElement.innerHTML = '';

        // Weekend handling
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayTextElement.textContent = 'No School';
          return;
        }

        // Always show schedule badge
        const badge = document.createElement('span');
        badge.className = 'schedule-badge';
        badge.textContent = data.schedule || 'Regular Day';
        specialScheduleElement.appendChild(badge);

        // Day calculation logic - UPDATED FOR MIDNIGHT EST SWITCH
        if (data.autoMode !== false && !data.manualDay) {
          // Automatic day rotation (now switches at midnight EST)
          dayTextElement.textContent = `Day ${calculateCurrentDay()}`;
        } else {
          // Manual override
          dayTextElement.textContent = `Day ${data.manualDay}`;
        }
      }
    })
    .catch(error => {
      console.error("Failed to load Firestore:", error);
      document.getElementById('dayText').textContent = "Connection Error";
    });
});
