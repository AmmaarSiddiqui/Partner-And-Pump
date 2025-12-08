import React, { useLayoutEffect, useState, useEffect, useMemo, useCallback } from "react";
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

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { useAuth } from "../state/useAuthContext";


// Helper to generate next 7 days
const getNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      id: i,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }), // Mon
      dayNum: d.toLocaleDateString("en-US", { day: "numeric" }),    // 25
      full: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  return days;
};

const TIMES = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", 
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"
];

const DURATIONS = [
  "30 min", "45 min", "1 hr", "1.5 hr", "2 hr", "2.5 hr", "3 hr"
];

export default function ChatScreen({ route, navigation }) {
  useEffect(() => {
  if (!user) {
    setLoading(false);
    return;
  }

  let finalId = paramMatchId;
  if (!finalId && recipientId) {
    finalId = [user.uid, recipientId].sort().join("_");
  }

  setChatId(finalId);

  if (!finalId) {
    console.warn("[ChatScreen] No matchId or recipientId provided.");
    setLoading(false);
    return;
  }

  // ... messages listener here ...
}, [user, paramMatchId, recipientId]);



  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const { recipientName, recipientId, matchId: paramMatchId } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    duration: "",
    location: "",
    description: "",
  });
  
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  

  const datesList = useMemo(() => getNext7Days(), []);

  // Set header title + unmatch button
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
            // TODO: BACKEND - remove match + chat in Firestore if you want.
            navigation.goBack();
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipientName,
      
    });
  }, [navigation, recipientName]);

  // Derive chatId and subscribe to Firestore messages
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prefer matchId from params, otherwise derive from user + recipient
    let finalId = paramMatchId;
    if (!finalId && recipientId) {
      finalId = [user.uid, recipientId].sort().join("_");
    }

    setChatId(finalId);

    if (!finalId) {
      console.warn("[ChatScreen] No matchId or recipientId provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const msgsRef = collection(db, "matches", finalId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "desc")); // newest first; FlatList is inverted

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        console.warn("[ChatScreen] messages listener error:", err);
        setLoadError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, paramMatchId, recipientId]);

  // Send a normal text message
  const handleSendText = useCallback(async () => {
  const trimmed = inputText.trim();
  if (!trimmed || !user || !chatId) return;

  // ✅ Clear the UI right away
  setInputText("");

  try {
    const msgsRef = collection(db, "matches", chatId, "messages");

    await addDoc(msgsRef, {
      text: trimmed,
      senderId: user.uid,
      senderName: profile?.name || "You",
      type: "text",
      createdAt: serverTimestamp(),
    });

    const matchRef = doc(db, "matches", chatId);
    await setDoc(
      matchRef,
      {
        lastMessageText: trimmed,
        lastMessageAt: serverTimestamp(),
        userIds: [user.uid, recipientId],
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[ChatScreen] handleSendText error:", err);
    // Optional: if you want to put the text back on error:
    // setInputText(trimmed);
  }
}, [inputText, user, chatId, profile, recipientId]);


  // Send a workout invite message
  const handleSendInvite = useCallback(async () => {
    if (!scheduleData.date || !scheduleData.time || !scheduleData.duration || !scheduleData.location) {
      Alert.alert("Missing Info", "Please select Date, Time, Duration, and Location.");
      return;
    }

    if (!user || !chatId) return;

    try {
      const msgsRef = collection(db, "matches", chatId, "messages");

      const details = { ...scheduleData };

      await addDoc(msgsRef, {
        senderId: user.uid,
        senderName: profile?.name || "You",
        type: "invite",
        status: "pending",
        details,
        createdAt: serverTimestamp(),
      });

      const matchRef = doc(db, "matches", chatId);
      await updateDoc(matchRef, {
        lastMessageText: `Workout invite: ${details.date} at ${details.time}`,
        lastMessageAt: serverTimestamp(),
      });

      setModalVisible(false);
      setScheduleData({ date: "", time: "", duration: "", location: "", description: "" });
    } catch (err) {
      console.warn("[ChatScreen] handleSendInvite error:", err);
    }
  }, [scheduleData, user, chatId, profile]);

  // Accept/decline invite (updates Firestore)
  const handleRespondToInvite = useCallback(
    async (id, response) => {
      if (!chatId) return;

      try {
        const msgRef = doc(db, "matches", chatId, "messages", id);
        await updateDoc(msgRef, { status: response });

        // Optimistic local update
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, status: response } : msg
          )
        );
      } catch (err) {
        console.warn("[ChatScreen] handleRespondToInvite error:", err);
      }
    },
    [chatId]
  );

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.uid || item.sender === "me"; // keep compatibility with old mock type
    const bubbleStyle = isMe
      ? [styles.myMessage, { backgroundColor: colors.primary }]
      : [styles.theirMessage, { backgroundColor: colors.card }];

    if (item.type === "invite") {
      return (
        <View style={[styles.messageBubble, styles.inviteBubble, bubbleStyle]}>
          <View style={styles.inviteHeader}>
            <Ionicons name="calendar" size={20} color={isMe ? "white" : colors.text} />
            <Text style={[styles.inviteTitle, { color: isMe ? "white" : colors.text }]}>
              Workout Invitation
            </Text>
          </View>
          
          <View style={styles.inviteDetails}>
            <Text style={[styles.inviteText, { color: isMe ? "#eee" : "gray" }]}>
              📅 {item.details?.date} at {item.details?.time}{" "}
              {item.details?.duration ? `(${item.details.duration})` : ""}
            </Text>
            <Text style={[styles.inviteText, { color: isMe ? "#eee" : "gray" }]}>
              📍 {item.details?.location}
            </Text>
            {item.details?.description ? (
              <Text
                style={[
                  styles.inviteText,
                  { color: isMe ? "#eee" : "gray", marginTop: 4, fontStyle: "italic" },
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
                    onPress={() => handleRespondToInvite(item.id, "declined")}
                  >
                    <Text style={styles.actionBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleRespondToInvite(item.id, "accepted")}
                  >
                    <Text style={styles.actionBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View
                style={[
                  styles.statusBadge,
                  item.status === "accepted" ? styles.statusAccepted : styles.statusDeclined,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status === "accepted" ? "✅ Accepted" : "❌ Declined"}
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

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.text, textAlign: "center" }}>
            You must be signed in to chat.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.text }}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: "red", textAlign: "center" }}>
            Could not load messages: {loadError.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom"]}>
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
          inverted // because we're ordering desc
        />

        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
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

        {/* Schedule Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Workout</Text>

              <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                {/* Date Selector */}
                <Text style={[styles.label, { color: colors.text }]}>Date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectorScroll}
                >
                  {datesList.map((d) => {
                    const isSelected = scheduleData.date === d.full;
                    return (
                      <TouchableOpacity
                        key={d.full}
                        style={[
                          styles.dateChip,
                          { backgroundColor: isSelected ? colors.primary : "#333" },
                        ]}
                        onPress={() => setScheduleData({ ...scheduleData, date: d.full })}
                      >
                        <Text style={{ color: "white", fontSize: 12 }}>{d.dayName}</Text>
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                          {d.dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Time Selector */}
                <Text style={[styles.label, { color: colors.text }]}>Time</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectorScroll}
                >
                  {TIMES.map((t) => {
                    const isSelected = scheduleData.time === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.timeChip,
                          { backgroundColor: isSelected ? colors.primary : "#333" },
                        ]}
                        onPress={() => setScheduleData({ ...scheduleData, time: t })}
                      >
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "500" }}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Duration Selector */}
                <Text style={[styles.label, { color: colors.text }]}>Duration</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectorScroll}
                >
                  {DURATIONS.map((d) => {
                    const isSelected = scheduleData.duration === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.timeChip,
                          { backgroundColor: isSelected ? colors.primary : "#333" },
                        ]}
                        onPress={() => setScheduleData({ ...scheduleData, duration: d })}
                      >
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "500" }}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Location Input */}
                <Text style={[styles.label, { color: colors.text }]}>Location</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g., Gold's Gym"
                  placeholderTextColor="gray"
                  value={scheduleData.location}
                  onChangeText={(t) =>
                    setScheduleData({ ...scheduleData, location: t })
                  }
                />

                {/* Description Input */}
                <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g., Chest & Back"
                  placeholderTextColor="gray"
                  value={scheduleData.description}
                  onChangeText={(t) =>
                    setScheduleData({ ...scheduleData, description: t })
                  }
                />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#333" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: "white" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSendInvite}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>Send Invite</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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

  inviteBubble: {
    minWidth: 220,
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  inviteTitle: {
    fontWeight: "bold",
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
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  statusAccepted: {
    backgroundColor: "rgba(50, 205, 50, 0.3)",
  },
  statusDeclined: {
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
  statusText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  acceptBtn: {
    backgroundColor: "#34C759",
  },
  declineBtn: {
    backgroundColor: "#FF3B30",
  },
  actionBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },

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
    alignItems: "center",
    justifyContent: "center",
  },

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
    marginBottom: 16,
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
  selectorScroll: {
    marginBottom: 16,
    maxHeight: 60,
  },
  dateChip: {
    width: 60,
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});
