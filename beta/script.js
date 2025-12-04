document.addEventListener('DOMContentLoaded', async function() {
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    const dayText = document.getElementById('dayText');
    if (dayText) dayText.textContent = "System Error";
    return;
  }

  const { db } = window.firebase;

  // ======================
  // ELEMENTS
  // ======================
  const reportBtn = document.getElementById('reportBtn');
  const nextDayBtn = document.createElement('button');
  nextDayBtn.className = 'pill report-pill';
  nextDayBtn.textContent = 'Next School Day';
  if (reportBtn && reportBtn.parentNode) {
    reportBtn.parentNode.insertBefore(nextDayBtn, reportBtn);
    reportBtn.textContent = 'Incorrect?';
  }

  const dayTextEl = document.getElementById('dayText');
  const specialScheduleEl = document.getElementById('specialSchedule');
  const timeDisplayEl = document.getElementById('timeDisplay');

  const announcementPopup = document.getElementById('announcementPopup');
  const popupTitle = document.getElementById('popupTitle');
  const popupDescription = document.getElementById('popupDescription');
  const dismissAnnouncement = document.getElementById('dismissAnnouncement');

  // ======================
  // MENU BUTTON
  // ======================
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  if (menuBtn && dropdownMenu) {
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
  }

  // ======================
  // REPORT BUTTON
  // ======================
  if (reportBtn) {
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
  }

  // ======================
  // NEXT DAY BUTTON
  // ======================
  if (nextDayBtn && dayTextEl) {
    nextDayBtn.addEventListener('click', async () => {
      try {
        const doc = await db.collection('settings').doc('nextDaySettings').get();
        let nextDayNum = 1;
        if (doc.exists) {
          nextDayNum = doc.data()?.manualDay || ((calculateCurrentDay() % 2) + 1);
        } else {
          nextDayNum = ((calculateCurrentDay() % 2) + 1);
        }
        dayTextEl.textContent = `Tomorrow will be a Day ${nextDayNum}`;
      } catch(err) {
        console.error(err);
        dayTextEl.textContent = 'Unable to load next day';
      }
    });
  }

  // ======================
  // LIVE CLOCK
  // ======================
  function updateESTTime() {
    if (!timeDisplayEl) return;
    const options = { timeZone:'America/New_York', weekday:'long', hour:'numeric', minute:'numeric', hour12:true };
    timeDisplayEl.textContent = new Date().toLocaleString('en-US', options);
  }
  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // DAY CALCULATION
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
  // FIRESTORE LISTENERS
  // ======================
  try {
    const { onSnapshot, doc } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');

    // ANNOUNCEMENT MODAL
    const announcementDoc = doc(db, "announcements", "current");
    onSnapshot(announcementDoc, (docSnap) => {
      if (docSnap.exists() && docSnap.data().message) {
        const data = docSnap.data();
        if (popupTitle) popupTitle.textContent = 'Announcement';
        if (popupDescription) popupDescription.textContent = data.message;
        if (announcementPopup) announcementPopup.classList.remove('hidden');
      } else {
        if (announcementPopup) announcementPopup.classList.add('hidden');
      }
    });

    if (dismissAnnouncement && announcementPopup) {
      dismissAnnouncement.addEventListener('click', () => {
        announcementPopup.classList.add('hidden');
      });
    }

    // CURRENT DAY LISTENER
    const currentDoc = doc(db, "settings", "current");
    onSnapshot(currentDoc, (docSnap) => {
      const data = docSnap.data() || { manualDay: null, schedule: "Regular Day", autoMode: true };
      if (!dayTextEl || !specialScheduleEl) return;

      // Clear
      dayTextEl.textContent = '';
      specialScheduleEl.innerHTML = '';

      // Weekend handling
      const today = new Date();
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayTextEl.textContent = 'No School';
        return;
      }

      // Schedule badge
      const badge = document.createElement('span');
      badge.className = 'schedule-badge';
      badge.textContent = data.schedule || 'Regular Day';
      specialScheduleEl.appendChild(badge);

      // Day text
      if (data.autoMode !== false && !data.manualDay) {
        dayTextEl.textContent = `Day ${calculateCurrentDay()}`;
      } else {
        dayTextEl.textContent = `Day ${data.manualDay}`;
      }
    });
  } catch (err) {
    console.error("Firestore import or listener error:", err);
    if (dayTextEl) dayTextEl.textContent = "Connection Error";
  }

  // ======================
  // SERVICE WORKER
  // ======================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/OneSignalSDKWorker.js');
  }
});
