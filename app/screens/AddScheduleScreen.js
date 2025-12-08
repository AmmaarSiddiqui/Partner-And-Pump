import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme, useRoute } from "@react-navigation/native";

const formatLongDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

export default function AddScheduleScreen({ navigation }) {
  const { colors } = useTheme();
  const route = useRoute();

  const onSave = route.params?.onSave;
  const initialDateParam = route.params?.initialDate
    ? new Date(route.params.initialDate)
    : new Date();

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const handleSave = () => {
    if (!title.trim() || !time.trim()) {
      // could add an Alert here if you want
      return;
    }

    if (typeof onSave === "function") {
      onSave({
        title: title.trim(),
        time: time.trim(),
        date: initialDateParam, // use the date coming from Home
      });
    }

    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>
        Add to Schedule
      </Text>

      {/* Show the date this item will be added to */}
      <Text style={[styles.label, { color: colors.text }]}>Date</Text>
      <Text style={[styles.dateText, { color: colors.text }]}>
        {formatLongDate(initialDateParam)}
      </Text>

      <View style={{ height: 16 }} />

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

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
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
});
