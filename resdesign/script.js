import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }
  const db = window.firebase.db;

  // ======================
  // 1. MENU BUTTON
  // ======================
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  menuBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
    menuBtn.setAttribute("aria-expanded", dropdownMenu.classList.contains('show'));
  });

  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
      menuBtn.setAttribute("aria-expanded", false);
    }
  });

  // ======================
  // 2. REPORT BUTTON
  // ======================
  const reportBtn = document.getElementById('reportBtn');
  reportBtn.addEventListener('click', async function() {
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
      try {
        const res = await fetch(webhookURL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(message)});
        if(res.ok) alert("Report sent!");
        else throw new Error("Failed to send report");
      } catch(err) { console.error(err); alert("Failed to send report"); }
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
    if (hour >= 15) return `Today was a Day ${day}`;
    if (hour < 0) return `Today will be a Day ${day}`;
    return `Today is a Day ${day}`;
  }

  // ======================
  // 5. FIRESTORE LISTENERS (modular)
  // ======================
  const announcementDoc = doc(db, "announcements", "current");
  const settingsDoc = doc(db, "settings", "current");
  const nextDayDoc = doc(db, "nextDaySettings", "current");

  onSnapshot(announcementDoc, (docSnap) => {
    const bar = document.getElementById('announcementBar');
    if(docSnap.exists() && docSnap.data().message){
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

  onSnapshot(settingsDoc, (docSnap) => { if(docSnap.exists()) updateDayDisplay(docSnap.data()); });
  onSnapshot(nextDayDoc, (docSnap) => { if(docSnap.exists()) updateDayDisplay(docSnap.data(), 'dayText'); });

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
    if (!window.matchMedia('(display-mode: standalone)').matches) installPopup.classList.remove('hidden');
  });

  installBtn.addEventListener('click', async () => {
    if(deferredPrompt){
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
  // 7. OneSignal Notifications
  // ======================
  const notifBtn = document.getElementById('enableNotifBtn');
  if(notifBtn){
    notifBtn.addEventListener('click', () => {
      if(!window.OneSignal) return alert("Notifications not supported.");
      OneSignalDeferred.push(function(OneSignal){
        OneSignal.showNativePrompt().then(() => alert("Notifications enabled!"));
      });
    });
  }

});
