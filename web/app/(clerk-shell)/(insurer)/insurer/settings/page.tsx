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

export default function InsurerSettingsPage() {
  const { getToken }                  = useAuth()
  const [profile, setProfile]         = useState<UserProfile | null>(null)
  const [name, setName]               = useState('')
  const [saving, setSaving]           = useState(false)
  const [saveMsg, setSaveMsg]         = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = (await res.json()) as { data: UserProfile }
        setProfile(json.data)
        setName(json.data.name ?? '')
      }
    }
    void load()
  }, [getToken])

  async function handleSave() {
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

  const comingSoon = [
    {
      title: 'Team Members',
      description: 'Invite and manage staff who can access the insurer portal.',
    },
    {
      title: 'Authorised Assessors',
      description: 'Manage which assessors are authorised to process claims for your organisation.',
    },
    {
      title: 'Notifications',
      description: 'Configure email alerts for disputed claims, delivery confirmations, and anomaly flags.',
    },
  ]

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Settings</h1>
        <p className="text-[#506070] text-sm mt-1">Manage your organisation and portal preferences</p>
      </div>

      {/* Profile section */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Contact Profile</h2>

        <div>
          <label htmlFor="insurer-name" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Contact Name</label>
          <input
            id="insurer-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
          />
        </div>

        <div>
          <label htmlFor="insurer-email" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Email</label>
          <input
            id="insurer-email"
            type="email"
            value={profile?.email ?? ''}
            readOnly
            className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-[#506070] cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="insurer-role" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Role</label>
          <input
            id="insurer-role"
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
          onClick={handleSave}
          disabled={saving}
          className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </section>

      {/* Coming soon sections */}
      <div className="space-y-4">
        {comingSoon.map((s) => (
          <div key={s.title} className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[#E8ECF1] font-semibold text-sm">{s.title}</h3>
              <p className="text-[#506070] text-xs mt-1">{s.description}</p>
            </div>
            <button
              disabled
              className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1E2E48] text-[#3D5068] cursor-not-allowed"
            >
              Manage
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
