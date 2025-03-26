function setToNull() {
  firebase.firestore()
    .collection("settings").doc("current")
    .update({
      manualDay: null,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
}

document.addEventListener('DOMContentLoaded', function() {
  const auth = firebase.auth();
  const db = firebase.firestore();
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('loginContainer');
  const adminPanel = document.getElementById('adminPanel');
  
 // Admin Login Function
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // 1. Sign in with email/password
    await firebase.auth().signInWithEmailAndPassword(email, password);
    
    // 2. Verify admin status (using custom claims)
    const user = firebase.auth().currentUser;
    if (user) {
      const token = await user.getIdTokenResult();
      
      if (token.claims.admin) {
        // Show admin panel
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
      } else {
        throw new Error('This account is not an admin');
      }
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
    firebase.auth().signOut(); // Clear invalid login
  }
});
  
  // Admin functions
  window.setDay = async (day) => {
    try {
      await db.collection("settings").doc("current").update({
        manualDay: day,
        autoMode: false,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert(`Successfully set to Day ${day}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  window.setSchedule = async (type) => {
    try {
      await db.collection("settings").doc("current").update({
        schedule: type,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert(`Schedule set to ${type}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  window.resetAuto = async () => {
    try {
      await db.collection("settings").doc("current").update({
        manualDay: null,
        schedule: 'Regular Day',
        autoMode: true,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Reset to automatic schedule');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
});
