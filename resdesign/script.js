/* script.js - merged, updated */
document.addEventListener('DOMContentLoaded', async () => {

  // ---------- basic firebase presence check ----------
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    const dt = document.getElementById('dayText');
    if (dt) dt.textContent = "System Error";
    return;
  }
  const { db } = window.firebase;

  // ---------- DOM references ----------
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const reportBtn = document.getElementById('reportBtn');
  const announcementBar = document.getElementById('announcementBar');
  const dayTextEl = document.getElementById('dayText');
  const specialScheduleEl = document.getElementById('specialSchedule');
  const timeDisplayEl = document.getElementById('timeDisplay');

  // ---------- NAV DROPDOWN behavior (fixed) ----------
  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = dropdownMenu.classList.toggle('show');
    menuBtn.setAttribute('aria-expanded', String(isShown));
    dropdownMenu.setAttribute('aria-hidden', String(!isShown));
  });

  // clicking inside dropdown should not close immediately
  dropdownMenu?.addEventListener('click', (e) => e.stopPropagation());

  // close when clicking outside
  document.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    menuBtn?.setAttribute('aria-expanded','false');
    dropdownMenu?.setAttribute('aria-hidden','true');
  });

  // ---------- REPORT button ----------
  reportBtn?.addEventListener('click', () => {
    if (!confirm('Are you sure you want to report this day as incorrect?\nThis will notify the site administrator.')) return;

    const webhookURL = 'https://discord.com/api/webhooks/1354971848944779284/IfbRlUhpkTNh02jb5nH3oRE_Epdv-lNwJ2mJFntGiDXZKD-fqaVy7kDd2WTMbaXTJNIk';
    const message = {
      content: 'Hey <@957691566271660102>! A user of LFCSD Days has reported the current day may be incorrect!',
      embeds: [{
        title: 'Day Report',
        description:
          `Page: Current Day\nReported at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`,
        color: 0xff0000
      }]
    };

    fetch(webhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    .then(res => res.ok ? alert('Report sent successfully!') : Promise.reject('report failed'))
    .catch(err => {
      console.error(err);
      alert('Failed to send report. Please try again later.');
    });
  });

  // ---------- LIVE EST CLOCK ----------
  function updateESTTime() {
    const options = { timeZone: 'America/New_York', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
    const nowStr = new Date().toLocaleString('en-US', options);
    timeDisplayEl.textContent = nowStr;
  }
  updateESTTime();
  setInterval(updateESTTime, 60_000);

  // ---------- DAY CALCULATION ----------
  // START_DATE is Day 1 (EST)
  const START_DATE = new Date('2025-10-09T00:00:00-05:00');

  function getESTDateObj(offsetMinutes = 0) {
    // returns a Date object representing now in EST plus optional offset minutes
    const now = new Date();
    const estStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estStr);
    if (offsetMinutes) estDate.setMinutes(estDate.getMinutes() + offsetMinutes);
    return estDate;
  }

  function calculateCurrentDayForDate(estDate) {
    const diff = estDate - START_DATE;
    const diffDays = Math.floor(diff / (1000*60*60*24));
    return (diffDays % 2) + 1; // 1 or 2
  }

  // compute display text considering time-of-day rules
  function getDayTenseText(settings) {
    // settings: { autoMode, manualDay }
    const estNow = getESTDateObj();
    const hours = estNow.getHours();
    const minutes = estNow.getMinutes();

    // after 3:00 PM EST, referring to "Today" should be past tense
    const afterSchool = (hours > 15) || (hours === 15 && minutes >= 0); // 3:00 PM or later
    // midnight -> we consider next day's text ("Today will be...")
    // We'll check if it's after 00:00 (midnight) and before school start where we want future tense
    // For simplicity: if current time is between 00:00 and 03:00 we show "Today will be..." for next day
    const betweenMidnightAndEarly = (hours < 3);

    let dayNum;
    if (settings?.autoMode !== false && !settings?.manualDay) {
      if (betweenMidnightAndEarly) {
        // show next day's number (estNow + 1 day)
        const tomorrow = getESTDateObj(60*24); // add 24 hours in minutes
        dayNum = calculateCurrentDayForDate(tomorrow);
        return { text: `Today will be a Day ${dayNum}`, tense: 'future' };
      } else if (afterSchool) {
        dayNum = calculateCurrentDayForDate(estNow);
        return { text: `Today was a Day ${dayNum}`, tense: 'past' };
      } else {
        dayNum = calculateCurrentDayForDate(estNow);
        return { text: `Today is Day ${dayNum}`, tense: 'present' };
      }
    } else {
      // manual day is set: show manualDay with same tense logic
      const manual = settings.manualDay || '—';
      if (betweenMidnightAndEarly) {
        return { text: `Today will be a Day ${manual}`, tense: 'future' };
      } else if (afterSchool) {
        return { text: `Today was a Day ${manual}`, tense: 'past' };
      } else {
        return { text: `Today is Day ${manual}`, tense: 'present' };
      }
    }
  }

  // ---------- FIRESTORE realtime listeners ----------
  try {
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
    const { onSnapshot, doc } = firestoreModule;

    onSnapshot(doc(db, "announcements", "current"), (snap) => {
      if (snap.exists() && snap.data().message) {
        const data = snap.data();
        announcementBar.textContent = data.message;
        announcementBar.style.backgroundColor = data.color || '#6a0dad';
        announcementBar.style.display = 'block';
        document.body.classList.add('has-announcement');
      } else {
        announcementBar.style.display = 'none';
        document.body.classList.remove('has-announcement');
      }
    }, (err) => {
      console.error('Announcement listener failed', err);
      announcementBar.style.display = 'none';
    });

    onSnapshot(doc(db, "settings", "current"), (snap) => {
      const data = snap.data() || { manualDay: null, schedule: "Regular Day", autoMode: true };
      renderDayAndSchedule(data);
    });
  } catch (err) {
    console.error('Firestore load failed', err);
    dayTextEl.textContent = 'Connection Error';
  }

  // update UI with schedule + tense-aware day text
  function renderDayAndSchedule(data) {
    // weekend handling uses local EST date
    const estNow = getESTDateObj();
    const dayOfWeek = estNow.getDay(); // 0 Sunday ... 6 Saturday
    specialScheduleEl.innerHTML = '';
    // schedule badge
    const badge = document.createElement('span');
    badge.className = 'schedule-badge';
    badge.textContent = data.schedule || 'Regular Day';
    specialScheduleEl.appendChild(badge);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayTextEl.textContent = 'No School';
      return;
    }

    const tenseInfo = getDayTenseText(data);
    dayTextEl.textContent = tenseInfo.text;
  }

  // ---------- PWA INSTALL handling ----------
  let deferredPrompt = null;
  const installPopup = document.getElementById('installPopup');
  const dismissInstallBtn = document.getElementById('dismissInstall');
  const installActionBtn = document.getElementById('installAction');
  const platformBtns = document.querySelectorAll('.platform-btn');
  const installInstructions = document.getElementById('installInstructions');

  // choose default instructions content
  function setInstallText(platform) {
    if (!installInstructions) return;
    if (platform === 'android') {
      installInstructions.textContent = 'Open the browser menu (three dots) and tap "Add to Home Screen".';
    } else {
      installInstructions.textContent = 'Tap the share icon (square with arrow) then choose "Add to Home Screen".';
    }
  }

  platformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      platformBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setInstallText(btn.dataset.platform);
    });
  });

  // listen for beforeinstallprompt (Chrome/Edge)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // show our custom popup (mobile users will also see this)
    installPopup?.classList.remove('hidden');
    setInstallText('ios'); // default as requested
  });

  // If no beforeinstallprompt, still show popup for mobile just as hint
  if (/Mobi|Android|iPhone/i.test(navigator.userAgent) && !deferredPrompt) {
    // show a hint-based install popup after a small delay
    setTimeout(() => {
      installPopup?.classList.remove('hidden');
      setInstallText('ios');
    }, 1200);
  }

  dismissInstallBtn?.addEventListener('click', () => installPopup?.classList.add('hidden'));

  installActionBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      // If browser supports native prompt, show it
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice on install:', outcome);
      installPopup?.classList.add('hidden');
      deferredPrompt = null;
    } else {
      // fallback: open instructions for user
      alert('Follow the instructions shown to add the app to your home screen.');
    }
  });

  // ---------- SERVICE WORKER (register if available) ----------
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service worker registered');
    } catch (e) {
      console.warn('Service worker register failed', e);
    }
  }

  // ---------- NOTIFICATIONS & PUSH ----------

  // UI buttons for notifications (in dropdown)
  const enableNotifBtn = document.getElementById('enableNotifBtn');
  const subscribePushBtn = document.getElementById('subscribePushBtn');

  enableNotifBtn?.addEventListener('click', async () => {
    // ask permission for the Notification API (used for in-tab or SW notifications)
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notifications enabled. You can receive reminders while this site is open and via push if you subscribe.');
      } else {
        alert('Notifications blocked. You can enable them in your browser settings.');
      }
    } catch (e) {
      console.error(e);
    }
  });

  // Web Push subscription
  // NOTE: You must provide your own VAPID public key and server to send push messages.
  // placeholder: REPLACE with your VAPID public key (URL-safe base64) or use Firebase Cloud Messaging
  const VAPID_PUBLIC_KEY = '<YOUR_URLSAFE_VAPID_PUBLIC_KEY_HERE>';

  subscribePushBtn?.addEventListener('click', async () => {
    if (!('serviceWorker' in navigator)) {
      alert('Push not supported in this browser.');
      return;
    }
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes('<YOUR')) {
      alert('Server key not configured. See README in-code comments to configure VAPID or FCM.');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('Push subscription:', sub);
      alert('Subscribed to push notifications. Please save this subscription on your server to send messages.');
      // Send subscription object to your server here (fetch POST)
    } catch (err) {
      console.error('Failed to subscribe to push', err);
      alert('Failed to subscribe: ' + (err.message || err));
    }
  });

  // helper: convert VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i=0;i<rawData.length;++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  // quick "in-page" notification helper (works while site is open)
  function showInPageNotification(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else {
      // fallback: toast-like visible element (simple alert for now)
      alert(`${title}\n\n${body}`);
    }
  }

  // ---------- SCHEDULING REMINDERS (client-side while page open) ----------
  // This function schedules a reminder after `delayMs` milliseconds while the page is open.
  const scheduledTimeouts = [];
  function scheduleInPageReminder(delayMs, title, body) {
    const t = setTimeout(() => {
      showInPageNotification(title, body);
    }, delayMs);
    scheduledTimeouts.push(t);
    return t;
  }

  // Example: if school delayed by 2 hours
  // scheduleInPageReminder(2 * 60 * 60 * 1000, 'School Delay', 'School delayed by 2 hours today.');

  // ---------- small API to be called by your admin UI / server push ----------
  window.lfcsdNotifyNow = (title, body) => {
    // Fire immediate notification (in tab or via service worker if present)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'show-notification', title, body });
    } else {
      showInPageNotification(title, body);
    }
  };

  window.lfcsdScheduleReminder = (delayMs, title, body) => scheduleInPageReminder(delayMs, title, body);

  // expose for console debugging
  console.log('PWA hooks available: lfcsdNotifyNow, lfcsdScheduleReminder');

});
