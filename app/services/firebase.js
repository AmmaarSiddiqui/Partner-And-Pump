// app/services/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { Platform } from "react-native";

console.log("[firebase] init");

const firebaseConfig = {
  apiKey: "AIzaSyArWbYT4-bXV3nKv8-WCn9ZRSNgK788DCs",
  authDomain: "partnerandpump.firebaseapp.com",
  projectId: "partnerandpump",
  storageBucket: "partnerandpump.appspot.com", 
  messagingSenderId: "266137880793",
  appId: "1:266137880793:web:863a252a2118a38d1916c8",
  measurementId: "G-J87WQ6KB0G",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// React Native must initialize Auth with AsyncStorage
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  if (!globalThis._auth) {
    globalThis._auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  auth = globalThis._auth;
}

// Fast default Firestore
const db = getFirestore(app);
setLogLevel("error");

export { app, auth, db };
