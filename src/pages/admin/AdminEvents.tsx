import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Zap, X,
  CheckCircle2, GraduationCap, PartyPopper, Palmtree, Wrench, Calendar
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const eventTypes = [
  { id: 'exam', label: 'Exam', icon: GraduationCap, color: 'from-red-500 to-rose-400', bg: 'bg-red-50 border-red-200 text-red-700', multiplier: 2.0 },
  { id: 'internal', label: 'Internal Assessment', icon: CheckCircle2, color: 'from-orange-500 to-amber-400', bg: 'bg-orange-50 border-orange-200 text-orange-700', multiplier: 1.5 },
  { id: 'event', label: 'College Event', icon: PartyPopper, color: 'from-violet-500 to-purple-400', bg: 'bg-violet-50 border-violet-200 text-violet-700', multiplier: 1.3 },
  { id: 'holiday', label: 'Holiday', icon: Palmtree, color: 'from-green-500 to-emerald-400', bg: 'bg-green-50 border-green-200 text-green-700', multiplier: 0.7 },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'from-gray-500 to-gray-400', bg: 'bg-gray-50 border-gray-200 text-gray-700', multiplier: 1.0 },
]

export default function AdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [batchInput, setBatchInput] = useState('')
  const [form, setForm] = useState({
    title: '',
    type: 'exam',
    start_date: '',
    end_date: '',
    affected_batches: [] as string[],
    priority_multiplier: 2.0,
  })

  useEffect(() => {
    loadEvents()

    const sub = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'college_events' }, () => loadEvents())
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  const loadEvents = async () => {
    const { data } = await supabase
      .from('college_events')
      .select('*')
      .order('start_date', { ascending: true })
    if (data) setEvents(data)
    setLoading(false)
  }

  const addBatch = () => {
    const trimmed = batchInput.trim().toUpperCase()
    if (!trimmed) return
    if (!form.affected_batches.includes(trimmed)) {
      setForm(prev => ({ ...prev, affected_batches: [...prev.affected_batches, trimmed] }))
    }
    setBatchInput('')
  }

  const removeBatch = (b: string) => {
    setForm(prev => ({ ...prev, affected_batches: prev.affected_batches.filter(x => x !== b) }))
  }

  const handleTypeChange = (typeId: string) => {
    const type = eventTypes.find(t => t.id === typeId)!
    setForm(prev => ({ ...prev, type: typeId, priority_multiplier: type.multiplier }))
  }

  const saveEvent = async () => {
    if (!form.title || !form.start_date) return
    setSaving(true)

    await supabase.from('college_events').insert({
      title: form.title,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      affected_batches: form.affected_batches.length > 0 ? form.affected_batches : ['All'],
      priority_multiplier: form.priority_multiplier,
    })

    setForm({ title: '', type: 'exam', start_date: '', end_date: '', affected_batches: [], priority_multiplier: 2.0 })
    setBatchInput('')
    setShowForm(false)
    setSaving(false)
  }

  const deleteEvent = async (id: string) => {
    await supabase.from('college_events').delete().eq('id', id)
  }

  const isActive = (ev: any) => {
    const now = new Date()
    return new Date(ev.start_date) <= now && new Date(ev.end_date) >= now
  }

  const getEventColor = (type: string) => eventTypes.find(t => t.id === type) || eventTypes[0]

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Header */}
      <div className="bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/admin')}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-white text-base font-bold">College Calendar</h1>
            <p className="text-white/40 text-xs">Real-time · Events affect ticket priority</p>
          </div>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl">
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
            <p className="text-sm font-bold text-gray-900">How events affect priority scoring</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {eventTypes.map(et => {
              const Icon = et.icon
              return (
                <div key={et.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${et.bg}`}>
                  <Icon size={12} />
                  <span className="text-[10px] font-semibold flex-1">{et.label}</span>
                  <span className="text-[10px] font-bold">{et.multiplier}×</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-3xl border border-blue-100 shadow-md p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">Add New Event</p>
                <button onClick={() => setShowForm(false)}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">

                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Event Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. End Semester Exam, Pongal Holiday..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Event Type</label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map(et => {
                      const Icon = et.icon
                      return (
                        <button key={et.id} onClick={() => handleTypeChange(et.id)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                            form.type === et.id
                              ? `bg-gradient-to-r ${et.color} text-white border-transparent`
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                          <Icon size={11} /> {et.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Start Date *</label>
                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">End Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>

                {/* Affected Batches — free text input */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Affected Batches
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">Type batch codes like 23BIT, 24BCE, 25BME and press Enter or Add. Leave empty for All batches.</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={batchInput}
                      onChange={e => setBatchInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addBatch()}
                      placeholder="e.g. 23BIT, 24BCE..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all uppercase"
                    />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={addBatch}
                      className="px-4 py-2.5 rounded-2xl bg-blue-500 text-white text-xs font-bold">
                      Add
                    </motion.button>
                  </div>

                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['All', '21BIT', '22BIT', '22BCE', '23BIT', '23BCE', '24BIT', '24BCE', '25BIT', '25BCE'].map(b => (
                      <button key={b} onClick={() => {
                        if (b === 'All') {
                          setForm(prev => ({ ...prev, affected_batches: ['All'] }))
                        } else if (!form.affected_batches.includes(b)) {
                          setForm(prev => ({ ...prev, affected_batches: [...prev.affected_batches.filter(x => x !== 'All'), b] }))
                        }
                      }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          form.affected_batches.includes(b)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300'
                        }`}>
                        {b}
                      </button>
                    ))}
                  </div>

                  {/* Selected batches */}
                  {form.affected_batches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.affected_batches.map(b => (
                        <span key={b} className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg">
                          {b}
                          <button onClick={() => removeBatch(b)}>
                            <X size={10} className="text-blue-400 hover:text-blue-600" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority multiplier preview */}
                <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">Priority multiplier for this event</p>
                  <span className="text-sm font-bold text-blue-600">{form.priority_multiplier}×</span>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={saveEvent}
                  disabled={!form.title || !form.start_date || saving}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    form.title && form.start_date
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Save to Calendar'
                  }
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No events yet</p>
            <p className="text-xs text-gray-400 mt-1">Add events to affect ticket priority scoring</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            <AnimatePresence>
              {events.map((ev) => {
                const type = getEventColor(ev.type)
                const Icon = type.icon
                const active = isActive(ev)
                return (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${type.color}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-sm`}>
                            <Icon size={18} className="text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900">{ev.title}</p>
                              {active && (
                                <span className="text-[9px] font-bold bg-green-100 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{type.label}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteEvent(ev.id)}
                          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors">
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-gray-50 rounded-xl p-2.5">
                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Start</p>
                          <p className="text-[10px] font-bold text-gray-700">{new Date(ev.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2.5">
                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">End</p>
                          <p className="text-[10px] font-bold text-gray-700">{new Date(ev.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2.5">
                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Multiplier</p>
                          <p className="text-[10px] font-bold text-blue-600">{ev.priority_multiplier}×</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(ev.affected_batches || ['All']).map((b: string) => (
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
        )}
      </div>
    </div>
  )
}