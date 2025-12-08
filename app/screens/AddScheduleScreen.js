import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useTheme, useRoute } from "@react-navigation/native";
import { db } from "../services/firebase"; //  use your firebase.js
import { deleteDoc, doc } from "firebase/firestore";


// Format a JS Date object into a readable "Mon, Dec 8" style label
const formatLongDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

export default function AddScheduleScreen({ navigation }) {
  const { colors } = useTheme();
  const route = useRoute();

  // Callback to save changes (provided by HomeScreen)
  const onSave = route.params?.onSave;
  const existingSchedule = route.params?.existingSchedule; // should include id, title/activity, time, status, dateKey
  const isEditing = !!existingSchedule;


  // Determine what date to display:
  // - use existing item’s date
  // - or use initial date passed from calendar
  // - otherwise default to today
  const initialDateParam = existingSchedule?.date
    ? new Date(existingSchedule.date)
    : route.params?.initialDate
    ? new Date(route.params.initialDate)
    : new Date();

  const [title, setTitle] = useState(
    existingSchedule?.title || existingSchedule?.activity || ""
  );
  const [time, setTime] = useState(existingSchedule?.time || "");

  // Save handler — just passes data upward to HomeScreen, which handles Firestore writes
  const handleSave = () => {
    if (!title.trim() || !time.trim()) {
      return;
    }

    if (typeof onSave !== "function") {
      console.error(
        "[AddSchedule] onSave is not a function. route.params:",
        route.params
      );
      return;
    }

    const payload = {
      title: title.trim(),
      time: time.trim(),
    };

    if (existingSchedule?.status) {
      payload.status = existingSchedule.status;
    }

    onSave(payload); // HomeScreen's handleSaveSchedule will handle Firestore
    navigation.goBack();
  };

  // Delete schedule item from Firestore (edit mode only)
  const handleDelete = async () => {
    if (!isEditing || !existingSchedule?.id) {
      console.error(
        "[AddSchedule] Cannot delete – missing existingSchedule.id",
        existingSchedule
      );
      return;
    }

    Alert.alert(
      "Delete Schedule",
      "Are you sure you want to delete this schedule item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                "[AddSchedule] Deleting schedule:",
                existingSchedule.id
              );
              await deleteDoc(doc(db, "schedules", existingSchedule.id));
              navigation.goBack();
            } catch (err) {
              console.error("❌ [AddSchedule] delete FAILED:", err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>
        {isEditing ? "Edit Schedule Item" : "Add to Schedule"}
      </Text>

      {/* Date display */}
      <Text style={[styles.label, { color: colors.text }]}>Date</Text>
      <Text style={[styles.dateText, { color: colors.text }]}>
        {formatLongDate(initialDateParam)}
      </Text>

      <View style={{ height: 16 }} />

      {/* Title */}
      <Text style={[styles.label, { color: colors.text }]}>Title</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text },
        ]}
        placeholder="e.g. Pull Day (Back & Bis)"
        placeholderTextColor="gray"
        value={title}
        onChangeText={setTitle}
      />

      {/* Time */}
      <Text style={[styles.label, { color: colors.text }]}>Time</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text },
        ]}
        placeholder="e.g. 07:00 PM"
        placeholderTextColor="gray"
        value={time}
        onChangeText={setTime}
      />

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          {isEditing ? "Save Changes" : "Save"}
        </Text>
      </TouchableOpacity>

      {/* Delete – only in edit mode */}
      {isEditing && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: "#FF3B30" }]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
