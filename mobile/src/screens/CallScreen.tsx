import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Phone, PhoneOff, Video, TriangleAlert } from "lucide-react-native";
import { useTheme } from "../theme";
import { Avatar } from "../components";
import { getSocket, SOCKET_EVENTS } from "../services/websocket/socket";
import { callSignaling, CallType } from "../services/webrtc/callSignaling";

type CallState = "calling" | "ringing" | "connected" | "ended";

export function CallScreen({ route, navigation }: any) {
  const { conversationId, otherUserName, callType, isIncoming } = route.params as {
    conversationId: string;
    otherUserName: string;
    callType: CallType;
    isIncoming?: boolean;
  };
  const { colors, typography, spacing, fontFamily } = useTheme();
  const [state, setState] = useState<CallState>(isIncoming ? "ringing" : "calling");

  useEffect(() => {
    if (!isIncoming) callSignaling.invite(conversationId, callType);

    const socket = getSocket();
    const onAccept = () => setState("connected");
    const onReject = () => {
      setState("ended");
      setTimeout(() => navigation.goBack(), 800);
    };
    const onEnd = () => {
      setState("ended");
      setTimeout(() => navigation.goBack(), 800);
    };

    socket?.on(SOCKET_EVENTS.CALL_ACCEPT, onAccept);
    socket?.on(SOCKET_EVENTS.CALL_REJECT, onReject);
    socket?.on(SOCKET_EVENTS.CALL_END, onEnd);

    return () => {
      socket?.off(SOCKET_EVENTS.CALL_ACCEPT, onAccept);
      socket?.off(SOCKET_EVENTS.CALL_REJECT, onReject);
      socket?.off(SOCKET_EVENTS.CALL_END, onEnd);
    };
  }, [conversationId, callType, isIncoming, navigation]);

  function handleAccept() {
    callSignaling.accept(conversationId);
    setState("connected");
  }

  function handleHangup() {
    if (state === "ringing") callSignaling.reject(conversationId);
    else callSignaling.end(conversationId);
    navigation.goBack();
  }

  const stateLabel: Record<CallState, string> = {
    calling: "Appel en cours...",
    ringing: "Appel entrant",
    connected: "En communication",
    ended: "Appel terminé",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ alignItems: "center", marginTop: spacing.xxl }}>
        <Avatar name={otherUserName} size={96} />
        <Text style={[typography.h2, { color: colors.textPrimary, fontFamily: fontFamily.medium, marginTop: spacing.md }]}>
          {otherUserName}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, fontFamily: fontFamily.regular, marginTop: 4 }]}>
          {stateLabel[state]}
        </Text>

        <View style={[styles.warningBox, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
          <TriangleAlert size={16} color={colors.warning} />
          <Text style={[typography.caption, { color: colors.warning, fontFamily: fontFamily.regular, marginLeft: 6, flex: 1 }]}>
            Signalisation uniquement : pas de son ni d'image dans Expo Go (nécessite un dev client WebRTC — voir services/webrtc/README.md).
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {state === "ringing" ? (
          <Pressable onPress={handleAccept} style={[styles.actionButton, { backgroundColor: colors.success }]}>
            {callType === "video" ? <Video size={26} color="#fff" /> : <Phone size={26} color="#fff" />}
          </Pressable>
        ) : null}
        <Pressable onPress={handleHangup} style={[styles.actionButton, { backgroundColor: colors.danger }]}>
          <PhoneOff size={26} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingBottom: 48 },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actions: { flexDirection: "row", justifyContent: "center", gap: 32 },
  actionButton: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
});
