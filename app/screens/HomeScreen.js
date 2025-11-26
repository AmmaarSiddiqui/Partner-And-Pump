import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../state/useAuthContext";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useMatches } from "../state/useMatchesContext";

// TODO: BACKEND - Fetch "New Matches" notifications from the database (e.g., /api/notifications/matches).
// This should return a list of users who have matched with the current user but haven't been chatted with yet.
const MOCK_MATCH_NOTIFICATIONS = [
  { id: "1", name: "Jessica Wu", goal: "Hypertrophy", time: "20m ago" },
  { id: "2", name: "David Chen", goal: "Strength", time: "2h ago" },
];

// TODO: BACKEND - Fetch the user's schedule for the current day from the database (e.g., /api/schedule/today).
// This might include planned workouts, meal times, or sessions scheduled via the ChatScreen.
const MOCK_SCHEDULE = [
  { id: "1", time: "07:00 AM", activity: "Morning Cardio", status: "completed" },
  { id: "2", time: "05:30 PM", activity: "Push Day (Chest & Tris)", status: "upcoming" },
  { id: "3", time: "07:00 PM", activity: "Post-Workout Meal", status: "upcoming" },
];


export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const { colors } = useTheme();
const { matches, acceptMatch } = useMatches();
  const notifications = matches;


  // TODO: BACKEND - Initialize this state with data fetched from the API.
  // Consider using a real-time listener if notifications should appear instantly.

  // Get current date formatted nicely (e.g., "Monday, Nov 25")
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const handleMatch = async (item) => {
  await acceptMatch(item.requestId);

  navigation.navigate("Chat", {
    recipientName: item.name,
    recipientId: item.id,
  });
};
  
  const renderMatchNotification = ({ item }) => (
    <View style={[styles.notificationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.notificationInfo}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <View>
          <Text style={[styles.matchName, { color: colors.text }]}>{item.name}</Text>
          <Text style={styles.matchDetail}>{item.goal} • {item.time}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.matchButton, { backgroundColor: colors.primary }]}
        onPress={() => handleMatch(item)}
      >
        <Text style={styles.matchButtonText}>Match</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScheduleItem = ({ item }) => (
    <View style={[styles.scheduleItem, { backgroundColor: colors.card }]}>
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text }]}>{item.time}</Text>
        {item.status === "completed" && (
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginTop: 4 }} />
        )}
      </View>
      <View style={[styles.activityContainer, { borderLeftColor: colors.primary }]}>
        <Text style={[styles.activityText, { color: colors.text }]}>{item.activity}</Text>
        <Text style={styles.statusText}>{item.status === "completed" ? "Done" : "Up next"}</Text>
      </View>
    </View>
  );

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

      {/* 2. New Matches Section - Only show if there are notifications */}
      {notifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>New Matches</Text>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{notifications.length}</Text>
            </View>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderMatchNotification}
            scrollEnabled={false} // Let the parent ScrollView handle scrolling
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* 3. Calendar / Schedule Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>
          Today's Schedule
        </Text>
        
        {/* Date Display */}
        <View style={[styles.dateCard, { backgroundColor: colors.card }]}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>{today}</Text>
        </View>

        {/* Timeline */}
        <FlatList
          data={MOCK_SCHEDULE}
          keyExtractor={(item) => item.id}
          renderItem={renderScheduleItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>

      {/* 4. Main CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Match")}
        >
          <Ionicons name="search" size={20} color="white" style={{ marginRight: 8 }} />
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
  // Notification Card Styles
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
  // Schedule Styles
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
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
    marginLeft: 16, // Visual separation
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
  // Main Button
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
});