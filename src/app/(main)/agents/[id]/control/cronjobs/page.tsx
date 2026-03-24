'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Job = { id: string; name: string; cron: string; command: string; enabled: boolean }

const EXAMPLES = [
  { id: '1', name: 'Daily Report',    cron: '0 8 * * *',   command: 'send_report --type=daily',     enabled: true  },
  { id: '2', name: 'Hourly Ping',     cron: '0 * * * *',   command: 'ping_health_check',             enabled: false },
]

export default function CronjobsPage() {
  const { id }   = useParams<{ id: string }>()
  const [jobs,   setJobs]    = useState<Job[]>(EXAMPLES)
  const [showAdd, setShowAdd] = useState(false)
  const [form,   setForm]    = useState({ name: '', cron: '', command: '' })

  function addJob() {
    if (!form.name || !form.cron || !form.command) return
    setJobs(prev => [...prev, { id: Date.now().toString(), ...form, enabled: true }])
    setForm({ name: '', cron: '', command: '' })
    setShowAdd(false)
  }

  function toggleJob(jobId: string) {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, enabled: !j.enabled } : j))
  }

  function deleteJob(jobId: string) {
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/agents/${id}/control`} className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
          <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-[#191c1e]">Cronjobs</h2>
          <p className="text-xs text-[#6f797a] mt-0.5">Jadwal tugas otomatis agent</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Tambah
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-5 mb-5 space-y-3">
          <p className="text-sm font-bold text-[#191c1e]">Job baru</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6f797a] mb-1">Nama</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Daily Report"
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6f797a] mb-1">Cron Expression</label>
              <input value={form.cron} onChange={e => setForm(f => ({ ...f, cron: e.target.value }))}
                placeholder="0 8 * * *"
                className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1">Command</label>
            <input value={form.command} onChange={e => setForm(f => ({ ...f, command: e.target.value }))}
              placeholder="send_report --type=daily"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-xs text-[#6f797a] border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6]">
              Batal
            </button>
            <button onClick={addJob}
              className="px-4 py-2 text-xs bg-primary text-white font-semibold rounded-lg hover:opacity-90">
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Job list */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        {jobs.length === 0 ? (
          <div className="py-12 text-center text-[#9ca3af] text-sm">
            <span className="material-symbols-outlined text-3xl block mb-2">schedule</span>
            Belum ada cronjob
          </div>
        ) : (
          <div className="divide-y divide-[#f2f4f6]">
            {jobs.map(job => (
              <div key={job.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#191c1e] text-sm">{job.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-[11px] bg-[#f2f4f6] px-2 py-0.5 rounded text-primary">{job.cron}</code>
                    <span className="text-[11px] text-[#9ca3af] font-mono truncate">{job.command}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-semibold ${job.enabled ? 'text-emerald-600' : 'text-[#9ca3af]'}`}>
                    {job.enabled ? 'Active' : 'Paused'}
                  </span>
                  <button onClick={() => toggleJob(job.id)}
                    className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-[#6f797a]">
                      {job.enabled ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <button onClick={() => deleteJob(job.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-[#9ca3af] hover:text-red-500">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
