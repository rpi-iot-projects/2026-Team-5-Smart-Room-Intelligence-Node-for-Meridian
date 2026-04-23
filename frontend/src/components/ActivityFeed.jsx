import { useState } from 'react'
import { ChevronDown, ChevronUp, LogIn, LogOut, Eye } from 'lucide-react'

const icons = {
  checkin: LogIn,
  checkout: LogOut,
  occupancy_change: Eye,
}

const colors = {
  checkin: 'text-emerald-500 bg-emerald-50',
  checkout: 'text-orange-500 bg-orange-50',
  occupancy_change: 'text-blue-500 bg-blue-50',
}

function describe(ev) {
  const uid = ev.data?.uid || ''
  const room = ev.room?.replace(/_/g, ' ') || ''
  if (ev.type === 'checkin') return `${uid} checked into ${room}`
  if (ev.type === 'checkout') return `${uid} checked out of ${room}`
  if (ev.type === 'occupancy_change') {
    return ev.data?.person_detected ? `Person detected in ${room}` : `${room} is now vacant`
  }
  return `${ev.type} in ${room}`
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ActivityFeed({ events }) {
  const [open, setOpen] = useState(false)
  const visible = events.slice(0, 10)

  if (visible.length === 0) return null

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-3"
      >
        Recent Activity
        <span className="text-[11px] bg-gray-200 text-gray-600 rounded-full px-2 py-px">
          {visible.length}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
          {visible.map((ev, i) => {
            const Icon = icons[ev.type] || Eye
            const color = colors[ev.type] || 'text-gray-500 bg-gray-50'
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={14} />
                </div>
                <span className="text-sm text-gray-700 flex-1">{describe(ev)}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatTime(ev.timestamp)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
