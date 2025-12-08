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

// 🔐 All values come from environment variables now
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
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

export { app, auth, db, firebaseConfig };
