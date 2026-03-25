'use client'
import { useEffect, useState, useRef } from 'react'
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
  const [form, setForm] = useState({
    name:                '',
    model:               'minimax-m2.5',
    model_name:          'MiniMax-M2.5',
    custom_model_name:   '',
    system_prompt:       '',
    credential:          '',
    temperature:         0.9,
    streaming:           true,
    max_tokens:          '',
    base_path:           'https://api.minimax.io/v1',
    allow_image_uploads: false,
    vision_model_name:   '',
  })

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
  
  // Credential modal state
  const [showCredentialModal, setShowCredentialModal] = useState(false)
  const [newCredentialName, setNewCredentialName] = useState('')
  const [newCredentialApiKey, setNewCredentialApiKey] = useState('')

  async function createAgent() {
    if (!form.name.trim() || creating) return
    setCreating(true)
    setCreateErr('')
    try {
      // Simpan langsung ke Supabase (tidak perlu bridge)
      const { data, error } = await supabase.from('agents').insert({
        name:                form.name.trim(),
        model:               form.model || 'minimax-m2.5',
        model_name:          form.model_name,
        custom_model_name:   form.custom_model_name,
        system_prompt:       form.system_prompt,
        credential:          form.credential,
        temperature:         form.temperature,
        streaming:           form.streaming,
        max_tokens:          form.max_tokens ? parseInt(form.max_tokens) : null,
        base_path:           form.base_path,
        allow_image_uploads: form.allow_image_uploads,
        vision_model_name:   form.vision_model_name,
        status:              'idle',
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

  // Preview chat state
  const [previewMsgs, setPreviewMsgs] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Halo! Ada yang bisa saya bantu?' }
  ])
  const [previewInput, setPreviewInput] = useState('')
  const previewBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    previewBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [previewMsgs])

  function sendPreview() {
    if (!previewInput.trim()) return
    const userMsg = previewInput.trim()
    setPreviewInput('')
    setPreviewMsgs(prev => [...prev, { role: 'user', text: userMsg }])
    // Simulate response based on system prompt
    setTimeout(() => {
      const persona = form.name || 'Agent'
      const reply = form.system_prompt
        ? `[${persona}] Saya siap membantu sesuai instruksi yang diberikan.`
        : `Halo! Saya ${persona}. Ada yang bisa saya bantu?`
      setPreviewMsgs(prev => [...prev, { role: 'assistant', text: reply }])
    }, 600)
  }

  const MODELS_LIST = [
    { value: 'minimax-m2.5',  label: 'MiniMax M2.5',     basePath: 'https://api.minimax.io/v1',       names: ['MiniMax-M2.5', 'MiniMax-M2', 'abab7-chat', 'abab6.5s-chat'] },
    { value: 'gpt-4o',        label: 'GPT-4o',           basePath: 'https://api.openai.com/v1',       names: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']  },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku',  basePath: 'https://api.anthropic.com',       names: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku']     },
    { value: 'qwen2.5-72b',   label: 'Qwen 2.5 72B',     basePath: 'https://dashscope.aliyuncs.com/compatible-mode/v1', names: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen2.5-72b'] },
    { value: 'glm',           label: 'GLM (ZhipuAI)',    basePath: 'https://open.bigmodel.cn/api/paas/v4', names: ['glm-4', 'glm-4v', 'glm-4-plus', 'glm-3-turbo'] },
    { value: 'flowise',       label: 'Flowise Chatflow', basePath: '',                                names: []                                                         },
    { value: 'custom',        label: 'Custom Model',     basePath: '',                                names: []                                                         },
  ]

  const CREDENTIALS = ['GLM 5', 'GLM 4v', 'MiniMax-VL-01', 'M2.7', '+ Create New']

  // Credential to model mapping
  const CREDENTIAL_MODEL_MAP: Record<string, { model: string; model_name: string; base_path: string }> = {
    'GLM 5': { model: 'glm', model_name: 'glm-4', base_path: 'https://open.bigmodel.cn/api/paas/v4' },
    'GLM 4v': { model: 'glm', model_name: 'glm-4v', base_path: 'https://open.bigmodel.cn/api/paas/v4' },
    'MiniMax-VL-01': { model: 'minimax-m2.5', model_name: 'MiniMax-VL-01', base_path: 'https://api.minimax.io/v1' },
    'M2.7': { model: 'minimax-m2.5', model_name: 'MiniMax-M2.7', base_path: 'https://api.minimax.io/v1' },
  }

  const selectedModelDef = MODELS_LIST.find(m => m.value === form.model)

  // ── New agent page
  if (id === 'new') return (
    <div className="flex h-full">

      {/* ── Left: Config ── */}
      <div className="w-[420px] shrink-0 border-r border-[#e0e3e5] bg-white flex flex-col h-full overflow-y-auto custom-scroll">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e0e3e5] flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 hover:bg-[#f2f4f6] rounded-lg shrink-0">
            <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
          </Link>
          <span className="material-symbols-outlined text-[20px] text-primary">smart_toy</span>
          <span className="font-bold text-[#191c1e]">{form.name || 'New Agent'}</span>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 flex-1">

          {/* Agent Name */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Agent Name <span className="text-red-400">*</span></label>
            <input value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Clara, SupportBot, dsb"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Select Model */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Select Model <span className="text-red-400">*</span></label>
            <select value={form.model}
              onChange={e => {
                const m = MODELS_LIST.find(x => x.value === e.target.value)
                setForm(f => ({
                  ...f,
                  model: e.target.value,
                  model_name: m?.names[0] ?? '',
                  base_path: m?.basePath ?? '',
                }))
              }}
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white">
              {MODELS_LIST.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Instructions <span className="text-red-400">*</span></label>
            <textarea rows={6} value={form.system_prompt}
              onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
              placeholder="You are a helpful assistant. Be concise and professional.…"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono" />
            <p className="text-[11px] text-[#9ca3af] mt-1">{form.system_prompt.length} karakter</p>
          </div>

          {/* Connect Credential */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Connect Credential <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <select value={form.credential}
                onChange={e => {
                  const cred = e.target.value
                  if (cred === '+ Create New') {
                    setShowCredentialModal(true)
                    return
                  }
                  const mapping = CREDENTIAL_MODEL_MAP[cred]
                  setForm(f => ({
                    ...f,
                    credential: cred,
                    ...(mapping && { model: mapping.model, model_name: mapping.model_name, base_path: mapping.base_path })
                  }))
                }}
                className="flex-1 border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                <option value="">Pilih credential…</option>
                {CREDENTIALS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="p-2.5 border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6] transition-colors shrink-0">
                <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
              </button>
            </div>
          </div>

          {/* Model Name */}
          {selectedModelDef && selectedModelDef.names.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Model Name <span className="text-red-400">*</span></label>
              <select value={form.model_name}
                onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))}
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                {selectedModelDef.names.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="custom">Custom Model</option>
              </select>
            </div>
          )}

          {/* Custom Model Name */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">
              Custom Model Name
              <span className="ml-1 font-normal text-[#9ca3af]">(opsional)</span>
            </label>
            <input value={form.custom_model_name}
              onChange={e => setForm(f => ({ ...f, custom_model_name: e.target.value }))}
              placeholder="Enter model name"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Temperature</label>
            <input type="number" min={0} max={2} step={0.1}
              value={form.temperature}
              onChange={e => setForm(f => ({ ...f, temperature: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Streaming */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#6f797a]">Streaming</label>
            <button onClick={() => setForm(f => ({ ...f, streaming: !f.streaming }))}
              className={`relative rounded-full transition-colors shrink-0`}
              style={{ width: 40, height: 22, background: form.streaming ? '#00899c' : '#e0e3e5' }}>
              <span className="absolute rounded-full bg-white shadow transition-all"
                style={{ width: 18, height: 18, top: 2, left: form.streaming ? 20 : 2 }} />
            </button>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Max Tokens</label>
            <input type="number" min={0}
              value={form.max_tokens}
              onChange={e => setForm(f => ({ ...f, max_tokens: e.target.value }))}
              placeholder="Leave empty for default"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Base Path */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Base Path</label>
            <input value={form.base_path}
              onChange={e => setForm(f => ({ ...f, base_path: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Allow Image Uploads */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#6f797a]">Allow Image Uploads</label>
            <button onClick={() => setForm(f => ({ ...f, allow_image_uploads: !f.allow_image_uploads }))}
              className="relative rounded-full transition-colors shrink-0"
              style={{ width: 40, height: 22, background: form.allow_image_uploads ? '#00899c' : '#e0e3e5' }}>
              <span className="absolute rounded-full bg-white shadow transition-all"
                style={{ width: 18, height: 18, top: 2, left: form.allow_image_uploads ? 20 : 2 }} />
            </button>
          </div>

          {/* Vision Model Name */}
          {form.allow_image_uploads && (
            <div>
              <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Vision Model Name</label>
              <input value={form.vision_model_name}
                onChange={e => setForm(f => ({ ...f, vision_model_name: e.target.value }))}
                placeholder="MiniMax-VL-01"
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          )}

          {/* Tools */}
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-2">Tools</label>
            <button className="w-full py-2.5 border border-[#e0e3e5] rounded-lg text-sm text-[#6f797a] hover:bg-[#f2f4f6] hover:text-primary transition-all">
              + Add Tool
            </button>
          </div>

          {createErr && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {createErr}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e0e3e5]">
          <button onClick={createAgent} disabled={!form.name.trim() || creating}
            className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            {creating ? 'Membuat agent…' : 'Create Agent'}
          </button>
        </div>
      </div>

      {/* ── Right: Preview ── */}
      <div className="flex-1 flex flex-col bg-[#f7f9fb]">
        {/* Preview header */}
        <div className="px-6 py-4 border-b border-[#e0e3e5] bg-white flex items-center justify-between">
          <span className="font-bold text-[#191c1e] text-sm">Preview</span>
          <button onClick={() => setPreviewMsgs([{ role: 'assistant', text: 'Halo! Ada yang bisa saya bantu?' }])}
            className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px] text-[#6f797a]">refresh</span>
          </button>
        </div>

        {/* Config summary */}
        {(form.name || form.model) && (
          <div className="mx-6 mt-4 px-4 py-3 bg-white border border-[#e0e3e5] rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#cef0f5] text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[#191c1e] text-sm truncate">{form.name || 'New Agent'}</div>
              <div className="text-[11px] text-[#9ca3af]">{MODELS_LIST.find(m => m.value === form.model)?.label || form.model}</div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto custom-scroll px-6 py-4 space-y-4">
          {previewMsgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#cef0f5] text-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                </div>
              )}
              <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white border border-[#e0e3e5] text-[#191c1e] rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={previewBottomRef} />
        </div>

        {/* Preview input */}
        <div className="px-6 py-4 border-t border-[#e0e3e5] bg-white">
          <div className="flex gap-3">
            <input value={previewInput}
              onChange={e => setPreviewInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendPreview()}
              placeholder="Ketik pesan untuk test…"
              className="flex-1 border border-[#e0e3e5] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={sendPreview} disabled={!previewInput.trim()}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
          <p className="text-[10px] text-[#9ca3af] mt-2 text-center">Preview simulasi · Koneksi live butuh bridge server</p>
        </div>
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
