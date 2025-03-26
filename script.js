document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firestore
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

  // Real-time listener for day updates
  db.collection("settings").doc("current")
    .onSnapshot((doc) => {
      const data = doc.data();
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
    if (data && !data.autoMode && data.manualDay !== null) {
      dayTextElement.textContent = `Day ${data.manualDay}`;
    } else {
      const startDate = new Date('2023-09-05'); // Adjust to your known Day 1
      const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      dayTextElement.textContent = `Day ${(diffDays % 2) + 1}`;
    }
    
    // Schedule display
    if (data && data.schedule && data.schedule !== 'Regular Day') {
      specialScheduleElement.innerHTML = `<span class="schedule-badge">${data.schedule}</span>`;
    } else {
      specialScheduleElement.innerHTML = '';
    }
  }
});
