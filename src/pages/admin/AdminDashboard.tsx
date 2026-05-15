import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TicketIcon, Clock, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, Flag, Calendar,
  Wifi, Zap, BookOpen, Bus, UtensilsCrossed, Stethoscope,
  Library, Bell, BarChart3, ArrowRight
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'

const categoryIcons: Record<string, any> = {
  'IT & Network': Wifi, 'Hostel': Zap, 'Academics': BookOpen,
  'Transport': Bus, 'Canteen': UtensilsCrossed, 'Medical': Stethoscope, 'Library': Library,
}

const categoryGradients: Record<string, string> = {
  'IT & Network': 'from-blue-500 to-cyan-400',
  'Hostel': 'from-orange-400 to-amber-300',
  'Academics': 'from-violet-500 to-purple-400',
  'Transport': 'from-green-500 to-emerald-400',
  'Canteen': 'from-pink-500 to-rose-400',
  'Medical': 'from-red-500 to-rose-400',
  'Library': 'from-indigo-500 to-blue-400',
}

const recentEvents = [
  { title: 'End Semester Exam', type: 'exam', date: 'May 15–22', multiplier: '2.0x', color: 'bg-red-500' },
  { title: 'College Day', type: 'event', date: 'May 25', multiplier: '1.3x', color: 'bg-violet-500' },
  { title: 'Summer Holiday', type: 'holiday', date: 'Jun 1–30', multiplier: '0.7x', color: 'bg-green-500' },
]

const hostelHeatmap = [
  { block: 'Block A', tickets: 8, color: 'bg-red-500', pct: 80 },
  { block: 'Block B', tickets: 5, color: 'bg-amber-400', pct: 50 },
  { block: 'Block C', tickets: 9, color: 'bg-red-600', pct: 90 },
  { block: 'Block D', tickets: 2, color: 'bg-green-400', pct: 20 },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState({ open: 0, resolvedToday: 0, slaBreaches: 0 })
  const [flaggedTickets, setFlaggedTickets] = useState<any[]>([])
  const [categoryStats, setCategoryStats] = useState<any[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status, priority_label, is_flagged, created_at, resolved_at, categories(name)')

    if (!tickets) return

    const open = tickets.filter(t => t.status === 'open').length
    const flagged = tickets.filter(t => t.is_flagged)
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
      .map(([label, count]) => ({ label, count, pct: Math.round((count / tickets.length) * 100) }))
      .sort((a, b) => b.count - a.count)

    setStats({ open, resolvedToday, slaBreaches: 0 })
    setFlaggedTickets(flagged)
    setCategoryStats(catArray)
  }

  const kpis = [
    { label: 'Open Tickets', value: String(stats.open), change: 'live', up: true, icon: TicketIcon, gradient: 'from-blue-500 to-cyan-400', bg: 'from-blue-50 to-cyan-50' },
    { label: 'Avg Resolution', value: '3.2h', change: 'estimated', up: false, icon: Clock, gradient: 'from-green-500 to-emerald-400', bg: 'from-green-50 to-emerald-50' },
    { label: 'SLA Breaches', value: String(stats.slaBreaches), change: 'live', up: false, icon: AlertTriangle, gradient: 'from-red-500 to-rose-400', bg: 'from-red-50 to-rose-50' },
    { label: 'Resolved Today', value: String(stats.resolvedToday), change: 'live', up: true, icon: CheckCircle2, gradient: 'from-violet-500 to-purple-400', bg: 'from-violet-50 to-purple-50' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Dark Header */}
      <div className="bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs font-medium">Admin Portal</p>
            <h1 className="text-white text-lg font-bold">Operations Centre</h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.93 }} className="relative w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={signOut}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-sm"
            >
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'AD'}
            </motion.button>
          </div>
        </div>

        {/* Dark Nav */}
        <div className="max-w-3xl mx-auto px-5 pb-4 flex gap-2 overflow-x-auto">
          {[
            { label: 'Overview', route: '/admin', active: true },
            { label: 'Flagged', route: '/admin/flagged', active: false, badge: flaggedTickets.length },
            { label: 'Events', route: '/admin/events', active: false },
            { label: 'Users', route: '/admin/users', active: false },
          ].map(nav => (
            <button
              key={nav.label}
              onClick={() => navigate(nav.route)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                nav.active ? 'bg-white text-gray-900' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {nav.label}
              {nav.badge ? (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
                  {nav.badge}
                </span>
              ) : null}
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
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${kpi.bg} rounded-3xl p-5 border border-white shadow-sm`}
              >
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

        {/* Flagged Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Flag size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Flagged Tickets</p>
                <p className="text-[10px] text-gray-400">AI couldn't classify these</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/flagged')} className="text-xs text-blue-600 font-semibold flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {flaggedTickets.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 size={24} className="text-green-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No flagged tickets — all clear!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedTickets.slice(0, 2).map((t: any) => (
                <div key={t.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-bold text-gray-900">{t.title}</p>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">
                      {Math.round((t.ai_confidence_score || 0) * 100)}% match
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">{t.ticket_number} · {t.ai_suggested_category || 'Uncategorized'}</p>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-semibold text-white bg-blue-500 px-3 py-1.5 rounded-xl">Assign</button>
                    <button className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl">Review</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tickets by Category */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <BarChart3 size={15} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900">Tickets by Category</p>
          </div>
          {categoryStats.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No ticket data yet</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const Icon = categoryIcons[cat.label] || BarChart3
                const gradient = categoryGradients[cat.label] || 'from-gray-400 to-gray-500'
                return (
                  <div key={cat.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                        <span className="text-xs font-bold text-gray-900">{cat.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.pct}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Hostel Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900">Hostel Block Heatmap</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {hostelHeatmap.map((h) => (
              <div key={h.block} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800">{h.block}</span>
                  <span className="text-xs font-bold text-gray-900">{h.tickets} tickets</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${h.pct}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full ${h.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Events */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
                <Calendar size={15} className="text-white" />
              </div>
              <p className="text-sm font-bold text-gray-900">College Calendar</p>
            </div>
            <button onClick={() => navigate('/admin/events')} className="text-xs text-blue-600 font-semibold flex items-center gap-1">
              Manage <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {recentEvents.map((ev) => (
              <div key={ev.title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className={`w-2 h-8 ${ev.color} rounded-full flex-shrink-0`} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{ev.title}</p>
                  <p className="text-[10px] text-gray-400">{ev.date}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded-lg">
                  {ev.multiplier} priority
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}