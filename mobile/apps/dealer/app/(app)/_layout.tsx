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
    </Tabs>
  )
}
