import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBCAtEJovMu2tQnoFXER7CblcVFU20VSUY",
  authDomain: "confeshapp.firebaseapp.com",
  projectId: "confeshapp",
  storageBucket: "confeshapp.firebasestorage.app",
  messagingSenderId: "221668322180",
  appId: "1:221668322180:web:3e3e7fe10a0be6e4ed0bd1",
  measurementId: "G-CVJ6Y8V6T8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { 
  db, 
  auth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  GoogleAuthProvider, 
  signInWithPopup 
};