import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const MOCK_MESSAGES = [
  { id: "1", text: "Hey! Ready to hit the gym?", sender: "them" },
  { id: "2", text: "You know it! What time?", sender: "me" },
  { id: "3", text: "How about 6 PM? We can do push day.", sender: "them" },
  { id: "4", text: "Perfect. See you there.", sender: "me" },
  { id: "5", text: "Sounds good!", sender: "them" },
];

export default function ChatScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { recipientName } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipientName,
    });
  }, [navigation, recipientName]);

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "me"
          ? [styles.myMessage, { backgroundColor: colors.primary }]
          : [styles.theirMessage, { backgroundColor: colors.card }],
      ]}
    >
      <Text
        style={
          item.sender === "me" ? styles.myMessageText : { color: colors.text }
        }
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
          style={styles.chatList}
          data={MOCK_MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
        />
        
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor="gray"
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="arrow-up-circle" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chatList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: "75%",
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  myMessageText: {
    color: "white",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    borderRadius: 20,
  },
});