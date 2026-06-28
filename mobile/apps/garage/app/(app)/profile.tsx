import {useCallback, useEffect, useState, useMemo} from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { Input, Button, ThemeToggle, useApi, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'

// expo-location is a native module — GPS only works after expo prebuild + rebuild.
// The address text field works immediately without a rebuild.
let Location: typeof import('expo-location') | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Location = require('expo-location')
} catch {
  // Not available until after prebuild — degrade gracefully
}

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: string
  lat: number | null
  lng: number | null
  address: string | null
}

export default function GarageProfileScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { signOut } = useAuth()
  const { user } = useUser()
  const { apiFetch } = useApi()

  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  // Editable fields
  const [name, setName]       = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat]         = useState<string>('')
  const [lng, setLng]         = useState<string>('')

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: UserProfile }>('/v1/users/me')
      setProfile(res.data)
      setName(res.data.name ?? '')
      setAddress(res.data.address ?? '')
      setLat(res.data.lat != null ? String(res.data.lat) : '')
      setLng(res.data.lng != null ? String(res.data.lng) : '')
    } catch {
      setError('Failed to load profile')
    }
  }, [apiFetch])

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false))
  }, [fetchProfile])

  async function detectGPS() {
    if (!Location) {
      Alert.alert(
        'GPS not available',
        'GPS requires a native rebuild of the app. Enter your address manually for now.',
      )
      return
    }
    setGpsLoading(true)
    setError(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location permission denied. Enter your address manually.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setLat(String(loc.coords.latitude))
      setLng(String(loc.coords.longitude))

      // Reverse-geocode to get a human address
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
      if (geo) {
        const parts = [geo.streetNumber, geo.street, geo.district ?? geo.subregion, geo.city, geo.country]
          .filter(Boolean)
        setAddress(parts.join(', '))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GPS failed. Enter address manually.')
    } finally {
      setGpsLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const latNum = lat.trim() ? parseFloat(lat) : undefined
      const lngNum = lng.trim() ? parseFloat(lng) : undefined

      if ((lat.trim() && isNaN(latNum!)) || (lng.trim() && isNaN(lngNum!))) {
        setError('Latitude and longitude must be valid numbers.')
        return
      }
      if ((latNum !== undefined) !== (lngNum !== undefined)) {
        setError('Both latitude and longitude must be provided together.')
        return
      }

      await apiFetch('/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          ...(name.trim()      && { name:    name.trim() }),
          ...(address.trim()   && { address: address.trim() }),
          ...(latNum !== undefined && { lat: latNum, lng: lngNum }),
        }),
      })
      setSuccess(true)
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.orange500} style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.heading}>My Profile</Text>
        <Text style={styles.sub}>{user?.primaryEmailAddress?.emailAddress}</Text>

        <View style={styles.themeSection}>
          <Text style={styles.themeLabel}>Appearance</Text>
          <ThemeToggle />
        </View>

        {/* Personal info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Info</Text>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
        </View>

        {/* Business / delivery location */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Garage Location</Text>
          <Text style={styles.hint}>
            This is the default delivery destination for all your parts orders. You can override it
            per order on the Orders screen.
          </Text>

          <Input
            label="Street Address"
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. 14 Liberation Road, Accra"
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                label="Latitude"
                value={lat}
                onChangeText={setLat}
                placeholder="e.g. 5.6037"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.half}>
              <Input
                label="Longitude"
                value={lng}
                onChangeText={setLng}
                placeholder="e.g. -0.1870"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.gpsBtn, gpsLoading && styles.btnDisabled]}
            onPress={detectGPS}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <ActivityIndicator color={colors.orange500} size="small" />
            ) : (
              <Text style={styles.gpsBtnText}>📍 Use Current GPS Location</Text>
            )}
          </TouchableOpacity>

          {profile?.lat != null && (
            <View style={styles.savedLocation}>
              <Text style={styles.savedLabel}>Saved:</Text>
              <Text style={styles.savedValue}>
                {profile.address ?? `${profile.lat.toFixed(5)}, ${profile.lng?.toFixed(5)}`}
              </Text>
            </View>
          )}
        </View>

        {error   && <Text style={styles.errText}>{error}</Text>}
        {success && <Text style={styles.successText}>Profile saved ✓</Text>}

        <Button label={saving ? 'Saving…' : 'Save Changes'} onPress={save} disabled={saving} loading={saving} />

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe:         { flex: 1, backgroundColor: c.navy900 },
  content:      { padding: 20, paddingBottom: 60 },
  heading:      { fontSize: 24, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  sub:          { fontSize: 13, color: c.textSecondary, marginBottom: 20 },
  themeSection: { marginBottom: 20, gap: 10 },
  themeLabel:   { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  card:         { backgroundColor: c.navy800, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle:    { fontSize: 14, fontWeight: '600', color: c.orange500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint:         { fontSize: 12, color: c.textMuted, marginBottom: 12, lineHeight: 18 },
  row:          { flexDirection: 'row', gap: 12 },
  half:         { flex: 1 },
  gpsBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.orange500, borderRadius: 8, paddingVertical: 10, marginTop: 4 },
  btnDisabled:  { opacity: 0.5 },
  gpsBtnText:   { fontSize: 14, color: c.orange500, fontWeight: '600' },
  savedLocation:{ marginTop: 10, backgroundColor: c.navy700, borderRadius: 8, padding: 10 },
  savedLabel:   { fontSize: 11, color: c.textMuted, marginBottom: 2 },
  savedValue:   { fontSize: 13, color: c.textPrimary },
  errText:      { color: c.error, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  successText:  { color: c.success, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  signOutBtn:   { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  signOutText:  { color: c.error, fontSize: 15, fontWeight: '600' },
  ...Platform.select({ ios: {}, android: {} }),
})
}
