import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Initial mock data for the conversation list
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    name: "Alex Rivera",
    lastMessage: "Perfect. See you there.",
    avatarSeed: "alex",
    isNew: false,
  },
  {
    id: "2",
    name: "Jordan Kim",
    lastMessage: "Down for a session tomorrow?",
    avatarSeed: "jordan",
    isNew: false,
  },
  {
    id: "3",
    name: "Priya Shah",
    lastMessage: "That was a great workout!",
    avatarSeed: "priya",
    isNew: false,
  },
];

// Reusable row component
const ConversationRow = ({ item, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.row, { borderBottomColor: colors.border }]}
    onPress={onPress}
  >
    {/* Using picsum for placeholder avatars */}
    <Image
      source={{ uri: `https://picsum.photos/seed/${item.avatarSeed}/100/100` }}
      style={styles.avatar}
    />
    <View style={styles.textContainer}>
      <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.lastMessage, { color: "gray" }]}>
        {item.lastMessage || "Say hi 👋"}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="gray" />
  </TouchableOpacity>
);

export default function MessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);

  // If we navigate here with a newChat param (from Discover), add it to the list if needed
  useEffect(() => {
    const newChat = route.params?.newChat;
    if (!newChat) return;

    setConversations((prev) => {
      const exists = prev.some(
        (c) => c.name.toLowerCase() === newChat.name.toLowerCase()
      );
      if (exists) return prev;

      return [
        {
          id: String(prev.length + 1),
          name: newChat.name,
          avatarSeed: newChat.avatarSeed || newChat.name,
          lastMessage: newChat.lastMessage || "",
          isNew: true,
        },
        ...prev,
      ];
    });
  }, [route.params?.newChat]);

  // Handle click on a conversation
  const onConversationPress = (item) => {
    navigation.navigate("Chat", {
      recipientName: item.name,
      isNewChat: item.isNew,
      onUpdateLastMessage: (lastMessage) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === item.id ? { ...c, lastMessage, isNew: false } : c
          )
        );
      },
    });
  };

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
});
