const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");
const calendarNotes = document.getElementById("calendarNotes");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

// School year months shown on the PDF
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
SPECIAL_DATES[key(2025, 8, 1)]  = { type: "off",  label: "No School - Holiday" }; // Sept 1
SPECIAL_DATES[key(2025, 9, 13)] = { type: "off",  label: "No School - Holiday" }; // Oct 13
SPECIAL_DATES[key(2025,10,11)]  = { type: "off",  label: "No School - Holiday" }; // Nov 11
addRange(SPECIAL_DATES, 2025, 10, 26, 28, "off", "Thanksgiving Recess");
addRange(SPECIAL_DATES, 2025, 11, 22, 31, "off", "Winter Recess");
addRange(SPECIAL_DATES, 2026, 0, 1, 2, "off", "Winter Recess");
addRange(SPECIAL_DATES, 2026, 1, 16, 20, "off", "Mid Winter Recess");
SPECIAL_DATES[key(2026, 3, 3)]  = { type: "off",  label: "Spring Recess" };
addRange(SPECIAL_DATES, 2026, 3, 6, 10, "off", "Spring Recess");
SPECIAL_DATES[key(2026, 4, 25)] = { type: "off",  label: "No School - Holiday" }; // May 25
SPECIAL_DATES[key(2026, 5, 19)] = { type: "off",  label: "No School - Holiday" }; // June 19

/* HALF DAYS */
SPECIAL_DATES[key(2025, 8, 19)] = { type: "half", label: "1/2 Day Students. Staff PD" };
SPECIAL_DATES[key(2025, 9, 6)]  = { type: "half", label: "1/2 Day Students. Staff PD" };
SPECIAL_DATES[key(2025, 9, 31)] = { type: "half", label: "1/2 Day Students. Staff PD" };
SPECIAL_DATES[key(2025,10,20)]  = { type: "half", label: "1/2 Day Students. MS/HS PT Conf. & BHA PD" };
SPECIAL_DATES[key(2025,11,11)]  = { type: "half", label: "1/2 Day Students - BHA Parent Teacher Conferences and MS/HS PD" };
SPECIAL_DATES[key(2025,11,12)]  = { type: "half", label: "1/2 Day Students - BHA Parent Teacher Conferences and MS/HS PD" };
SPECIAL_DATES[key(2026, 1, 6)]  = { type: "half", label: "1/2 Day Students. Staff PD" };
SPECIAL_DATES[key(2026, 2,20)]  = { type: "half", label: "1/2 Day Students. Staff PD" };
SPECIAL_DATES[key(2026, 2,27)]  = { type: "half", label: "1/2 Day Students & PT Conf." };
SPECIAL_DATES[key(2026, 4,19)]  = { type: "half", label: "1/2 Day Students. Staff PD" };
SPECIAL_DATES[key(2026, 5,24)]  = { type: "half", label: "1/2 Day Students" };
SPECIAL_DATES[key(2026, 5,25)]  = { type: "half", label: "1/2 Day Students" };

/* SUPERINTENDENT CONFERENCE / SPECIAL */
SPECIAL_DATES[key(2025, 8, 2)]  = { type: "conf", label: "Sup. Conf. Day - No School Students" };
SPECIAL_DATES[key(2025, 8, 3)]  = { type: "conf", label: "Sup. Conf. Day - No School Students" };
SPECIAL_DATES[key(2026, 0,23)]  = { type: "conf", label: "Sup. Conf. Day - No School Students" };
SPECIAL_DATES[key(2026, 5,26)]  = { type: "conf", label: "Graduation / Sup. Conf. Day & Regents Rating" };

/* OTHER NOTED SPECIAL DATE */
SPECIAL_DATES[key(2025,10,25)]  = { type: "conf", label: "Early Dismissal Drill - 15 min early" };

function getInitialMonthIndex() {
  const now = new Date();
  const found = SCHOOL_MONTHS.findIndex(
    ({ year, month }) => year === now.getFullYear() && month === now.getMonth()
  );
  return found >= 0 ? found : 0;
}

let currentIndex = getInitialMonthIndex();

function renderMonth() {
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

    const isToday =
      year === new Date().getFullYear() &&
      month === new Date().getMonth() &&
      day === new Date().getDate();

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
    return;
  }

  notes.sort((a, b) => a.day - b.day);

  notes.forEach(note => {
    const noteEl = document.createElement("div");
    noteEl.className = `calendar-note note-${note.type}`;
    noteEl.innerHTML = `<strong>${note.day}</strong> — ${note.label}`;
    calendarNotes.appendChild(noteEl);
  });

  prevMonthBtn.disabled = currentIndex === 0;
  nextMonthBtn.disabled = currentIndex === SCHOOL_MONTHS.length - 1;
}

function chipLabel(type) {
  if (type === "half") return "Half";
  if (type === "off") return "Off";
  return "Info";
}

prevMonthBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderMonth();
  }
});

nextMonthBtn.addEventListener("click", () => {
  if (currentIndex < SCHOOL_MONTHS.length - 1) {
    currentIndex++;
    renderMonth();
  }
});

renderMonth();
