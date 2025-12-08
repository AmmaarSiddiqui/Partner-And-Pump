import React, { useLayoutEffect, useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import PostCard from "../components/PostCard";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

export default function DiscoverScreen({ navigation }) {
  const { colors } = useTheme();
  const [posts, setPosts] = useState([]);

  // Header upload button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => navigation.navigate("Upload")}
        >
          <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
            Upload
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.primary]);

  // Subscribe to posts collection
  useEffect(() => {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(items);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingTop: 8 },
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
