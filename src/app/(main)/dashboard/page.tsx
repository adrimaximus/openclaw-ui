'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Agent   = { id: string; name: string; model: string; status: string; created_at: string }
type Session = { id: string; name: string; session_id: string; created_at: string }

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  active:   { bg: 'bg-[#cef0f5]', text: 'text-primary',    dot: 'bg-emerald-500' },
  idle:     { bg: 'bg-[#f2f4f6]', text: 'text-[#6f797a]',  dot: 'bg-[#bfc8ca]'  },
  thinking: { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  error:    { bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-400'    },
}

export default function DashboardPage() {
  const [agents,   setAgents]   = useState<Agent[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('agents').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(5),
    ]).then(([{ data: ag }, { data: se }]) => {
      setAgents(ag ?? [])
      setSessions(se ?? [])
      setLoading(false)
    })
  }, [])

  const activeCount = agents.filter(a => a.status === 'active').length

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#191c1e] tracking-tight">Dashboard</h2>
        <p className="text-sm text-[#6f797a] mt-1">Ringkasan aktivitas agent kamu</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <StatCard icon="smart_toy" label="Agent Aktif" value={String(activeCount)}
          sub={`${agents.length} total`} color="text-primary" bg="bg-[#cef0f5]" />
        <StatCard icon="chat" label="Sesi Chat" value={String(sessions.length)}
          sub="recent" color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon="bolt" label="Tokens" value="—"
          sub="coming soon" color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Agent Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#191c1e]">Agents Kamu</h3>
          <Link href="/agents/new"
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
            <span className="material-symbols-outlined text-[14px]">add</span> Baru
          </Link>
        </div>
        {loading ? (
          <div className="py-8 text-center text-[#9ca3af] text-sm">Loading…</div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#e0e3e5] py-10 text-center text-[#9ca3af] text-sm">
            <span className="material-symbols-outlined text-3xl block mb-2">smart_toy</span>
            Belum ada agent.
            <Link href="/agents/new" className="ml-1.5 text-primary font-semibold hover:underline">Buat sekarang →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(a => {
              const sc = STATUS_COLOR[a.status] ?? STATUS_COLOR.idle
              return (
                <Link key={a.id} href={`/agents/${a.id}`}
                  className="bg-white rounded-xl border border-[#e0e3e5] p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#cef0f5] text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {a.status}
                    </span>
                  </div>
                  <div className="font-bold text-[#191c1e] text-sm truncate">{a.name}</div>
                  <div className="text-[11px] text-[#9ca3af] mt-0.5">{a.model}</div>
                  <div className="mt-3 pt-3 border-t border-[#f2f4f6] flex items-center justify-between">
                    <span className="text-[11px] text-[#9ca3af]">
                      {new Date(a.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <span className="text-[11px] text-primary font-semibold">Buka →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] shadow-sm">
        <div className="px-5 py-4 border-b border-[#e0e3e5] flex items-center justify-between">
          <h3 className="font-bold text-[#191c1e] text-sm">Sesi Terakhir</h3>
          <Link href="/sessions" className="text-xs text-primary font-semibold hover:underline">Lihat semua →</Link>
        </div>
        {loading ? (
          <div className="py-8 text-center text-[#9ca3af] text-sm">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-[#9ca3af] text-sm">Belum ada sesi chat.</div>
        ) : (
          <div className="divide-y divide-[#f2f4f6]">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="material-symbols-outlined text-[18px] text-[#9ca3af]">chat</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#191c1e] text-sm truncate">{s.name}</div>
                  <div className="text-[11px] text-[#9ca3af] font-mono">{s.session_id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, bg }: {
  icon: string; label: string; value: string; sub: string; color: string; bg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] p-5 shadow-sm">
      <span className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
      </span>
      <div className="text-2xl font-extrabold text-[#191c1e]">{value}</div>
      <div className="text-[11px] font-bold text-[#6f797a] uppercase tracking-wide mt-0.5">{label}</div>
      <div className="text-[11px] text-[#9ca3af]">{sub}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-[#cef0f5] text-primary', idle: 'bg-[#f2f4f6] text-[#6f797a]',
    thinking: 'bg-amber-50 text-amber-700', error: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${map[status] ?? 'bg-[#f2f4f6] text-[#6f797a]'}`}>
      {status}
    </span>
  )
}
