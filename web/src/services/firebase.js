import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
  authDomain: "booking-b1567.firebaseapp.com",
  projectId: "booking-b1567",
  storageBucket: "booking-b1567.firebasestorage.app",
  messagingSenderId: "1027148740103",
  appId: "1:1027148740103:web:6624959d0dd09527b6dca2",
  measurementId: "G-GKTL2B6S3Y"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

export { auth, db, analytics } 