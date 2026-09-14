import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Not a secret: this config is embedded in the client bundle and visible to
// anyone who opens dev tools on the deployed site. Access control is enforced
// by firestore.rules + Firebase Auth, not by hiding this.
const firebaseConfig = {
  apiKey: 'AIzaSyCQnf7kcBqN2sh9Z5z0pJMU9lhljYEdMJ4',
  authDomain: 'dinner-4bfa2.firebaseapp.com',
  projectId: 'dinner-4bfa2',
  storageBucket: 'dinner-4bfa2.firebasestorage.app',
  messagingSenderId: '900743619415',
  appId: '1:900743619415:web:4512b762f90766fd4d1412',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
