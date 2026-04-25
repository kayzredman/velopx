import { Tabs } from 'expo-router'
import { Colors } from '@velopx/shared'

export default function DriverAppLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Deliveries' }} />
      <Tabs.Screen
        name="delivery/[id]"
        options={{ href: null }}
      />
    </Tabs>
  )
}
