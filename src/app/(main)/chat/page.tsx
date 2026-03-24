'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBridgeStatus } from '@/lib/useBridgeStatus'

type Session = { id: string; phone_number: string; display_name: string; last_message_at: string; status: string }

export default function ChatListPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const BRIDGE = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'
  const { status: waStatus } = useBridgeStatus()

  const load = () =>
    fetch(`${BRIDGE}/api/sessions`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSessions(d) })
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold">WhatsApp Sessions</h2>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e0e3e5] rounded-lg text-sm font-semibold hover:bg-[#f2f4f6] transition-all">
          <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh
        </button>
      </div>

      {loading && <div className="text-center py-16 text-[#6f797a]">Loading sessions…</div>}

      {!loading && sessions.length === 0 && (
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[#bfc8ca]">forum</span>
          <p className="mt-4 font-semibold text-[#6f797a]">No WhatsApp sessions yet.</p>
          <p className="text-sm text-[#6f797a] mt-1">
            {waStatus !== 'connected'
              ? <Link href="/connect" className="text-primary font-semibold">Connect WhatsApp first →</Link>
              : 'Send a message to your WhatsApp number to start a session.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map(s => (
          <Link key={s.id} href={`/chat/${encodeURIComponent(s.id)}`}
            className="flex items-center gap-4 bg-white rounded-xl p-4 border border-[#e0e3e5] hover:border-primary/30 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {(s.display_name || s.phone_number)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#191c1e]">{s.display_name || s.phone_number}</div>
              <div className="text-xs text-[#6f797a] mt-0.5">{s.phone_number}</div>
            </div>
            <div className="text-right shrink-0">
              {s.last_message_at && (
                <div className="text-xs text-[#6f797a]">
                  {new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <span className="material-symbols-outlined text-[#bfc8ca] group-hover:text-primary transition-colors text-[18px] mt-1">chevron_right</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
