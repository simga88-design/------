import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAx0MY9206Ofb7bj9d4rIL62EjBNHetBCQ",
  authDomain: "jcmhcmainportal.firebaseapp.com",
  databaseURL: "https://jcmhcmainportal-default-rtdb.firebaseio.com",
  projectId: "jcmhcmainportal",
  storageBucket: "jcmhcmainportal.firebasestorage.app",
  messagingSenderId: "431651056565",
  appId: "1:431651056565:web:9cb7fc899d5acbc1f5c7fc"
};

// Next.js 환경에서 여러 번 초기화되는 것을 방지합니다.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

export { app, db, auth, storage, provider };
