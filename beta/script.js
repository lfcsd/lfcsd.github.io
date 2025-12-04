document.addEventListener('DOMContentLoaded', async () => {
  const db = window.firebase.db;

  const reportBtn = document.getElementById('reportBtn');

  reportBtn.addEventListener('click', () => {
    if (confirm("Report this as incorrect?")) {
      fetch("YOUR_DISCORD_WEBHOOK", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Someone reported an incorrect day." })
      });
      alert("Report sent!");
    }
  });

  // ===== CLOCK =====
  function updateTime() {
    document.getElementById('timeDisplay').textContent =
      new Date().toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long", hour: "numeric", minute: "numeric" });
  }

  updateTime();
  setInterval(updateTime, 60000);

  // ===== POPUP LISTENER (REPLACES ANNOUNCEMENT BAR) =====
  const { onSnapshot, doc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");

  onSnapshot(doc(db, "announcements", "current"), (docSnap) => {
    const popup = document.getElementById("sitePopup");

    if (!docSnap.exists()) {
      popup.classList.add("hidden");
      return;
    }

    const data = docSnap.data();

    if (data.popupEnabled === true) {
      document.getElementById("popupTitle").textContent = data.popupTitle || "Important";
      document.getElementById("popupDesc").textContent = data.popupDescription || "";
      document.getElementById("popupClose").textContent = data.popupCloseText || "Close";
      popup.classList.remove("hidden");
    } else {
      popup.classList.add("hidden");
    }
  });

  document.getElementById("popupClose").addEventListener("click", () => {
    document.getElementById("sitePopup").classList.add("hidden");
  });
});
