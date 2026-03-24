'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Agent   = { id: string; name: string; status: string }
type Session = { id: string; name: string; session_id: string }

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-500', idle: 'bg-[#bfc8ca]',
  thinking: 'bg-amber-400 animate-pulse', error: 'bg-red-400',
}

const CONTROL_ITEMS = [
  { href: (id: string) => `/agents/${id}/control/channels`,  icon: 'wifi',         label: 'Channels'     },
  { href: (id: string) => `/agents/${id}/control/models`,    icon: 'psychology',   label: 'AI Models'    },
  { href: (id: string) => `/agents/${id}/control/workspace`, icon: 'folder_open',  label: 'Workspace'    },
  { href: (id: string) => `/agents/${id}/control/cronjobs`,  icon: 'schedule',     label: 'Cronjobs'     },
  { href: (id: string) => `/agents/${id}/control/env`,       icon: 'key',          label: 'Environment'  },
]

function NavLink({ href, icon, label, depth = 0 }: { href: string; icon: string; label: string; depth?: number }) {
  const path = usePathname()
  const active = path === href || path.startsWith(href + '/')
  const pad = depth === 0 ? 'px-4 py-2.5' : depth === 1 ? 'px-3 py-2' : 'px-2.5 py-1.5'
  const text = depth === 0 ? 'text-sm' : 'text-xs'
  const iconSize = depth === 0 ? 'text-[18px]' : depth === 1 ? 'text-[15px]' : 'text-[13px]'
  return (
    <Link href={href}
      className={`flex items-center gap-2.5 ${pad} rounded-lg ${text} font-medium transition-all ${
        active ? 'bg-[#cef0f5] text-primary border-l-4 border-primary shadow-sm'
               : 'text-[#6f797a] hover:bg-[#f2f4f6] hover:text-primary'
      }`}>
      <span className={`material-symbols-outlined shrink-0 ${iconSize}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

function GroupHeader({ icon, label, open, onClick }: { icon: string; label: string; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#3f484a] hover:bg-[#f2f4f6] hover:text-primary transition-all">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span className="flex-1 text-left text-sm font-semibold">{label}</span>
      <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${open ? '' : '-rotate-90'}`}>expand_less</span>
    </button>
  )
}

export default function SideNavBar() {
  const path = usePathname()

  // Section open states
  const [sec, setSec]   = useState({ admin: true, overview: true, workspace: true })
  const [agents, setAgents]             = useState<Agent[]>([])
  const [openAgents, setOpenAgents]     = useState<Record<string, boolean>>({})
  const [openChat, setOpenChat]         = useState<Record<string, boolean>>({})
  const [openControl, setOpenControl]   = useState<Record<string, boolean>>({})
  const [sessions, setSessions]         = useState<Record<string, Session[]>>({})
  const [loadingSess, setLoadingSess]   = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase.from('agents').select('id, name, status')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const ag = data ?? []
        setAgents(ag)
        // Auto-expand agent + sub-section matching current path
        ag.forEach(a => {
          if (!path.startsWith(`/agents/${a.id}`)) return
          setOpenAgents(prev => ({ ...prev, [a.id]: true }))
          if (path.includes('/chat'))    setOpenChat(prev => ({ ...prev, [a.id]: true }))
          if (path.includes('/control')) setOpenControl(prev => ({ ...prev, [a.id]: true }))
        })
      })
  }, [])

  const loadSessions = useCallback(async (agentId: string) => {
    if (sessions[agentId]) return // already loaded
    setLoadingSess(prev => ({ ...prev, [agentId]: true }))
    const { data } = await supabase.from('sessions')
      .select('id, name, session_id')
      .order('created_at', { ascending: false })
      .limit(10)
    setSessions(prev => ({ ...prev, [agentId]: data ?? [] }))
    setLoadingSess(prev => ({ ...prev, [agentId]: false }))
  }, [sessions])

  const toggleAgent = (id: string) =>
    setOpenAgents(prev => ({ ...prev, [id]: !prev[id] }))

  const toggleChat = (id: string) => {
    const next = !openChat[id]
    setOpenChat(prev => ({ ...prev, [id]: next }))
    if (next) loadSessions(id)
  }

  const toggleControl = (id: string) =>
    setOpenControl(prev => ({ ...prev, [id]: !prev[id] }))

  const tog = (key: keyof typeof sec) =>
    setSec(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-white border-r border-[#e0e3e5] py-6 px-4 shrink-0 z-50">
      {/* Brand */}
      <div className="mb-6 px-2">
        <h1 className="text-xl font-extrabold text-primary tracking-tight">OpenClaw AI</h1>
        <p className="text-[10px] font-semibold text-[#6f797a] uppercase tracking-widest mt-0.5">Enterprise Hub</p>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scroll space-y-0.5">

        {/* ── Admin ── */}
        <GroupHeader icon="admin_panel_settings" label="Admin" open={sec.admin} onClick={() => tog('admin')} />
        {sec.admin && (
          <div className="pl-2 mb-1">
            <NavLink href="/master" icon="monitoring" label="Master Dashboard" />
          </div>
        )}

        <div className="my-1 mx-3 border-t border-[#e0e3e5]" />

        {/* ── Overview ── */}
        <GroupHeader icon="monitor_heart" label="Overview" open={sec.overview} onClick={() => tog('overview')} />
        {sec.overview && (
          <div className="pl-2 mb-1">
            <NavLink href="/dashboard" icon="dashboard" label="Dashboard" />
          </div>
        )}

        {/* ── Workspace (agents) ── */}
        <GroupHeader icon="grid_view" label="Workspace" open={sec.workspace} onClick={() => tog('workspace')} />
        {sec.workspace && (
          <div className="pl-2 mb-1 space-y-0.5">
            {agents.length === 0 && (
              <Link href="/agents/new"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-[#9ca3af] hover:text-primary hover:bg-[#f2f4f6] transition-all">
                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                Tambah Agent
              </Link>
            )}

            {agents.map(agent => (
              <div key={agent.id}>

                {/* Level 1: Agent */}
                <button onClick={() => toggleAgent(agent.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#3f484a] hover:bg-[#f2f4f6] hover:text-primary transition-all">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[agent.status] ?? 'bg-[#bfc8ca]'}`} />
                  <span className="flex-1 text-left text-xs font-semibold truncate">{agent.name}</span>
                  <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${openAgents[agent.id] ? '' : '-rotate-90'}`}>expand_less</span>
                </button>

                {openAgents[agent.id] && (
                  <div className="pl-3 space-y-0.5">

                    {/* Level 2: Overview link */}
                    <NavLink href={`/agents/${agent.id}`} icon="smart_toy" label="Overview" depth={1} />

                    {/* Level 2: Chat (collapsible) */}
                    <button onClick={() => toggleChat(agent.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        path.startsWith(`/agents/${agent.id}/chat`)
                          ? 'text-primary' : 'text-[#6f797a] hover:bg-[#f2f4f6] hover:text-primary'
                      }`}>
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span className="flex-1 text-left">Chat</span>
                      <span className={`material-symbols-outlined text-[13px] transition-transform duration-200 ${openChat[agent.id] ? '' : '-rotate-90'}`}>expand_less</span>
                    </button>

                    {openChat[agent.id] && (
                      <div className="pl-4 space-y-0.5">
                        {loadingSess[agent.id] && (
                          <span className="block px-2.5 py-1.5 text-[10px] text-[#9ca3af]">Loading…</span>
                        )}
                        {(sessions[agent.id] ?? []).map(s => (
                          <NavLink key={s.id}
                            href={`/agents/${agent.id}/chat/${s.id}`}
                            icon="forum" label={s.name || s.session_id}
                            depth={2}
                          />
                        ))}
                        {(sessions[agent.id] ?? []).length === 0 && !loadingSess[agent.id] && (
                          <span className="block px-2.5 py-1.5 text-[10px] text-[#9ca3af]">Belum ada sesi</span>
                        )}
                        {(sessions[agent.id] ?? []).length >= 10 && (
                          <NavLink href={`/agents/${agent.id}/chat`} icon="more_horiz" label="Lihat semua" depth={2} />
                        )}
                      </div>
                    )}

                    {/* Level 2: Control (collapsible) */}
                    <button onClick={() => toggleControl(agent.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        path.startsWith(`/agents/${agent.id}/control`)
                          ? 'text-primary' : 'text-[#6f797a] hover:bg-[#f2f4f6] hover:text-primary'
                      }`}>
                      <span className="material-symbols-outlined text-[15px]">tune</span>
                      <span className="flex-1 text-left">Control</span>
                      <span className={`material-symbols-outlined text-[13px] transition-transform duration-200 ${openControl[agent.id] ? '' : '-rotate-90'}`}>expand_less</span>
                    </button>

                    {openControl[agent.id] && (
                      <div className="pl-4 space-y-0.5">
                        {CONTROL_ITEMS.map(item => (
                          <NavLink key={item.label}
                            href={item.href(agent.id)}
                            icon={item.icon} label={item.label}
                            depth={2}
                          />
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="my-1 mx-3 border-t border-[#e0e3e5]" />

        {/* ── Plan & Support ── */}
        <NavLink href="/plan"    icon="event_note"      label="Plan"    />
        <NavLink href="/support" icon="help_center"     label="Support" />

      </nav>

      {/* Bottom */}
      <div className="pt-4 mt-4 border-t border-[#e0e3e5]">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#6f797a] hover:text-red-500 transition-colors rounded-lg hover:bg-[#f2f4f6]">
          <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
