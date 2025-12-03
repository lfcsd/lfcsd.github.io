document.addEventListener('DOMContentLoaded', function() {

  // ======================
  // ✅ FIREBASE SAFETY CHECK
  // ======================
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }

  const { db } = window.firebase;

  // ======================
  // ✅ NAV MENU TOGGLE
  // ======================
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  document.addEventListener('click', function(event) {
    if (!menuBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.classList.remove('show');
    }
  });

  // ======================
  // ✅ REPORT BUTTON
  // ======================
  const reportBtn = document.getElementById('reportBtn');

  if (reportBtn) {
    reportBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to report this day as incorrect?\nThis will notify the site administrator.')) {

        const webhookURL = 'https://discord.com/api/webhooks/1354971848944779284/IfbRlUhpkTNh02jb5nH3oRE_Epdv-lNwJ2mJFntGiDXZKD-fqaVy7kDd2WTMbaXTJNIk';

        const message = {
          content: 'Hey <@957691566271660102>! A user of LFCSD Days has reported the current day may be incorrect!',
          embeds: [{
            title: 'Day Report',
            description:
              `Page: Current Day\n` +
              `Reported at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`,
            color: 0xff0000
          }]
        };

        fetch(webhookURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        })
        .then(response => response.ok ? 
          alert('Report sent successfully!') : 
          Promise.reject('Failed to send report')
        )
        .catch(error => {
          console.error('Error:', error);
          alert('Failed to send report. Please try again later.');
        });
      }
    });
  }

  // ======================
  // ✅ LIVE CLOCK (EST)
  // ======================
  function updateESTTime() {
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

  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // ✅ DAY CALCULATION
  // ======================
  const START_DATE = new Date('2025-10-09T00:00:00-05:00');

  function getCurrentESTDate() {
    const now = new Date();
    const estTime = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    return new Date(estTime);
  }

  function calculateCurrentDay() {
    const estNow = getCurrentESTDate();
    const diffTime = estNow - START_DATE;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays % 2) + 1;
  }

  // ======================
  // ✅ FIRESTORE LISTENERS
  // ======================
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
    .then(({ onSnapshot, doc }) => {

      // ✅ ANNOUNCEMENTS
      onSnapshot(doc(db, "announcements", "current"), (docSnapshot) => {
        const announcementBar = document.getElementById('announcementBar');

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
      });

      // ✅ DAY + SCHEDULE
      onSnapshot(doc(db, "settings", "current"), (docSnapshot) => {
        const data = docSnapshot.data() || {
          manualDay: null,
          schedule: "Regular Day",
          autoMode: true
        };

        updateDayDisplay(data);
      });

      function updateDayDisplay(data) {
        const today = new Date();
        const dayOfWeek = today.getDay();

        const dayTextElement = document.getElementById('dayText');
        const specialScheduleElement = document.getElementById('specialSchedule');

        dayTextElement.textContent = '';
        specialScheduleElement.innerHTML = '';

        // ✅ Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayTextElement.textContent = 'No School';
          return;
        }

        // ✅ Schedule Badge
        const badge = document.createElement('span');
        badge.className = 'schedule-badge';
        badge.textContent = data.schedule || 'Regular Day';
        specialScheduleElement.appendChild(badge);

        // ✅ Day Mode
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

  // ======================
  // ✅ MOBILE INSTALL PROMPT
  // ======================
  const installPopup = document.getElementById("installPopup");
  const dismissInstall = document.getElementById("dismissInstall");
  const platformBtns = document.querySelectorAll(".platform-btn");
  const installText = document.getElementById("installInstructions");

  if (installPopup && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    setTimeout(() => installPopup.classList.remove("hidden"), 1200);
  }

  dismissInstall?.addEventListener("click", () => {
    installPopup.classList.add("hidden");
  });

  platformBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      platformBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      if (btn.dataset.platform === "ios") {
        installText.textContent = 'Tap the Share icon, then select "Add to Home Screen".';
      } else {
        installText.textContent = 'Open browser menu and tap "Add to Home Screen".';
      }
    });
  });

});
