import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Calendar, Zap, X,
  CheckCircle2, GraduationCap, PartyPopper, Palmtree, Wrench
} from 'lucide-react'

const eventTypes = [
  { id: 'exam', label: 'Exam', icon: GraduationCap, color: 'from-red-500 to-rose-400', bg: 'bg-red-50 border-red-200 text-red-700', multiplier: '2.0x' },
  { id: 'internal', label: 'Internal Assessment', icon: CheckCircle2, color: 'from-orange-500 to-amber-400', bg: 'bg-orange-50 border-orange-200 text-orange-700', multiplier: '1.5x' },
  { id: 'event', label: 'College Event', icon: PartyPopper, color: 'from-violet-500 to-purple-400', bg: 'bg-violet-50 border-violet-200 text-violet-700', multiplier: '1.3x' },
  { id: 'holiday', label: 'Holiday', icon: Palmtree, color: 'from-green-500 to-emerald-400', bg: 'bg-green-50 border-green-200 text-green-700', multiplier: '0.7x' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'from-gray-500 to-gray-400', bg: 'bg-gray-50 border-gray-200 text-gray-700', multiplier: '1.0x' },
]

const initialEvents = [
  { id: '1', title: 'End Semester Exam', type: 'exam', start: '2026-05-16', end: '2026-05-22', batches: ['23BIT', '23BCE', '22BIT'], multiplier: '2.0x' },
  { id: '2', title: 'College Day', type: 'event', start: '2026-05-25', end: '2026-05-25', batches: ['All'], multiplier: '1.3x' },
  { id: '3', title: 'Summer Holiday', type: 'holiday', start: '2026-06-01', end: '2026-06-30', batches: ['All'], multiplier: '0.7x' },
  { id: '4', title: 'Internal Assessment 3', type: 'internal', start: '2026-05-28', end: '2026-05-30', batches: ['23BIT', '23BCE'], multiplier: '1.5x' },
]

const batches = ['All', '23BIT', '23BCE', '22BIT', '22BCE', '21BIT']

export default function AdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'exam', start: '', end: '', batches: ['All'] })

  const addEvent = () => {
    if (!form.title || !form.start) return
    const type = eventTypes.find(t => t.id === form.type)!
    setEvents([...events, {
      id: Date.now().toString(),
      title: form.title,
      type: form.type,
      start: form.start,
      end: form.end || form.start,
      batches: form.batches,
      multiplier: type.multiplier
    }])
    setForm({ title: '', type: 'exam', start: '', end: '', batches: ['All'] })
    setShowForm(false)
  }

  const removeEvent = (id: string) => setEvents(events.filter(e => e.id !== id))

  const toggleBatch = (b: string) => {
    if (b === 'All') { setForm({ ...form, batches: ['All'] }); return }
    const current = form.batches.filter(x => x !== 'All')
    setForm({ ...form, batches: current.includes(b) ? current.filter(x => x !== b) : [...current, b] })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Dark Header */}
      <div className="bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/admin')}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-white text-base font-bold">College Calendar</h1>
            <p className="text-white/40 text-xs">Events affect ticket priority scoring</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl"
          >
            <Plus size={14} /> Add Event
          </motion.button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5">

        {/* How it works */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900">How events affect priority</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {eventTypes.map(et => {
              const Icon = et.icon
              return (
                <div key={et.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${et.bg}`}>
                  <Icon size={12} />
                  <span className="text-[10px] font-semibold flex-1">{et.label}</span>
                  <span className="text-[10px] font-bold">{et.multiplier}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-3xl border border-blue-100 shadow-md p-5 mb-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">Add New Event</p>
                <button onClick={() => setShowForm(false)}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Event Title</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. End Semester Exam"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map(et => {
                      const Icon = et.icon
                      return (
                        <button
                          key={et.id}
                          onClick={() => setForm({ ...form, type: et.id })}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                            form.type === et.id ? `bg-gradient-to-r ${et.color} text-white border-transparent` : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          <Icon size={11} /> {et.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Start Date</label>
                    <input
                      type="date"
                      value={form.start}
                      onChange={e => setForm({ ...form, start: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">End Date</label>
                    <input
                      type="date"
                      value={form.end}
                      onChange={e => setForm({ ...form, end: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Affected Batches</label>
                  <div className="flex flex-wrap gap-2">
                    {batches.map(b => (
                      <button
                        key={b}
                        onClick={() => toggleBatch(b)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                          form.batches.includes(b)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={addEvent}
                  disabled={!form.title || !form.start}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    form.title && form.start
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  Add to Calendar
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events List */}
        <div className="space-y-3">
          <AnimatePresence>
            {events.map((ev) => {
              const type = eventTypes.find(t => t.id === ev.type)!
              const Icon = type.icon
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${type.color}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-sm`}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{ev.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{type.label}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeEvent(ev.id)}
                        className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <X size={14} className="text-gray-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Start</p>
                        <p className="text-[10px] font-bold text-gray-700">{ev.start}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">End</p>
                        <p className="text-[10px] font-bold text-gray-700">{ev.end}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Priority</p>
                        <p className="text-[10px] font-bold text-gray-700">{ev.multiplier}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {ev.batches.map(b => (
                        <span key={b} className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}