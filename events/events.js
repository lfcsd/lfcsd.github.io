import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const listEl = document.getElementById("eventsList");

/* ---------- Helpers ---------- */

// Local YYYY-MM-DD (prevents UTC shifting bug)
function toDateKey(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// Convert "6:30 PM" → Date for sorting
function parseTime(timeStr) {
  if (!timeStr) return new Date(0);

  const [time, modifier] = timeStr.split(" ");
  let [h, m] = time.split(":").map(Number);

  if (modifier === "PM" && h !== 12) h += 12;
  if (modifier === "AM" && h === 12) h = 0;

  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d;
}

// Pretty date like "Friday, Feb 28"
function prettyDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

/* ---------- Load Events ---------- */

async function loadEvents() {
  try {
    const snapshot = await getDocs(collection(window.db, "events"));

    const allEvents = [];
    snapshot.forEach(doc => allEvents.push(doc.data()));

    if (!allEvents.length) {
      listEl.innerHTML = `<div class="time-display">No scheduled events.</div>`;
      return;
    }

    const todayKey = toDateKey(new Date());

    // Group events by date
    const grouped = {};
    allEvents.forEach(ev => {
      if (!grouped[ev.date]) grouped[ev.date] = [];
      grouped[ev.date].push(ev);
    });

    /* ---------- 1️⃣ Try today ---------- */
    if (grouped[todayKey]) {
      renderDay("Today", todayKey, grouped[todayKey]);
      return;
    }

    /* ---------- 2️⃣ Find next upcoming day ---------- */
    const futureDates = Object.keys(grouped)
      .filter(d => d > todayKey)
      .sort(); // chronological

    if (!futureDates.length) {
      listEl.innerHTML = `<div class="time-display">No upcoming events.</div>`;
      return;
    }

    const nextDate = futureDates[0];
    renderDay("Upcoming", nextDate, grouped[nextDate]);

  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<div class="time-display">Failed to load events.</div>`;
  }
}

/* ---------- Render ---------- */

function renderDay(label, dateKey, events) {

  // Sort events by time
  events.sort((a, b) => parseTime(a.time) - parseTime(b.time));

  listEl.innerHTML = `
    <div class="events-heading">
      ${label} — ${prettyDate(dateKey)}
    </div>
  `;

  events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <div class="event-time">${ev.time || "All Day"}</div>
      <div class="event-title">${ev.title}</div>
      ${ev.location ? `<div class="event-location">${ev.location}</div>` : ""}
    `;

    listEl.appendChild(card);
  });
}

loadEvents();
