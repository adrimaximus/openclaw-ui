export default function ChannelsPage() {
  const channels = [
    { name: 'Console', type: 'Built-in', status: 'Enabled',  prefix: null },
    { name: 'WhatsApp', type: 'Custom',  status: 'Enabled',  prefix: null },
    { name: 'DingTalk', type: 'Built-in', status: 'Disabled', prefix: null },
    { name: 'Feishu',   type: 'Built-in', status: 'Disabled', prefix: null },
    { name: 'iMessage', type: 'Built-in', status: 'Disabled', prefix: null },
    { name: 'Discord',  type: 'Built-in', status: 'Disabled', prefix: null },
    { name: 'Telegram', type: 'Built-in', status: 'Disabled', prefix: null },
    { name: 'QQ',       type: 'Built-in', status: 'Disabled', prefix: null },
    { name: 'Matrix',   type: 'Built-in', status: 'Disabled', prefix: null },
    { name: 'Twilio',   type: 'Built-in', status: 'Disabled', prefix: null },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#191c1e]">Channels</h2>
        <p className="text-sm text-[#6f797a] mt-1">Manage and configure message channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map(ch => (
          <div
            key={ch.name}
            className={`bg-white rounded-xl p-5 border cursor-pointer hover:shadow-md transition-all ${
              ch.status === 'Enabled' ? 'border-primary/40' : 'border-[#e0e3e5]'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-bold text-[#191c1e] text-sm">{ch.name}</span>
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f2f4f6] text-[#6f797a]">
                  {ch.type}
                </span>
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${
                ch.status === 'Enabled' ? 'text-green-500' : 'text-[#9ca3af]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  ch.status === 'Enabled' ? 'bg-green-500' : 'bg-[#9ca3af]'
                }`} />
                {ch.status}
              </span>
            </div>
            <p className="text-xs text-[#6f797a]">Bot Prefix: {ch.prefix ?? 'Not set'}</p>
            <p className="text-xs text-[#9ca3af] mt-2">Click card to edit</p>
          </div>
        ))}
      </div>
    </div>
  )
}
