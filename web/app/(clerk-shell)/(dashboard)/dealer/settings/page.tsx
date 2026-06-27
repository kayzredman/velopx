'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface UserProfile { id: string; email: string; name: string | null; role: string; lat: number | null; lng: number | null; address: string | null }
interface Driver { id: string; name: string | null; email: string; createdAt: string }

export default function SettingsPage() {
  const { getToken } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  // Team state
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [driversLoading, setDriversLoading] = useState(false)
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [driverForm, setDriverForm] = useState({ email: '', name: '', password: '' })
  const [addingDriver, setAddingDriver] = useState(false)
  const [addDriverError, setAddDriverError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  async function reverseGeocode(latVal: number, lngVal: number): Promise<string> {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latVal}&lon=${lngVal}&format=json`,
      { headers: { 'User-Agent': 'VelopX/1.0' } },
    )
    if (!res.ok) throw new Error('Reverse geocode failed')
    const json = await res.json() as { display_name?: string }
    return json.display_name ?? ''
  }

  async function handleUseGPS() {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser')
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const latVal = pos.coords.latitude
          const lngVal = pos.coords.longitude
          setLat(String(latVal))
          setLng(String(lngVal))
          const addr = await reverseGeocode(latVal, lngVal)
          if (addr) setAddress(addr)
        } catch {
          setGpsError('Could not reverse-geocode your position. Coordinates were still filled in.')
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        setGpsError(err.message ?? 'Location access denied')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleLookupAddress() {
    if (!address.trim()) return
    setLookupLoading(true)
    setLookupError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address.trim())}&format=json&limit=1`,
        { headers: { 'User-Agent': 'VelopX/1.0' } },
      )
      if (!res.ok) throw new Error('Geocode request failed')
      const json = await res.json() as Array<{ lat: string; lon: string }>
      if (!json.length) throw new Error('Address not found — try a more specific address')
      setLat(json[0].lat)
      setLng(json[0].lon)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLookupLoading(false)
    }
  }

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: UserProfile }
      setProfile(json.data)
      setName(json.data.name ?? '')
      setAddress(json.data.address ?? '')
      setLat(json.data.lat != null ? String(json.data.lat) : '')
      setLng(json.data.lng != null ? String(json.data.lng) : '')
    } catch { /* keep */ }
  }, [getToken, API_URL])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/team/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Driver[] }
      setDrivers(json.data)
    } catch { /* keep */ } finally {
      setDriversLoading(false)
    }
  }, [getToken, API_URL])

  useEffect(() => { loadDrivers() }, [loadDrivers])

  async function handleAddDriver() {
    if (!driverForm.email || !driverForm.name || !driverForm.password) return
    setAddingDriver(true)
    setAddDriverError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/team/drivers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(driverForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `API ${res.status}`)
      setDrivers((prev) => [...prev, json.data as Driver])
      setDriverForm({ email: '', name: '', password: '' })
      setShowAddDriver(false)
    } catch (err) {
      setAddDriverError(err instanceof Error ? err.message : 'Failed to add driver')
    } finally {
      setAddingDriver(false)
    }
  }

  async function handleRemoveDriver(id: string) {
    setRemovingId(id)
    try {
      const token = await getToken()
      await fetch(`${API_URL}/v1/users/team/drivers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setDrivers((prev) => prev.filter((d) => d.id !== id))
    } catch { /* keep */ } finally {
      setRemovingId(null)
    }
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const token = await getToken()
      const latNum = lat.trim() ? parseFloat(lat.trim()) : undefined
      const lngNum = lng.trim() ? parseFloat(lng.trim()) : undefined
      const body: Record<string, unknown> = { name: name.trim() }
      if (address.trim()) body.address = address.trim()
      if (latNum != null && !isNaN(latNum)) body.lat = latNum
      if (lngNum != null && !isNaN(lngNum)) body.lng = lngNum
      const res = await fetch(`${API_URL}/v1/users/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const notifications = [
    { label: 'New RFQ received', description: 'Get notified when a buyer sends a new request for quote', enabled: true },
    { label: 'Order confirmed', description: 'When a buyer accepts your quote and places an order', enabled: true },
    { label: 'Delivery status updates', description: 'Driver pick-up and delivery confirmations', enabled: true },
    { label: 'Weekly performance digest', description: 'Summary of your revenue, orders and views every Monday', enabled: false },
    { label: 'Price benchmark alerts', description: 'When your listing price deviates significantly from market average', enabled: false },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Manage your account and notification preferences</p>
      </div>

      {/* Business Profile */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2E48]">
          <h2 className="text-white font-semibold text-sm">Business Profile</h2>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div>
            <label htmlFor="field-name" className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Display Name</label>
            <input
              id="field-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Email</label>
            <p className="text-[#8A97AA] text-sm px-4 py-2.5 bg-[#0A1628] border border-[#1E2E48] rounded-lg">{profile?.email ?? '—'}</p>
            <p className="text-[#4A5568] text-xs mt-1">Email is managed by your Clerk account.</p>
          </div>
          <div>
            <label className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Role</label>
            <p className="text-[#8A97AA] text-sm px-4 py-2.5 bg-[#0A1628] border border-[#1E2E48] rounded-lg capitalize">{profile?.role?.replace(/_/g, ' ') ?? '—'}</p>
          </div>
          {/* Warehouse Location */}
          <div className="pt-2 border-t border-[#1E2E48]">
            <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-3">Warehouse / Pickup Location</p>
            <p className="text-[#4A5568] text-xs mb-3">Drivers use this address to know where to collect parts. Set it once — it auto-populates every new delivery.</p>
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="field-address" className="block text-[#8A97AA] text-xs mb-1.5">Street Address</label>
                <div className="flex gap-2">
                  <input
                    id="field-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="12 Industrial Rd, Tema, Greater Accra"
                    className="flex-1 bg-[#0A1628] border border-[#1E2E48] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleLookupAddress}
                    disabled={lookupLoading || !address.trim()}
                    title="Look up coordinates from address"
                    className="px-3 py-2.5 rounded-lg bg-[#1E2E48] text-[#8A97AA] hover:text-white text-sm disabled:opacity-40 transition-colors flex-shrink-0"
                  >
                    {lookupLoading ? '…' : '🔍'}
                  </button>
                </div>
                {lookupError && <p className="text-xs text-red-400 mt-1 font-mono">{lookupError}</p>}
              </div>

              {/* GPS button */}
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={gpsLoading}
                className="flex items-center gap-2 text-sm text-[#F5A623] border border-[#F5A623]/30 bg-[#F5A623]/5 hover:bg-[#F5A623]/10 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 w-full justify-center"
              >
                {gpsLoading ? (
                  <><span className="animate-spin">⟳</span> Detecting location…</>
                ) : (
                  <>📍 Use My Current Location</>
                )}
              </button>
              {gpsError && <p className="text-xs text-red-400 font-mono">{gpsError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="field-lat" className="block text-[#8A97AA] text-xs mb-1.5">Latitude</label>
                  <input
                    id="field-lat"
                    type="text"
                    inputMode="decimal"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="5.6037"
                    className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="field-lng" className="block text-[#8A97AA] text-xs mb-1.5">Longitude</label>
                  <input
                    id="field-lng"
                    type="text"
                    inputMode="decimal"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="-0.1870"
                    className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                </div>
              </div>
              {profile?.lat != null && !lat && !lng && (
                <p className="text-[#4A5568] text-xs">📍 Current: {profile.lat}, {profile.lng} — {profile.address ?? 'no address'}</p>
              )}
            </div>
          </div>

          {saveError && <p className="text-xs text-red-400 font-mono">{saveError}</p>}
          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && <p className="text-xs text-green-400 font-medium">Saved!</p>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-5 py-2 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Team — Drivers */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2E48] flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-sm">Dispatch Team</h2>
            <p className="text-[#8A97AA] text-xs mt-0.5">Drivers you can assign to deliveries</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowAddDriver(true); setAddDriverError(null) }}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30 font-semibold hover:bg-[#F5A623]/20 transition-colors"
          >
            + Add Driver
          </button>
        </div>

        {/* Add driver form */}
        {showAddDriver && (
          <div className="px-6 py-5 border-b border-[#1E2E48] bg-[#0A1628] space-y-4">
            <p className="text-[#8A97AA] text-xs font-semibold uppercase tracking-wider">New Driver Account</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#8A97AA] text-xs mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Kwame Mensah"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
                />
              </div>
              <div>
                <label className="block text-[#8A97AA] text-xs mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="driver@example.com"
                  value={driverForm.email}
                  onChange={(e) => setDriverForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-[#8A97AA] text-xs mb-1.5">Temporary Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={driverForm.password}
                onChange={(e) => setDriverForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
              <p className="text-[#4A5568] text-xs mt-1">The driver will use these credentials to sign in to the VelopX Driver app.</p>
            </div>
            {addDriverError && <p className="text-xs text-red-400 font-mono">{addDriverError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddDriver}
                disabled={addingDriver || !driverForm.email || !driverForm.name || driverForm.password.length < 8}
                className="px-5 py-2 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] disabled:opacity-50 transition-colors"
              >
                {addingDriver ? 'Creating…' : 'Create Driver Account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddDriver(false); setDriverForm({ email: '', name: '', password: '' }); setAddDriverError(null) }}
                className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Driver list */}
        {driversLoading ? (
          <div className="px-6 py-6 text-center">
            <p className="text-[#8A97AA] text-sm">Loading…</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-[#8A97AA] text-sm">No drivers yet. Add drivers so you can assign them to deliveries.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E2E48]">
            {drivers.map((d) => (
              <div key={d.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">{d.name ?? 'Unnamed'}</p>
                  <p className="text-[#8A97AA] text-xs">{d.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDriver(d.id)}
                  disabled={removingId === d.id}
                  className="text-xs text-[#EF4444] border border-[#EF4444]/20 px-3 py-1 rounded-lg hover:bg-[#EF4444]/10 disabled:opacity-40 transition-colors"
                >
                  {removingId === d.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2E48]">
          <h2 className="text-white font-semibold text-sm">Notifications</h2>
        </div>
        <div className="divide-y divide-[#1E2E48]">
          {notifications.map((n) => (
            <div key={n.label} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium">{n.label}</p>
                <p className="text-[#8A97AA] text-xs mt-0.5">{n.description}</p>
              </div>
              {/* Visual-only toggle — no state change needed for static mock */}
              <div
                className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${n.enabled ? 'bg-[#F5A623]' : 'bg-[#1E2E48]'}`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 mt-6">
        <h2 className="text-red-400 font-semibold text-sm mb-1">Danger Zone</h2>
        <p className="text-[#8A97AA] text-xs mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button type="button" className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}
