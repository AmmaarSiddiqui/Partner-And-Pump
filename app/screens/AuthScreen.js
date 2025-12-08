// app/screens/AuthScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const onSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don’t match.");
      return;
    }

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(cred.user, { displayName: name.trim() });

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date(),
      });

      //  No profile doc here
      //  No navigation.reset here
      // onAuthStateChanged in useAuthContext will fire,
      // AppNavigator will see user + (incomplete) profile
      // and show ProfileCreateFlow.

    } catch (e) {
      console.error("Sign up error:", e);
      Alert.alert("Sign up failed", e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter email and password.");
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // No manual navigation; AppNavigator will handle it.
    } catch (e) {
      console.error("Login error:", e);
      Alert.alert("Login failed", e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f0f10" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, padding: 24, gap: 24 }}>
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
            Partner & Pump
          </Text>
          <Text style={{ color: "#9aa0a6", marginTop: 6 }}>
            {isSignup ? "Create your account" : "Welcome back"}
          </Text>
        </View>

        {/* Toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#1a1b1e",
            borderRadius: 12,
            padding: 4,
            marginTop: 8,
            alignSelf: "center",
            gap: 4,
          }}
        >
          <TabButton
            active={isSignup}
            label="Sign up"
            onPress={() => setMode("signup")}
          />
          <TabButton
            active={!isSignup}
            label="Log in"
            onPress={() => setMode("login")}
          />
        </View>

        {/* Form */}
        <View style={{ gap: 14, marginTop: 12 }}>
          {isSignup && (
            <FormInput
              label="Full name"
              placeholder="e.g. Yasir Abdulgani"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <FormInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {isSignup && (
            <FormInput
              label="Confirm password"
              placeholder="••••••••"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
          )}
        </View>

        {/* Submit */}
        <Pressable
          onPress={isSignup ? onSignup : onLogin}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#2b5cff" : "#3b6cff",
            opacity: loading ? 0.7 : 1,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 8,
          })}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {loading
              ? isSignup
                ? "Creating account..."
                : "Logging in..."
              : isSignup
              ? "Create account"
              : "Log in"}
          </Text>
        </Pressable>

        {/* Switch helper */}
        <Pressable
          onPress={() => setMode(isSignup ? "login" : "signup")}
          style={{ alignSelf: "center", marginTop: 6 }}
        >
          <Text style={{ color: "#9aa0a6" }}>
            {isSignup
              ? "Already have an account? Log in"
              : "New here? Create an account"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function TabButton({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: active ? "#2b2f36" : "transparent",
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: active ? "white" : "#9aa0a6",
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FormInput({ label, ...rest }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: "#c7cbd1", fontSize: 12 }}>{label}</Text>
      <TextInput
        {...rest}
        style={{
          backgroundColor: "#1a1b1e",
          color: "white",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 10,
        }}
        placeholderTextColor="#747a81"
      />
    </View>
  );
}
