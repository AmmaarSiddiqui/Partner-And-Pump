import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  // orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { useAuth } from "../state/useAuthContext";

// Row component
const ConversationRow = ({ item, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.row, { borderBottomColor: colors.border }]}
    onPress={onPress}
  >
    <Image
      source={{
        uri: `https://picsum.photos/seed/${
          item.avatarSeed || "default-avatar"
        }/100/100`,
      }}
      style={styles.avatar}
    />
    <View style={styles.textContainer}>
      <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.lastMessage, { color: "gray" }]}>
        {item.lastMessage || "Start the conversation!"}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="gray" />
  </TouchableOpacity>
);

export default function MessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // 🔑 From your AuthProvider
  const { user, profile, profileLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
      if (!user) return;

      setLoading(true);
      setLoadError(null);

      const q = query(
        collection(db, "matches"),
        where("userIds", "array-contains", user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          try {
            const uid = user.uid;

            // Step 1: base items from matches
            const baseItems = snapshot.docs.map((docSnap) => {
              const data = docSnap.data() || {};

              let otherUserId = null;
              if (Array.isArray(data.userIds)) {
                otherUserId =
                  data.userIds.find((id) => id !== uid) ||
                  data.userIds[0] ||
                  null;
              }

              return {
                id: docSnap.id,
                matchId: docSnap.id,
                otherUserId,
                // temporary, will be replaced after we fetch profiles
                name: "Gym partner",
                avatarSeed: otherUserId || docSnap.id,
                lastMessage: data.lastMessageText || "",
                lastMessageAt: data.lastMessageAt || null,
              };
            });

            // Step 2: fetch profiles for distinct otherUserIds
            const uniqueOtherIds = Array.from(
              new Set(
                baseItems
                  .map((item) => item.otherUserId)
                  .filter((id) => !!id)
              )
            );

            const profileMap = {};
            if (uniqueOtherIds.length > 0) {
              const profileSnaps = await Promise.all(
                uniqueOtherIds.map((id) => getDoc(doc(db, "profiles", id)))
              );

              profileSnaps.forEach((snap, index) => {
                if (snap.exists()) {
                  profileMap[uniqueOtherIds[index]] = snap.data() || {};
                }
              });
            }

            // Step 3: hydrate items with names / avatarSeeds
            const items = baseItems.map((item) => {
              if (!item.otherUserId) return item;

              const p = profileMap[item.otherUserId] || {};
              const name =
                p.name ||
                p.username ||
                p.displayName ||
                item.name ||
                "Gym partner";
              const avatarSeed =
                p.avatarSeed || item.avatarSeed || item.otherUserId || item.id;

              return {
                ...item,
                name,
                avatarSeed,
              };
            });

            setConversations(items);
            setLoading(false);
          } catch (err) {
            console.warn("[Messages] listener processing error:", err);
            setLoadError(err);
            setLoading(false);
          }
        },
        (err) => {
          console.warn("[Messages] listener error:", err);
          setLoadError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }, [user]);


  const onConversationPress = (item) => {
    navigation.navigate("Chat", {
      recipientName: item.name,
      matchId: item.matchId,
      recipientId: item.otherUserId,
    });
  };

  // ---- UI STATES ----

  // Not signed in at all
  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: "center" }}>
          You must be signed in to see your messages.
        </Text>
      </View>
    );
  }

  // (Optional) Wait for profile if your chat list depends on it
  if (profileLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
        <Text style={{ color: colors.text, marginTop: 8 }}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
        <Text style={{ color: colors.text, marginTop: 8 }}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: "red", textAlign: "center" }}>
          Couldn't load messages: {loadError.message}
        </Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: "center" }}>
          No conversations yet. Go match with someone and say hi 👋
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow
            item={item}
            colors={colors}
            onPress={() => onConversationPress(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});

