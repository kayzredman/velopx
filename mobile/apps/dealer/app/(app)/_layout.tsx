import { Tabs } from 'expo-router'
import { Colors } from '@velopx/shared'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navy900,
          borderTopColor: Colors.navy700,
        },
        tabBarActiveTintColor: Colors.orange500,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="catalogue" options={{ title: 'Catalogue' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="rfqs" options={{ title: 'RFQs' }} />
      <Tabs.Screen name="dispatch"  options={{ title: 'Dispatch' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
    </Tabs>
  )
}
