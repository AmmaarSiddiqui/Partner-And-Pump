// App.js
import "react-native-gesture-handler";

import React, { useEffect } from "react";

import AppNavigator from "./app/navigation/AppNavigator";
import { AuthProvider } from "./app/state/useAuthContext";
import { MatchesProvider } from "./app/state/useMatchesContext";

import { auth, db } from "./app/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
 
// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

  export default function App() {
    // ask for permissions (already had this)
    // Save Expo push token for logged-in users
  useEffect(() => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        try {
          // 1) Check existing permission
          let { status } = await Notifications.getPermissionsAsync();

          // 2) If not granted, ASK the user
          if (status !== "granted") {
            const req = await Notifications.requestPermissionsAsync();
            status = req.status;
          }

          // 3) If still not granted, bail
          if (status !== "granted") {
            console.warn("Push permission not granted for user:", user.uid);
            return;
          }

          // 4) Get the Expo push token
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId,
          });

          const expoPushToken = tokenData.data;
          console.log("Expo push token:", expoPushToken);

          // 5) Save token to Firestore under profiles/{uid}
          await setDoc(
            doc(db, "profiles", user.uid),
            { expoPushToken },
            { merge: true }
          );

          console.log("Saved push token for", user.uid);
        } catch (e) {
          console.warn("Error registering push token:", e);
        }
      });

      return () => unsub();
    }, []);

    return (
      <AuthProvider>
        <MatchesProvider>
          <AppNavigator />
        </MatchesProvider>
      </AuthProvider>
    );
  }