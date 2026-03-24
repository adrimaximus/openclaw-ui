'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Integration = {
  key: string; label: string; desc: string
  icon: string; color: string; bg: string
  enabled: boolean; status: string
}

const INTEGRATIONS: Integration[] = [
  { key: 'whatsapp', label: 'WhatsApp',        desc: 'Terima & kirim pesan via WhatsApp Bridge',       icon: 'chat',          color: 'text-emerald-600', bg: 'bg-emerald-50', enabled: true,  status: 'Connected'      },
  { key: 'gcal',     label: 'Google Calendar', desc: 'Baca dan buat event di Google Calendar',          icon: 'calendar_month', color: 'text-blue-600',   bg: 'bg-blue-50',    enabled: false, status: 'Not connected'  },
  { key: 'gdrive',   label: 'Google Drive',    desc: 'Akses file dan folder di Google Drive',           icon: 'folder_shared',  color: 'text-yellow-600', bg: 'bg-yellow-50',  enabled: false, status: 'Not connected'  },
  { key: 'gmail',    label: 'Gmail',           desc: 'Baca dan kirim email via Gmail',                  icon: 'mail',           color: 'text-red-600',    bg: 'bg-red-50',     enabled: false, status: 'Not connected'  },
  { key: 'telegram', label: 'Telegram',        desc: 'Integrasikan bot Telegram',                       icon: 'send',           color: 'text-sky-600',    bg: 'bg-sky-50',     enabled: false, status: 'Not connected'  },
  { key: 'notion',   label: 'Notion',          desc: 'Akses dan tulis ke Notion database',              icon: 'description',    color: 'text-[#3f484a]',  bg: 'bg-[#f2f4f6]',  enabled: false, status: 'Not connected'  },
]

export default function ChannelsPage() {
  const { id } = useParams<{ id: string }>()
  const [items, setItems] = useState(INTEGRATIONS)

  const toggle = (key: string) =>
    setItems(prev => prev.map(i => i.key === key ? { ...i, enabled: !i.enabled } : i))

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/agents/${id}/control`} className="p-1.5 hover:bg-[#f2f4f6] rounded-lg">
          <span className="material-symbols-outlined text-[18px] text-[#6f797a]">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1e]">Channels & Integrations</h2>
          <p className="text-xs text-[#6f797a] mt-0.5">Kelola koneksi channel dan layanan eksternal</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key}
            className={`bg-white rounded-xl border p-5 transition-all ${
              item.enabled ? 'border-primary/40 shadow-sm' : 'border-[#e0e3e5]'
            }`}>
            <div className="flex items-center gap-4">
              <span className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-[22px] ${item.color}`}>{item.icon}</span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#191c1e] text-sm">{item.label}</div>
                <div className="text-[11px] text-[#9ca3af] mt-0.5">{item.desc}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[11px] font-semibold ${item.enabled ? 'text-emerald-600' : 'text-[#9ca3af]'}`}>
                  {item.enabled ? 'Connected' : item.status}
                </span>
                {/* Toggle */}
                <button onClick={() => toggle(item.key)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${
                    item.enabled ? 'bg-primary' : 'bg-[#e0e3e5]'
                  }`}
                  style={{ height: 22, width: 40 }}>
                  <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                    item.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} style={{ width: 18, height: 18, top: 2, left: item.enabled ? 20 : 2 }} />
                </button>
              </div>
            </div>
            {item.enabled && item.key === 'whatsapp' && (
              <div className="mt-3 pt-3 border-t border-[#f2f4f6]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-semibold">Bridge active</span>
                  <span className="ml-auto text-[11px] text-[#9ca3af]">via localhost:3001</span>
                </div>
              </div>
            )}
            {item.enabled && item.key !== 'whatsapp' && (
              <div className="mt-3 pt-3 border-t border-[#f2f4f6]">
                <button className="text-xs text-primary font-semibold hover:underline">
                  Configure credentials →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
