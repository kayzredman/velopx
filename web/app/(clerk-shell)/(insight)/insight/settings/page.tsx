'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface UserProfile {
  id: string
  email: string
  name: string | null
  role: string
}

export default function InsightSettings() {
  const { getToken } = useAuth()
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [name, setName]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [saveMsg, setSaveMsg]   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json() as { data: UserProfile }
        setProfile(json.data)
        setName(json.data.name ?? '')
      }
    }
    void load()
  }, [getToken])

  async function handleSaveProfile() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveMsg('Profile saved.')
    } catch {
      setSaveMsg('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Manage your insurance company account and preferences</p>
      </div>

      {/* Company profile */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Company Profile</h2>

        <div>
          <label htmlFor="insight-contact" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Contact Name</label>
          <input
            id="insight-contact"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
          />
        </div>

        <div>
          <label htmlFor="insight-email" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Contact Email</label>
          <input
            id="insight-email"
            type="email"
            value={profile?.email ?? ''}
            readOnly
            className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-[#506070] cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="insight-role" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Role</label>
          <input
            id="insight-role"
            type="text"
            value={profile?.role ?? ''}
            readOnly
            className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-[#506070] cursor-not-allowed"
          />
        </div>

        {saveMsg && (
          <p className={`text-xs ${saveMsg.startsWith('Failed') ? 'text-rose-400' : 'text-green-400'}`}>{saveMsg}</p>
        )}

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </section>

      {/* Thresholds */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Alert Thresholds</h2>
        <div>
          <label htmlFor="insight-flag-threshold" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Auto-escalate when overcharge exceeds (%)</label>
          <input id="insight-flag-threshold" type="number" defaultValue={30} min={5} max={100} className="w-32 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]" />
          <p className="text-xs text-[#8A97AA] mt-1.5">Claims exceeding this threshold are automatically escalated to your fraud team.</p>
        </div>
        <div>
          <label htmlFor="insight-anomaly-min" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Anomaly pattern minimum occurrences</label>
          <input id="insight-anomaly-min" type="number" defaultValue={2} min={1} max={20} className="w-32 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]" />
          <p className="text-xs text-[#8A97AA] mt-1.5">Minimum occurrences before a pricing deviation appears in the Anomalies list.</p>
        </div>
        <button type="button" className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
          Save Thresholds
        </button>
      </section>

      {/* Notifications */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {[
          { label: "Critical anomaly detected", on: true },
          { label: "Weekly claims digest", on: true },
          { label: "New assessor activity", on: false },
          { label: "Monthly report ready", on: true },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-1">
            <span className="text-sm text-[#8A97AA]">{n.label}</span>
            <div className={`w-10 h-5 rounded-full relative cursor-pointer ${n.on ? "bg-[#F5A623]" : "bg-[#1E2E48]"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.on ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
