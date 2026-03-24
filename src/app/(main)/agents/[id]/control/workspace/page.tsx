'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const FILES = [
  {
    key: 'identity',
    label: 'identity.md',
    icon: 'badge',
    desc: 'Identitas dasar agent: nama, peran, kepribadian',
    color: 'text-primary', bg: 'bg-[#cef0f5]',
    preset: `# Identity\n\n## Nama\n[Nama Agent]\n\n## Peran\n[Deskripsi peran agent]\n\n## Kepribadian\n- Ramah dan profesional\n- Responsif dan informatif\n- Empati terhadap kebutuhan pengguna\n\n## Bahasa\nBahasa Indonesia (default), bisa beralih ke Bahasa Inggris jika diminta.`,
  },
  {
    key: 'soul',
    label: 'soul.md',
    icon: 'favorite',
    desc: 'Nilai-nilai inti, prinsip, dan tujuan agent',
    color: 'text-red-500', bg: 'bg-red-50',
    preset: `# Soul\n\n## Nilai Inti\n- Kejujuran: Selalu berikan informasi yang akurat\n- Kepedulian: Utamakan kebutuhan pengguna\n- Efisiensi: Berikan jawaban yang tepat dan ringkas\n\n## Prinsip\n1. Tidak pernah memalsukan informasi\n2. Mengakui keterbatasan dengan jujur\n3. Melindungi privasi pengguna\n\n## Tujuan Utama\nMembantu pengguna menyelesaikan tugasnya dengan efektif dan menyenangkan.`,
  },
  {
    key: 'skills',
    label: 'skills.md',
    icon: 'construction',
    desc: 'Kemampuan dan keahlian spesifik agent',
    color: 'text-amber-600', bg: 'bg-amber-50',
    preset: `# Skills\n\n## Kemampuan Utama\n- Menjawab pertanyaan umum\n- Merangkum dokumen dan teks panjang\n- Membantu perencanaan dan penjadwalan\n\n## Integrasi\n- WhatsApp: Menerima dan membalas pesan\n- Calendar: Membuat dan mengelola jadwal\n\n## Batasan\n- Tidak bisa mengakses internet secara real-time\n- Tidak menyimpan percakapan antar sesi`,
  },
  {
    key: 'agents',
    label: 'agents.md',
    icon: 'smart_toy',
    desc: 'Daftar sub-agent dan kolaborasi antar agent',
    color: 'text-purple-600', bg: 'bg-purple-50',
    preset: `# Agents\n\n## Agent Utama\nNama: [Nama Agent]\nModel: [Model yang digunakan]\nPeran: Primary conversational agent\n\n## Sub-Agents\n*(kosong — tambahkan sub-agent jika diperlukan)*\n\n## Protokol Kolaborasi\n- Agent utama menerima semua pesan masuk\n- Delegasikan ke sub-agent berdasarkan konteks\n- Sub-agent melaporkan hasil ke agent utama`,
  },
  {
    key: 'heartbeat',
    label: 'heartbeat.md',
    icon: 'monitor_heart',
    desc: 'Status kesehatan dan monitoring agent',
    color: 'text-emerald-600', bg: 'bg-emerald-50',
    preset: `# Heartbeat\n\n## Status Check\nInterval: setiap 5 menit\nEndpoint: /api/health\n\n## Kondisi Sehat\n- Response time < 2000ms\n- Memory usage < 80%\n- Error rate < 1%\n\n## Tindakan jika Tidak Sehat\n1. Log error ke sistem\n2. Kirim notifikasi ke admin\n3. Restart jika perlu`,
  },
]

type FileRecord = { id: string; agent_id: string; file_key: string; content: string }

export default function WorkspacePage() {
  const { id }   = useParams<{ id: string }>()
  const [records, setRecords] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [draft,   setDraft]   = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    supabase.from('agent_workspace').select('*').eq('agent_id', id)
      .then(({ data }) => {
        const map: Record<string, string> = {}
        ;(data ?? []).forEach((r: FileRecord) => { map[r.file_key] = r.content })
        setRecords(map)
      })
  }, [id])

  function openFile(key: string, preset: string) {
    setEditing(key)
    setDraft(records[key] ?? preset)
  }

  async function saveFile() {
    if (!editing || saving) return
    setSaving(true)
    const existing = await supabase.from('agent_workspace')
      .select('id').eq('agent_id', id).eq('file_key', editing).single()

    if (existing.data?.id) {
      await supabase.from('agent_workspace').update({ content: draft }).eq('id', existing.data.id)
    } else {
      await supabase.from('agent_workspace').insert({ agent_id: id, file_key: editing, content: draft })
    }
    setRecords(prev => ({ ...prev, [editing]: draft }))
    setSaving(false)
    setEditing(null)
  }

  const activeFile = FILES.find(f => f.key === editing)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/agents/${id}/control`} className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
          <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1e]">Workspace</h2>
          <p className="text-xs text-[#6f797a] mt-0.5">File konfigurasi identitas agent</p>
        </div>
      </div>

      {/* File cards */}
      {!editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FILES.map(f => (
            <button key={f.key} onClick={() => openFile(f.key, f.preset)}
              className="bg-white rounded-xl border border-[#e0e3e5] p-5 text-left hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <span className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-[20px] ${f.color}`}>{f.icon}</span>
                </span>
                {records[f.key] && (
                  <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                    Edited
                  </span>
                )}
              </div>
              <div className="font-bold text-[#191c1e] text-sm font-mono">{f.label}</div>
              <div className="text-[11px] text-[#9ca3af] mt-1 leading-snug">{f.desc}</div>
              <div className="mt-3 text-[11px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Buka & edit →
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      {editing && activeFile && (
        <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
          {/* Editor header */}
          <div className="px-5 py-4 border-b border-[#e0e3e5] flex items-center gap-3">
            <span className={`w-8 h-8 rounded-lg ${activeFile.bg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined text-[16px] ${activeFile.color}`}>{activeFile.icon}</span>
            </span>
            <span className="font-bold text-[#191c1e] text-sm font-mono">{activeFile.label}</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setEditing(null)}
                className="px-4 py-1.5 text-xs font-semibold text-[#6f797a] border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6]">
                Batal
              </button>
              <button onClick={saveFile} disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-40">
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>
          {/* Textarea */}
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full p-5 text-sm font-mono text-[#191c1e] outline-none resize-none bg-[#fafafa] min-h-[400px]"
            spellCheck={false}
          />
          <div className="px-5 py-2 border-t border-[#f2f4f6] text-[10px] text-[#9ca3af]">
            {draft.length} karakter · Markdown supported
          </div>
        </div>
      )}
    </div>
  )
}
