'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type EnvVar = { id: string; key: string; value: string }

const EXAMPLES: EnvVar[] = [
  { id: '1', key: 'AGENT_LANGUAGE', value: 'id-ID' },
  { id: '2', key: 'MAX_TOKENS',     value: '2048'  },
]

export default function EnvPage() {
  const { id }    = useParams<{ id: string }>()
  const [vars,    setVars]    = useState<EnvVar[]>(EXAMPLES)
  const [showAdd, setShowAdd] = useState(false)
  const [newKey,  setNewKey]  = useState('')
  const [newVal,  setNewVal]  = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  function addVar() {
    if (!newKey.trim()) return
    setVars(prev => [...prev, { id: Date.now().toString(), key: newKey.trim().toUpperCase(), value: newVal }])
    setNewKey(''); setNewVal(''); setShowAdd(false)
  }

  function saveEdit(varId: string) {
    setVars(prev => prev.map(v => v.id === varId ? { ...v, value: editVal } : v))
    setEditing(null)
  }

  function deleteVar(varId: string) {
    setVars(prev => prev.filter(v => v.id !== varId))
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/agents/${id}/control`} className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
          <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-[#191c1e]">Environment</h2>
          <p className="text-xs text-[#6f797a] mt-0.5">Variabel lingkungan agent</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Tambah
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-5 mb-5">
          <p className="text-sm font-bold text-[#191c1e] mb-3">Variabel baru</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#6f797a] mb-1">KEY</label>
              <input value={newKey} onChange={e => setNewKey(e.target.value)}
                placeholder="MY_API_KEY"
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-mono uppercase" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#6f797a] mb-1">VALUE</label>
              <input value={newVal} onChange={e => setNewVal(e.target.value)}
                placeholder="value"
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
            </div>
            <button onClick={addVar}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 shrink-0">
              Simpan
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-[#6f797a] border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6] shrink-0">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Vars table */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#f2f4f6] grid grid-cols-[1fr_1fr_auto] gap-4">
          <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Key</span>
          <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Value</span>
          <span className="w-16" />
        </div>
        {vars.length === 0 ? (
          <div className="py-12 text-center text-[#9ca3af] text-sm">
            <span className="material-symbols-outlined text-3xl block mb-2">key</span>
            Belum ada variabel
          </div>
        ) : (
          <div className="divide-y divide-[#f2f4f6]">
            {vars.map(v => (
              <div key={v.id} className="px-5 py-3 grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
                <code className="text-sm font-mono text-primary font-semibold truncate">{v.key}</code>
                {editing === v.id ? (
                  <div className="flex gap-2">
                    <input value={editVal} onChange={e => setEditVal(e.target.value)}
                      autoFocus
                      className="flex-1 border border-primary rounded-lg px-2 py-1 text-sm font-mono outline-none" />
                    <button onClick={() => saveEdit(v.id)}
                      className="px-2 py-1 text-xs bg-primary text-white rounded-lg">✓</button>
                    <button onClick={() => setEditing(null)}
                      className="px-2 py-1 text-xs text-[#6f797a] border border-[#e0e3e5] rounded-lg">✕</button>
                  </div>
                ) : (
                  <code className="text-sm font-mono text-[#3f484a] truncate">{v.value || '—'}</code>
                )}
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(v.id); setEditVal(v.value) }}
                    className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
                    <span className="material-symbols-outlined text-[15px] text-[#9ca3af]">edit</span>
                  </button>
                  <button onClick={() => deleteVar(v.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg">
                    <span className="material-symbols-outlined text-[15px] text-[#9ca3af]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-[#9ca3af]">
        {vars.length} variabel · Nilai sensitif akan dienkripsi saat disimpan ke server
      </p>
    </div>
  )
}
