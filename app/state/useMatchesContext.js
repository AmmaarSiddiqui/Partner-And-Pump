// app/state/useMatchesContext.js
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import * as Notifications from "expo-notifications";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../services/firebase";

/**
 * Firestore-backed "match requests" store.
 *
 * We treat `matches` as "incoming match requests" for the current user:
 *   matches: [{ id, name, category, mode, days, requestId }]
 *
 * - id:        UID of the *other* user (the one who sent the request)
 * - name:      their name (from profiles collection)
 * - category:  e.g. "Push"
 * - mode:      "pumpNow" | "longTerm"
 * - days:      shared days or their schedule
 * - requestId: matchRequests document ID in Firestore
 */
const MatchesCtx = createContext(null);

export function MatchesProvider({ children }) {
  const [matches, setMatches] = useState([]);
  const prevRequestIdsRef = useRef(new Set());

  useEffect(() => {
    let unsubAuth = null;
    let unsubIncoming = null;

    //  listen to auth state first
    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // logged out → clear + stop listening
        setMatches([]);
        prevRequestIdsRef.current = new Set();
        if (unsubIncoming) {
          unsubIncoming();
          unsubIncoming = null;
        }
        return;
      }

      //  DEFINE q *here*
      const q = query(
        collection(db, "matchRequests"),
        where("toUserId", "==", user.uid),
        where("status", "==", "pending")
      );

      // clean any previous listener
      if (unsubIncoming) {
        unsubIncoming();
        unsubIncoming = null;
      }

      //  USE q *here*
      unsubIncoming = onSnapshot(q, async (snap) => {
        const rows = await Promise.all(
          snap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const requestId = docSnap.id;

            const fromUserId = data.fromUserId;
            const category = data.category || "";
            const mode = data.mode || "";
            const days = Array.isArray(data.days) ? data.days : [];

            // load sender's profile for name
            let name = "Gym partner";
            try {
              const profSnap = await getDoc(doc(db, "profiles", fromUserId));
              if (profSnap.exists()) {
                const p = profSnap.data();
                name = p.name || name;
              }
            } catch (e) {
              console.warn(
                "[MatchesProvider] failed to load profile for",
                fromUserId,
                e
              );
            }

            return {
              id: fromUserId, // other user UID
              name,
              category,
              mode,
              days,
              requestId,
            };
          })
        );

        //  detect *new* requests
        const prevIds = prevRequestIdsRef.current;
        const newOnes = rows.filter((r) => !prevIds.has(r.requestId));

        // send a local notification for each new one
        newOnes.forEach(async (req) => {
          const isLongTerm = req.mode === "longTerm";
          const typeLabel = isLongTerm ? "Long-Term Request" : "Pump Now Request";

          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "New Match Request 💪",
                body: `${req.name} sent you a ${typeLabel}${
                  req.category ? ` (${req.category})` : ""
                }`,
                data: {
                  requestId: req.requestId,
                  fromUserId: req.id,
                },
              },
              trigger: null, // send immediately
            });
          } catch (e) {
            console.warn("[MatchesProvider] notification error:", e);
          }
        });

        // update seen IDs so we don’t re-notify for old ones
        prevRequestIdsRef.current = new Set(rows.map((r) => r.requestId));

        setMatches(rows);
      });
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubIncoming) unsubIncoming();
    };
  }, []);

  /**
   * addMatch: send a match request to another user
   */
  const addMatch = async (m) => {
    const user = auth.currentUser;
    if (!user) {
      console.warn("[MatchesProvider] addMatch called with no logged-in user");
      return;
    }

    try {
      await addDoc(collection(db, "matchRequests"), {
        fromUserId: user.uid, // sender = me
        toUserId: m.id, // receiver = other user
        category: m.category,
        mode: m.mode,
        days: Array.isArray(m.days) ? m.days : [],
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[MatchesProvider] addMatch (send request) error:", e);
    }
  };

  /**
   * cancelMatch: cancel a pending request that was sent TO me
   */
  const cancelMatch = async (id, mode, category) => {
    const match = matches.find(
      (m) => m.id === id && m.mode === mode && m.category === category
    );
    if (!match || !match.requestId) {
      console.warn(
        "[MatchesProvider] cancelMatch: no matching request found for",
        id,
        mode,
        category
      );
      return;
    }

    try {
      await updateDoc(doc(db, "matchRequests", match.requestId), {
        status: "canceled",
      });
    } catch (e) {
      console.warn("[MatchesProvider] cancelMatch error:", e);
    }
  };

  /**
   * acceptMatch: mark the request as accepted AND create a symmetric match doc
   */
  const acceptMatch = async (requestId) => {
    const user = auth.currentUser;
    if (!user) {
      console.warn("[MatchesProvider] acceptMatch called with no logged-in user");
      return;
    }

    const match = matches.find((m) => m.requestId === requestId);
    if (!match) {
      console.warn(
        "[MatchesProvider] acceptMatch: no in-memory match for requestId",
        requestId
      );
      return;
    }

    try {
      // 1) Update the matchRequests doc to accepted
      const reqRef = doc(db, "matchRequests", requestId);
      await updateDoc(reqRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      // 2) Create a shared match doc for BOTH accounts
      await addDoc(collection(db, "matches"), {
        users: [user.uid, match.id], // me + other user
        mode: match.mode,
        category: match.category,
        days: match.days,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[MatchesProvider] acceptMatch error:", e);
    }
  };

  /**
   * declineMatch: mark the request as declined
   */
  const declineMatch = async (requestId) => {
    try {
      const reqRef = doc(db, "matchRequests", requestId);
      await updateDoc(reqRef, {
        status: "declined",
        declinedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[MatchesProvider] declineMatch error:", e);
    }
  };

  const value = useMemo(
    () => ({ matches, addMatch, cancelMatch, acceptMatch, declineMatch }),
    [matches]
  );

  return <MatchesCtx.Provider value={value}>{children}</MatchesCtx.Provider>;
}

export function useMatches() {
  const v = useContext(MatchesCtx);
  if (!v) throw new Error("useMatches must be used inside <MatchesProvider>");
  return v;
}
