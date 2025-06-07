// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
  authDomain: "booking-b1567.firebaseapp.com",
  projectId: "booking-b1567",
  storageBucket: "booking-b1567.firebasestorage.app",
  messagingSenderId: "1027148740103",
  appId: "1:1027148740103:web:2b580beab39f01a0b6dca2",
  measurementId: "G-X1BE24TK3Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
  const currentPath = window.location.pathname;
  
  // If we're on the root path, redirect to login
  if (currentPath === '/' || currentPath === '/index.html') {
    window.location.href = '/login.html';
    return;
  }

  // If user is not logged in and not on login/register page, redirect to login
  if (!user && !currentPath.includes('login.html') && !currentPath.includes('register.html')) {
    window.location.href = '/login.html';
  }
  // If user is logged in and on login/register page, redirect to scheduler
  else if (user && (currentPath.includes('login.html') || currentPath.includes('register.html'))) {
    window.location.href = '/scheduler.html';
  }
}); 