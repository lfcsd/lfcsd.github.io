document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase
  const db = firebase.firestore();
  
  // Hamburger menu functionality
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

  // Real-time Firestore listener
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
    
    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayTextElement.textContent = 'No School';
      specialScheduleElement.innerHTML = '';
      return;
    }
    
    // Day calculation
    if (data.autoMode !== false && (data.manualDay === null || data.manualDay === undefined)) {
      // Automatic day rotation
      const startDate = new Date('2023-09-05'); // Your known Day 1 date
      const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      dayTextElement.textContent = `Day ${(diffDays % 2) + 1}`;
    } else {
      // Manual day override
      dayTextElement.textContent = `Day ${data.manualDay}`;
    }
    
    // Schedule display - FIXED TO ALWAYS SHOW REGULAR DAY WHEN APPLICABLE
    if (data.schedule && data.schedule !== 'Regular Day') {
      specialScheduleElement.innerHTML = `<span class="schedule-badge">${data.schedule}</span>`;
    } else {
      specialScheduleElement.innerHTML = '<span class="schedule-badge">Regular Day</span>';
    }
  }

  // Error handling for Firebase
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return;
    
    user.getIdTokenResult()
      .then(token => {
        if (token.claims.admin) {
          console.log("Admin user detected");
        }
      })
      .catch(error => console.error("Token error:", error));
  });
});
