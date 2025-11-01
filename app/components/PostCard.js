import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Using a placeholder for images
const getPlaceholderImage = (seed) => `https://picsum.photos/seed/${seed}/600/800`;

export default function PostCard({ post }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Post Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: getPlaceholderImage(post.id) }}
          style={styles.avatar}
        />
        <Text style={[styles.username, { color: colors.text }]}>
          {post.username}
        </Text>
      </View>

      {/* Post Image */}
      <Image
        source={{ uri: getPlaceholderImage(post.imageSeed) }}
        style={styles.image}
      />

      {/* Post Footer (Actions & Caption) */}
      <View style={styles.footer}>
        <View style={styles.actions}>
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color={colors.text}
            style={styles.actionIcon}
          />
          <Text style={[styles.comments, { color: "gray" }]}>
            {post.comments} Comments
          </Text>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={colors.text}
            style={styles.ellipsis}
          />
        </View>
        <Text style={[styles.caption, { color: colors.text }]}>
          <Text style={{ fontWeight: "bold" }}>{post.username}</Text>{" "}
          {post.caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    // Cards in a feed typically don't have borders, but have a background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  username: {
    fontWeight: "600",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 5, // Common feed image ratio
    backgroundColor: "#333", // Background while loading
  },
  footer: {
    padding: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionIcon: {
    marginRight: 6,
  },
  comments: {
    fontSize: 14,
  },
  ellipsis: {
    marginLeft: "auto", // Pushes the ellipsis icon to the far right
  },
  caption: {
    fontSize: 14,
  },
});
