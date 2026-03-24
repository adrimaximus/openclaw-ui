'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Msg = { id: string; session_id: string; role: string; content: string; message_type: string; created_at: string }

export default function HistoryPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading]   = useState(true)
  const [role, setRole]         = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('wa_messages').select('*').order('created_at', { ascending: false }).limit(100)
      if (role !== 'all') q = q.eq('role', role)
      const { data } = await q
      setMessages(data ?? [])
      setLoading(false)
    }
    load()
  }, [role])

  const roleColor: Record<string, string> = {
    user:      'bg-primary/10 text-primary',
    assistant: 'bg-emerald-50 text-emerald-700',
    system:    'bg-amber-50 text-amber-700',
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold">Message History</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6f797a] font-medium">Filter:</span>
          {['all','user','assistant','system'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${role === r ? 'bg-primary text-white' : 'bg-white border border-[#e0e3e5] text-[#6f797a] hover:bg-[#f2f4f6]'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-16 text-[#6f797a]">Loading history…</div>}

      <div className="space-y-3">
        {messages.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-[#e0e3e5] p-5 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleColor[m.role] ?? 'bg-[#f2f4f6] text-[#6f797a]'}`}>
                  {m.role}
                </span>
                <Link href={`/chat/${encodeURIComponent(m.session_id)}`}
                  className="text-xs text-primary font-semibold hover:underline">
                  {m.session_id.split('@')[0]}
                </Link>
              </div>
              <span className="text-xs text-[#6f797a] shrink-0">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#191c1e] line-clamp-2 leading-relaxed">
              {m.message_type === 'command_output' ? (
                <code className="text-xs bg-[#f2f4f6] px-2 py-0.5 rounded">{m.content.substring(0, 200)}</code>
              ) : m.content}
            </p>
          </div>
        ))}
        {!loading && messages.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e0e3e5] p-16 text-center text-[#6f797a] text-sm">
            No messages found.
          </div>
        )}
      </div>
    </div>
  )
}
