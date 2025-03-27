// Main application initialization
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
  
  // Toggle menu visibility
  menuBtn.addEventListener('click', function() {
    dropdownMenu.classList.toggle('show');
  });
  
  // Close menu when clicking outside
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
  
  // Initialize and update every minute
  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // 3. FIRESTORE LISTENER
  // ======================
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
    .then(({ onSnapshot, doc }) => {
      // Real-time updates for day/schedule
      const unsubscribe = onSnapshot(doc(db, "settings", "current"), (docSnapshot) => {
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

        // Always show schedule badge (including "Regular Day")
        const badge = document.createElement('span');
        badge.className = 'schedule-badge';
        badge.textContent = data.schedule || 'Regular Day';
        specialScheduleElement.appendChild(badge);

        // Day calculation logic
        if (data.autoMode !== false && !data.manualDay) {
          // Automatic day rotation
          const startDate = new Date('2025-03-25'); // Your known Day 1
          const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
          dayTextElement.textContent = `Day ${(diffDays % 2) + 1}`;
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
