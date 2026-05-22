import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBBDWF4bCDNyRg2TiJ9augpxmAJH8r8CU4",
  authDomain: "course-progress-visualiz-64c02.firebaseapp.com",
  projectId: "course-progress-visualiz-64c02",
  storageBucket: "course-progress-visualiz-64c02.firebasestorage.app",
  messagingSenderId: "565952994812",
  appId: "1:565952994812:web:b2d8713aba9578380ba679",
  measurementId: "G-32CHZ1FTCH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Initialize Firebase Authentication and Google Provider
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);