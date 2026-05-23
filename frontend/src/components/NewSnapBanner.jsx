import React, { useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { COLORS } from "../constants/colors";

const REACTIONS = ["❤️", "😂", "🔥", "🥺", "📷"];

const formatBannerTime = (createdAt) => {
  if (!createdAt) {
    return "now";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "now";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NewSnapBanner({
  visible,
  notification,
  onClose,
  onPress,
}) {
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose?.();
    }, 6000);

    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible || !notification) {
    return null;
  }

  const displayLabel =
    notification.senderDisplayLabel ||
    notification.displayLabel ||
    notification.senderUsername ||
    "A friend";

  const avatarUrl =
    notification.senderAvatarUrl ||
    notification.avatarUrl ||
    null;

  const imageUrl = notification.imageUrl || null;
  const caption = notification.caption?.trim() || "1 new snap";
  const profileColor = notification.senderProfileColor || COLORS.primary;
  const time = formatBannerTime(notification.createdAt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.92}
          onPress={onPress}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.backgroundImage}
              contentFit="cover"
              blurRadius={18}
            />
          ) : null}

          <View style={styles.darkLayer} />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={10}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <View style={styles.topRow}>
            <View style={[styles.avatarRing, { borderColor: profileColor }]}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: profileColor }]}>
                  <Text style={styles.avatarInitial}>
                    {displayLabel?.[0]?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.textColumn}>
              <Text style={styles.meta} numberOfLines={1}>
                {displayLabel} to you • {time}
              </Text>

              <Text style={styles.caption} numberOfLines={2}>
                {caption}
              </Text>
            </View>
          </View>

          <View style={styles.reactionRow}>
            {REACTIONS.map((reaction) => (
              <View key={reaction} style={styles.reactionBubble}>
                <Text style={styles.reactionText}>{reaction}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 58,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  card: {
    minHeight: 142,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(12,12,12,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.38,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  darkLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
    paddingRight: 28,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    padding: 3,
    marginRight: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  textColumn: {
    flex: 1,
  },
  meta: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 13,
    fontWeight: "800",
  },
  caption: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "950",
    lineHeight: 31,
    marginTop: 4,
  },
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    zIndex: 2,
  },
  reactionBubble: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionText: {
    fontSize: 18,
  },
});
