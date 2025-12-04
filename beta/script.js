document.addEventListener('DOMContentLoaded', function() {
  if (!window.firebase?.db) {
    console.error("Firebase not initialized!");
    document.getElementById('dayText').textContent = "System Error";
    return;
  }

  const { db } = window.firebase;

  // ======================
  // MENU & REPORT BUTTONS
  // ======================
  const menuBtn = document.getElementById('menuBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const reportBtn = document.getElementById('reportBtn');

  menuBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
  });

  document.addEventListener('click', e => {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
    }
  });

  reportBtn.addEventListener('click', () => {
    if (!confirm("Report this day?")) return;
    const webhookURL = 'https://discord.com/api/webhooks/1354971848944779284/IfbRlUhpkTNh02jb5nH3oRE_Epdv-lNwJ2mJFntGiDXZKD-fqaVy7kDd2WTMbaXTJNIk';
    const message = { content: `A user reported the current day at ${new Date().toLocaleString('en-US', {timeZone:'America/New_York'})}` };
    fetch(webhookURL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(message) });
  });

  // ======================
  // LIVE CLOCK (EST)
  // ======================
  function updateESTTime() {
    const options = { timeZone:'America/New_York', weekday:'long', hour:'numeric', minute:'numeric', hour12:true };
    document.getElementById('timeDisplay').textContent = new Date().toLocaleString('en-US', options);
  }
  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // DAY CALCULATION
  // ======================
  const START_DATE = new Date('2025-10-09T00:00:00-05:00');
  function getCurrentESTDate() { return new Date(new Date().toLocaleString('en-US', {timeZone:'America/New_York'})); }
  function calculateCurrentDay() {
    const diffTime = getCurrentESTDate() - START_DATE;
    return (Math.floor(diffTime / (1000*60*60*24)) % 2) + 1;
  }

  // ======================
  // FIRESTORE ANNOUNCEMENT MODAL
  // ======================
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
    .then(({ onSnapshot, doc }) => {
      const popup = document.getElementById('announcementPopup');
      const popupTitle = document.getElementById('popupTitle');
      const popupDesc = document.getElementById('popupDescription');
      const popupClose = document.getElementById('dismissAnnouncement');

      popupClose.addEventListener('click', () => popup.classList.add('hidden'));

      onSnapshot(doc(db, "announcements", "current"), snap => {
        if (!snap.exists()) {
          popup.classList.add('hidden');
          return;
        }
        const data = snap.data();
        if (data.popupEnabled) {
          popupTitle.textContent = data.popupTitle || "Announcement";
          popupDesc.textContent = data.popupDescription || "";
          popup.classList.remove('hidden');
        } else {
          popup.classList.add('hidden');
        }
      });
    })
    .catch(e => console.error("Firestore error:", e));

  // ======================
  // DAY/SCHEDULE DISPLAY
  // ======================
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js')
    .then(({ onSnapshot, doc }) => {
      onSnapshot(doc(db, "settings", "current"), snap => {
        const data = snap.data() || { manualDay:null, schedule:"Regular Day", autoMode:true };
        const dayEl = document.getElementById('dayText');
        const schedEl = document.getElementById('specialSchedule');
        dayEl.textContent = '';
        schedEl.innerHTML = '';

        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayEl.textContent = "No School";
          return;
        }

        const badge = document.createElement('span');
        badge.className = 'schedule-badge';
        badge.textContent = data.schedule || "Regular Day";
        schedEl.appendChild(badge);

        if (data.autoMode && !data.manualDay) dayEl.textContent = `Day ${calculateCurrentDay()}`;
        else dayEl.textContent = `Day ${data.manualDay}`;
      });
    })
    .catch(e => console.error(e));
});
