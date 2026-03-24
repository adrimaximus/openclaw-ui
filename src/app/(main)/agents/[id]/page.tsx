'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const BRIDGE = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'

type Agent   = { id: string; name: string; model: string; status: string; system_prompt: string; created_at: string }
type Session = { id: string; name: string; session_id: string; created_at: string }

export default function AgentPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [agent,    setAgent]    = useState<Agent | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading,  setLoading]  = useState(true)

  // ── New agent form
  const [form, setForm] = useState({ name: '', model: 'minimax-m2.5', system_prompt: '' })

  useEffect(() => {
    if (id === 'new') { setLoading(false); return }
    Promise.all([
      supabase.from('agents').select('*').eq('id', id).single(),
      supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(5),
    ]).then(([{ data: ag }, { data: se }]) => {
      setAgent(ag)
      setSessions(se ?? [])
      setLoading(false)
    })
  }, [id])

  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  async function createAgent() {
    if (!form.name.trim() || creating) return
    setCreating(true)
    setCreateErr('')
    try {
      // Simpan langsung ke Supabase (tidak perlu bridge)
      const { data, error } = await supabase.from('agents').insert({
        name: form.name.trim(),
        model: form.model || 'minimax-m2.5',
        system_prompt: form.system_prompt || '',
        status: 'idle',
      }).select().single()

      if (error) throw new Error(error.message)

      // Notify bridge jika tersedia (fire & forget, tidak wajib)
      fetch(`${BRIDGE}/api/agents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id, ...form }),
      }).catch(() => {}) // ignore jika bridge tidak jalan

      router.push(`/agents/${data.id}`)
    } catch (err) {
      setCreateErr(String(err))
    } finally {
      setCreating(false)
    }
  }

  // ── New agent page
  if (id === 'new') return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-[#6f797a] hover:text-primary flex items-center gap-1 mb-6">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
      </Link>
      <h2 className="text-2xl font-extrabold mb-6">New Agent</h2>
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-6 space-y-4">
        {([
          { key: 'name',          label: 'Agent Name',   placeholder: 'CustomerSupport_v1' },
          { key: 'model',         label: 'Model',        placeholder: 'minimax-m2.5'        },
        ] as const).map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-bold uppercase tracking-wider text-[#6f797a] block mb-1">{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
        ))}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#6f797a] block mb-1">System Prompt</label>
          <textarea rows={4} value={form.system_prompt} onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
            placeholder="You are a helpful assistant…"
            className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
        </div>
        {createErr && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {createErr}
          </div>
        )}
        <button onClick={createAgent} disabled={!form.name.trim() || creating}
          className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
          {creating ? 'Membuat agent…' : 'Create Agent'}
        </button>
      </div>
    </div>
  )

  if (loading || !agent) return <div className="p-8 text-center text-[#9ca3af]">Loading…</div>

  const STATS = [
    { icon: 'bolt',         label: 'Tokens',          value: '—',                  color: 'text-amber-600',   bg: 'bg-amber-50'     },
    { icon: 'psychology',   label: 'Model',           value: agent.model,          color: 'text-primary',     bg: 'bg-[#cef0f5]'    },
    { icon: 'chat',         label: 'Active Sessions', value: String(sessions.length), color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-2xl">smart_toy</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#191c1e]">{agent.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#9ca3af]">{agent.model}</span>
              <StatusBadge s={agent.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/agents/${id}/chat`}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-sm shadow-primary/20">
            <span className="material-symbols-outlined text-[16px]">chat</span> Chat
          </Link>
          <Link href={`/agents/${id}/control`}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e0e3e5] text-[#3f484a] text-sm font-semibold rounded-lg hover:bg-[#f2f4f6]">
            <span className="material-symbols-outlined text-[16px]">tune</span> Control
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e0e3e5] p-5 shadow-sm">
            <span className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
            </span>
            <div className="text-xl font-extrabold text-[#191c1e] truncate">{s.value}</div>
            <div className="text-[11px] font-bold text-[#6f797a] uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] shadow-sm">
        <div className="px-5 py-4 border-b border-[#e0e3e5] flex items-center justify-between">
          <h3 className="font-bold text-[#191c1e] text-sm">Recent Sessions</h3>
          <Link href={`/agents/${id}/chat`} className="text-xs text-primary font-semibold hover:underline">
            Lihat semua →
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="py-10 text-center text-[#9ca3af] text-sm">
            Belum ada sesi.
            <Link href={`/agents/${id}/chat`} className="ml-1.5 text-primary font-semibold hover:underline">Mulai chat →</Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f2f4f6]">
            {sessions.map(s => (
              <Link key={s.id} href={`/agents/${id}/chat/${s.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f7f9fb] transition-colors">
                <span className="material-symbols-outlined text-[18px] text-[#9ca3af]">forum</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#191c1e] text-sm truncate">{s.name}</div>
                  <div className="text-[11px] text-[#9ca3af] font-mono">{s.session_id}</div>
                </div>
                <span className="text-[11px] text-[#9ca3af]">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ s }: { s: string }) {
  const c = s === 'active' ? 'bg-[#cef0f5] text-primary' : s === 'thinking' ? 'bg-amber-50 text-amber-700' : s === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#f2f4f6] text-[#6f797a]'
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${c}`}>{s}</span>
}
