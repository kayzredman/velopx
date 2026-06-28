import { Tabs } from 'expo-router'
import { useTheme } from '@velopx/shared'

export default function DriverAppLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Deliveries' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
