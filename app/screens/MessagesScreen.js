import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Mock data for the conversation list
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    name: "Alex Rivera",
    lastMessage: "Perfect. See you there.",
    avatarSeed: "alex",
  },
  {
    id: "2",
    name: "Jordan Kim",
    lastMessage: "Down for a session tomorrow?",
    avatarSeed: "jordan",
  },
  {
    id: "3",
    name: "Priya Shah",
    lastMessage: "That was a great workout!",
    avatarSeed: "priya",
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
        {item.lastMessage}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="gray" />
  </TouchableOpacity>
);

export default function MessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Handle click on a conversation
  const onConversationPress = (item) => {
    navigation.navigate("Chat", { recipientName: item.name });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={MOCK_CONVERSATIONS}
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