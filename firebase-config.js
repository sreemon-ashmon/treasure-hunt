// ============================================
// EDIT THIS ONCE — every page loads this file
// Get these values from Firebase Console → Project Settings → General → Your apps → SDK config
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyAVDpAofaZ05ji_SPYul7_NzChzXl5lg0c",
  authDomain: "treasure-hunt-fae61.firebaseapp.com",
  databaseURL: "https://treasure-hunt-fae61-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "treasure-hunt-fae61",
  storageBucket: "treasure-hunt-fae61.firebasestorage.app",
  messagingSenderId: "561518091730",
  appId: "1:561518091730:web:b903ef5206fc3ec2e47c0b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
