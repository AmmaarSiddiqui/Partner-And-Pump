import React, { useLayoutEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Helper to generate next 7 days
const getNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      id: i,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.toLocaleDateString("en-US", { day: "numeric" }),
      full: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    });
  }
  return days;
};

const TIMES = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
];

const DURATIONS = ["30 min", "45 min", "1 hr", "1.5 hr", "2 hr", "2.5 hr", "3 hr"];

// Mock history for *existing* chats
const INITIAL_MESSAGES = [
  { id: "1", text: "Hey! Ready to hit the gym?", sender: "them", type: "text" },
  { id: "2", text: "You know it! What time?", sender: "me", type: "text" },
  {
    id: "3",
    text: "How about 6 PM? We can do push day.",
    sender: "them",
    type: "text",
  },
  { id: "4", text: "Perfect. See you there.", sender: "me", type: "text" },
  { id: "5", text: "Sounds good!", sender: "them", type: "text" },
  {
    id: "6",
    sender: "them",
    type: "invite",
    status: "pending",
    details: {
      date: "Tomorrow",
      time: "06:00 PM",
      duration: "1.5 hr",
      location: "Gold's Gym",
      description: "Leg Day - Heavy Squats",
    },
  },
];

export default function ChatScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { recipientName, isNewChat, onUpdateLastMessage } = route.params;

  // For new chats (from Discover), start with an empty history.
  const [messages, setMessages] = useState(
    isNewChat ? [] : INITIAL_MESSAGES
  );
  const [inputText, setInputText] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    duration: "",
    location: "",
    description: "",
  });

  const datesList = useMemo(() => getNext7Days(), []);

  const handleUnmatch = () => {
    Alert.alert(
      "Unmatch",
      `Are you sure you want to unmatch with ${recipientName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipientName,
      headerRight: () => (
        <TouchableOpacity onPress={handleUnmatch}>
          <Text style={styles.unmatchText}>Unmatch</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, recipientName]);

  const handleSendText = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "me",
      type: "text",
    };

    setMessages((prev) => [newMessage, ...prev]);
    setInputText("");

    if (typeof onUpdateLastMessage === "function") {
      onUpdateLastMessage(newMessage.text);
    }
  };

  const handleSendInvite = () => {
    if (
      !scheduleData.date ||
      !scheduleData.time ||
      !scheduleData.duration ||
      !scheduleData.location
    ) {
      Alert.alert(
        "Missing Info",
        "Please select Date, Time, Duration, and Location."
      );
      return;
    }

    const newMessage = {
      id: Date.now().toString(),
      sender: "me",
      type: "invite",
      status: "pending",
      details: { ...scheduleData },
    };

    setMessages((prev) => [newMessage, ...prev]);
    setModalVisible(false);
    setScheduleData({
      date: "",
      time: "",
      duration: "",
      location: "",
      description: "",
    });

    if (typeof onUpdateLastMessage === "function") {
      onUpdateLastMessage("Sent a workout invite");
    }
  };

  const handleRespondToInvite = (id, response) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, status: response } : msg
      )
    );
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === "me";
    const bubbleStyle = isMe
      ? [styles.myMessage, { backgroundColor: colors.primary }]
      : [styles.theirMessage, { backgroundColor: colors.card }];

    if (item.type === "invite") {
      return (
        <View style={[styles.messageBubble, styles.inviteBubble, bubbleStyle]}>
          <View style={styles.inviteHeader}>
            <Ionicons
              name="calendar"
              size={20}
              color={isMe ? "white" : colors.text}
            />
            <Text
              style={[
                styles.inviteTitle,
                { color: isMe ? "white" : colors.text },
              ]}
            >
              Workout Invitation
            </Text>
          </View>

          <View style={styles.inviteDetails}>
            <Text
              style={[
                styles.inviteText,
                { color: isMe ? "#eee" : "gray" },
              ]}
            >
              📅 {item.details.date} at {item.details.time}{" "}
              {item.details.duration ? `(${item.details.duration})` : ""}
            </Text>
            <Text
              style={[
                styles.inviteText,
                { color: isMe ? "#eee" : "gray" },
              ]}
            >
              📍 {item.details.location}
            </Text>
            {item.details.description ? (
              <Text
                style={[
                  styles.inviteText,
                  {
                    color: isMe ? "#eee" : "gray",
                    marginTop: 4,
                    fontStyle: "italic",
                  },
                ]}
              >
                📝 "{item.details.description}"
              </Text>
            ) : null}
          </View>

          <View style={styles.inviteFooter}>
            {item.status === "pending" ? (
              isMe ? (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>⏳ Pending Response</Text>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.declineBtn]}
                    onPress={() =>
                      handleRespondToInvite(item.id, "declined")
                    }
                  >
                    <Text style={styles.actionBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() =>
                      handleRespondToInvite(item.id, "accepted")
                    }
                  >
                    <Text style={styles.actionBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View
                style={[
                  styles.statusBadge,
                  item.status === "accepted"
                    ? styles.statusAccepted
                    : styles.statusDeclined,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status === "accepted"
                    ? "✅ Accepted"
                    : "❌ Declined"}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageBubble, bubbleStyle]}>
        <Text style={isMe ? styles.myMessageText : { color: colors.text }}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
          style={styles.chatList}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
        />

        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor="gray"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSendText}
          >
            <Ionicons name="arrow-up" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Modal remains unchanged (omitted here for brevity) */}
        {/* ... keep your existing modal JSX here ... */}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  unmatchText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 16,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: "80%",
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
    fontSize: 16,
  },
  
  // Invite Styles
  inviteBubble: {
    minWidth: 220,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  inviteTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  inviteDetails: {
    marginBottom: 10,
  },
  inviteText: {
    fontSize: 14,
    marginBottom: 2,
  },
  inviteFooter: {
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusAccepted: {
    backgroundColor: 'rgba(50, 205, 50, 0.3)',
  },
  statusDeclined: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptBtn: {
    backgroundColor: '#34C759',
  },
  declineBtn: {
    backgroundColor: '#FF3B30',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Input Styles
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  iconButton: {
    marginRight: 10,
    padding: 4,
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16, // Reduced bottom margin
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  // New Selector Styles
  selectorScroll: {
    marginBottom: 16,
    maxHeight: 60, // Constraint height
  },
  dateChip: {
    width: 60,
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});