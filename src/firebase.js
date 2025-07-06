import { initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBC0vMfFQ72i9OHwof-6Ga4giOWMP4j5P0",
  authDomain: "to-do-list-93ef5.firebaseapp.com",
  projectId: "to-do-list-93ef5",
  storageBucket: "to-do-list-93ef5.firebasestorage.app",
  messagingSenderId: "638764760229",
  appId: "1:638764760229:web:d2018ff8035c7e985ae14c",
  measurementId: "G-4S5HP3H900"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
