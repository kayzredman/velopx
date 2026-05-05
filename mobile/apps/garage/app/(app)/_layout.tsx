import { Tabs } from 'expo-router'
import { Colors } from '@velopx/shared'

export default function GarageAppLayout() {
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
      <Tabs.Screen name="index"    options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="search"   options={{ title: 'Search' }} />
      <Tabs.Screen name="quotes"   options={{ title: 'Quotes' }} />
      <Tabs.Screen name="orders"   options={{ title: 'Orders' }} />
      <Tabs.Screen name="inbound"  options={{ title: 'Inbound' }} />
      <Tabs.Screen name="job-cards" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  )
}
