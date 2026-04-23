import { Thermometer, Droplets, User, Clock } from 'lucide-react'

function formatRoomName(id) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function Stat({ icon: Icon, value, unit, label }) {
  return (
    <div className="flex flex-col items-center">
      <Icon size={15} className="text-gray-400 mb-1" />
      <span className="text-xl font-bold text-gray-900">{value ?? '—'}</span>
      <span className="text-[11px] text-gray-400 leading-tight">{unit}</span>
    </div>
  )
}

export default function RoomCard({ room, compact, pulsing, timeAgo }) {
  const occupied = room.person_detected

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm transition-shadow ${
        pulsing ? 'animate-pulse-border' : ''
      } ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider ${
            occupied
              ? 'bg-indigo-50 text-indigo-600'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {occupied ? 'OCCUPIED' : 'VACANT'}
        </span>
        {occupied && room.confidence > 0 && (
          <span className="text-xs text-gray-400">
            {Math.round(room.confidence * 100)}% confidence
          </span>
        )}
      </div>

      <h3 className={`font-bold text-gray-900 ${compact ? 'text-lg mb-1' : 'text-2xl mb-1'}`}>
        {formatRoomName(room.room_id)}
      </h3>
      <p className="text-xs text-gray-400 mb-4">{room.room_id}</p>

      {!compact && (
        <div className="grid grid-cols-4 gap-4 py-4 border-t border-gray-100">
          <Stat
            icon={Thermometer}
            value={room.temp_f != null ? room.temp_f.toFixed(1) : null}
            unit="°F"
          />
          <Stat
            icon={Droplets}
            value={room.humidity_pct != null ? room.humidity_pct.toFixed(0) : null}
            unit="%"
          />
          <Stat
            icon={User}
            value={room.current_uid || 'none'}
            unit="occupant"
          />
          <Stat
            icon={Clock}
            value={timeAgo(room.last_checkin_time)}
            unit="last check-in"
          />
        </div>
      )}

      {compact && (
        <div className="flex items-center gap-5 pt-3 border-t border-gray-100 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Thermometer size={13} className="text-gray-400" />
            {room.temp_f != null ? `${room.temp_f.toFixed(1)}°F` : '—'}
          </span>
          <span className="flex items-center gap-1">
            <Droplets size={13} className="text-gray-400" />
            {room.humidity_pct != null ? `${room.humidity_pct.toFixed(0)}%` : '—'}
          </span>
          <span className="flex items-center gap-1">
            <User size={13} className="text-gray-400" />
            {room.current_uid || 'none'}
          </span>
        </div>
      )}
    </div>
  )
}
