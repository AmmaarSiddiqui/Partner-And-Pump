import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Props
 * - name, age, bio, tags[]
 * - isMatched: boolean
 * - onMatch: () => void
 */
export default function UserCard({
  name,
  age,
  bio,
  tags = [],
  score,
  isMatched = false,
  onMatch,
}) {
  const { colors } = useTheme();

  let scoreColor = "gray"; // fallback
  if (typeof score === "number") {
    if (score >= 80) scoreColor = "#4CAF50";      // green
    else if (score >= 50) scoreColor = "#FFC107"; // yellow
    else scoreColor = "#F44336";                 // red
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Ionicons
        name="person-circle-outline"
        size={50}
        color={colors.text}
        style={styles.avatar}
      />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>
          {name}, {age}
        </Text>
        <Text style={[styles.bio, { color: "gray" }]}>{bio}</Text>

         {typeof score === "number" && (
      <Text style={[styles.scoreText, { color: scoreColor }]}>
        Match: {score}%
      </Text>
    )}

        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.border }]}
            >
              <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.matchButton,
          isMatched
            ? { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border }
            : { backgroundColor: colors.primary },
        ]}
        onPress={onMatch}
        disabled={isMatched}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.matchButtonText,
            { color: isMatched ? colors.text : "white" },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isMatched ? "Sent" : "Match"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  avatar: { marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  bio: { fontSize: 14, marginBottom: 8 },
  
  tagRow: { flexDirection: "row", flexWrap: "wrap" },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: { fontSize: 12, fontWeight: "500" },
  matchButton: {
    backgroundColor: "#333", // fallback; overridden by theme
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  matchButtonText: { fontWeight: "bold", fontSize: 14 },
});
