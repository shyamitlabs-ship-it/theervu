import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TicketIcon, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, Calendar,
  Zap, Bell, BarChart3, ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import ProfileModal from '../../components/shared/ProfileModal'

const categoryColors: Record<string, string> = {
  'IT & Network': '#3B82F6',
  'Hostel': '#F97316',
  'Academics': '#8B5CF6',
  'Transport': '#10B981',
  'Canteen': '#EC4899',
  'Medical': '#EF4444',
  'Library': '#6366F1',
}

const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#10B981',
}

const eventTypeColors: Record<string, string> = {
  exam: 'bg-red-500',
  internal: 'bg-orange-400',
  event: 'bg-violet-500',
  holiday: 'bg-green-500',
  maintenance: 'bg-gray-400',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({ open: 0, resolvedToday: 0, slaBreaches: 0, total: 0 })
  const [categoryStats, setCategoryStats] = useState<any[]>([])
  const [priorityStats, setPriorityStats] = useState<any[]>([])
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [hostelStats, setHostelStats] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    loadStats()
    loadEvents()

    // Realtime for events
    const sub = supabase
      .channel('admin-events')
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
  }

  const loadStats = async () => {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status, priority_label, created_at, resolved_at, location, categories(name)')

    if (!tickets) return

    const open = tickets.filter(t => t.status === 'open').length
    const resolvedToday = tickets.filter(t => {
      if (t.status !== 'resolved' || !t.resolved_at) return false
      return new Date(t.resolved_at).toDateString() === new Date().toDateString()
    }).length

    const catMap: Record<string, number> = {}
    tickets.forEach(t => {
      const cat = (t.categories as any)?.name || 'Other'
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    const catArray = Object.entries(catMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const priMap: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    tickets.forEach(t => { if (t.priority_label) priMap[t.priority_label] = (priMap[t.priority_label] || 0) + 1 })
    const priArray = Object.entries(priMap).map(([name, value]) => ({ name, value }))

    const days: any[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const count = tickets.filter(t => new Date(t.created_at).toDateString() === dateStr).length
      const resolved = tickets.filter(t => t.resolved_at && new Date(t.resolved_at).toDateString() === dateStr).length
      days.push({ day: date.toLocaleDateString('en-US', { weekday: 'short' }), raised: count, resolved })
    }

    const hostelMap: Record<string, number> = {}
    tickets.forEach(t => {
      if (t.location?.includes('Hostel')) {
        hostelMap[t.location] = (hostelMap[t.location] || 0) + 1
      }
    })
    const hostelArray = Object.entries(hostelMap)
      .map(([block, count]) => ({ block, tickets: count }))
      .sort((a, b) => b.tickets - a.tickets)

    setStats({ open, resolvedToday, slaBreaches: 0, total: tickets.length })
    setCategoryStats(catArray)
    setPriorityStats(priArray)
    setDailyStats(days)
    setHostelStats(hostelArray.length > 0 ? hostelArray : [
      { block: 'Block A', tickets: 0 },
      { block: 'Block B', tickets: 0 },
      { block: 'Block C', tickets: 0 },
    ])
  }

  const kpis = [
    { label: 'Open Tickets', value: String(stats.open), change: 'live', up: true, icon: TicketIcon, gradient: 'from-blue-500 to-cyan-400', bg: 'from-blue-50 to-cyan-50' },
    { label: 'Total Tickets', value: String(stats.total), change: 'all time', up: true, icon: BarChart3, gradient: 'from-violet-500 to-purple-400', bg: 'from-violet-50 to-purple-50' },
    { label: 'SLA Breaches', value: String(stats.slaBreaches), change: 'live', up: false, icon: AlertTriangle, gradient: 'from-red-500 to-rose-400', bg: 'from-red-50 to-rose-50' },
    { label: 'Resolved Today', value: String(stats.resolvedToday), change: 'live', up: true, icon: CheckCircle2, gradient: 'from-green-500 to-emerald-400', bg: 'from-green-50 to-emerald-50' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-lg">
          <p className="text-xs font-bold text-gray-700 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="text-xs" style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      )
    }
    return null
  }

  const isActiveEvent = (ev: any) => {
    const now = new Date()
    return new Date(ev.start_date) <= now && new Date(ev.end_date) >= now
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Dark Header */}
      <div className="bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="text-xl font-bold" style={{
            background: 'linear-gradient(135deg, #60A5FA 0%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>தீர்வு</span>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.93 }}
              className="relative w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'AD'}
            </motion.button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 pb-4 flex gap-2 overflow-x-auto">
          {[
            { label: 'Overview', route: '/admin', active: true },
            { label: 'Events', route: '/admin/events', active: false },
            { label: 'Users', route: '/admin/users', active: false },
          ].map(nav => (
            <button key={nav.label} onClick={() => navigate(nav.route)}
              className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                nav.active ? 'bg-white text-gray-900' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}>
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${kpi.bg} rounded-3xl p-5 border border-white shadow-sm`}>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">{kpi.label}</p>
                <div className={`flex items-center gap-1 text-xs font-semibold ${kpi.up ? 'text-blue-500' : 'text-green-600'}`}>
                  {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Weekly Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900">Tickets This Week</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="raised" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} name="Raised" />
              <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
                <BarChart3 size={15} className="text-white" />
              </div>
              <p className="text-xs font-bold text-gray-900">By Category</p>
            </div>
            {categoryStats.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={categoryStats} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} width={65} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tickets">
                    {categoryStats.map((entry, index) => (
                      <Cell key={index} fill={categoryColors[entry.name] || '#6B7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center">
                <AlertTriangle size={15} className="text-white" />
              </div>
              <p className="text-xs font-bold text-gray-900">By Priority</p>
            </div>
            {priorityStats.every(p => p.value === 0) ? (
              <p className="text-xs text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={priorityStats.filter(p => p.value > 0)} cx="50%" cy="50%"
                      innerRadius={35} outerRadius={55} dataKey="value">
                      {priorityStats.map((entry, index) => (
                        <Cell key={index} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {priorityStats.filter(p => p.value > 0).map(p => (
                    <div key={p.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: PRIORITY_COLORS[p.name as keyof typeof PRIORITY_COLORS] }} />
                      <span className="text-[9px] text-gray-500 capitalize">{p.name} ({p.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Hostel Heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900">Hostel Block Heatmap</p>
          </div>
          {hostelStats.every(h => h.tickets === 0) ? (
            <p className="text-xs text-gray-400 text-center py-4">No hostel tickets yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={hostelStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="block" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tickets" fill="#F97316" radius={[4, 4, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* College Calendar — real data */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
                <Calendar size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">College Calendar</p>
                <p className="text-[10px] text-gray-400">{events.length} event{events.length !== 1 ? 's' : ''} · real-time</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/events')}
              className="text-xs text-blue-600 font-semibold flex items-center gap-1">
              Manage <ArrowRight size={11} />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No events added yet</p>
              <button onClick={() => navigate('/admin/events')}
                className="text-xs text-blue-500 font-semibold mt-2">
                Add your first event →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((ev: any) => {
                const active = isActiveEvent(ev)
                const colorClass = eventTypeColors[ev.type] || 'bg-blue-500'
                const start = new Date(ev.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                const end = new Date(ev.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                const dateStr = start === end ? start : `${start} – ${end}`
                const batches = (ev.affected_batches || ['All']).join(', ')

                return (
                  <div key={ev.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    active ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                  }`}>
                    <div className={`w-2 h-10 ${colorClass} rounded-full flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-800 truncate">{ev.title}</p>
                        {active && (
                          <span className="text-[9px] font-bold bg-green-100 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{dateStr} · {batches}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded-lg flex-shrink-0">
                      {ev.priority_multiplier}× priority
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  )
}