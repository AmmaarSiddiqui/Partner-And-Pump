import { setGlobalOptions } from "firebase-functions/v2/options";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { Expo } from "expo-server-sdk";

import {
  notifyPartnerRequest,
  notifyMatchAccepted,
} from "./messaging/sendNotification";

// ---- Global options for all v2 functions ----
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

// ---- Initialize Firebase Admin ----
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const expo = new Expo();

/**
 * Helper: send a real Expo push to a user based on profiles/{uid}.expoPushToken
 */
async function sendExpoPushToUser(
  userId: string,
  content: { title: string; body: string; data?: any }
): Promise<void> {
  try {
    const profileSnap = await db.collection("profiles").doc(userId).get();
    if (!profileSnap.exists) {
      console.log("[sendExpoPushToUser] No profile for", userId);
      return;
    }

    const profileData = profileSnap.data() || {};
    const expoPushToken = (profileData as any).expoPushToken;

    if (!expoPushToken) {
      console.log("[sendExpoPushToUser] No expoPushToken for", userId);
      return;
    }

    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.log(
        "[sendExpoPushToUser] Invalid Expo push token:",
        userId,
        expoPushToken
      );
      return;
    }

    const messages = [
      {
        to: expoPushToken,
        sound: "default" as const,
        title: content.title,
        body: content.body,
        data: content.data || {},
      },
    ];

    const tickets = await expo.sendPushNotificationsAsync(messages);
    console.log("[sendExpoPushToUser] Sent push:", tickets);
  } catch (err) {
    console.error("[sendExpoPushToUser] Error:", err);
  }
}

/**
 * 1) New match request created → notify RECEIVER (toUserId)
 */
export const onMatchRequestCreated = onDocumentCreated(
  "matchRequests/{requestId}",
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("[onMatchRequestCreated] No event data");
      return;
    }

    const data = snap.data() as any;

    const fromUserId: string = data.fromUserId;
    const toUserId: string = data.toUserId;
    const mode: string = data.mode || "";
    const category: string = data.category || "";
    const gym: string | undefined = data.gym;

    // Get sender's name
    let fromName = "Gym partner";
    try {
      const senderProfile = await db.collection("profiles").doc(fromUserId).get();
      if (senderProfile.exists) {
        const p = senderProfile.data() || {};
        fromName = (p as any).name || fromName;
      }
    } catch (e) {
      console.warn("[onMatchRequestCreated] Failed to load sender profile:", e);
    }

    const isLongTerm = mode === "longTerm";
    const typeLabel = isLongTerm ? "Long-Term Request" : "Pump Now Request";

    const body =
      `${fromName} sent you a ${typeLabel}` +
      (category ? ` (${category})` : "");

    console.log(
      "[onMatchRequestCreated] New request → receiver:",
      toUserId,
      body
    );

    // log helper
    await notifyPartnerRequest(toUserId, { fromName, gym });

    // push
    await sendExpoPushToUser(toUserId, {
      title: "New Match Request 💪",
      body,
      data: {
        type: "matchRequest:new",
        requestId: event.params.requestId,
        fromUserId,
      },
    });
  }
);

/**
 * 2) Match request updated → notify SENDER when status becomes "accepted"
 */
export const onMatchRequestUpdated = onDocumentUpdated(
  "matchRequests/{requestId}",
  async (event) => {
    if (!event.data) {
      console.log("[onMatchRequestUpdated] No event data");
      return;
    }

    const before = event.data.before.data() as any;
    const after = event.data.after.data() as any;

    // Only act when status transitions to "accepted"
    if (before.status === "accepted" || after.status !== "accepted") {
      return;
    }

    const fromUserId: string = after.fromUserId;
    const toUserId: string = after.toUserId;
    const mode: string = after.mode || "";
    const category: string = after.category || "";

    // Get receiver's name (person who accepted)
    let partnerName = "Your match";
    try {
      const receiverProfile = await db.collection("profiles").doc(toUserId).get();
      if (receiverProfile.exists) {
        const p = receiverProfile.data() || {};
        partnerName = (p as any).name || partnerName;
      }
    } catch (e) {
      console.warn(
        "[onMatchRequestUpdated] Failed to load receiver profile:",
        e
      );
    }

    const isLongTerm = mode === "longTerm";
    const typeLabel = isLongTerm ? "Long-Term Request" : "Pump Now Request";

    const body =
      `${partnerName} accepted your ${typeLabel}` +
      (category ? ` (${category})` : "");

    console.log(
      "[onMatchRequestUpdated] Request accepted → sender:",
      fromUserId,
      body
    );

    await notifyMatchAccepted(fromUserId, { partnerName });

    await sendExpoPushToUser(fromUserId, {
      title: "Match Accepted ✅",
      body,
      data: {
        type: "matchRequest:accepted",
        requestId: event.params.requestId,
        toUserId,
      },
    });
  }
);

/**
 * 3) New chat message created → notify RECEIVER
 *
 * Trigger: /matches/{matchId}/messages/{messageId} onCreate
 */
export const onMessageCreated = onDocumentCreated(
  "matches/{matchId}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("[onMessageCreated] No event data");
      return;
    }

    const matchId = event.params.matchId;
    const data = snap.data() as any;

    const text: string = data.text || "";
    const fromUserId: string | undefined = data.fromUserId;
    const toUserId: string | undefined = data.toUserId;
    const createdAt =
      data.createdAt || admin.firestore.FieldValue.serverTimestamp();

    if (!fromUserId || !toUserId) {
      console.log("[onMessageCreated] Missing fromUserId/toUserId", data);
      return;
    }

    if (fromUserId === toUserId) {
      return; // no self-notifications
    }

    // update match summary
    try {
      const matchRef = db.collection("matches").doc(matchId);
      await matchRef.set(
        {
          lastMessageText: text,
          lastMessageAt: createdAt,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[onMessageCreated] Failed to update match doc:", e);
    }

    // get sender name
    let fromName = "Your gym partner";
    try {
      const senderProfile = await db
        .collection("profiles")
        .doc(fromUserId)
        .get();
      if (senderProfile.exists) {
        const p = senderProfile.data() || {};
        fromName = ((p as any).name as string) || fromName;
      }
    } catch (e) {
      console.warn("[onMessageCreated] Failed to load sender profile:", e);
    }

    const preview = text.length > 60 ? text.slice(0, 57) + "..." : text;

    await sendExpoPushToUser(toUserId, {
      title: `${fromName} sent you a message 💬`,
      body: preview || "New message in Partner & Pump",
      data: {
        type: "chat:message",
        matchId,
        messageId: event.params.messageId,
        fromUserId,
      },
    });
  }
);
