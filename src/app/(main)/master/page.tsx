'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type WaStatus  = 'connected' | 'connecting' | 'disconnected'
type ClientRow = {
  id: string; name: string; model: string; status: string; created_at: string
  username: string; phone: string
  wa_status: WaStatus
  location_flag: string; location_city: string
  last_active: Date
  tokens_used: number; tokens_limit: number
}

const ENRICH = [
  { username: 'dewi_saraswati', phone: '+62812-xxxx',  wa_status: 'connected'    as WaStatus, location_flag: '🇮🇩', location_city: 'Jakarta',      tokens_used: 12483, tokens_limit: 50000, minsAgo: 2   },
  { username: 'budi_santoso',   phone: '+62813-xxxx',  wa_status: 'connected'    as WaStatus, location_flag: '🇮🇩', location_city: 'Surabaya',     tokens_used:  8241, tokens_limit: 50000, minsAgo: 18  },
  { username: 'siti_nurhaliza', phone: '+6012-xxxxxx', wa_status: 'connecting'   as WaStatus, location_flag: '🇲🇾', location_city: 'Kuala Lumpur', tokens_used:  3102, tokens_limit: 50000, minsAgo: 65  },
  { username: 'ahmad_zulkifli', phone: '+65-xxxxxxxx', wa_status: 'disconnected' as WaStatus, location_flag: '🇸🇬', location_city: 'Singapore',    tokens_used:   421, tokens_limit: 50000, minsAgo: 480 },
  { username: 'layla_rahman',   phone: '+6011-xxxxxx', wa_status: 'connected'    as WaStatus, location_flag: '🇲🇾', location_city: 'Penang',       tokens_used:  5901, tokens_limit: 50000, minsAgo: 5   },
  { username: 'rizky_pradana',  phone: '+62821-xxxx',  wa_status: 'connected'    as WaStatus, location_flag: '🇮🇩', location_city: 'Bandung',      tokens_used:  9412, tokens_limit: 50000, minsAgo: 1   },
]

function enrich(agents: Record<string, unknown>[]): ClientRow[] {
  return agents.map((a, i) => {
    const e = ENRICH[i % ENRICH.length]
    return { ...a, ...e, last_active: new Date(Date.now() - e.minsAgo * 60_000) } as ClientRow
  })
}

function relTime(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
function lastActiveColor(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (m < 15)  return 'text-emerald-600'
  if (m < 120) return 'text-amber-600'
  return 'text-[#9ca3af]'
}

const WA_DOT: Record<WaStatus, string> = {
  connected: 'bg-emerald-500', connecting: 'bg-amber-400 animate-pulse', disconnected: 'bg-[#9ca3af]',
}
const WA_TXT: Record<WaStatus, string> = {
  connected: 'text-emerald-600', connecting: 'text-amber-600', disconnected: 'text-[#9ca3af]',
}

const TEMPLATES = ['Customer Support', 'Sales Bot', 'Info Assistant', 'FAQ Bot', 'Custom']
const MODELS    = ['MiniMax M2.5', 'GPT-4o', 'GPT-4o mini', 'Qwen2.5-72B', 'Claude 3 Haiku']
const BRIDGE    = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'

type ConfigForm = { name: string; model: string; system_prompt: string }

export default function MasterPage() {
  const [clients,   setClients]   = useState<ClientRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [form, setForm] = useState({
    client_name: '', phone: '', template: 'Customer Support',
    model: 'MiniMax M2.5', system_prompt: '',
  })
  // Config drawer
  const [configAgent, setConfigAgent] = useState<ClientRow | null>(null)
  const [configForm,  setConfigForm]  = useState<ConfigForm>({ name: '', model: '', system_prompt: '' })
  const [configSaving, setConfigSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false })
    setClients(enrich(data ?? []))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  const totalTokens  = clients.reduce((s, c) => s + c.tokens_used, 0)
  const waConnected  = clients.filter(c => c.wa_status === 'connected').length
  const waReconnect  = clients.filter(c => c.wa_status === 'connecting').length
  const onlineNow    = clients.filter(c => (Date.now() - c.last_active.getTime()) < 10 * 60_000).length
  const activeAgents = clients.filter(c => c.status === 'active').length

  function openConfig(c: ClientRow) {
    setConfigAgent(c)
    setConfigForm({ name: c.name, model: c.model, system_prompt: '' })
  }

  async function saveConfig() {
    if (!configAgent || configSaving) return
    setConfigSaving(true)
    await Promise.all([
      supabase.from('agents').update({
        name: configForm.name, model: configForm.model,
        ...(configForm.system_prompt ? { system_prompt: configForm.system_prompt } : {}),
      }).eq('id', configAgent.id),
      fetch(`${BRIDGE}/api/agents/${configAgent.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm),
      }),
    ])
    setConfigAgent(null)
    setConfigSaving(false)
    await load()
  }

  async function deployAgent() {
    if (!form.client_name.trim() || deploying) return
    setDeploying(true)
    const prompt = form.system_prompt.trim() ||
      `You are a ${form.template} AI assistant for ${form.client_name}. Be helpful, concise and professional.`
    const res = await fetch(`${BRIDGE}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${form.client_name} — ${form.template}`,
        model: form.model.toLowerCase().replace(/\s+/g, '-'),
        system_prompt: prompt,
      }),
    })
    if (res.ok) {
      setShowSetup(false)
      setForm({ client_name: '', phone: '', template: 'Customer Support', model: 'MiniMax M2.5', system_prompt: '' })
      await load()
    }
    setDeploying(false)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full uppercase tracking-wide">Admin</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#191c1e] tracking-tight">Master Dashboard</h2>
          <p className="text-sm text-[#6f797a] mt-1">Monitor semua client agent secara real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className="p-2.5 bg-white border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6] transition-all">
            <span className="material-symbols-outlined text-[18px] text-[#6f797a]">refresh</span>
          </button>
          <button onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 shadow-md shadow-primary/20 text-sm">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Setup Agent for Client
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiCard label="Active Agents"     value={String(activeAgents)} icon="smart_toy"
          bg="bg-[#cef0f5]" color="text-primary"
          sub={`${clients.length} total deployed`} live />
        <KpiCard label="Tokens Used Today" value={totalTokens.toLocaleString()} icon="bolt"
          bg="bg-amber-50" color="text-amber-600"
          sub="across all agents" />
        <KpiCard label="WA Connected" value={`${waConnected} / ${clients.length}`} icon="chat"
          bg="bg-emerald-50" color="text-emerald-600"
          sub={waReconnect > 0 ? `${waReconnect} reconnecting` : 'all stable'} />
        <KpiCard label="Online Now" value={String(onlineNow)} icon="sensors"
          bg="bg-purple-50" color="text-purple-600"
          sub="active in last 10 min" live />
      </div>

      {/* Monitor Table */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e0e3e5] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#191c1e]">Client Agent Monitor</h3>
            <p className="text-xs text-[#6f797a] mt-0.5">Live status · auto-refresh 30s</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#e0e3e5] bg-[#f7f9fb] text-[#6f797a] text-xs font-semibold uppercase tracking-wide">
                {['Client', 'Agent', 'WhatsApp', 'Location', 'Last Active', 'Tokens', 'Config', 'Link']
                  .map(h => <th key={h} className="px-5 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {loading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[#9ca3af] text-sm">
                  <span className="material-symbols-outlined text-3xl block mb-2 animate-spin">progress_activity</span>
                  Loading…
                </td></tr>
              )}
              {!loading && clients.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[#9ca3af] text-sm">
                  Belum ada agent.
                  <button onClick={() => setShowSetup(true)} className="ml-2 text-primary font-semibold hover:underline">
                    Setup client pertama →
                  </button>
                </td></tr>
              )}
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-[#f7f9fb] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#cef0f5] text-primary font-extrabold text-sm flex items-center justify-center shrink-0">
                        {c.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[#191c1e] text-xs">{c.username}</div>
                        <div className="text-[10px] text-[#9ca3af]">{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-medium text-[#191c1e] max-w-[130px] truncate">{c.name}</div>
                    <AgentBadge status={c.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${WA_TXT[c.wa_status]}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${WA_DOT[c.wa_status]}`} />
                      {c.wa_status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-base mr-1.5">{c.location_flag}</span>
                    <span className="text-xs text-[#3f484a] font-medium">{c.location_city}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold ${lastActiveColor(c.last_active)}`}>
                      {relTime(c.last_active)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-[#3f484a] mb-1.5">
                      {c.tokens_used.toLocaleString()}
                      <span className="text-[#9ca3af] font-normal"> / {(c.tokens_limit / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="w-20 h-1.5 bg-[#e0e3e5] rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((c.tokens_used / c.tokens_limit) * 100, 100)}%` }} />
                    </div>
                  </td>
                  {/* Config button */}
                  <td className="px-5 py-4">
                    <button onClick={() => openConfig(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-[#cef0f5] transition-all">
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      Config
                    </button>
                  </td>
                  {/* Link to agent page */}
                  <td className="px-5 py-4">
                    <Link href={`/agents/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs text-[#9ca3af] hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Drawer */}
      {configAgent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setConfigAgent(null)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-[#e0e3e5] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-[#191c1e]">Config Agent</h3>
                <p className="text-xs text-[#9ca3af] mt-0.5 font-mono truncate max-w-[240px]">{configAgent.id}</p>
              </div>
              <button onClick={() => setConfigAgent(null)}
                className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
                <span className="material-symbols-outlined text-[20px] text-[#6f797a]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Nama Agent</label>
                <input value={configForm.name}
                  onChange={e => setConfigForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Model</label>
                <select value={configForm.model}
                  onChange={e => setConfigForm(f => ({ ...f, model: e.target.value }))}
                  className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                  {MODELS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">
                  System Prompt
                  <span className="ml-1 font-normal text-[#9ca3af]">(kosong = tidak diubah)</span>
                </label>
                <textarea rows={6} value={configForm.system_prompt}
                  onChange={e => setConfigForm(f => ({ ...f, system_prompt: e.target.value }))}
                  placeholder="You are a helpful assistant…"
                  className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#e0e3e5] flex justify-end gap-3">
              <button onClick={() => setConfigAgent(null)}
                className="px-5 py-2.5 text-sm font-semibold text-[#6f797a] border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6]">
                Batal
              </button>
              <button onClick={saveConfig} disabled={configSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-40">
                <span className="material-symbols-outlined text-[16px]">save</span>
                {configSaving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Agent Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[#e0e3e5] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-[#191c1e]">Setup Agent for Client</h3>
                <p className="text-xs text-[#6f797a] mt-0.5">Deploy AI agent baru untuk client</p>
              </div>
              <button onClick={() => setShowSetup(false)}
                className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[20px] text-[#6f797a]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Client Name" placeholder="e.g. Dewi Saraswati"
                  value={form.client_name} onChange={v => setForm(f => ({ ...f, client_name: v }))} />
                <FormField label="Phone Number" placeholder="+62812xxxxxxx"
                  value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Agent Template</label>
                  <select value={form.template}
                    onChange={e => setForm(f => ({ ...f, template: e.target.value }))}
                    className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                    {TEMPLATES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Model</label>
                  <select value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                    {MODELS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">
                  System Prompt
                  <span className="ml-1 font-normal text-[#9ca3af]">(auto-generated if blank)</span>
                </label>
                <textarea rows={3} value={form.system_prompt}
                  onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
                  placeholder={`You are a ${form.template} assistant for ${form.client_name || 'this client'}…`}
                  className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#e0e3e5] flex justify-end gap-3">
              <button onClick={() => setShowSetup(false)}
                className="px-5 py-2.5 text-sm font-semibold text-[#6f797a] border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6] transition-all">
                Cancel
              </button>
              <button onClick={deployAgent} disabled={!form.client_name.trim() || deploying}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-40 shadow-md shadow-primary/20 transition-all">
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                {deploying ? 'Deploying…' : 'Deploy Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, icon, bg, color, sub, live }: {
  label: string; value: string; icon: string
  bg: string; color: string; sub: string; live?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
        </span>
        {live && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1.5" />}
      </div>
      <div className="text-3xl font-extrabold text-[#191c1e] tracking-tight">{value}</div>
      <div className="text-[11px] font-bold text-[#6f797a] uppercase tracking-wide mt-1">{label}</div>
      <div className="text-[11px] text-[#9ca3af] mt-0.5">{sub}</div>
    </div>
  )
}

function AgentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-[#cef0f5] text-primary', idle: 'bg-[#f2f4f6] text-[#6f797a]',
    thinking: 'bg-amber-50 text-amber-700', error: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[status] ?? 'bg-[#f2f4f6] text-[#6f797a]'}`}>
      {status}
    </span>
  )
}

function FormField({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
    </div>
  )
}
