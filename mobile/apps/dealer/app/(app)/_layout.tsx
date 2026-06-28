import { Tabs } from 'expo-router'
import { useTheme } from '@velopx/shared'

export default function AppLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.navy900, borderTopColor: colors.navy700 },
        tabBarActiveTintColor: colors.orange500,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="catalogue" options={{ title: 'Catalogue' }} />
      <Tabs.Screen name="rfqs" options={{ title: 'RFQs' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="dispatch" options={{ title: 'Dispatch' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
