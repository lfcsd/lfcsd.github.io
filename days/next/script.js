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

  // Main logic
  if (window.firebase?.db) {
    const { db } = window.firebase;
    const nextDayText = document.getElementById('nextDayText');
    const nextDaySchedule = document.getElementById('nextDaySchedule');

    const nextSchoolDate = getNextSchoolDate();
    const dayNumber = calculateDayNumber(nextSchoolDate);
    
    // Display day number
    nextDayText.textContent = `Day ${dayNumber}`;

    // Get schedule from Firestore
    import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
      .then(({ doc, getDoc }) => {
        return getDoc(doc(db, "nextDaySettings", "current"));
      })

 function getDefaultSettings() {
        return {
          manualDay: null,
          schedule: "Regular Day",
          autoMode: true
        };
      }
      .then(docSnapshot => {
        const data = docSnapshot.data() || { schedule: "Regular Day" };
        nextDaySchedule.innerHTML = `
          <span class="schedule-badge">${data.schedule}</span>
        `;
      })
      .catch(error => {
        console.error("Error:", error);
        nextDaySchedule.innerHTML = `
          <span class="schedule-badge">Regular Day</span>
        `;
      });
  }
});
