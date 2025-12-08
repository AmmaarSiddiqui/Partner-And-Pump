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
import { useTheme, useNavigation } from "@react-navigation/native";
import PlaceAutocomplete from "../components/PlaceAutocomplete";

// Firestore imports
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase"; 

const GOAL_OPTIONS = [
  "Strength",
  "Aesthetics",
  "Health",
  "Weight-loss",
  "Endurance",
  "Sports",
];

export default function ProfileCreateScreen() {
  const { user, setProfile } = useAuth();
  const { colors } = useTheme();

  // Form state
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("Strength");
  const [gym, setGym] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();


  // Create + write profile to Firestore
  const onSave = async () => {
    if (!name.trim() || !gym.trim()) {
      Alert.alert("Missing info", "Please fill out your name and gym.");
      return;
    }

    if (!user || !user.uid) {
      Alert.alert(
        "Not signed in",
        "You need to be logged in before creating a profile."
      );
      return;
    }

    // Object to store in Firestore
    const profile = {
      uid: user.uid,
      name: name.trim(),
      goal: goal.trim(),
      gym: gym.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      
      // Save to Firestore (using merge to avoid overriding future fields)
      const ref = doc(db, "profiles", user.uid);
      await setDoc(ref, profile, { merge: true });

      setProfile(profile);
    Alert.alert("Success", "Profile saved!");


      
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert(
        "Error",
        "We couldn't save your profile right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
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
      <Dropdown
        value={goal}
        open={goalOpen}
        setOpen={setGoalOpen}
        options={GOAL_OPTIONS}
        onSelect={setGoal}
        colors={colors}
      />

      <Text style={[styles.label, { color: colors.text }]}>Primary Gym</Text>
      <PlaceAutocomplete
        placeholder="e.g., LA Fitness - Downtown"
        initialValue={gym}
        onSelect={(place) => {
          const text = place?.name || place?.description || "";
          setGym(text);
        }}
      />

      <View style={styles.buttonWrapper}>
        <Button
          title={saving ? "Saving..." : "Save & Continue"}
          onPress={onSave}
          disabled={saving}
        />
      </View>
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
  buttonWrapper: {
    marginTop: 20,
  },
});
