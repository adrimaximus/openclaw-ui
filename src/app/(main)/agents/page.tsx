'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Agent = { id: string; name: string; model: string; status: string; created_at: string; flowise_chatflow_id: string }

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    supabase.from('agents').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setAgents(data ?? []))
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold">Agents</h2>
        <Link href="/agents/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-sm">
          <span className="material-symbols-outlined text-[18px]">add</span> New Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map(a => (
          <Link key={a.id} href={`/agents/${a.id}`}
            className="bg-white rounded-xl p-5 border border-[#e0e3e5] hover:border-primary/30 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#cef0f5] rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div>
                <div className="font-bold text-[#191c1e]">{a.name}</div>
                <div className="text-xs text-[#6f797a]">{a.model}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge s={a.status} />
              <span className="text-xs text-[#6f797a]">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}

        {/* New Agent card */}
        <Link href="/agents/new"
          className="bg-white rounded-xl p-5 border-2 border-dashed border-[#e0e3e5] hover:border-primary/40 flex flex-col items-center justify-center gap-2 text-[#6f797a] hover:text-primary transition-all min-h-[140px]">
          <span className="material-symbols-outlined text-3xl">add_circle</span>
          <span className="text-sm font-semibold">Add Agent</span>
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ s }: { s: string }) {
  const c = s === 'active' ? 'bg-[#cef0f5] text-primary' : s === 'thinking' ? 'bg-amber-50 text-amber-700' : s === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#f2f4f6] text-[#6f797a]'
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${c}`}>{s}</span>
}
