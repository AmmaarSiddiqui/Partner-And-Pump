import React, { useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../state/useAuthContext";
import { ActivityIndicator } from "react-native";
import { useMatches } from "../state/useMatchesContext";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth(); // trust the provider
  const { matches, cancelMatch } = useMatches();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "My Profile",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfile")}
          style={[styles.pill, { marginRight: 12 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.pillText}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 1) loading
  if (profile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: "#9ca3af", marginTop: 8 }}>Loading profile…</Text>
      </View>
    );
  }

  // 2) authed but no profile doc yet
  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff" }}>No profile yet.</Text>
        <Text style={{ color: "#9ca3af", marginTop: 6 }}>Tap “Edit” to create it.</Text>
      </View>
    );
  }

  // 3) ready
  const DAYS_ORDER = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const mapped = {
    initials: profile.name ? profile.name[0].toUpperCase() : "?",
    name: profile.name || "",
    goal: profile.goal || "",
    about: profile.about || "",
    level: profile.fitnessLevel || "",
    split: profile.split || "",
    gymName: profile.gym?.name || profile.gym || "",
    gymAddr: profile.gym?.address || "",
    time: profile.time || "",
    days: Array.isArray(profile.days) ? profile.days : [],
    availability:
      Array.isArray(profile.availability) && profile.availability.length > 0
        ? profile.availability
        : Array.isArray(profile.days)
        ? [...profile.days]
            .sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b))
            .map((d) => ({ day: d, time: profile.time || "Anytime", tag: "preferred" }))
        : [],
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* header */}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{mapped.initials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{mapped.name || "—"}</Text>
            <Text style={styles.about}>{mapped.about || " "}</Text>
          </View>
        </View>

        <Card title="Stats">
          <Row label="Goal" value={mapped.goal || "—"} />
          <Row label="Fitness Level" value={mapped.level || "—"} />
          <Row label="Workout Split" value={mapped.split || "—"} />
        </Card>

        <Card title="Gym">
          <Text style={styles.cardTitleText}>{mapped.gymName || "—"}</Text>
          {!!mapped.gymAddr && <Text style={styles.cardSubText}>{mapped.gymAddr}</Text>}
        </Card>

        <Card title="Weekly Availability">
          {mapped.availability.length === 0 ? (
            <Text style={{ color: "#9ca3af" }}>—</Text>
          ) : (
            mapped.availability.map((a, i) => (
              <AvailabilityRow key={i} day={a.day} time={a.time} tag={a.tag} />
            ))
          )}
        </Card>

        <Card title="About Me">
          <Text style={styles.aboutText}>{mapped.about || "—"}</Text>
        </Card>

        {/* NEW: Schedule */}
        <Card title="Schedule">
          {matches.length === 0 ? (
            <Text style={{ color: "#9ca3af" }}>No scheduled partners yet.</Text>
          ) : (
            matches.map((m) => (
              <View key={`${m.id}-${m.mode}-${m.category}`} style={styles.scheduleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleName}>{m.name}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                    {m.days.length === 0 ? (
                      <Text style={{ color: "#9ca3af" }}>Days TBD</Text>
                    ) : (
                      m.days.map((d) => (
                        <View key={d} style={styles.dayChip}>
                          <Text style={styles.dayChipText}>{d}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => cancelMatch(m.id, m.mode, m.category)}
                  style={styles.cancelBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

/* ---------- tiny building blocks ---------- */

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function AvailabilityRow({ day, time, tag }) {
  return (
    <View style={styles.avRow}>
      <Text style={styles.avDay}>{day}</Text>
      <Text style={styles.avTime}>{time}</Text>
      <View style={styles.avTag}>
        <Text style={styles.avTagText}>{tag}</Text>
      </View>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  pill: {
    backgroundColor: "#fff",
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pillText: { color: "#111", fontWeight: "600" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b0b0b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  avatar: {
    width: 64, height: 64, borderRadius: 9999,
    backgroundColor: "#2b2b2b",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#cfcfcf", fontWeight: "700", fontSize: 18 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#8e8e93", marginTop: 2 },
  looking: { color: "#22c55e", marginTop: 4, fontWeight: "600" },

  card: {
    backgroundColor: "#121212",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardHeader: { color: "#fff", fontWeight: "800", fontSize: 16, marginBottom: 10 },
  cardTitleText: { color: "#fff", fontWeight: "700", fontSize: 16, marginBottom: 4 },
  cardSubText: { color: "#9ca3af" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#1a1a1a",
  },
  rowLabel: { color: "#9ca3af", flex: 1 },
  rowValue: { color: "#fff", fontWeight: "600" },

  avRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1b1b1b",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  avDay: { color: "#fff", width: 48, fontWeight: "800" },
  avTime: { color: "#e5e7eb", flex: 1, textAlign: "center" },
  avTag: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "#22c55e",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  avTagText: { color: "#22c55e", fontWeight: "700" },

  aboutText: { color: "#e5e7eb", lineHeight: 20 },

  /* schedule styles */
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1b1b1b",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  scheduleName: { color: "#fff", fontWeight: "800", fontSize: 16 },
  dayChip: {
    backgroundColor: "#1f1f1f",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  dayChipText: { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "#ef4444",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    marginLeft: 12,
  },
  cancelBtnText: { color: "#ef4444", fontWeight: "800" },
});