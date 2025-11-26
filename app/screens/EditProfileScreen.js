import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../state/useAuthContext";
import { auth, db } from "../services/firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
const GOAL_OPTIONS = ["Strength", "Aesthetics", "Health", "Weight-loss", "Endurance", "Sports"];
const TIME_OPTIONS = [
  "Morning (5AM–9AM)",
  "Midday (10AM–1PM)",
  "Afternoon (2PM–5PM)",
  "Evening (6PM–9PM)",
  "Late Night (10PM–12AM)",
];
const FITNESS_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const SPLIT_OPTIONS = ["Push/Pull/Legs", "Upper/Lower", "Full Body", "Bro Split", "Sports"];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile, setProfile } = useAuth();

  const [name, setName] = useState(profile?.name || "");
  const [goal, setGoal] = useState(profile?.goal || "strength");
  const [gym, setGym] = useState(
    typeof profile?.gym === "string" || !profile?.gym ? (profile?.gym || "") : (profile?.gym?.name || "")
  );
  const [time, setTime] = useState(profile?.time || "Morning (5AM–9AM)");
  const [days, setDays] = useState(Array.isArray(profile?.days) ? profile.days : []);

  const [about, setAbout] = useState(profile?.about || "");
  const [fitnessLevel, setFitnessLevel] = useState(profile?.fitnessLevel || "Beginner");
  const [split, setSplit] = useState(profile?.split || "Push/Pull/Legs");

  const [openGoals, setOpenGoals] = useState(false);
  const [openTimes, setOpenTimes] = useState(false);
  const [openFitness, setOpenFitness] = useState(false);
  const [openSplit, setOpenSplit] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleDay = (day) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

const save = async () => {
  setError("");
  const uid = auth.currentUser?.uid;
  if (!uid) { setError("You must be signed in to save your profile."); return; }

  const toSlug = s => (s||"").trim().toLowerCase();
  const trim  = s => (s||"").trim();

  const payload = {
    name: trim(name),
    goal: toSlug(goal),
    gym: trim(gym),
    time: trim(time),
    days: Array.isArray(days) ? [...new Set(days)] : [],
    about: trim(about),
    fitnessLevel: trim(fitnessLevel),
    split: trim(split),
    updatedAt: serverTimestamp(),
  };

  setSaving(true);
  //  optimistic update so ProfileScreen has data immediately
  setProfile(prev => ({ ...(prev||{}), ...payload, updatedAt: new Date() }));

  //  leave this screen immediately; no chance to render a loader here
  navigation.goBack();

  //  write to Firestore in the background; no UI block
  setDoc(doc(db, "profiles", uid), payload, { merge: true })
    .then(() => {
      // mirror cache (don’t await)
      (async () => {
        try {
          await AsyncStorage.setItem(`profile:${uid}`, JSON.stringify({ ...(profile||{}), ...payload, updatedAt: Date.now() }));
        } catch {}
      })();
    })
    .catch(e => {
      console.warn("[EditProfile] save error:", e);
      // optional: toast failure and/or revert optimistic change
    })
    .finally(() => setSaving(false));
};

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.header}>Edit Profile</Text>

      <Label>Display name</Label>
      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#6b7280"
      />

      <Label>Primary goal</Label>
      <Dropdown
        value={goal}
        open={openGoals}
        setOpen={setOpenGoals}
        options={GOAL_OPTIONS}
        onSelect={setGoal}
      />

      <Label>Preferred workout time</Label>
      <Dropdown
        value={time}
        open={openTimes}
        setOpen={setOpenTimes}
        options={TIME_OPTIONS}
        onSelect={setTime}
      />

      <Label>Workout days</Label>
      <DaysPicker selected={days} onToggle={toggleDay} />

      <Label>Primary gym</Label>
      <TextInput
        style={s.input}
        value={gym}
        onChangeText={setGym}
        placeholder="LA Fitness - Downtown"
        placeholderTextColor="#6b7280"
      />

      <Label>Fitness level</Label>
      <Dropdown
        value={fitnessLevel}
        open={openFitness}
        setOpen={setOpenFitness}
        options={FITNESS_LEVEL_OPTIONS}
        onSelect={setFitnessLevel}
      />

      <Label>Workout split</Label>
      <Dropdown
        value={split}
        open={openSplit}
        setOpen={setOpenSplit}
        options={SPLIT_OPTIONS}
        onSelect={setSplit}
      />

      <Label>About me</Label>
      <TextInput
        style={[s.input, s.textArea]}
        value={about}
        onChangeText={setAbout}
        placeholder="Tell people about you, experience, goals, etc."
        placeholderTextColor="#6b7280"
        multiline
        textAlignVertical="top"
      />

      {!!error && <Text style={s.errorText}>{error}</Text>}

      <TouchableOpacity style={[s.save, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.cancel} onPress={() => navigation.goBack()} disabled={saving}>
        <Text style={s.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- tiny building blocks ---------- */

function Label({ children }) {
  return <Text style={s.label}>{children}</Text>;
}

function Dropdown({ value, open, setOpen, options, onSelect }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        style={[s.input, s.dropdownHeader]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={{ color: "#fff" }}>{value}</Text>
        <Text style={{ color: "#9ca3af" }}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={s.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={s.dropdownItem}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text style={{ color: opt === value ? "#fff" : "#d1d5db", fontWeight: opt === value ? "700" : "500" }}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function DaysPicker({ selected, onToggle }) {
  return (
    <View style={s.daysContainer}>
      {DAYS.map((d) => {
        const isSelected = selected.includes(d);
        return (
          <TouchableOpacity
            key={d}
            style={[s.dayButton, isSelected && s.dayButtonSelected]}
            onPress={() => onToggle(d)}
          >
            <Text style={[s.dayText, isSelected && s.dayTextSelected]}>{d}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ---------- styles ---------- */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  label: { color: "#9ca3af", marginTop: 12, marginBottom: 6, fontWeight: "600" },

  input: {
    backgroundColor: "#111827",
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  textArea: {
    height: 120,
    lineHeight: 20,
  },

  dropdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dropdown: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },

  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginBottom: 8,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#111827",
  },
  dayButtonSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  dayText: { color: "#9ca3af", fontWeight: "600" },
  dayTextSelected: { color: "#fff" },

  save: { marginTop: 18, backgroundColor: "#3b6cff", paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  saveText: { color: "#fff", textAlign: "center", fontWeight: "700" },
  cancel: { marginTop: 10, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: "#374151" },
  cancelText: { color: "#9ca3af", textAlign: "center", fontWeight: "600" },
  errorText: { color: "#f87171", marginTop: 10, fontWeight: "600" },
});
