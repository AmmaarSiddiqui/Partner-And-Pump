// app/screens/MatchListScreen.js
import React, { useLayoutEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import UserCard from "../components/UserCard";

// Mock data based on your screenshot
const MOCK_USERS = [
  {
    id: "1",
    name: "Alex Rivera",
    age: 24,
    bio: "Dedicated to strength training and staying fit.",
    tags: ["Goals"],
  },
  {
    id: "2",
    name: "Jordan Kim",
    age: 25,
    bio: "Passionate about bodybuilding and strength training.",
    tags: ["Pull"],
  },
  {
    id: "3",
    name: "Priya Shah",
    age: 22,
    bio: "Focused on improving strength and overall fitness.",
    tags: ["Pull"],
  },
  {
    id: "4",
    name: "Marcus Lee",
    age: 27,
    bio: "Enjoys weightlifting and making progress.",
    tags: [],
  },
  {
    id: "5",
    name: "Sofia Alvarez",
    age: 23,
    bio: "Striving for strength gains and muscle building.",
    tags: ["Pull"],
  },
];

export default function MatchListScreen({ route, navigation }) {
  const { colors } = useTheme();
  
  // Get the category and mode passed from the previous screen
  const { category, mode } = route.params;

  // Set the header title dynamically
  useLayoutEffect(() => {
    const modeText = mode === "pumpNow" ? "Same-Day" : "Long-Term";
    navigation.setOptions({
      title: `${category} — ${modeText}`,
    });
  }, [navigation, category, mode]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
            data={MOCK_USERS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => ( 
            <UserCard
                name={item.name}
                age={item.age}
                bio={item.bio}
                tags={item.tags}
                onMatch={() => console.log("Match with", item.name)}
            />
            )}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 20,
  },
});