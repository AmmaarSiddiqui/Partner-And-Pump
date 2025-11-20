import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../state/useAuthContext";
import { useTheme } from "@react-navigation/native";

const GOAL_OPTIONS = ["Strength", "Aesthetics", "Health", "Weight-loss", "Endurance", "Sports"];

export default function ProfileCreateScreen() {
  const { setProfile } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("Strength");
  const [gym, setGym] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);

  const onSave = () => {
    if (!name.trim() || !gym.trim()) {
      Alert.alert("Missing info", "Please fill out your name and gym.");
      return;
    }
    setProfile({ name: name.trim(), goal: goal.trim(), gym: gym.trim() });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.h1, { color: colors.text }]}>Create your profile</Text>

      <Text style={[styles.label, { color: colors.text }]}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g., Yasir"
        placeholderTextColor="gray"
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Primary Goal</Text>
      <Dropdown
        value={goal}
        open={goalOpen}
        setOpen={setGoalOpen}
        options={GOAL_OPTIONS}
        onSelect={setGoal}
        colors={colors}
      />

      <Text style={[styles.label, { color: colors.text }]}>Primary Gym</Text>
      <TextInput
        value={gym}
        onChangeText={setGym}
        placeholder="e.g., LA Fitness - Downtown"
        placeholderTextColor="gray"
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
        ]}
      />

      <Button title="Save & Continue" onPress={onSave} />
    </View>
  );
}

function Dropdown({ value, open, setOpen, options, onSelect, colors }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dropdownHeader,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={{ color: colors.text }}>{value}</Text>
        <Text style={{ color: "#9ca3af" }}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {open && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownItem, { borderTopColor: colors.border }]}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text
                style={{
                  color: opt === value ? colors.text : "#9ca3af",
                  fontWeight: opt === value ? "700" : "500",
                }}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  h1: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12 },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
});
