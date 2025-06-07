import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
    authDomain: "booking-b1567.firebaseapp.com",
    projectId: "booking-b1567",
    storageBucket: "booking-b1567.appspot.com",
    messagingSenderId: "1027148740103",
    appId: "1:1027148740103:web:2b580beab39f01a0b6dca2",
    measurementId: "G-X1BE24TK3Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to Auth emulator
connectAuthEmulator(auth, 'http://localhost:9099');

// Create test user
const email = 'test@example.com';
const password = 'test123456';

createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        console.log('Test user created successfully:', userCredential.user.email);
    })
    .catch((error) => {
        console.error('Error creating test user:', error);
    }); 