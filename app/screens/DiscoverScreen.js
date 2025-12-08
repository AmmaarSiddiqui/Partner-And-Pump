// app/screens/DiscoverScreen.js
import React, { useLayoutEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import PostCard from "../components/PostCard";

const MOCK_POSTS = [
  {
    id: "1",
    username: "masroors",
    imageSeed: "post1",
    caption: "Curls in the gym",
    likes: 18,
    comments: [
      { id: "c1", username: "fitfan", text: "Let’s gooo 🔥" },
      { id: "c2", username: "ironaddict", text: "Clean form!" },
    ],
  },
  {
    id: "2",
    username: "alexrivera",
    imageSeed: "post2",
    caption: "New deadlift PR! 🏋️",
    likes: 32,
    comments: [
      { id: "c1", username: "masroors", text: "Huge lift 👏" },
      { id: "c2", username: "jordankim", text: "What weight was that?" },
    ],
  },
  {
    id: "3",
    username: "jordankim",
    imageSeed: "post3",
    caption: "Morning run views.",
    likes: 9,
    comments: [
      { id: "c1", username: "alexrivera", text: "Love this route" },
    ],
  },
];

export default function DiscoverScreen({ navigation }) {
  const { colors } = useTheme();

  // Upload button in the top-right of the Discover header
// app/screens/DiscoverScreen.js
// ...

useLayoutEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => navigation.navigate("Upload")} // ⬅️ route name matches Stack.Screen
      >
        <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
          Upload
        </Text>
      </TouchableOpacity>
    ),
  });
}, [navigation, colors.primary]);

// ...


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
    paddingTop: 8,
  },
  uploadButton: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#666",
  },
  uploadButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
