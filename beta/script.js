document.addEventListener('DOMContentLoaded', function() {
  // Verify Firebase is available
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }

  const { db } = window.firebase;

  // ======================
  // 1. MENU AND REPORT BUTTONS
  // ======================
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const reportBtn = document.getElementById('reportBtn');

  menuBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
    menuBtn.setAttribute("aria-expanded", dropdownMenu.classList.contains('show'));
  });

  document.addEventListener('click', (event) => {
    if (!menuBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.classList.remove('show');
      menuBtn.setAttribute("aria-expanded", false);
    }
  });

  reportBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to report this day as incorrect?\nThis will notify the site administrator.')) {
      const webhookURL = 'https://discord.com/api/webhooks/1354971848944779284/IfbRlUhpkTNh02jb5nH3oRE_Epdv-lNwJ2mJFntGiDXZKD-fqaVy7kDd2WTMbaXTJNIk';
      const message = {
        content: 'Hey <@957691566271660102>! A user reported the current day may be incorrect!',
        embeds: [{
          title: 'Day Report',
          description: `Page: Current Day\nReported at: ${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})} EST`,
          color: 0xff0000
        }]
      };

      fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
      .then(res => res.ok ? alert('Report sent successfully!') : Promise.reject('Failed'))
      .catch(err => { console.error(err); alert('Failed to send report.'); });
    }
  });

  // ======================
  // 2. LIVE CLOCK (EST)
  // ======================
  function updateESTTime() {
    const options = { timeZone:'America/New_York', weekday:'long', hour:'numeric', minute:'numeric', hour12:true };
    document.getElementById('timeDisplay').textContent = new Date().toLocaleString('en-US', options);
  }
  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // 3. DAY CALCULATION
  // ======================
  const START_DATE = new Date('2025-10-09T00:00:00-05:00');

  function getCurrentESTDate() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  }

  function calculateCurrentDay() {
    const estNow = getCurrentESTDate();
    const diffTime = estNow - START_DATE;
    const diffDays = Math.floor(diffTime / (1000*60*60*24));
    return (diffDays % 2) + 1;
  }

  // ======================
  // 4. FIRESTORE LISTENERS
  // ======================
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
    .then(({ onSnapshot, doc }) => {

      const announcementBar = document.getElementById('announcementBar');

      // --- Announcement Listener ---
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

      // --- Day / Schedule Listener ---
      onSnapshot(doc(db, "settings", "current"), (docSnapshot) => {
        const data = docSnapshot.data() || { manualDay: null, schedule: "Regular Day", autoMode: true };
        updateDayDisplay(data);
      });

      function updateDayDisplay(data) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const dayTextElement = document.getElementById('dayText');
        const specialScheduleElement = document.getElementById('specialSchedule');

        dayTextElement.textContent = '';
        specialScheduleElement.innerHTML = '';

        // Weekend handling
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayTextElement.textContent = 'No School';
          return;
        }

        // Schedule badge
        const badge = document.createElement('span');
        badge.className = 'schedule-badge';
        badge.textContent = data.schedule || 'Regular Day';
        specialScheduleElement.appendChild(badge);

        // Day calculation
        if (data.autoMode !== false && !data.manualDay) {
          dayTextElement.textContent = `Day ${calculateCurrentDay()}`;
        } else {
          dayTextElement.textContent = `Day ${data.manualDay}`;
        }
      }

    })
    .catch(error => {
      console.error("Failed to load Firestore:", error);
      document.getElementById('dayText').textContent = "Connection Error";
    });

});
document.addEventListener('DOMContentLoaded', function() {
  // Verify Firebase is available
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }

  const { db } = window.firebase;

  // ======================
  // 1. MENU AND REPORT BUTTONS
  // ======================
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const reportBtn = document.getElementById('reportBtn');

  menuBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
    menuBtn.setAttribute("aria-expanded", dropdownMenu.classList.contains('show'));
  });

  document.addEventListener('click', (event) => {
    if (!menuBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.classList.remove('show');
      menuBtn.setAttribute("aria-expanded", false);
    }
  });

  reportBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to report this day as incorrect?\nThis will notify the site administrator.')) {
      const webhookURL = 'https://discord.com/api/webhooks/1354971848944779284/IfbRlUhpkTNh02jb5nH3oRE_Epdv-lNwJ2mJFntGiDXZKD-fqaVy7kDd2WTMbaXTJNIk';
      const message = {
        content: 'Hey <@957691566271660102>! A user reported the current day may be incorrect!',
        embeds: [{
          title: 'Day Report',
          description: `Page: Current Day\nReported at: ${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})} EST`,
          color: 0xff0000
        }]
      };

      fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
      .then(res => res.ok ? alert('Report sent successfully!') : Promise.reject('Failed'))
      .catch(err => { console.error(err); alert('Failed to send report.'); });
    }
  });

  // ======================
  // 2. LIVE CLOCK (EST)
  // ======================
  function updateESTTime() {
    const options = { timeZone:'America/New_York', weekday:'long', hour:'numeric', minute:'numeric', hour12:true };
    document.getElementById('timeDisplay').textContent = new Date().toLocaleString('en-US', options);
  }
  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // 3. DAY CALCULATION
  // ======================
  const START_DATE = new Date('2025-10-09T00:00:00-05:00');

  function getCurrentESTDate() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  }

  function calculateCurrentDay() {
    const estNow = getCurrentESTDate();
    const diffTime = estNow - START_DATE;
    const diffDays = Math.floor(diffTime / (1000*60*60*24));
    return (diffDays % 2) + 1;
  }

  // ======================
  // 4. FIRESTORE LISTENERS
  // ======================
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
    .then(({ onSnapshot, doc }) => {

      const announcementBar = document.getElementById('announcementBar');

      // --- Announcement Listener ---
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

      // --- Day / Schedule Listener ---
      onSnapshot(doc(db, "settings", "current"), (docSnapshot) => {
        const data = docSnapshot.data() || { manualDay: null, schedule: "Regular Day", autoMode: true };
        updateDayDisplay(data);
      });

      function updateDayDisplay(data) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const dayTextElement = document.getElementById('dayText');
        const specialScheduleElement = document.getElementById('specialSchedule');

        dayTextElement.textContent = '';
        specialScheduleElement.innerHTML = '';

        // Weekend handling
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayTextElement.textContent = 'No School';
          return;
        }

        // Schedule badge
        const badge = document.createElement('span');
        badge.className = 'schedule-badge';
        badge.textContent = data.schedule || 'Regular Day';
        specialScheduleElement.appendChild(badge);

        // Day calculation
        if (data.autoMode !== false && !data.manualDay) {
          dayTextElement.textContent = `Day ${calculateCurrentDay()}`;
        } else {
          dayTextElement.textContent = `Day ${data.manualDay}`;
        }
      }

    })
    .catch(error => {
      console.error("Failed to load Firestore:", error);
      document.getElementById('dayText').textContent = "Connection Error";
    });

});
