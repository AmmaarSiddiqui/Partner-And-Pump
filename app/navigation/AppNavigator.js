// app/navigation/AppNavigator.js
import React from "react";
import {
  NavigationContainer,
  DarkTheme,
  useTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../state/useAuthContext";

import HomeScreen from "../screens/HomeScreen";
import ProfileCreateScreen from "../screens/ProfileCreateScreen";
import AuthScreen from "../screens/AuthScreen";
import MatchScreen from "../screens/MatchScreen";
import PumpNowScreen from "../screens/PumpNowScreen"; // ok if unused
import MatchListScreen from "../screens/MatchListScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MessagesScreen from "../screens/MessagesScreen";
import UploadScreen from "../screens/UploadScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileStack from "./ProfileStack";
import AddScheduleScreen from "../screens/AddScheduleScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#3b6cff",
    background: "#121212",
    card: "#1E1E1E",
  },
};

function MainAppTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Match") {
            iconName = focused ? "link" : "link-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Discover") {
            iconName = focused ? "compass" : "compass-outline";
          } else if (route.name === "Messages") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen
        name="Match"
        component={MatchScreen}
        options={{ title: "Match" }}
      />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Auth-only stack
function AuthFlow() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: CustomDarkTheme.colors.card },
        headerTintColor: CustomDarkTheme.colors.text,
      }}
    >
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Profile creation flow
function ProfileCreateFlow() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: CustomDarkTheme.colors.card },
        headerTintColor: CustomDarkTheme.colors.text,
      }}
    >
      <Stack.Screen
        name="ProfileCreate"
        component={ProfileCreateScreen}
        options={{ title: "Create Profile", headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}

//  Main app flow (tabs + extra screens)
function MainAppFlow() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: CustomDarkTheme.colors.card },
        headerTintColor: CustomDarkTheme.colors.text,
      }}
    >
      <Stack.Screen
        name="MainApp"
        component={MainAppTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PumpNow"
        component={MatchScreen}
        options={{ title: "Find a Partner" }}
      />
      <Stack.Screen name="MatchList" component={MatchListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="AddSchedule"
        component={AddScheduleScreen}
        options={{ title: "Add to Schedule" }}
      />
      <Stack.Screen
        name="Upload"
        component={UploadScreen}
        options={{ title: "Upload Post" }}
      />
    </Stack.Navigator>
  );
}

function BootScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color="#fff" />
      <Text style={{ color: "#9aa0a6", marginTop: 8 }}>
        Loading your profile…
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const { user, profile, profileLoading } = useAuth();
  console.log("[Nav] user?", !!user, "profile:", profile, "profileLoading:", profileLoading);

  // profile: undefined → still loading from Firestore
  const isProfileLoading = user && profile === undefined;

  // what counts as "complete" profile (matches ProfileCreateScreen)
  const isProfileComplete =
    profile &&
    profile.name &&
    profile.goal &&
    profile.gym;

  let content;

  if (!user) {
    // not logged in
    content = <AuthFlow />;
  } else if (isProfileLoading) {
    // logged in, but profile not fetched yet
    content = <BootScreen />;
  } else if (!isProfileComplete) {
    // logged in, but no full profile yet
    content = <ProfileCreateFlow />;
  } else {
    // logged in + full profile
    content = <MainAppFlow />;
  }

  return (
    <NavigationContainer theme={CustomDarkTheme}>
      {content}
    </NavigationContainer>
  );
}
