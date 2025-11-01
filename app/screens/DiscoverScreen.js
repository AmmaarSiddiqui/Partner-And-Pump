import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import PostCard from "../components/PostCard";

const MOCK_POSTS = [
  {
    id: "1",
    username: "masroors",
    imageSeed: "post1",
    caption: "Curls in the gym",
    comments: 4,
  },
  {
    id: "2",
    username: "alexrivera",
    imageSeed: "post2",
    caption: "New deadlift PR! 🏋️",
    comments: 12,
  },
  {
    id: "3",
    username: "jordankim",
    imageSeed: "post3",
    caption: "Morning run views.",
    comments: 7,
  },
];

export default function DiscoverScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={MOCK_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingTop: 8, // Give a little space from the header
  },
});
