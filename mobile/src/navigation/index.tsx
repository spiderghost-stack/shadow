import React from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MessageCircle, Settings as SettingsIcon } from "lucide-react-native";
import { useTheme } from "../theme";
import { useAuthStore } from "../hooks/useAuthStore";

import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ConversationsListScreen } from "../screens/ConversationsListScreen";
import { NewConversationScreen } from "../screens/NewConversationScreen";
import { NewGroupScreen } from "../screens/NewGroupScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { PrivacySettingsScreen } from "../screens/PrivacySettingsScreen";
import { BlockedUsersScreen } from "../screens/BlockedUsersScreen";
import { ChangePasswordScreen } from "../screens/ChangePasswordScreen";
import { SecurityHistoryScreen } from "../screens/SecurityHistoryScreen";
import { ConversationInfoScreen } from "../screens/ConversationInfoScreen";
import { MessageSearchScreen } from "../screens/MessageSearchScreen";
import { CallScreen } from "../screens/CallScreen";

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="ConversationsTab"
        component={ConversationsListScreen}
        options={{ title: "Discussions", tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: "Paramètres", tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} /> }}
      />
    </Tabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="NewConversation" component={NewConversationScreen} />
      <RootStack.Screen name="NewGroup" component={NewGroupScreen} />
      <RootStack.Screen name="Chat" component={ChatScreen} />
      <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
      <RootStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <RootStack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <RootStack.Screen name="SecurityHistory" component={SecurityHistoryScreen} />
      <RootStack.Screen name="ConversationInfo" component={ConversationInfoScreen} />
      <RootStack.Screen name="MessageSearch" component={MessageSearchScreen} />
      <RootStack.Screen name="Call" component={CallScreen} options={{ presentation: "fullScreenModal" }} />
    </RootStack.Navigator>
  );
}

export const navigationRef = createNavigationContainerRef<any>();

// Ouvre une conversation depuis l'extérieur de l'arbre React (ex. tap sur
// une notification push, voir App.tsx). On ne connaît que l'id de la
// conversation (le contenu du message n'est jamais dans la notification) —
// l'écran Chat récupérera titre/participant via son propre chargement.
export function navigateToConversation(conversationId: string) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate("Main", { screen: "ConversationsTab" });
  navigationRef.navigate("Chat", { conversationId, title: "Conversation" });
}

export function AppNavigator() {
  const status = useAuthStore((s) => s.status);
  return (
    <NavigationContainer ref={navigationRef}>
      {status === "ready" ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
