import { Redirect, useLocalSearchParams } from "expo-router";

export default function LegacyUsernameFriendRoute() {
  const { username } = useLocalSearchParams();
  const target = Array.isArray(username) ? username[0] : username;

  if (!target) {
    return <Redirect href="/tabs/profile" />;
  }

  return <Redirect href={`/friend/${encodeURIComponent(target)}`} />;
}
