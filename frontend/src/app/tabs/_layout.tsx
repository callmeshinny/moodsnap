import React, { useContext } from "react";
import { View, TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { BookOpen, CalendarDays, Camera, User, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AuthContext } from "../../context/AuthContext";

const FALLBACK_ACCENT = "#FFB800";

const isHexColor = (value: unknown) =>
  /^#[0-9a-fA-F]{6}$/.test(String(value || ""));

const getReadableIconColor = (hex: string) => {
  if (!isHexColor(hex)) {
    return "#000";
  }

  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "#000" : "#fff";
};

function TabBubble({
  Icon,
  focused,
  accentColor,
}: {
  Icon: React.ComponentType<any>;
  focused: boolean;
  accentColor: string;
}) {
  const activeIconColor = getReadableIconColor(accentColor);

  return (
    <View
      style={{
        width: focused ? 58 : 44,
        height: focused ? 58 : 44,
        borderRadius: focused ? 29 : 22,
        backgroundColor: focused ? accentColor : "transparent",
        alignItems: "center",
        justifyContent: "center",
        marginTop: focused ? -10 : 0,
        shadowColor: accentColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: focused ? 0.34 : 0,
        shadowRadius: focused ? 16 : 0,
        elevation: focused ? 10 : 0,
      }}
    >
      <Icon
        size={focused ? 29 : 26}
        color={focused ? activeIconColor : "#777"}
        strokeWidth={focused ? 3 : 2.7}
      />
    </View>
  );
}

function CameraBubble({
  focused,
  accentColor,
}: {
  focused: boolean;
  accentColor: string;
}) {
  const activeIconColor = getReadableIconColor(accentColor);

  return (
    <View
      style={{
        width: focused ? 58 : 44,
        height: focused ? 58 : 44,
        borderRadius: focused ? 29 : 22,
        backgroundColor: focused ? accentColor : "transparent",
        alignItems: "center",
        justifyContent: "center",
        marginTop: focused ? -8 : 0,
        shadowColor: accentColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: focused ? 0.34 : 0,
        shadowRadius: focused ? 16 : 0,
        elevation: focused ? 10 : 0,
      }}
    >
      <Camera
        size={focused ? 29 : 26}
        color={focused ? activeIconColor : "#777"}
        strokeWidth={focused ? 3 : 2.7}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useContext(AuthContext as React.Context<any>);
  const accentColor = isHexColor(user?.profileColor)
    ? user.profileColor
    : FALLBACK_ACCENT;

  return (
    <Tabs
      screenOptions={{
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
              props.onPress?.();
            }}
          />
        ),
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          height: 72,
          borderRadius: 36,
          backgroundColor: "rgba(18,18,18,0.96)",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: "#777",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="diary"
        options={{
          title: "Diary",
          tabBarIcon: ({ focused }) => (
            <TabBubble Icon={BookOpen} focused={focused} accentColor={accentColor} />
          ),
        }}
      />

      <Tabs.Screen
        name="feed"
        options={{
          title: "Friend",
          tabBarIcon: ({ focused }) => (
            <TabBubble Icon={Users} focused={focused} accentColor={accentColor} />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ focused }) => (
            <CameraBubble focused={focused} accentColor={accentColor} />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused }) => (
            <TabBubble
              Icon={CalendarDays}
              focused={focused}
              accentColor={accentColor}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabBubble Icon={User} focused={focused} accentColor={accentColor} />
          ),
        }}
      />
    </Tabs>
  );
}
