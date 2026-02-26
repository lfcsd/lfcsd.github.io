import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const listEl = document.getElementById("eventsList");

// Format today's key like: 2026-02-26
const today = new Date();
const todayKey = today.toISOString().split("T")[0];

async function loadEvents() {
  try {
    const snapshot = await getDocs(collection(window.db, "events"));

    const todaysEvents = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      // Expect Firestore structure:
      // { title: "...", date: "YYYY-MM-DD", time: "...", location: "..." }
      if (data.date === todayKey) {
        todaysEvents.push(data);
      }
    });

    renderEvents(todaysEvents);
  } catch (err) {
    listEl.innerHTML = `<div class="time-display">Failed to load events.</div>`;
    console.error(err);
  }
}

function renderEvents(events) {
  if (!events.length) {
    listEl.innerHTML = `<div class="time-display">No events today.</div>`;
    return;
  }

  listEl.innerHTML = "";

  events.sort((a,b)=> (a.time || "").localeCompare(b.time || ""));

  events.forEach(event => {
    const card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <strong>${event.title}</strong>
      <span>${event.time || ""}</span>
      <em>${event.location || ""}</em>
    `;

    listEl.appendChild(card);
  });
}

loadEvents();
