'use client'
import { useBridgeStatus } from '@/lib/useBridgeStatus'

export default function ConnectPage() {
  const { status, qr } = useBridgeStatus()

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

        {/* QR Card */}
        <div className="md:col-span-7 bg-white rounded-xl p-10 shadow-sm border border-[#e0e3e5] flex flex-col items-center text-center">
          {isConnected ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
              </div>
              <h2 className="text-2xl font-extrabold mb-2">WhatsApp Connected</h2>
              <p className="text-[#6f797a] text-sm">Your WhatsApp is connected and the bridge is live.</p>
            </>
          ) : (
            <>
              {/* Status pill */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-8
                ${isConnecting ? 'bg-amber-50 text-amber-700' : 'bg-[#ffdad6] text-red-700'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
                {isConnecting ? 'Connecting…' : 'Disconnected'}
              </div>

              <h2 className="text-3xl font-extrabold mb-3">Connect WhatsApp</h2>
              <p className="text-[#6f797a] text-sm mb-8 max-w-xs">
                Scan this QR code with WhatsApp to connect your account and start automating.
              </p>

              {/* QR display */}
              <div className="w-64 h-64 border-4 border-primary bg-white rounded-xl flex items-center justify-center mb-6 overflow-hidden">
                {qr ? (
                  <img src={qr} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-[#6f797a]">
                    <span className="material-symbols-outlined text-5xl">qr_code_2</span>
                    <p className="text-xs font-medium">
                      {isConnecting ? 'Generating QR…' : 'Start bridge server first'}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#6f797a]">
                QR code auto-updates when it expires.
              </p>
            </>
          )}
        </div>

        {/* Steps panel */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-[#f2f4f6] rounded-xl p-6 flex-1 border border-[#e0e3e5]">
            <h3 className="text-base font-bold mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              Setup Steps
            </h3>
            <div className="space-y-5">
              {[
                { n: 1, title: 'Open WhatsApp', desc: 'Launch the app on your mobile device.' },
                { n: 2, title: 'Settings Menu', desc: 'Tap Menu or Settings → Linked Devices.' },
                { n: 3, title: 'Point & Scan', desc: 'Tap Link a Device and scan the QR code.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                    ${n === 1 ? 'bg-primary text-white' : 'bg-[#cef0f5] text-primary'}`}>{n}</div>
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="text-xs text-[#6f797a] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Connection pulse */}
            <div className="mt-8 p-3 rounded-lg bg-[#cce8ed] text-[#051f23] flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">sync</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider">Connection Pulse</p>
                <p className="text-xs font-medium">
                  {isConnected ? 'Bridge is live ✅' : isConnecting ? 'Waiting for signal…' : 'Bridge not running'}
                </p>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="bg-primary text-white rounded-xl p-5 flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl opacity-50">shield_lock</span>
            <div>
              <p className="text-sm font-bold">End-to-End Encrypted</p>
              <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed">
                Communication data is never stored externally. Only transient metadata is processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
