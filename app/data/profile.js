// app/data/profile.js
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

/**
 * Save or update a user's profile in Firestore.
 * It writes to: profiles/{uid}
 */
export async function saveProfile(profile) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const ref = doc(db, "profiles", user.uid);

  await setDoc(
    ref,
    {
      name: profile.name,
      goal: profile.goal,
      gym: profile.gym && {
        placeId: profile.gym.placeId,
        name: profile.gym.name,
        address: profile.gym.address,
        lat: profile.gym.lat,
        lng: profile.gym.lng,
      },
      updatedAt: Date.now(),
    },
    { merge: true } // keeps existing fields intact
  );
}
