'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface UserProfile {
  id: string
  email: string
  name: string | null
  role: string
  lat: number | null
  lng: number | null
  address: string | null
}

interface StaffMember {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

export default function GarageSettings() {
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

  // Staff state
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [staffForm, setStaffForm] = useState({ email: '', name: '', password: '' })
  const [addingStaff, setAddingStaff] = useState(false)
  const [addStaffError, setAddStaffError] = useState<string | null>(null)
  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null)

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

  const fetchStaff = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/team/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: StaffMember[] }
      setStaff(json.data)
    } catch { /* keep */ } finally {
      setStaffLoading(false)
    }
  }, [getToken, API_URL])

  useEffect(() => { fetchProfile() }, [fetchProfile])
  useEffect(() => { void fetchStaff() }, [fetchStaff])

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    setAddingStaff(true)
    setAddStaffError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/team/staff`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      })
      const json = await res.json() as { data?: StaffMember; error?: string }
      if (!res.ok) throw new Error(json.error ?? `API ${res.status}`)
      setStaff((prev) => [...prev, json.data!])
      setStaffForm({ email: '', name: '', password: '' })
      setShowAddStaff(false)
    } catch (err) {
      setAddStaffError(err instanceof Error ? err.message : 'Failed to add staff member')
    } finally {
      setAddingStaff(false)
    }
  }

  async function handleRemoveStaff(id: string) {
    setRemovingStaffId(id)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/team/staff/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      setStaff((prev) => prev.filter((s) => s.id !== id))
    } catch { /* keep */ } finally {
      setRemovingStaffId(null)
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

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Manage your workshop profile and delivery location</p>
      </div>

      {/* Workshop Profile */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Workshop Profile</h2>

        <div>
          <label htmlFor="garage-name" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Display Name</label>
          <input
            id="garage-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#8A97AA] mb-1.5">Email</label>
          <p className="bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-[#8A97AA]">{profile?.email ?? '—'}</p>
          <p className="text-[#4A5568] text-xs mt-1">Email is managed by your Clerk account.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#8A97AA] mb-1.5">Role</label>
          <p className="bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-[#8A97AA] capitalize">{profile?.role?.replace(/_/g, ' ') ?? '—'}</p>
        </div>

        {/* Garage Location */}
        <div className="pt-3 border-t border-[#1E2E48] space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#8A97AA] uppercase tracking-widest mb-1">Garage Location</p>
            <p className="text-[#4A5568] text-xs">
              Your default delivery destination. Dealers and drivers use this to deliver parts to you.
              Set it once — it auto-populates every order you place.
            </p>
          </div>

          <div>
            <label htmlFor="garage-address" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Street Address</label>
            <div className="flex gap-2">
              <input
                id="garage-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="45 Garage Lane, Kumasi, Ashanti Region"
                className="flex-1 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
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
              <label htmlFor="garage-lat" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Latitude</label>
              <input
                id="garage-lat"
                type="text"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="6.6884"
                className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#F5A623]"
              />
            </div>
            <div>
              <label htmlFor="garage-lng" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Longitude</label>
              <input
                id="garage-lng"
                type="text"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-1.6244"
                className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#F5A623]"
              />
            </div>
          </div>

          {profile?.lat != null && !lat && !lng && (
            <p className="text-[#4A5568] text-xs">📍 Saved: {profile.lat}, {profile.lng} — {profile.address ?? 'no address'}</p>
          )}
          {profile?.lat == null && !lat && !lng && (
            <div className="flex items-start gap-2 bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-lg px-3 py-3">
              <span className="text-[#F5A623] text-sm">📍</span>
              <p className="text-[#F5A623] text-xs">
                No garage location set yet. Without a location, dealers won&apos;t have an exact delivery address.
                You can also capture GPS automatically using the <strong>VelopX Garage mobile app</strong>.
              </p>
            </div>
          )}
        </div>

        {saveError && <p className="text-xs text-red-400 font-mono">{saveError}</p>}
        <div className="flex items-center justify-end gap-3 pt-1">
          {saved && <p className="text-xs text-green-400 font-medium">Saved!</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </section>

      {/* Workshop Staff */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Workshop Staff</h2>
          <button
            type="button"
            onClick={() => { setShowAddStaff(true); setAddStaffError(null) }}
            className="text-xs bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add Staff
          </button>
        </div>

        {showAddStaff && (
          <form onSubmit={handleAddStaff} className="bg-[#060F1E] border border-[#1E2E48] rounded-lg p-4 space-y-3">
            <p className="text-xs font-medium text-[#8A97AA] uppercase tracking-widest">New Staff Member</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#8A97AA] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Kwame Mensah"
                  className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8A97AA] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="kwame@workshop.com"
                  className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#8A97AA] mb-1">Temporary Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={staffForm.password}
                onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters"
                className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F5A623]"
              />
            </div>
            {addStaffError && <p className="text-xs text-red-400 font-mono">{addStaffError}</p>}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={addingStaff}
                className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                {addingStaff ? 'Adding…' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddStaff(false)}
                className="text-xs text-[#8A97AA] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {staffLoading && (
          <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-12 rounded-lg bg-[#060F1E] animate-pulse" />)}</div>
        )}

        {!staffLoading && staff.length === 0 && !showAddStaff && (
          <p className="text-sm text-[#4A5568] py-2">No staff members yet. Add your first team member above.</p>
        )}

        {!staffLoading && staff.map((member) => (
          <div key={member.id} className="flex items-center gap-4 py-2 border-b border-[#1E2E48] last:border-0">
            <div className="w-8 h-8 rounded-full bg-[#1E2E48] flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[#F5A623]">
                {(member.name ?? member.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{member.name ?? '—'}</p>
              <p className="text-xs text-[#8A97AA] truncate">{member.email}</p>
            </div>
            <span className="text-xs text-[#8A97AA] bg-[#1E2E48] px-2 py-0.5 rounded-full capitalize shrink-0">
              {member.role.replace(/_/g, ' ')}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveStaff(member.id)}
              disabled={removingStaffId === member.id}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors shrink-0"
            >
              {removingStaffId === member.id ? '…' : 'Remove'}
            </button>
          </div>
        ))}
      </section>

      {/* Notifications */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {[
          { label: 'New quote received for RFQ', on: true },
          { label: 'Part dispatched by dealer', on: true },
          { label: 'Delivery arriving today', on: true },
          { label: 'Job card status updates', on: false },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-1">
            <span className="text-sm text-[#8A97AA]">{n.label}</span>
            <div className={`w-10 h-5 rounded-full relative ${n.on ? 'bg-[#F5A623]' : 'bg-[#1E2E48]'}`} aria-hidden="true">
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        ))}
      </section>

      {/* Danger zone */}
      <section className="bg-[#0D1E35] border border-red-500/20 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        <p className="text-xs text-[#8A97AA]">
          Deleting your workshop account is permanent. All job cards, RFQs, and order history will be lost.
        </p>
        <button type="button" className="text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors">
          Delete Workshop Account
        </button>
      </section>
    </div>
  )
}
