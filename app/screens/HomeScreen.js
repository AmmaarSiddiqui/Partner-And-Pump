// app/screens/HomeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { useAuth } from "../state/useAuthContext";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useMatches } from "../state/useMatchesContext";
import { auth } from "../services/firebase";

// import Firestore
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase"; // make sure db is exported from firebase.js

// --- date helpers ---
const formatLongDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

const formatDateKey = (date) => date.toISOString().slice(0, 10);

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { matches, acceptMatch, declineMatch } = useMatches();
  const notifications = matches;

  // ---- SCHEDULE STATE ----
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]); // list for that day
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDateLabel = formatLongDate(selectedDate);

  const userId = auth.currentUser?.uid;

  // subscribe to Firestore when date or user changes
  useEffect(() => {
    if (!userId) {
      setSchedule([]);
      setLoadingSchedule(false);
      return;
    }

    setLoadingSchedule(true);

    const q = query(
      collection(db, "schedules"),
      where("userId", "==", userId),
      where("dateKey", "==", selectedDateKey),
      orderBy("time")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setSchedule(list);
        setLoadingSchedule(false);
      },
      (err) => {
        console.log("❌ schedule onSnapshot error:", err);
        setLoadingSchedule(false);
      }
    );

    return unsubscribe;
  }, [userId, selectedDateKey]);

  // ---- SCHEDULE HELPERS ----

  /**
   * This is called from AddSchedule screen.
   * It handles BOTH creating and editing:
   *  - if newItem.id exists -> update existing doc
   *  - else -> create new doc
   *
   * newItem should look like:
   *  {
   *    id?: string,      // only for edit
   *    title: string,    // activity
   *    time: string,     // "05:30 PM"
   *    date?: Date | string, // optional override date
   *    status?: "upcoming" | "completed"
   *  }
   */
  // HomeScreen.js

const handleSaveSchedule = async (newItem) => {
  try {
    console.log("[HomeScreen] handleSaveSchedule called with:", newItem);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.warn("[HomeScreen] handleSaveSchedule – no auth.currentUser");
      return;
    }

    // if editing, keep the old dateKey; if creating, use the current selectedDate
    const dateKey =
      newItem.dateKey || formatDateKey(selectedDate); // "YYYY-MM-DD"

    const payload = {
      userId: uid,
      dateKey,
      time: newItem.time,
      activity: newItem.title,
      status: newItem.status || "upcoming",
    };

    console.log("[HomeScreen] Writing schedule payload:", payload);

    if (newItem.id) {
      const ref = doc(db, "schedules", newItem.id);
      await updateDoc(ref, payload);
      console.log("[HomeScreen] Updated schedule doc:", newItem.id);
    } else {
      const docRef = await addDoc(collection(db, "schedules"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      console.log("[HomeScreen] Created schedule doc:", docRef.id);
    }
  } catch (err) {
    console.error(" handleSaveSchedule FAILED:", err);
  }
};


  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 1);
      return d;
    });
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 1);
      return d;
    });
  };

  // ---- MATCH HANDLERS ----

  const handleMatch = async (item) => {
    try {
      const myId = auth.currentUser?.uid;
      if (!myId) return;

      // 1) accept in backend
      await acceptMatch(item.requestId);

      // 2) matchId that ChatScreen expects
      const otherId = item.id;
      const matchId = [myId, otherId].sort().join("_");

      // 3) go to chat
      navigation.navigate("Chat", {
        recipientName: item.name,
        recipientId: otherId,
        matchId,
      });
    } catch (err) {
      console.log("❌ handleMatch FAILED:", err);
    }
  };

  const handleDeclineMatch = async (item) => {
    try {
      await declineMatch(item.requestId);
    } catch (err) {
      console.log(" handleDeclineMatch FAILED:", err);
    }
  };

  // open AddSchedule in "edit" mode
  const handleEditSchedule = (item) => {
    navigation.navigate("AddSchedule", {
      // When user hits save, we call handleSaveSchedule with existing id
      onSave: (updated) =>
        handleSaveSchedule({
          ...updated,
          id: item.id,
        }),
      initialDate: selectedDate,
      // You can use this inside AddSchedule to pre-fill the form
      existingSchedule: {
        id: item.id,
        title: item.activity,
        time: item.time,
        date: selectedDate,
        status: item.status,
      },
    });
  };

  // ---- RENDERERS ----

  const renderMatchNotification = ({ item }) => {
    const isLongTerm = item.mode === "longTerm";
    const typeLabel = isLongTerm ? "Long-Term" : "Pump Now";
    const detailLabel = item.category ? `: ${item.category}` : "";

    return (
      <View
        style={[
          styles.notificationCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.notificationInfo}>
          <View className="avatar" style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name[0]}</Text>
          </View>
          <View>
            <Text style={[styles.matchName, { color: colors.text }]}>
              {item.name}
            </Text>

            <Text style={styles.matchDetail}>
              {typeLabel}
              {detailLabel}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={[
              styles.matchButton,
              { backgroundColor: colors.primary, marginRight: 8 },
            ]}
            onPress={() => handleMatch(item)}
          >
            <Text style={styles.matchButtonText}>Match</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.declineButton, { backgroundColor: "#FF3B30" }]}
            onPress={() => handleDeclineMatch(item)}
          >
            <Text style={styles.matchButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderScheduleItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleEditSchedule(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.scheduleItem, { backgroundColor: colors.card }]}>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {item.time}
          </Text>
          {item.status === "completed" && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.primary}
              style={{ marginTop: 4 }}
            />
          )}
        </View>
        <View
          style={[
            styles.activityContainer,
            { borderLeftColor: colors.primary },
          ]}
        >
          <Text style={[styles.activityText, { color: colors.text }]}>
            {item.activity}
          </Text>
          <Text style={styles.statusText}>
            {item.status === "completed" ? "Done" : "Up next"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ---- UI ----

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: "gray" }]}>Hello,</Text>
          <Text style={[styles.username, { color: colors.text }]}>
            {profile?.name || "Lifter"} 👋
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. New Matches */}
      {notifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              New Matches
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{notifications.length}</Text>
            </View>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.requestId}
            renderItem={renderMatchNotification}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* 3. Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Schedule
          </Text>

          <TouchableOpacity
            style={[
              styles.addScheduleButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() =>
              navigation.navigate("AddSchedule", {
                onSave: handleSaveSchedule,
                initialDate: selectedDate,
              })
            }
          >
            <Ionicons
              name="add"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.addScheduleButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Date chooser */}
        <View style={[styles.dateCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.dateArrowButton}
            onPress={goToPreviousDay}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {selectedDateLabel}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dateArrowButton}
            onPress={goToNextDay}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {loadingSchedule ? (
          <Text style={{ color: colors.text, opacity: 0.7 }}>
            Loading schedule...
          </Text>
        ) : schedule.length === 0 ? (
          <Text style={{ color: colors.text, opacity: 0.7 }}>
            No schedule items for this day yet. Tap "Add" to create one.
          </Text>
        ) : (
          <FlatList
            data={schedule}
            keyExtractor={(item) => item.id}
            renderItem={renderScheduleItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>

      {/* 4. CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Match")}
        >
          <Ionicons
            name="search"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.mainButtonText}>Find a New Partner</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: "800",
  },
  profileButton: {
    padding: 10,
    borderRadius: 50,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  badge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  addScheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  addScheduleButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  notificationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  matchName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  matchDetail: {
    color: "gray",
    fontSize: 12,
    marginTop: 2,
  },
  matchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  matchButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  dateCenter: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  dateArrowButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  scheduleItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
  },
  timeContainer: {
    width: 80,
    borderRightWidth: 1,
    borderRightColor: "#333",
    justifyContent: "center",
  },
  timeText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  activityContainer: {
    flex: 1,
    paddingLeft: 16,
    borderLeftWidth: 3,
    marginLeft: 16,
    justifyContent: "center",
  },
  activityText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusText: {
    color: "gray",
    fontSize: 12,
  },
  mainButton: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  declineButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
});
