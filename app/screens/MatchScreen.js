// app/screens/MatchScreen.js
// Match Screen (UI-Only)
// lets users toggle between "Pump Now" and "Long-Term"
// all front-end visuals only, no backend or data yet.

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";

export default function MatchScreen() {
  // keep track of which mode we're on like "pumpNow" or "longTerm"
  const [mode, setMode] = useState("pumpNow");
  const { colors } = useTheme();
  const navigation = useNavigation();

  // mock categories for display only
  const categories = [
    { label: "Push", icon: "💪" },
    { label: "Legs", icon: "🦵" },
    { label: "Sports", icon: "⚽" },
    { label: "Cardio", icon: "❤️" },
    { label: "Full Body", icon: "🏋️" },
    { label: "Yoga", icon: "🧘" },
  ];

  // render title text based on selected mode
  const titleText = mode === "pumpNow" ? "Pump Now" : "Long-Term";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>MATCH</Text>

      <View style={[styles.toggleRow, { backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => setMode("pumpNow")}
          style={[
            styles.toggleBtn,
            mode === "pumpNow" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              { color: mode === "pumpNow" ? "white" : "gray" },
            ]}
          >
            Pump Now
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("longTerm")}
          style={[
            styles.toggleBtn,
            mode === "longTerm" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              { color: mode === "longTerm" ? "white" : "gray" },
            ]}
          >
            Long-Term
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: "gray" }]}>
        {titleText === "Pump Now" ? "Same-Day Sessions" : "Ongoing Partnerships"}
      </Text>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat.label}
            style={[styles.box, { 
              backgroundColor: colors.card, 
              borderColor: colors.border 
            }]}
            onPress={() =>
              navigation.navigate("MatchList", {
                category: cat.label,
                mode: mode,
              })
            }
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={[styles.boxText, { color: colors.text }]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// 🧠 styles — all dark mode, consistent with rest of app
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 70, // This might be too large, adjust as needed
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  // 'activeToggle' removed, backgroundColor applied inline
  toggleText: {
    fontWeight: "600",
    fontSize: 14,
  },
  // 'activeText' removed, color applied inline
  sectionTitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 60,
  },
  box: {
    width: "47%",
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  // 'backBox' removed, styles applied inline
  icon: {
    fontSize: 28,
    marginBottom: 10,
  },
  boxText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
