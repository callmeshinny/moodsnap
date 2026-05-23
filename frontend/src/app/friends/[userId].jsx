import { Redirect, useLocalSearchParams } from "expo-router";

export default function LegacyUserIdFriendRoute() {
  const { userId } = useLocalSearchParams();
  const target = Array.isArray(userId) ? userId[0] : userId;

  if (!target) {
    return <Redirect href="/tabs/profile" />;
  }

  return <Redirect href={`/friend/${encodeURIComponent(target)}`} />;
}
