import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCUA-mKAasmNX0ls2ix78SN602WD9Zd_-w",
  authDomain: "task-manager-1d05e.firebaseapp.com",
  projectId: "task-manager-1d05e",
  storageBucket: "task-manager-1d05e.firebasestorage.app",
  messagingSenderId: "722540948272",
  appId: "1:722540948272:web:fc1190173f30094a5176f5"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
