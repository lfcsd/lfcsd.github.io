 document.addEventListener('DOMContentLoaded', function() {
  const auth = firebase.auth();
  const db = firebase.firestore();
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('loginContainer');
  const adminPanel = document.getElementById('adminPanel');

  // Login handler
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const token = await userCredential.user.getIdTokenResult();
      
      if (token.claims.admin) {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
      } else {
        throw new Error('Not an admin');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
      auth.signOut();
    }
  });

  // Check if already logged in
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      const token = await user.getIdTokenResult();
      if (token.claims.admin) {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
      }
    }
  });
});

// Admin functions
async function setDay(type, day) {
  try {
    await firebase.firestore().collection("settings").doc(type).update({
      manualDay: day,
      autoMode: false,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Set ${type} day to ${day}`);
  } catch (error) {
    alert(`Error updating ${type} day: ` + error.message);
  }
}

async function setSchedule(type, schedule) {
  try {
    await firebase.firestore().collection("settings").doc(type).update({
      schedule: schedule,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Set ${type} schedule to ${schedule}`);
  } catch (error) {
    alert(`Error updating ${type} schedule: ` + error.message);
  }
}

async function resetAuto(type) {
  try {
    await firebase.firestore().collection("settings").doc(type).update({
      manualDay: null,
      schedule: "Regular Day",
      autoMode: true,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Reset ${type} to automatic`);
  } catch (error) {
    alert(`Error resetting ${type}: ` + error.message);
  }
  // ======================
  // 4. AUTO-LOGIN CHECK
  // ======================
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      try {
        const token = await user.getIdTokenResult();
        if (token.claims.admin) {
          loginContainer.style.display = 'none';
          adminPanel.style.display = 'block';
          currentDayButtons.style.display = 'block';
          nextDayButtons.style.display = 'block';
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    }
  });
});
