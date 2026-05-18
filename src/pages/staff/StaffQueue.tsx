import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Wifi, Zap, BookOpen, Bus, UtensilsCrossed, Stethoscope,
  Library, Clock, AlertCircle, Loader2, Filter, Search,
  ChevronRight, Bell, TrendingUp
} from 'lucide-react'
import { getStaffTickets } from '../../lib/tickets'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import ProfileModal from '../../components/shared/ProfileModal'

const categoryIcons: Record<string, any> = {
  'IT & Network': Wifi, 'Hostel': Zap, 'Academics': BookOpen,
  'Transport': Bus, 'Canteen': UtensilsCrossed, 'Medical': Stethoscope, 'Library': Library,
}

const categoryColors: Record<string, string> = {
  'IT & Network': 'from-blue-500 to-cyan-400',
  'Hostel': 'from-orange-400 to-amber-300',
  'Academics': 'from-violet-500 to-purple-400',
  'Transport': 'from-green-500 to-emerald-400',
  'Canteen': 'from-pink-500 to-rose-400',
  'Medical': 'from-red-500 to-rose-400',
  'Library': 'from-indigo-500 to-blue-400',
}

const priorityConfig: Record<string, { label: string; color: string; bar: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50', bar: 'bg-red-500', border: 'border-l-red-500' },
  high: { label: 'High', color: 'text-orange-600 bg-orange-50', bar: 'bg-orange-400', border: 'border-l-orange-400' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50', bar: 'bg-amber-400', border: 'border-l-amber-400' },
  low: { label: 'Low', color: 'text-green-600 bg-green-50', bar: 'bg-green-400', border: 'border-l-green-400' },
}

const filters = ['All', 'Critical', 'Open', 'In Progress']

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }

function StaffContextWidget({ tickets }: { tickets: any[] }) {
  const hour = new Date().getHours()
  const isNight = hour >= 22 || hour < 6
  const isEvening = hour >= 18 && hour < 22

  const critical = tickets.filter(t => t.priority_label === 'critical').length
  const overdue = tickets.filter(t => {
    if (!t.sla_deadline) return false
    return new Date(t.sla_deadline) < new Date() && t.status !== 'resolved'
  }).length
  const unassigned = tickets.filter(t => !t.assigned_staff_id && t.status === 'open').length

  const timeGreeting = isNight ? '🌙 Night shift' : isEvening ? '🌆 Evening shift' : '☀️ Day shift'
  const timeColor = isNight ? 'from-indigo-900 to-blue-900' : isEvening ? 'from-violet-800 to-indigo-800' : 'from-violet-600 to-purple-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${timeColor} rounded-3xl p-5 mb-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white/60 text-xs font-medium">{timeGreeting}</p>
          <p className="text-white font-bold text-base mt-0.5">
            {critical > 0 ? `⚠️ ${critical} critical ticket${critical > 1 ? 's' : ''} need attention`
              : overdue > 0 ? `⏰ ${overdue} ticket${overdue > 1 ? 's' : ''} past SLA deadline`
              : unassigned > 0 ? `📋 ${unassigned} unassigned ticket${unassigned > 1 ? 's' : ''}`
              : '✅ Queue looks healthy'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/50 text-[9px] uppercase tracking-wide">Queue</p>
          <p className="text-white font-bold text-2xl">{tickets.length}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {critical > 0 && (
          <span className="text-[10px] font-bold bg-red-500/30 text-red-200 border border-red-400/30 px-2.5 py-1 rounded-full">
            {critical} Critical
          </span>
        )}
        {overdue > 0 && (
          <span className="text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30 px-2.5 py-1 rounded-full">
            {overdue} Overdue
          </span>
        )}
        {unassigned > 0 && (
          <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-1 rounded-full">
            {unassigned} Unassigned
          </span>
        )}
        {critical === 0 && overdue === 0 && unassigned === 0 && (
          <span className="text-[10px] font-bold bg-green-500/30 text-green-200 border border-green-400/30 px-2.5 py-1 rounded-full">
            All clear
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default function StaffQueue() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    const { data } = await getStaffTickets()
    if (data) setTickets(data)
    setLoading(false)
  }

  const filtered = tickets.filter(t => {
    const matchesFilter = activeFilter === 'All' ||
      (activeFilter === 'Critical' && t.priority_label === 'critical') ||
      (activeFilter === 'Open' && t.status === 'open') ||
      (activeFilter === 'In Progress' && t.status === 'in_progress')
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.profiles?.name?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="text-xl font-bold" style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>தீர்வு</span>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.93 }}
              className="relative w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Bell size={18} className="text-gray-600" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white font-bold text-sm"
            >
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'ST'}
            </motion.button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets or students..."
              className="w-full bg-gray-100 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-gray-200 transition-all" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 pb-4 flex gap-2 overflow-x-auto">
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                activeFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-4">

        {/* Context Widget */}
        {!loading && <StaffContextWidget tickets={tickets} />}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'text-blue-600', bg: 'from-blue-50 to-blue-100/50', icon: AlertCircle },
            { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'text-amber-600', bg: 'from-amber-50 to-amber-100/50', icon: Loader2 },
            { label: 'Total', value: tickets.length, color: 'text-violet-600', bg: 'from-violet-50 to-violet-100/50', icon: TrendingUp },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-2xl p-4 border border-white`}>
                <Icon size={15} className={stat.color} />
                <p className="text-2xl font-bold text-gray-900 mt-1.5">{stat.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">{filtered.length} tickets</p>
          <button className="flex items-center gap-1 text-xs text-gray-500">
            <Filter size={12} /> Sort by priority
          </button>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 border-l-4 border-l-gray-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded-full animate-pulse w-2/3" />
                      <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/3" />
                    </div>
                    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full animate-pulse mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                    <div className="h-3 w-12 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-semibold text-gray-700">No tickets found</p>
              <p className="text-xs text-gray-400 mt-1">Queue is clear</p>
            </div>
          ) : filtered.map((ticket) => {
            const priority = priorityConfig[ticket.priority_label] || priorityConfig['medium']
            const categoryName = ticket.categories?.name || 'General'
            const Icon = categoryIcons[categoryName] || AlertCircle
            const gradColor = categoryColors[categoryName] || 'from-gray-500 to-gray-400'
            const slaColor = ticket.priority_score > 80 ? 'bg-red-500' : ticket.priority_score > 50 ? 'bg-amber-400' : 'bg-green-400'
            const timeAgo = new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            return (
              <motion.div key={ticket.id} variants={item} whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
                className={`bg-white rounded-3xl border-l-4 ${priority.border} border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden`}>
                {ticket.priority_label === 'critical' && (
                  <div className="bg-red-50 px-5 py-2 flex items-center gap-2 border-b border-red-100">
                    <AlertCircle size={12} className="text-red-500" />
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Critical — Immediate attention required</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{ticket.title}</p>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${priority.color}`}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ticket.ticket_number} · {categoryName}</p>
                    </div>
                  </div>

                  {ticket.active_event_context && (
                    <div className="mb-3">
                      <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-2.5 py-1 rounded-full font-semibold">
                        📅 {ticket.active_event_context}
                      </span>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-400 font-medium">Priority Score</span>
                      <span className={`text-[10px] font-bold ${ticket.priority_score > 80 ? 'text-red-500' : ticket.priority_score > 50 ? 'text-amber-500' : 'text-green-500'}`}>
                        {Math.round(ticket.priority_score)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }}
                        animate={{ width: `${Math.min(ticket.priority_score, 100)}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full ${slaColor} rounded-full`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">
                          {ticket.profiles?.name?.split(' ').map((n: string) => n[0]).join('') || 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-700">{ticket.profiles?.name || 'Student'}</p>
                        <p className="text-[9px] text-gray-400">{ticket.location || 'Campus'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock size={10} />
                      <span className="text-[10px]">{timeAgo}</span>
                      <ChevronRight size={12} className="ml-1 text-gray-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  )
}