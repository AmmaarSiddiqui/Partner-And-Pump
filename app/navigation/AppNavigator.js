// app/navigation/AppNavigator.js
import React from "react";
import { 
  NavigationContainer, 
  DarkTheme
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../state/useAuthContext";
import { Ionicons } from "@expo/vector-icons"; 
import { useTheme } from "@react-navigation/native";
import { View, Text, ActivityIndicator } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import ProfileCreateScreen from "../screens/ProfileCreateScreen";
import AuthScreen from "../screens/AuthScreen";
import MatchScreen from "../screens/MatchScreen";
import PumpNowScreen from "../screens/PumpNowScreen";
import MatchListScreen from "../screens/MatchListScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileStack from "./ProfileStack";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// Custom dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#3b6cff", // Your active color
    background: "#121212", // A standard dark background
    card: "#1E1E1E",      // For headers and tab bars
  },
};

function MainAppTabs() {
  // 5. Use the theme's colors
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // ... (your icon logic remains the same)
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

        tabBarActiveTintColor: colors.primary, // Active color from theme
        tabBarInactiveTintColor: "white",       // Inactive color
        
        tabBarStyle: { 
          backgroundColor: colors.card, // Set tab bar background
          borderTopColor: colors.border,  // Style the border
        },
        headerStyle: {
          backgroundColor: colors.card, // Set header background
        },
        headerTintColor: colors.text,     // Set header text color
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
      <Tab.Screen name="Profile" component={ProfileStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, profile, profileLoading } = useAuth();
    console.log("[Nav] user?", !!user, "profile:", profile, "profileLoading:", profileLoading);

  const hasSeenProfileRef = React.useRef(false);
  if (profile !== undefined) hasSeenProfileRef.current = true;

  const showBoot = !!user && profile === undefined && !hasSeenProfileRef.current;

  const navKey = !user
    ? "auth"
    : showBoot
    ? "boot"
    : profile === null
    ? "create"
    : "app";

  return (
     <NavigationContainer theme={CustomDarkTheme}>
      <Stack.Navigator
        key={navKey}          
        screenOptions={{
          headerStyle: {
            backgroundColor: CustomDarkTheme.colors.card,
          },
          headerTintColor: CustomDarkTheme.colors.text,
          headerTransparent: false,
          headerBlurEffect: "none",
        }}
      >
        {!user ? (
          (console.log("[Nav] -> Auth"),  
          <Stack.Screen
          
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />)
        )  : profile === undefined ? ( 
            (console.log("[Nav] -> Boot"),
          <Stack.Screen
            name="Boot"
            component={BootScreen}
            options={{ headerShown: false }}
          />)
        ) : profile === null ? (
          (console.log("[Nav] -> ProfileCreate"),      
          <Stack.Screen
            name="ProfileCreate"
            component={ProfileCreateScreen}
            options={{ title: "Create Profile", headerBackVisible: false }}
          />)
        ) : (
           (console.log("[Nav] -> MainApp"),
         <Stack.Group>
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
            <Stack.Screen
              name="MatchList"
              component={MatchListScreen}
              // The title will be set dynamically by the screen itself
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
            />
          </Stack.Group>)
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
function BootScreen() {
  return (
    <View style={{ flex:1, backgroundColor:"#121212", alignItems:"center", justifyContent:"center" }}>
      <ActivityIndicator color="#fff" />
      <Text style={{ color:"#9aa0a6", marginTop:8 }}>Loading your profile…</Text>
    </View>
  );
}
