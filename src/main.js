// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    window.location.href = '/index.html';
  } else {
    // User is signed out
    window.location.href = '/login.html';
  }
}); 