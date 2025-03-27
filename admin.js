document.addEventListener('DOMContentLoaded', async function() {
  // Initialize Firebase
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('loginContainer');
  const adminPanel = document.getElementById('adminPanel');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  // Current Day Controls
  const currentDayButtons = document.getElementById('currentDayControls');
  // Next Day Controls (new section)
  const nextDayButtons = document.getElementById('nextDayControls');

  // ======================
  // 1. ADMIN LOGIN SYSTEM
  // ======================
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    try {
      // Show loading state
      loginForm.querySelector('button').disabled = true;
      loginForm.querySelector('button').textContent = 'Logging in...';
      
      // Sign in with email/password
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Verify admin status
      const token = await user.getIdTokenResult();
      if (!token.claims.admin) {
        throw new Error('This account is not an administrator');
      }
      
      // Success - show admin panel
      loginContainer.style.display = 'none';
      adminPanel.style.display = 'block';
      
      // Show both control panels
      currentDayButtons.style.display = 'block';
      nextDayButtons.style.display = 'block';
      
    } catch (error) {
      let message = 'Login failed: ';
      switch (error.code) {
        case 'auth/invalid-email':
          message += 'Invalid email format';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message += 'Invalid email or password';
          break;
        default:
          message += error.message;
      }
      alert(message);
    } finally {
      loginForm.querySelector('button').disabled = false;
      loginForm.querySelector('button').textContent = 'Login';
    }
  });

  // ======================
  // 2. CURRENT DAY CONTROLS
  // ======================
  window.setDay = async function(day) {
    try {
      await db.collection("settings").doc("current").update({
        manualDay: day,
        autoMode: false,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert(`Current day set to Day ${day}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  window.setSchedule = async function(type) {
    try {
      await db.collection("settings").doc("current").update({
        schedule: type,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert(`Current schedule set to ${type}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  window.resetAuto = async function() {
    try {
      await db.collection("settings").doc("current").update({
        manualDay: null,
        schedule: "Regular Day",
        autoMode: true,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Current day reset to automatic');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ======================
  // 3. NEXT DAY CONTROLS (NEW)
  // ======================
  window.setNextDay = async function(day) {
    try {
      await db.collection("settings").doc("nextDayOverride").update({
        manualDay: day,
        autoMode: false,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert(`Next day override set to Day ${day}`);
    } catch (error) {
      // Create document if it doesn't exist
      if (error.code === 'not-found') {
        await db.collection("settings").doc("nextDayOverride").set({
          manualDay: day,
          autoMode: false,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`Created next day override: Day ${day}`);
      } else {
        alert('Error: ' + error.message);
      }
    }
  };

  window.setNextSchedule = async function(type) {
    try {
      await db.collection("settings").doc("nextDayOverride").update({
        schedule: type,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert(`Next day schedule set to ${type}`);
    } catch (error) {
      if (error.code === 'not-found') {
        await db.collection("settings").doc("nextDayOverride").set({
          schedule: type,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`Created next day schedule: ${type}`);
      } else {
        alert('Error: ' + error.message);
      }
    }
  };

  window.resetNextAuto = async function() {
    try {
      await db.collection("settings").doc("nextDayOverride").update({
        manualDay: null,
        schedule: "Regular Day",
        autoMode: true,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Next day reset to automatic calculation');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

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
