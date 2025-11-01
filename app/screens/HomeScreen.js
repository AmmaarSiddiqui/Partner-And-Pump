import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from "react-native";
import { useAuth } from "../state/useAuthContext";
import { useTheme } from "@react-navigation/native";

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.h1, { color: colors.text }]}>
        Welcome, {profile?.name || "Lifter"} 👋
      </Text>
      <Text style={[styles.sub, { color: colors.text }]}>
        Goal: {profile?.goal}
      </Text>
      <Text style={[styles.sub, { color: colors.text }]}>
        Gym: {profile?.gym}
      </Text>

      <View style={{ height: 16 }} />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]} 
        onPress={() => navigation.navigate("PumpNow")}
      >
        <Text style={styles.buttonText}>Find a partner (Pump Now)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  h1: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  sub: { fontSize: 16 },
  
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center", // Center the text horizontally
    justifyContent: "center", // Center the text vertically
  },
  buttonText: {
    color: "#FFFFFF", // Button text is almost always white
    fontSize: 16,
    fontWeight: "600",
  },
});