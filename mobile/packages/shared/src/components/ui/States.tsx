import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { FontFamily } from '../../hooks/useFonts'

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  errorText: { color: Colors.error, fontSize: 13 },
})
