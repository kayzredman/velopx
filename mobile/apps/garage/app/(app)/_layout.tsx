import { Tabs } from 'expo-router'
import { useTheme } from '@velopx/shared'

export default function GarageAppLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navy900,
          borderTopColor: colors.navy700,
        },
        tabBarActiveTintColor: colors.orange500,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="quotes" options={{ title: 'Quotes' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="inbound" options={{ title: 'Inbound' }} />
      <Tabs.Screen name="job-cards" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
