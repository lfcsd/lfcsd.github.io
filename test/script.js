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
  const periodsContainer = document.getElementById('periodsContainer');

  const announcementPopup = document.getElementById('announcementPopup');
  const popupTitle = document.getElementById('popupTitle');
  const popupDescription = document.getElementById('popupDescription');
  const dismissAnnouncement = document.getElementById('dismissAnnouncement');

  // Calendar elements
  const calendarTitle = document.getElementById("calendarTitle");
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarNotes = document.getElementById("calendarNotes");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");

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
            description: `Page: Current Day\nReported at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`,
            color: 0xff0000
          }]
        };
        fetch(webhookURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        })
        .then(res => res.ok ? alert('Report sent successfully!') : Promise.reject('Failed'))
        .catch(err => {
          console.error(err);
          alert('Failed to send report.');
        });
      }
    });
  }

  // ======================
  // NEXT DAY BUTTON
  // ======================
  if (nextDayBtn && dayTextEl) {
    nextDayBtn.addEventListener('click', async () => {
      try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
        const nextDayRef = doc(db, "settings", "nextDaySettings");
        const docSnap = await getDoc(nextDayRef);
        let nextDayNum = 1;

        if (docSnap.exists()) {
          nextDayNum = docSnap.data()?.manualDay || ((calculateCurrentDay() % 2) + 1);
        } else {
          nextDayNum = ((calculateCurrentDay() % 2) + 1);
        }

        dayTextEl.textContent = `Tomorrow will be a Day ${nextDayNum}`;
      } catch (err) {
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
    const options = {
      timeZone: 'America/New_York',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    timeDisplayEl.textContent = new Date().toLocaleString('en-US', options);
  }

  updateESTTime();
  setInterval(updateESTTime, 60000);

  // ======================
  // DAY CALCULATION
  // ======================
  const START_DATE = new Date('2025-10-13T00:00:00-05:00');

  function getCurrentESTDate() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  }

  function calculateCurrentDay() {
    const estNow = getCurrentESTDate();
    const diffTime = estNow - START_DATE;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays % 2) + 1;
  }

  // ======================
  // CALENDAR DATA
  // ======================
  const SCHOOL_MONTHS = [
    { year: 2025, month: 8 },  // Sep
    { year: 2025, month: 9 },  // Oct
    { year: 2025, month: 10 }, // Nov
    { year: 2025, month: 11 }, // Dec
    { year: 2026, month: 0 },  // Jan
    { year: 2026, month: 1 },  // Feb
    { year: 2026, month: 2 },  // Mar
    { year: 2026, month: 3 },  // Apr
    { year: 2026, month: 4 },  // May
    { year: 2026, month: 5 }   // Jun
  ];

  function key(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function addRange(map, year, month, startDay, endDay, type, label) {
    for (let d = startDay; d <= endDay; d++) {
      map[key(year, month, d)] = { type, label };
    }
  }

  const SPECIAL_DATES = {};

  /* NO SCHOOL / HOLIDAY / RECESS */
  SPECIAL_DATES[key(2025, 8, 1)]  = { type: "off",  label: "No School - Holiday" };
  SPECIAL_DATES[key(2025, 9, 13)] = { type: "off",  label: "No School - Holiday" };
  SPECIAL_DATES[key(2025, 10, 11)] = { type: "off", label: "No School - Holiday" };
  addRange(SPECIAL_DATES, 2025, 10, 26, 28, "off", "Thanksgiving Recess");
  addRange(SPECIAL_DATES, 2025, 11, 22, 31, "off", "Winter Recess");
  addRange(SPECIAL_DATES, 2026, 0, 1, 2, "off", "Winter Recess");
  addRange(SPECIAL_DATES, 2026, 1, 16, 20, "off", "Mid Winter Recess");
  SPECIAL_DATES[key(2026, 3, 3)] = { type: "off", label: "Spring Recess" };
  addRange(SPECIAL_DATES, 2026, 3, 6, 10, "off", "Spring Recess");
  SPECIAL_DATES[key(2026, 4, 25)] = { type: "off", label: "No School - Holiday" };
  SPECIAL_DATES[key(2026, 5, 19)] = { type: "off", label: "No School - Holiday" };

  /* HALF DAYS */
  SPECIAL_DATES[key(2025, 8, 19)] = { type: "half", label: "1/2 Day Students. Staff PD" };
  SPECIAL_DATES[key(2025, 9, 6)]  = { type: "half", label: "1/2 Day Students. Staff PD" };
  SPECIAL_DATES[key(2025, 9, 31)] = { type: "half", label: "1/2 Day Students. Staff PD" };
  SPECIAL_DATES[key(2025, 10, 20)] = { type: "half", label: "1/2 Day Students. MS/HS PT Conf. & BHA PD" };
  SPECIAL_DATES[key(2025, 11, 11)] = { type: "half", label: "1/2 Day Students - BHA Parent Teacher Conferences and MS/HS PD" };
  SPECIAL_DATES[key(2025, 11, 12)] = { type: "half", label: "1/2 Day Students - BHA Parent Teacher Conferences and MS/HS PD" };
  SPECIAL_DATES[key(2026, 1, 6)] = { type: "half", label: "1/2 Day Students. Staff PD" };
  SPECIAL_DATES[key(2026, 2, 20)] = { type: "half", label: "1/2 Day Students. Staff PD" };
  SPECIAL_DATES[key(2026, 2, 27)] = { type: "half", label: "1/2 Day Students & PT Conf." };
  SPECIAL_DATES[key(2026, 4, 19)] = { type: "half", label: "1/2 Day Students. Staff PD" };
  SPECIAL_DATES[key(2026, 5, 24)] = { type: "half", label: "1/2 Day Students" };
  SPECIAL_DATES[key(2026, 5, 25)] = { type: "half", label: "1/2 Day Students" };

  /* SUPERINTENDENT CONFERENCE / SPECIAL */
  SPECIAL_DATES[key(2025, 8, 2)] = { type: "conf", label: "Sup. Conf. Day - No School Students" };
  SPECIAL_DATES[key(2025, 8, 3)] = { type: "conf", label: "Sup. Conf. Day - No School Students" };
  SPECIAL_DATES[key(2026, 0, 23)] = { type: "conf", label: "Sup. Conf. Day - No School Students" };
  SPECIAL_DATES[key(2026, 5, 26)] = { type: "conf", label: "Graduation / Sup. Conf. Day & Regents Rating" };

  /* OTHER NOTED SPECIAL DATE */
  SPECIAL_DATES[key(2025, 10, 25)] = { type: "conf", label: "Early Dismissal Drill - 15 min early" };

  function getInitialMonthIndex() {
    const now = new Date();
    const found = SCHOOL_MONTHS.findIndex(
      ({ year, month }) => year === now.getFullYear() && month === now.getMonth()
    );
    return found >= 0 ? found : 0;
  }

  let currentIndex = getInitialMonthIndex();

  function chipLabel(type) {
    if (type === "half") return "Half";
    if (type === "off") return "Off";
    return "Info";
  }

  function renderMonth() {
    if (!calendarTitle || !calendarGrid || !calendarNotes || !prevMonthBtn || !nextMonthBtn) return;

    const { year, month } = SCHOOL_MONTHS[currentIndex];
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarTitle.textContent = firstDay.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });

    calendarGrid.innerHTML = "";
    calendarNotes.innerHTML = "";

    for (let i = 0; i < startWeekday; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-day empty";
      calendarGrid.appendChild(empty);
    }

    const notes = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = key(year, month, day);
      const info = SPECIAL_DATES[dateKey];
      const dayEl = document.createElement("div");

      dayEl.className = "calendar-day";
      if (info) dayEl.classList.add(`day-${info.type}`);

      const today = new Date();
      const isToday =
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate();

      if (isToday) dayEl.classList.add("today");

      dayEl.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        ${info ? `<div class="calendar-day-chip">${chipLabel(info.type)}</div>` : ""}
      `;

      if (info) {
        dayEl.title = info.label;
        notes.push({ day, label: info.label, type: info.type });
      }

      calendarGrid.appendChild(dayEl);
    }

    if (!notes.length) {
      calendarNotes.innerHTML = `<div class="time-display">No marked half days or no-school dates this month.</div>`;
    } else {
      notes.sort((a, b) => a.day - b.day);

      notes.forEach(note => {
        const noteEl = document.createElement("div");
        noteEl.className = `calendar-note note-${note.type}`;
        noteEl.innerHTML = `<strong>${note.day}</strong> — ${note.label}`;
        calendarNotes.appendChild(noteEl);
      });
    }

    prevMonthBtn.disabled = currentIndex === 0;
    nextMonthBtn.disabled = currentIndex === SCHOOL_MONTHS.length - 1;
  }

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderMonth();
      }
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      if (currentIndex < SCHOOL_MONTHS.length - 1) {
        currentIndex++;
        renderMonth();
      }
    });
  }

  renderMonth();

  // ======================
  // FIRESTORE LISTENERS
  // ======================
  try {
    const { onSnapshot, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');

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

      dayTextEl.textContent = '';
      specialScheduleEl.innerHTML = '';

      const today = new Date();
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayTextEl.textContent = 'No School';
        return;
      }

      const badge = document.createElement('span');
      badge.className = 'schedule-badge';
      badge.textContent = data.schedule || 'Regular Day';
      specialScheduleEl.appendChild(badge);

      if (data.autoMode !== false && !data.manualDay) {
        dayTextEl.textContent = `Day ${calculateCurrentDay()}`;
      } else {
        dayTextEl.textContent = `Day ${data.manualDay}`;
      }
    });

    // CURRENT PERIOD
    const bellDoc = doc(db, "bellSchedules", "today");

    function formatTime(time24) {
      const [h, m] = time24.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    function isNowInPeriod(now, start, end) {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      const startTime = new Date(now);
      startTime.setHours(sH, sM, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(eH, eM, 0, 0);
      return now >= startTime && now <= endTime;
    }

    function updateCurrentPeriod(data) {
      if (!periodsContainer) return;

      const periods = data?.periods || [];
      const now = getCurrentESTDate();
      const current = periods.find(p => isNowInPeriod(now, p.start, p.end));

      if (current) {
        periodsContainer.innerHTML = `
          <div class="current-period-card current">
            <strong>Current Period:</strong> ${current.name} <br>
            <span>${formatTime(current.start)} - ${formatTime(current.end)}</span>
          </div>
        `;
      } else {
        periodsContainer.innerHTML = `<div class="current-period-card">No ongoing period</div>`;
      }
    }

    onSnapshot(bellDoc, (snap) => {
      if (!snap.exists()) {
        periodsContainer.innerHTML = `<div class="current-period-card">No periods today</div>`;
        return;
      }
      updateCurrentPeriod(snap.data());
    });

    setInterval(() => {
      getDoc(bellDoc).then(snap => {
        if (snap.exists()) updateCurrentPeriod(snap.data());
      });
    }, 60000);

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
