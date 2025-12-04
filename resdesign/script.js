document.addEventListener('DOMContentLoaded', function() {
  // ======================
  // 0. Firebase check
  // ======================
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }
  const db = window.firebase.db;

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
  const announcementRef = db.collection("announcements").doc("current");
  const settingsRef = db.collection("settings").doc("current");

  // Announcements
  announcementRef.onSnapshot(docSnap => {
    const bar = document.getElementById('announcementBar');
    if (docSnap.exists() && docSnap.data().message) {
      const data = docSnap.data();
      bar.textContent = data.message;
      bar.style.backgroundColor = data.color || "#6a0dad";
      bar.style.display = "block";
      document.body.classList.add('has-announcement');
    } else {
      bar.style.display = "none";
      document.body.classList.remove('has-announcement');
    }
  });

  // Day / Schedule
  settingsRef.onSnapshot(docSnap => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const dayTextEl = document.getElementById('dayText');
    const scheduleEl = document.getElementById('specialSchedule');

    dayTextEl.textContent = '';
    scheduleEl.innerHTML = '';

    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayTextEl.textContent = 'No School';
      return;
    }

    const badge = document.createElement('span');
    badge.className = 'schedule-badge';
    badge.textContent = data.schedule || 'Regular Day';
    scheduleEl.appendChild(badge);

    if (data.autoMode !== false && !data.manualDay) {
      dayTextEl.textContent = `Day ${calculateCurrentDay()}`;
    } else {
      dayTextEl.textContent = `Day ${data.manualDay}`;
    }
  });

  // ======================
  // 5. PWA INSTALL POPUP
  // ======================
  let deferredPrompt;
  const installPopup = document.getElementById('installPopup');
  const installBtn = document.getElementById('installAction');
  const dismissBtn = document.getElementById('dismissInstall');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      installPopup.classList.remove('hidden');
    }
  });

  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installPopup.classList.add('hidden');
    }
  });

  dismissBtn.addEventListener('click', () => installPopup.classList.add('hidden'));

  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.platform-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const instructions = document.getElementById('installInstructions');
      instructions.textContent = btn.dataset.platform === 'ios' ?
        'Tap the Share icon, then select "Add to Home Screen".' :
        'Tap the menu, then select "Add to Home Screen".';
    });
  });

  // ======================
  // 6. PUSH NOTIFICATIONS (OneSignal)
  // ======================
  const notifBtn = document.getElementById('enableNotifBtn');
  if (notifBtn && window.OneSignal) {
    notifBtn.addEventListener('click', () => {
      OneSignal.push(function() {
        OneSignal.showNativePrompt().then(() => {
          alert("Notifications enabled!");
        });
      });
    });
  }
});
