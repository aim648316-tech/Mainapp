import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyC5mgw03m4qCMrSYYy_UxMtvk7vVl0pcxs',
  authDomain: 'delevery-track.firebaseapp.com',
  projectId: 'delevery-track',
  storageBucket: 'delevery-track.firebasestorage.app',
  messagingSenderId: '73991278679',
  appId: '1:73991278679:web:16f531d5848147215b9312',
  measurementId: 'G-FSPTTM820H',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
