import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
import PlaceAutocomplete from "../components/PlaceAutocomplete";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc, 
  getDoc,
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
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.toLocaleDateString("en-US", { day: "numeric" }),
      full: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      dateKey: d.toISOString().slice(0, 10), 
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

export default function ChatScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const { recipientName, recipientId, matchId: paramMatchId } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    dateKey: "",  
    time: "",
    duration: "",
    location: "",
    description: "",
  });
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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
            // TODO: delete match/messages if desired
            navigation.goBack();
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipientName,
      // headerRight: () => (
      //   <TouchableOpacity onPress={handleUnmatch}>
      //     <Text style={styles.unmatchText}>Unmatch</Text>
      //   </TouchableOpacity>
      // ),
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

  // Clear UI immediately
  setInputText("");

  try {
    const msgsRef = collection(db, "matches", chatId, "messages");

    const fromUserId = user.uid;
    const toUserId = recipientId; 

    await addDoc(msgsRef, {
      text: trimmed,                     
      senderId: fromUserId,
      senderName: profile?.name || "You",
      fromUserId,                          
      toUserId,                            
      type: "text",
      createdAt: serverTimestamp(),
    });

    const matchRef = doc(db, "matches", chatId);
    await setDoc(
      matchRef,
      {
        lastMessageText: trimmed,
        lastMessageAt: serverTimestamp(),
        userIds: [fromUserId, toUserId],
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[ChatScreen] handleSendText error:", err);
    // optionally: setInputText(trimmed);
  }
}, [inputText, user, chatId, profile, recipientId]);


  // Send a workout invite message
  const handleSendInvite = useCallback(async () => {
    if (
      !scheduleData.dateKey ||        
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

    if (!user || !chatId) return;

    try {
      const msgsRef = collection(db, "matches", chatId, "messages");
      const details = { ...scheduleData }; 

      const fromUserId = user.uid;
      const toUserId = recipientId;

      const summaryText = `Workout invite: ${details.date} at ${details.time}`;

      await addDoc(msgsRef, {
        text: summaryText,
        senderId: fromUserId,
        senderName: profile?.name || "You",
        fromUserId,
        toUserId,
        fromUserName: profile?.name || "",
        toUserName: recipientName || "",
        type: "invite",
        status: "pending",
        details,                       
        createdAt: serverTimestamp(),
      });

      const matchRef = doc(db, "matches", chatId);
      await updateDoc(matchRef, {
        lastMessageText: summaryText,
        lastMessageAt: serverTimestamp(),
      });

      setModalVisible(false);
      setScheduleData({
        date: "",
        dateKey: "",                  
        time: "",
        duration: "",
        location: "",
        description: "",
      });
    } catch (err) {
      console.warn("[ChatScreen] handleSendInvite error:", err);
    }
  }, [scheduleData, user, chatId, profile, recipientId, recipientName]);




  // Accept/decline invite
  const handleRespondToInvite = useCallback(
    async (id, response) => {
      if (!chatId || !user) return;

      try {
        const msgRef = doc(db, "matches", chatId, "messages", id);

        // 1) Update the invite message status
        await updateDoc(msgRef, { status: response });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, status: response } : msg
          )
        );

        // Only add schedules if accepted
        if (response !== "accepted") return;

        // 2) Get full invite details
        const snap = await getDoc(msgRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const details = data.details || {};

        const fromUserId = data.fromUserId;
        const toUserId = data.toUserId;

        const fromUserName =
          data.fromUserName ?? data.senderName ?? "Partner";
        const toUserName = data.toUserName ?? recipientName ?? "Partner";

        const dateKey = details.dateKey;
        const time = details.time;

        if (!dateKey || !time) {
          console.warn("[ChatScreen] invite missing dateKey or time", {
            details,
          });
          return;
        }

        const schedulesRef = collection(db, "schedules");
        const baseSchedule = {
          matchId: chatId,
          inviteMessageId: id,
          dateKey,               
          time,                  
          status: "upcoming",
          createdAt: serverTimestamp(),
        };

        // 3) Add schedule for sender
        await addDoc(schedulesRef, {
          ...baseSchedule,
          userId: fromUserId,                    
          activity: `Workout with ${toUserName}`, 
        });

        // 4) Add schedule for receiver
        await addDoc(schedulesRef, {
          ...baseSchedule,
          userId: toUserId,
          activity: `Workout with ${fromUserName}`,
        });
      } catch (err) {
        console.warn("[ChatScreen] handleRespondToInvite error:", err);
      }
    },
    [chatId, user, recipientName]
  );


    const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.uid || item.sender === "me";
    const bubbleStyle = isMe
      ? [styles.myMessage, { backgroundColor: colors.primary }]
      : [styles.theirMessage, { backgroundColor: colors.card }];

    // Workout invite message
    if (item.type === "invite") {
      const details = item.details || {};
      const isPending = item.status === "pending";
      const isAccepted = item.status === "accepted";
      const isDeclined = item.status === "declined";
      const showActions = !isMe && isPending;

      return (
        <View style={[styles.messageBubble, styles.inviteBubble, bubbleStyle]}>
          {/* Header */}
          <View style={styles.inviteHeader}>
            <Ionicons name="calendar-outline" size={18} color="white" />
            <Text style={[styles.inviteTitle, { color: "white" }]}>
              Workout invite
            </Text>
          </View>

          {/* Details */}
          <View style={styles.inviteDetails}>
            {details.date ? (
              <Text style={[styles.inviteText, { color: "white" }]}>
                📅 {details.date}
              </Text>
            ) : null}
            {details.time ? (
              <Text style={[styles.inviteText, { color: "white" }]}>
                ⏰ {details.time}
              </Text>
            ) : null}
            {details.duration ? (
              <Text style={[styles.inviteText, { color: "white" }]}>
                ⏱ {details.duration}
              </Text>
            ) : null}
            {details.location ? (
              <Text style={[styles.inviteText, { color: "white" }]}>
                📍 {details.location}
              </Text>
            ) : null}
            {details.description ? (
              <Text style={[styles.inviteText, { color: "white" }]}>
                💬 {details.description}
              </Text>
            ) : null}
          </View>

          {/* Status + buttons */}
          <View style={styles.inviteFooter}>
            {isPending && (
              <View style={[styles.statusBadge]}>
                <Text style={styles.statusText}>
                  {isMe ? "Waiting for response..." : "Respond to invite"}
                </Text>
              </View>
            )}

            {isAccepted && (
              <View style={[styles.statusBadge, styles.statusAccepted]}>
                <Text style={styles.statusText}>Accepted</Text>
              </View>
            )}

            {isDeclined && (
              <View style={[styles.statusBadge, styles.statusDeclined]}>
                <Text style={styles.statusText}>Declined</Text>
              </View>
            )}

            {showActions && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => handleRespondToInvite(item.id, "accepted")}
                >
                  <Text style={styles.actionBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.declineBtn]}
                  onPress={() => handleRespondToInvite(item.id, "declined")}
                >
                  <Text style={styles.actionBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Normal text message
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
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
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
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: colors.text }}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: "red", textAlign: "center" }}>
            Could not load messages: {loadError.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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

        <View
          style={[styles.inputContainer, { backgroundColor: colors.card }]}
        >
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

                <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text },
                ]}
              >
                Schedule a Workout
              </Text>

              {/* Date selector */}
              <Text style={[styles.label, { color: colors.text }]}>
                Date
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.selectorScroll}
              >
                {datesList.map((d) => {
                  const isSelected = scheduleData.dateKey === d.dateKey;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.dateChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : "#222",
                        },
                      ]}
                      onPress={() =>
                        setScheduleData((prev) => ({
                          ...prev,
                          date: d.full,        // nice label for UI
                          dateKey: d.dateKey,  // 🔑 used by HomeScreen + Firestore
                        }))
                      }
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                        }}
                      >
                        {d.dayName}
                      </Text>
                      <Text style={{ color: "white" }}>{d.dayNum}</Text>
                    </TouchableOpacity>
                  );
                })}

              </ScrollView>

              {/* Time selector */}
              <Text style={[styles.label, { color: colors.text }]}>
                Time
              </Text>
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
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : "#222",
                        },
                      ]}
                      onPress={() =>
                        setScheduleData((prev) => ({
                          ...prev,
                          time: t,
                        }))
                      }
                    >
                      <Text style={{ color: "white" }}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Duration selector */}
              <Text style={[styles.label, { color: colors.text }]}>
                Duration
              </Text>
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
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : "#222",
                        },
                      ]}
                      onPress={() =>
                        setScheduleData((prev) => ({
                          ...prev,
                          duration: d,
                        }))
                      }
                    >
                      <Text style={{ color: "white" }}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Location */}
                <Text style={[styles.label, { color: colors.text }]}>
                  Location
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <PlaceAutocomplete
                    placeholder="e.g., LA Fitness - Downtown"
                    initialValue={scheduleData.location}
                    onSelect={(place) => {
                      const text = place?.name || place?.description || "";
                      setScheduleData((prev) => ({
                        ...prev,
                        location: text,
                      }));
                    }}
                  />
                </View>


              {/* Optional description */}
              <Text style={[styles.label, { color: colors.text }]}>
                Description (optional)
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: "#222",
                    color: colors.text,
                    height: 80,
                    textAlignVertical: "top",
                  },
                ]}
                placeholder="Anything else they should know?"
                placeholderTextColor="gray"
                multiline
                value={scheduleData.description}
                onChangeText={(text) =>
                  setScheduleData((prev) => ({
                    ...prev,
                    description: text,
                  }))
                }
              />

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#333" },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    setScheduleData({
                      date: "",
                      time: "",
                      duration: "",
                      location: "",
                      description: "",
                    });
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSendInvite}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Send invite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
