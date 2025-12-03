document.addEventListener('DOMContentLoaded', async function() {
  // ======================
  // 0. Firebase check
  // ======================
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }
  const { db } = window.firebase;

  // ======================
  // 1. MENU BUTTON
  // ======================
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  menuBtn.addEventListener('click', function() {
    dropdownMenu.classList.toggle('show');
    menuBtn.setAttribute("aria-expanded", dropdownMenu.classList.contains('show'));
  });

  document.addEventListener('click', function(e) {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
      menuBtn.setAttribute("aria-expanded", false);
    }
  });

  // ======================
  // 2. REPORT BUTTON
  // ======================
  const reportBtn = document.getElementById('reportBtn');
  reportBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to report this day as incorrect? This will notify the site administrator.')) {
      const webhookURL = 'https://discord.com/api/webhooks/1354971848944779284/IfbRlUhpkTNh02jb5nH3oRE_Epdv-lNwJ2mJFntGiDXZKD-fqaVy7kDd2WTMbaXTJNIk';
      const message = {
        content: 'Hey <@957691566271660102>! A user reported the current day may be incorrect!',
        embeds: [{
          title: 'Day Report',
          description: `Page: Current Day\nReported at: ${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})} EST`,
          color: 0xff0000
        }]
      };
      fetch(webhookURL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(message)})
        .then(res => res.ok ? alert("Report sent!") : Promise.reject("Failed"))
        .catch(err => { console.error(err); alert("Failed to send report"); });
    }
  });

  // ======================
  // 3. LIVE CLOCK
  // ======================
  function updateESTTime() {
    const options = { timeZone:'America/New_York', weekday:'long', hour:'numeric', minute:'numeric', hour12:true };
    document.getElementById('timeDisplay').textContent = new Date().toLocaleString('en-US', options);
  }
  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // 4. DAY CALCULATION
  // ======================
  const START_DATE = new Date('2025-10-09T00:00:00-05:00');

  function getCurrentESTDate() {
    const now = new Date();
    const estStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    return new Date(estStr);
  }

  function calculateCurrentDay() {
    const estNow = getCurrentESTDate();
    const diffTime = estNow - START_DATE;
    const diffDays = Math.floor(diffTime / (1000*60*60*24));
    return (diffDays % 2) + 1; // Day 1 or 2
  }

  function getDayText(scheduleData) {
    const now = getCurrentESTDate();
    const hour = now.getHours();
    const day = (scheduleData.autoMode !== false && !scheduleData.manualDay) ? calculateCurrentDay() : scheduleData.manualDay;
    if (hour >= 15) return `Today was a Day ${day}`; // After school hours
    if (hour < 0) return `Today will be a Day ${day}`; // Midnight
    return `Today is a Day ${day}`; // Default
  }

  // ======================
  // 5. FIRESTORE LISTENERS
  // ======================
  const announcementRef = db.collection("announcements").doc("current");
  const settingsRef = db.collection("settings").doc("current");
  const nextDayRef = db.collection("nextDaySettings").doc("current");

  announcementRef.onSnapshot(docSnap => {
    const bar = document.getElementById('announcementBar');
    if (docSnap.exists() && docSnap.data().message) {
      const data = docSnap.data();
      bar.textContent = data.message;
      bar.style.backgroundColor = data.color || "#6a0dad";
      bar.style.display = "block";
    } else bar.style.display = "none";
  });

  function updateDayDisplay(data, targetId='dayText') {
    const dayTextEl = document.getElementById(targetId);
    const scheduleEl = document.getElementById('specialSchedule');
    dayTextEl.textContent = getDayText(data);

    scheduleEl.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = 'schedule-badge';
    badge.textContent = data.schedule || 'Regular Day';
    scheduleEl.appendChild(badge);
  }

  settingsRef.onSnapshot(docSnap => {
    if (docSnap.exists()) updateDayDisplay(docSnap.data());
  });

  nextDayRef.onSnapshot(docSnap => {
    if (docSnap.exists()) updateDayDisplay(docSnap.data(), 'dayText'); // Could add a separate element if needed
  });

  // ======================
  // 6. PWA INSTALL POPUP
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
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      installPopup.classList.add('hidden');
    }
  });

  dismissBtn.addEventListener('click', () => installPopup.classList.add('hidden'));

  // Platform toggle instructions
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
  // 7. PUSH NOTIFICATIONS
  // ======================
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const notifBtn = document.getElementById('enableNotifBtn');

  if (notifBtn && window.innerWidth <= 768) {
    notifBtn.style.display = "block";
    notifBtn.addEventListener('click', requestNotificationPermission);
  } else if (notifBtn) notifBtn.style.display = "none";

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return alert("Notifications not supported.");
    let permission = await Notification.requestPermission();
    if (permission !== "granted") return alert("Permission denied.");

    if (!isIOS) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array("BDCwJOe_9loznu0yeRBZoYhxg_LvzR5TA6ekWhQgTS6n9JvmrJWQdgZcSRw1OHswUSmnUV3VSo-FzrQtcCAl_5s")
        });

        await db.collection("push_subscriptions").doc(subscription.endpoint).set({
          token: subscription.endpoint,
          platform: isAndroid ? "android" : "web",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Notifications enabled!");
      } catch(err) { console.error(err); alert("Push subscription failed"); }
    } else {
      alert("iOS Safari cannot receive background notifications. Alerts will appear in-app when open.");
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  // ======================
  // 8. LISTEN FOR NOTIFICATIONS (Firestore outbox)
  // ======================
  db.collection("notification_outbox").where("sent", "==", false)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (Notification.permission === "granted") {
            new Notification(data.title, { body: data.body, icon: data.icon || undefined });
          } else if (isIOS) {
            showInAppBanner(data.title, data.body);
          }
        }
      });
    });

  function showInAppBanner(title, body) {
    const banner = document.createElement('div');
    banner.className = "in-app-banner";
    banner.innerHTML = `<strong>${title}</strong><p>${body}</p>`;
    document.body.appendChild(banner);
    setTimeout(()=>banner.remove(),8000);
  }

  // ======================
  // 9. REGISTER SERVICE WORKER
  // ======================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(e => console.warn('SW failed:', e));
  }
});
