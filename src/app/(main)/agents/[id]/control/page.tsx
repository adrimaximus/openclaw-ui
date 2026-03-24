'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const CARDS = [
  { key: 'channels',  icon: 'wifi',        label: 'Channels & Integrations', desc: 'WhatsApp, Google Calendar, Drive, Gmail', color: 'text-emerald-600', bg: 'bg-emerald-50'  },
  { key: 'models',    icon: 'psychology',  label: 'AI Models',               desc: 'Model dan system prompt agent',           color: 'text-primary',    bg: 'bg-[#cef0f5]'   },
  { key: 'workspace', icon: 'folder_open', label: 'Workspace',               desc: 'Identity, Soul, Skills, Agents, Heartbeat', color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'cronjobs',  icon: 'schedule',    label: 'Cronjobs',                desc: 'Jadwal tugas otomatis',                   color: 'text-amber-600',  bg: 'bg-amber-50'    },
  { key: 'env',       icon: 'key',         label: 'Environment',             desc: 'Variabel lingkungan agent',               color: 'text-[#6f797a]',  bg: 'bg-[#f2f4f6]'  },
]

type Agent = { id: string; name: string; status: string }

export default function ControlPage() {
  const { id } = useParams<{ id: string }>()
  const [agent, setAgent] = useState<Agent | null>(null)

  useEffect(() => {
    supabase.from('agents').select('id, name, status').eq('id', id).single()
      .then(({ data }) => setAgent(data))
  }, [id])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/agents/${id}`} className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
          <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1e]">Control</h2>
          {agent && <p className="text-xs text-[#6f797a] mt-0.5">{agent.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map(c => (
          <Link key={c.key} href={`/agents/${id}/control/${c.key}`}
            className="bg-white rounded-xl border border-[#e0e3e5] p-5 hover:border-primary/30 hover:shadow-md transition-all group">
            <div className="flex items-start gap-4">
              <span className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <span className={`material-symbols-outlined text-[22px] ${c.color}`}>{c.icon}</span>
              </span>
              <div className="min-w-0">
                <div className="font-bold text-[#191c1e] text-sm">{c.label}</div>
                <div className="text-[11px] text-[#9ca3af] mt-0.5 leading-snug">{c.desc}</div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#9ca3af] group-hover:text-primary ml-auto shrink-0 transition-colors">
                chevron_right
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
