import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { auth, db } from "./services/firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Index() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("signup"); // "signup" or "login"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Listen for login/logout state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setBooting(false);
    });
    return unsub;
  }, []);

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
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });

      // Save user info in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created successfully!");
    } catch (e) {
      Alert.alert("Sign up failed", e.message);
    }
  };

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Welcome back!");
    } catch (e) {
      Alert.alert("Login failed", e.message);
    }
  };

  const onLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      Alert.alert("Logout failed", e.message);
    }
  };

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // temporary logged-in view
  if (user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f0f10", padding: 24 }}>
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
            Partner & Pump
          </Text>
          <Text style={{ color: "#9aa0a6", marginTop: 10 }}>
            Welcome, {user.displayName || user.email} 👋
          </Text>
        </View>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#2b2f36" : "#1a1b1e",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 60,
          })}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Log out</Text>
        </Pressable>
      </View>
    );
  }

  // Login / Signup form
  const isSignup = mode === "signup";

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

        {/* Toggle buttons */}
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
          <TabButton active={isSignup} label="Sign up" onPress={() => setMode("signup")} />
          <TabButton active={!isSignup} label="Log in" onPress={() => setMode("login")} />
        </View>

        {/* Form fields */}
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

        {/* Submit button */}
        <Pressable
          onPress={isSignup ? onSignup : onLogin}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#2b5cff" : "#3b6cff",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 8,
          })}
        >
          
          <Text style={{ color: "white", fontWeight: "700" }}>
            {isSignup ? "Create account" : "Log in"}
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

/* ---------- Small helper components ---------- */

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
      <Text style={{ color: active ? "white" : "#9aa0a6", fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FormInput(props) {
  const { label, ...rest } = props;
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