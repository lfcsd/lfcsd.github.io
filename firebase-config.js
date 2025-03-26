import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

 const firebaseConfig = {
    apiKey: "AIzaSyB6yxt2JX4ubnFsiYf2stfdnHeqjNySiJc",
    authDomain: "lfcsd-days.firebaseapp.com",
    projectId: "lfcsd-days",
    storageBucket: "lfcsd-days.firebasestorage.app",
    messagingSenderId: "520576481150",
    appId: "1:520576481150:web:b08a50be7b0d15e113e52f",
    measurementId: "G-7NPR8M9T6C"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Make available globally
window.firebaseAuth = auth;
window.firebaseDb = db;
