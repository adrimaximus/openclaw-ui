'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const BRIDGE = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'
const MODELS  = ['MiniMax M2.5', 'GPT-4o', 'GPT-4o mini', 'Qwen2.5-72B', 'Claude 3 Haiku', 'flowise']

type Agent = { id: string; name: string; model: string; system_prompt: string; status: string }

export default function ControlModelsPage() {
  const { id }  = useParams<{ id: string }>()
  const [agent,  setAgent]  = useState<Agent | null>(null)
  const [form,   setForm]   = useState({ model: '', system_prompt: '' })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    supabase.from('agents').select('*').eq('id', id).single()
      .then(({ data }) => {
        setAgent(data)
        if (data) setForm({ model: data.model, system_prompt: data.system_prompt ?? '' })
      })
  }, [id])

  const isDirty = agent && (form.model !== agent.model || form.system_prompt !== (agent.system_prompt ?? ''))

  async function save() {
    if (!isDirty || saving) return
    setSaving(true)
    await Promise.all([
      fetch(`${BRIDGE}/api/agents/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: form.model, system_prompt: form.system_prompt }),
      }),
      supabase.from('agents').update({ model: form.model, system_prompt: form.system_prompt }).eq('id', id),
    ])
    setAgent(prev => prev ? { ...prev, ...form } : prev)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!agent) return <div className="p-8 text-center text-[#9ca3af]">Loading…</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/agents/${id}/control`} className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
          <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
        </Link>
        <div className="w-10 h-10 rounded-xl bg-[#cef0f5] text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">psychology</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#191c1e]">AI Models</h2>
          <p className="text-xs text-[#6f797a]">{agent.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">Model</label>
          <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
            className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white">
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            {!MODELS.includes(form.model) && <option value={form.model}>{form.model}</option>}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6f797a] mb-1.5">System Prompt</label>
          <textarea rows={8} value={form.system_prompt}
            onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
            placeholder="You are a helpful AI assistant…"
            className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none font-mono" />
          <p className="text-[11px] text-[#9ca3af] mt-1">{form.system_prompt.length} karakter</p>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={save} disabled={!isDirty || saving}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              saved ? 'bg-emerald-500 text-white'
                : isDirty ? 'bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20'
                : 'bg-[#f2f4f6] text-[#9ca3af] cursor-default'
            }`}>
            <span className="material-symbols-outlined text-[16px]">{saved ? 'check' : 'save'}</span>
            {saved ? 'Tersimpan' : saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>

      <div className="mt-4 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] p-4">
        <p className="text-[11px] font-semibold text-[#6f797a] uppercase tracking-wide mb-2">Aktif saat ini</p>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 bg-[#cef0f5] text-primary rounded-full text-xs font-semibold">{agent.model}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            agent.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#f2f4f6] text-[#6f797a]'
          }`}>{agent.status}</span>
        </div>
      </div>
    </div>
  )
}
