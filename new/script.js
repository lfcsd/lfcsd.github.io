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
  if (reportBtn) {
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

  const schedulePopup = document.getElementById('schedulePopup');
  const schedulePopupTitle = document.getElementById('schedulePopupTitle');
  const schedulePopupBody = document.getElementById('schedulePopupBody');
  const dismissSchedulePopup = document.getElementById('dismissSchedulePopup');

  const prevViewedDayBtn = document.getElementById('prevViewedDayBtn');
  const nextViewedDayBtn = document.getElementById('nextViewedDayBtn');

  // Calendar elements
  const calendarTitle = document.getElementById("calendarTitle");
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarNotes = document.getElementById("calendarNotes");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");

  // ======================
  // STATE
  // ======================
  let viewedDayOffset = 0;
  let currentSettingsData = { manualDay: null, schedule: "Regular Day", autoMode: true };
  let latestBellData = null;

  // ======================
  // HELPERS
  // ======================
  function getCurrentESTDate() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  }

  function cloneDate(date) {
    return new Date(date.getTime());
  }

  function isWeekend(date) {
    const d = date.getDay();
    return d === 0 || d === 6;
  }

  function getWeekdayLabel(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: 'America/New_York'
    });
  }

  function getViewedDateFromOffset(offset) {
    const base = getCurrentESTDate();
    const date = cloneDate(base);

    if (offset === 0) return date;

    let moved = 0;
    while (moved < offset) {
      date.setDate(date.getDate() + 1);
      if (!isWeekend(date)) moved++;
    }
    return date;
  }

  const START_DATE = new Date('2025-10-13T00:00:00-05:00');

  function calculateDayNumberForDate(targetDate) {
    const normalizedTarget = new Date(targetDate);
    normalizedTarget.setHours(0, 0, 0, 0);

    const normalizedStart = new Date(START_DATE);
    normalizedStart.setHours(0, 0, 0, 0);

    const diffTime = normalizedTarget - normalizedStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return ((diffDays % 2) + 2) % 2 + 1;
  }

  function getCurrentConfiguredDayNumber() {
    if (currentSettingsData.autoMode !== false && !currentSettingsData.manualDay) {
      return calculateDayNumberForDate(getCurrentESTDate());
    }
    return currentSettingsData.manualDay || calculateDayNumberForDate(getCurrentESTDate());
  }

  function getViewedDayNumber() {
    const currentDayNumber = getCurrentConfiguredDayNumber();
    return ((currentDayNumber - 1 + viewedDayOffset) % 2) + 1;
  }

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

  function key(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function getDateKeyForDate(date) {
    return key(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function getTodaySpecialInfo() {
    const today = getCurrentESTDate();
    return SPECIAL_DATES[getDateKeyForDate(today)] || null;
  }

  function isHalfDayForToday() {
    const special = getTodaySpecialInfo();
    if (special?.type === "half") return true;

    const scheduleName = String(currentSettingsData?.schedule || '').toLowerCase();
    return scheduleName.includes('half');
  }

  function getSchedulePopupTitle() {
    return isHalfDayForToday() ? 'Current Bell Schedule' : 'Current Bell Schedule';
  }

  function openSchedulePopup() {
    if (!schedulePopup || !schedulePopupBody || !schedulePopupTitle) return;
    if (viewedDayOffset > 0) return;

    const today = getCurrentESTDate();
    const special = getTodaySpecialInfo();

    if (isWeekend(today) || special?.type === "off" || special?.type === "conf") return;
    if (!latestBellData?.periods?.length) return;

    schedulePopupTitle.textContent = getSchedulePopupTitle();

    schedulePopupBody.innerHTML = latestBellData.periods.map(period => `
      <div class="schedule-line">
        <div class="schedule-line-name">${period.name}</div>
        <div class="schedule-line-time">${formatTime(period.start)} - ${formatTime(period.end)}</div>
      </div>
    `).join('');

    schedulePopup.classList.remove('hidden');
  }

  function closeSchedulePopup() {
    if (schedulePopup) {
      schedulePopup.classList.add('hidden');
    }
  }

  function attachCurrentPeriodPopupHandlers() {
    const clickableCard = periodsContainer?.querySelector('.current-period-card.clickable');
    if (!clickableCard) return;

    clickableCard.addEventListener('click', openSchedulePopup);
    clickableCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSchedulePopup();
      }
    });
  }

  function updateCurrentPeriod(data) {
    if (!periodsContainer) return;

    if (viewedDayOffset > 0) {
      periodsContainer.innerHTML = `<div class="current-period-card">Viewing a future school day</div>`;
      return;
    }

    const today = getCurrentESTDate();
    const special = getTodaySpecialInfo();

    if (isWeekend(today) || special?.type === "off" || special?.type === "conf") {
      periodsContainer.innerHTML = `<div class="current-period-card">No periods today</div>`;
      return;
    }

    const periods = data?.periods || [];
    const current = periods.find(p => isNowInPeriod(today, p.start, p.end));
    const popupHint = `<br><span class="period-popup-hint">Tap to view full schedule</span>`;

    if (current) {
      periodsContainer.innerHTML = `
        <div class="current-period-card current clickable" role="button" tabindex="0" aria-label="Open today's full schedule">
          <strong>Current Period:</strong> ${current.name}<br>
          <span>${formatTime(current.start)} - ${formatTime(current.end)}</span>
          ${popupHint}
        </div>
      `;
    } else if (periods.length) {
      periodsContainer.innerHTML = `
        <div class="current-period-card clickable" role="button" tabindex="0" aria-label="Open today's full schedule">
          <strong>${getSchedulePopupTitle()}</strong><br>
          <span>No ongoing period</span>
          ${popupHint}
        </div>
      `;
    } else {
      periodsContainer.innerHTML = `<div class="current-period-card">No periods today</div>`;
    }

    attachCurrentPeriodPopupHandlers();
  }

  function updateViewedDayUI() {
    if (!dayTextEl || !specialScheduleEl) return;

    const viewedDate = getViewedDateFromOffset(viewedDayOffset);
    const isViewedWeekend = isWeekend(viewedDate);

    specialScheduleEl.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = 'schedule-badge';
    badge.textContent = getWeekdayLabel(viewedDate);
    specialScheduleEl.appendChild(badge);

    if (isViewedWeekend) {
      dayTextEl.textContent = 'No School';
    } else {
      dayTextEl.textContent = `Day ${getViewedDayNumber()}`;
    }

    if (prevViewedDayBtn) {
      prevViewedDayBtn.classList.toggle('hidden', viewedDayOffset === 0);
    }

    if (latestBellData) {
      updateCurrentPeriod(latestBellData);
    }
  }

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
  // VIEWED DAY NAV BUTTONS
  // ======================
  if (nextViewedDayBtn) {
    nextViewedDayBtn.addEventListener('click', () => {
      viewedDayOffset++;
      closeSchedulePopup();
      updateViewedDayUI();
    });
  }

  if (prevViewedDayBtn) {
    prevViewedDayBtn.addEventListener('click', () => {
      if (viewedDayOffset > 0) {
        viewedDayOffset--;
        closeSchedulePopup();
        updateViewedDayUI();
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
  // CALENDAR DATA
  // ======================
  const SCHOOL_MONTHS = [
    { year: 2025, month: 8 },
    { year: 2025, month: 9 },
    { year: 2025, month: 10 },
    { year: 2025, month: 11 },
    { year: 2026, month: 0 },
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
    { year: 2026, month: 5 }
  ];

  function addRange(map, year, month, startDay, endDay, type, label) {
    for (let d = startDay; d <= endDay; d++) {
      map[key(year, month, d)] = { type, label };
    }
  }

  const SPECIAL_DATES = {};

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

  SPECIAL_DATES[key(2025, 8, 2)] = { type: "conf", label: "Sup. Conf. Day - No School Students" };
  SPECIAL_DATES[key(2025, 8, 3)] = { type: "conf", label: "Sup. Conf. Day - No School Students" };
  SPECIAL_DATES[key(2026, 0, 23)] = { type: "conf", label: "Sup. Conf. Day - No School Students" };
  SPECIAL_DATES[key(2026, 5, 26)] = { type: "conf", label: "Graduation / Sup. Conf. Day & Regents Rating" };

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

  if (dismissSchedulePopup) {
    dismissSchedulePopup.addEventListener('click', closeSchedulePopup);
  }

  if (schedulePopup) {
    schedulePopup.addEventListener('click', (e) => {
      if (e.target === schedulePopup) {
        closeSchedulePopup();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSchedulePopup();
    }
  });

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
      currentSettingsData = docSnap.data() || { manualDay: null, schedule: "Regular Day", autoMode: true };
      updateViewedDayUI();
    });

    // CURRENT PERIOD
    const bellDoc = doc(db, "bellSchedules", "today");

    onSnapshot(bellDoc, (snap) => {
      if (!snap.exists()) {
        latestBellData = null;
        periodsContainer.innerHTML = `<div class="current-period-card">No periods today</div>`;
        return;
      }

      latestBellData = snap.data();
      updateCurrentPeriod(latestBellData);
      updateViewedDayUI();
    });

    setInterval(() => {
      getDoc(bellDoc).then(snap => {
        if (snap.exists()) {
          latestBellData = snap.data();
          updateCurrentPeriod(latestBellData);
        }
      });
    }, 60000);

  } catch (err) {
    console.error("Firestore import or listener error:", err);
    if (dayTextEl) dayTextEl.textContent = "Connection Error";
  }

  updateViewedDayUI();

  // ======================
  // SERVICE WORKER
  // ======================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/OneSignalSDKWorker.js');
  }
});
