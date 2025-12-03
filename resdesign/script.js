document.addEventListener('DOMContentLoaded', async () => {
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }

  const { db } = window.firebase;

  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const reportBtn = document.getElementById('reportBtn');
  const enableNotifBtn = document.getElementById('enableNotifBtn');
  const subscribePushBtn = document.getElementById('subscribePushBtn');
  const timeDisplay = document.getElementById('timeDisplay');
  const dayTextElement = document.getElementById('dayText');
  const specialScheduleElement = document.getElementById('specialSchedule');
  const announcementBar = document.getElementById('announcementBar');

  const installPopup = document.getElementById('installPopup');
  const dismissInstall = document.getElementById('dismissInstall');
  const installAction = document.getElementById('installAction');
  const platformBtns = document.querySelectorAll('.platform-btn');
  const installInstructions = document.getElementById('installInstructions');

  const isMobile = window.innerWidth <= 768;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  /* ============================
     MOBILE-ONLY SETTINGS
  ============================ */
  if (!isMobile) {
    enableNotifBtn.style.display = 'none';
    subscribePushBtn.style.display = 'none';
  }

  /* ============================
     DROPDOWN MENU FIX
  ============================ */
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
    menuBtn.setAttribute('aria-expanded', dropdownMenu.classList.contains('show'));
  });

  document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target) && !menuBtn.contains(e.target)) {
      dropdownMenu.classList.remove('show');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* ============================
     LIVE EST CLOCK
  ============================ */
  function updateESTTime() {
    const options = {
      timeZone: 'America/New_York',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    timeDisplay.textContent = new Date().toLocaleString('en-US', options);
  }
  updateESTTime();
  setInterval(updateESTTime, 60000);

  /* ============================
     DAY CALCULATION WITH TENSE
  ============================ */
  const START_DATE = new Date('2025-10-09T00:00:00-05:00');

  function getCurrentESTDate() {
    const now = new Date();
    const est = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    return new Date(est);
  }

  function calculateDay(offset = 0) {
    const base = getCurrentESTDate();
    base.setDate(base.getDate() + offset);
    const diffTime = base - START_DATE;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays % 2) + 1;
  }

  function getTenseText(day) {
    const est = getCurrentESTDate();
    const hour = est.getHours();

    if (hour >= 15 && hour < 24) {
      return `Today was a Day ${day}`;
    } else if (hour >= 0 && hour < 6) {
      return `Today will be a Day ${calculateDay(1)}`;
    } else {
      return `Today is a Day ${day}`;
    }
  }

  /* ============================
     FIRESTORE LISTENERS
  ============================ */
  const { onSnapshot, doc } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');

  onSnapshot(doc(db, "announcements", "current"), (snap) => {
    if (snap.exists() && snap.data().message) {
      const data = snap.data();
      announcementBar.textContent = data.message;
      announcementBar.style.backgroundColor = data.color || '#6a0dad';
      announcementBar.style.display = 'block';
    } else {
      announcementBar.style.display = 'none';
    }
  });

  onSnapshot(doc(db, "settings", "current"), (snap) => {
    const data = snap.data() || {
      manualDay: null,
      schedule: "Regular Day",
      autoMode: true
    };

    specialScheduleElement.innerHTML = '';

    const badge = document.createElement('span');
    badge.textContent = data.schedule || "Regular Day";
    specialScheduleElement.appendChild(badge);

    const today = new Date().getDay();
    if (today === 0 || today === 6) {
      dayTextElement.textContent = "No School";
      return;
    }

    const day = data.autoMode !== false && !data.manualDay
      ? calculateDay()
      : Number(data.manualDay);

    dayTextElement.textContent = getTenseText(day);
  });

  /* ============================
     NEXT DAY (NO NAVIGATION)
  ============================ */
  document.querySelectorAll('a[href="/days/next/"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const nextDay = calculateDay(1);
      dayTextElement.textContent = `Tomorrow will be a Day ${nextDay}`;
      dropdownMenu.classList.remove('show');
    });
  });

  /* ============================
     REPORT BUTTON
  ============================ */
  reportBtn.addEventListener('click', () => {
    if (!confirm("Report incorrect day?")) return;

    fetch('https://discord.com/api/webhooks/1354971848944779284/IfbRlUhpkTNh02jb5nH3oRE_Epdv-lNwJ2mJFntGiDXZKD-fqaVy7kDd2WTMbaXTJNIk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: "A user reported today may be incorrect."
      })
    });

    alert("Report sent.");
  });

  /* ============================
     PWA INSTALL HANDLING
  ============================ */
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    if (isPWA) return; // ✅ DO NOT SHOW IF ALREADY A PWA

    e.preventDefault();
    deferredPrompt = e;
    installPopup.classList.remove('hidden');
  });

  dismissInstall.addEventListener('click', () => {
    installPopup.classList.add('hidden');
  });

  installAction.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installPopup.classList.add('hidden');
  });

  /* ============================
     PLATFORM INSTRUCTIONS
  ============================ */
  platformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      platformBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      installInstructions.textContent =
        btn.dataset.platform === "android"
          ? 'Tap the menu (⋮) and select "Add to Home Screen".'
          : 'Tap Share → "Add to Home Screen"';
    });
  });

  /* ============================
     NOTIFICATION PERMISSIONS
  ============================ */
  enableNotifBtn?.addEventListener('click', async () => {
    const permission = await Notification.requestPermission();
    alert(permission === 'granted' ? "Notifications Enabled" : "Notifications Blocked");
  });

  subscribePushBtn?.addEventListener('click', () => {
    alert("Push subscription system ready for server integration.");
  });
});
