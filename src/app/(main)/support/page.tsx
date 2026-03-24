import Link from 'next/link'

const ITEMS = [
  { icon: 'book',         label: 'Dokumentasi',  desc: 'Panduan lengkap penggunaan OpenClaw AI', href: '#' },
  { icon: 'chat',         label: 'Live Chat',     desc: 'Hubungi tim support via WhatsApp',        href: '#' },
  { icon: 'bug_report',   label: 'Laporkan Bug',  desc: 'Temukan masalah? Laporkan ke tim kami',   href: '#' },
  { icon: 'forum',        label: 'Komunitas',     desc: 'Diskusi dengan pengguna lain',             href: '#' },
]

export default function SupportPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#191c1e]">Support</h2>
        <p className="text-sm text-[#6f797a] mt-1">Butuh bantuan? Kami siap membantu.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {ITEMS.map(item => (
          <Link key={item.label} href={item.href}
            className="bg-white rounded-xl border border-[#e0e3e5] p-5 hover:border-primary/30 hover:shadow-sm transition-all flex items-start gap-4">
            <span className="w-10 h-10 rounded-lg bg-[#cef0f5] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] text-primary">{item.icon}</span>
            </span>
            <div>
              <div className="font-bold text-[#191c1e] text-sm">{item.label}</div>
              <div className="text-[11px] text-[#9ca3af] mt-0.5">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] p-6">
        <h3 className="font-bold text-[#191c1e] mb-4 text-sm">Kirim Pesan</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1">Subjek</label>
            <input placeholder="Deskripsikan masalah kamu"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6f797a] mb-1">Pesan</label>
            <textarea rows={4} placeholder="Ceritakan lebih detail…"
              className="w-full border border-[#e0e3e5] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
          <button className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90">
            Kirim
          </button>
        </div>
      </div>
    </div>
  )
}
