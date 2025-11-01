import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../state/useAuthContext";
import { useTheme } from "@react-navigation/native";

export default function ProfileCreateScreen() {
  const { setProfile } = useAuth();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("strength"); // strength | endurance | aesthetics
  const [gym, setGym] = useState("");
  const { colors } = useTheme(); 

  const onSave = () => {
    // ... (your save logic is fine)
    if (!name.trim() || !gym.trim()) {
      Alert.alert("Missing info", "Please fill out your name and gym.");
      return;
    }
    setProfile({ name: name.trim(), goal: goal.trim(), gym: gym.trim() });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.h1, { color: colors.text }]}>
        Create your profile
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g., Yasir"
        placeholderTextColor="gray" 
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.card, 
            borderColor: colors.border,   
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Primary Goal</Text>
      <TextInput
        value={goal}
        onChangeText={setGoal}
        placeholder="strength | endurance | aesthetics"
        placeholderTextColor="gray"
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Primary Gym</Text>
      <TextInput
        value={gym}
        onChangeText={setGym}
        placeholder="e.g., LA Fitness - Downtown"
        placeholderTextColor="gray"
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      />
      <Button title="Save & Continue" onPress={onSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  h1: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
});