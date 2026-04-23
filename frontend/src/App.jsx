import { useState, useEffect, useRef, useCallback } from 'react'
import RoomCard from './components/RoomCard'
import ActivityFeed from './components/ActivityFeed'

function timeAgo(iso) {
  if (!iso) return 'never'
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function App() {
  const [rooms, setRooms] = useState({})
  const [events, setEvents] = useState([])
  const [viewMode, setViewMode] = useState('regular')
  const [pulsingRooms, setPulsingRooms] = useState(new Set())
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connectWs = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'snapshot') {
        const roomMap = {}
        for (const r of msg.rooms) roomMap[r.room_id] = r
        setRooms(roomMap)
        setEvents(msg.events || [])
        return
      }

      if (msg.type === 'update') {
        setRooms((prev) => ({ ...prev, [msg.room_id]: msg.room }))

        if (['checkin', 'checkout', 'occupancy'].includes(msg.topic_type)) {
          const event = {
            timestamp: msg.timestamp,
            type: msg.topic_type === 'occupancy' ? 'occupancy_change' : msg.topic_type,
            room: msg.room_id,
            data: msg.payload,
          }
          setEvents((prev) => [event, ...prev].slice(0, 50))
        }

        setPulsingRooms((prev) => new Set(prev).add(msg.room_id))
        setTimeout(() => {
          setPulsingRooms((prev) => {
            const next = new Set(prev)
            next.delete(msg.room_id)
            return next
          })
        }, 1000)
      }
    }

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connectWs, 3000)
    }
    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => {
    connectWs()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connectWs])

  const roomList = Object.values(rooms)

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-14">
          <img src="/meridian-logo.png" alt="Meridian" className="h-7" />

          <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm">
            <button
              onClick={() => setViewMode('regular')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'regular'
                  ? 'bg-white text-gray-900 font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              regular
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'compact'
                  ? 'bg-white text-gray-900 font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              compact
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {roomList.length > 0 && (
          <p className="text-sm text-gray-400 mb-5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 relative top-[-1px]" />
            {roomList.length} room{roomList.length !== 1 ? 's' : ''} connected
          </p>
        )}

        <div className="space-y-4">
          {roomList.map((room) => (
            <RoomCard
              key={room.room_id}
              room={room}
              compact={viewMode === 'compact'}
              pulsing={pulsingRooms.has(room.room_id)}
              timeAgo={timeAgo}
            />
          ))}
        </div>

        {roomList.length === 0 && (
          <div className="text-center py-24">
            <img src="/meridian-logo.png" alt="" className="h-9 mx-auto mb-4 opacity-30" />
            <p className="text-gray-400 text-lg mb-1">Waiting for data&hellip;</p>
            <p className="text-gray-400 text-sm">
              Room cards will appear when the Pi publishes to the MQTT broker.
            </p>
          </div>
        )}

        <ActivityFeed events={events} />
      </main>
    </div>
  )
}
