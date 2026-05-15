import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Bell, Wifi, Zap, BookOpen, Bus, UtensilsCrossed,
  Stethoscope, Library, ChevronRight, Clock, CheckCircle2,
  AlertCircle, Loader2, TrendingUp
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { getStudentTickets } from '../../lib/tickets'

const categories = [
  { id: 'hostel', label: 'Hostel', icon: Zap, gradient: 'from-orange-400 to-amber-300', bg: 'bg-orange-50', border: 'border-orange-100' },
  { id: 'it', label: 'IT & Network', icon: Wifi, gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50', border: 'border-blue-100' },
  { id: 'academics', label: 'Academics', icon: BookOpen, gradient: 'from-violet-500 to-purple-400', bg: 'bg-violet-50', border: 'border-violet-100' },
  { id: 'transport', label: 'Transport', icon: Bus, gradient: 'from-green-500 to-emerald-400', bg: 'bg-green-50', border: 'border-green-100' },
  { id: 'canteen', label: 'Canteen', icon: UtensilsCrossed, gradient: 'from-pink-500 to-rose-400', bg: 'bg-pink-50', border: 'border-pink-100' },
  { id: 'medical', label: 'Medical', icon: Stethoscope, gradient: 'from-red-500 to-rose-400', bg: 'bg-red-50', border: 'border-red-100' },
  { id: 'library', label: 'Library', icon: Library, gradient: 'from-indigo-500 to-blue-400', bg: 'bg-indigo-50', border: 'border-indigo-100' },
]

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  open: { label: 'Open', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  in_progress: { label: 'In Progress', icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-50' },
  awaiting_student: { label: 'Awaiting You', icon: Bell, color: 'text-violet-600', bg: 'bg-violet-50' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  closed: { label: 'Closed', icon: CheckCircle2, color: 'text-gray-600', bg: 'bg-gray-50' },
}

const priorityConfig: Record<string, { label: string; color: string; slaBar: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-100', slaBar: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-100', slaBar: 'bg-orange-400' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-100', slaBar: 'bg-amber-400' },
  low: { label: 'Low', color: 'text-green-600 bg-green-50 border-green-100', slaBar: 'bg-green-400' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }

const navItems = [
  { label: 'Home', icon: TrendingUp, route: '/student' },
  { label: 'My Tickets', icon: Clock, route: '/student/tickets' },
  { label: 'Raise', icon: Plus, route: '/student/raise', special: true },
  { label: 'Notifications', icon: Bell, route: '/student/notifications' },
]

export default function StudentHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (user) loadTickets()
  }, [user])

  const loadTickets = async () => {
    const { data } = await getStudentTickets(user!.id)
    if (data) setTickets(data)
    setLoading(false)
  }

  const openCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="text-xl font-bold" style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>தீர்வு</span>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.93 }} className="relative w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Bell size={18} className="text-gray-600" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={signOut}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm"
            >
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SS'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-28">

        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 rounded-3xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative p-7">
            <p className="text-blue-400 text-xs font-semibold tracking-widest uppercase mb-2">Campus Support</p>
            <h2 className="text-white text-2xl font-bold leading-tight mb-1">Need help with<br />something? 🎓</h2>
            <p className="text-white/40 text-sm mb-5">We'll get it sorted, fast.</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/student/raise')}
              className="flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={16} />
              Raise a Ticket
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Open', value: openCount, icon: AlertCircle, color: 'text-blue-600', bg: 'from-blue-50 to-blue-100/50' },
            { label: 'In Progress', value: inProgressCount, icon: TrendingUp, color: 'text-amber-600', bg: 'from-amber-50 to-amber-100/50' },
            { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: 'text-green-600', bg: 'from-green-50 to-green-100/50' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} variants={item} className={`bg-gradient-to-br ${stat.bg} rounded-2xl p-4 border border-white`}>
                <Icon size={16} className={stat.color} />
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Categories */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Quick Raise</h2>
          </div>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <motion.button
                  key={cat.id}
                  variants={item}
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ y: -3 }}
                  onClick={() => navigate('/student/raise')}
                  className={`${cat.bg} ${cat.border} border rounded-2xl p-3 flex flex-col items-center gap-2 transition-all`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{cat.label}</span>
                </motion.button>
              )
            })}
          </motion.div>
        </div>

        {/* Real Tickets */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Your Tickets</h2>
            <button onClick={() => navigate('/student/tickets')} className="text-xs text-blue-600 font-medium flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-semibold text-gray-700">No tickets yet</p>
              <p className="text-xs text-gray-400 mt-1">Raise one if you need help</p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {tickets.slice(0, 5).map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig['open']
                const priority = priorityConfig[ticket.priority_label] || priorityConfig['medium']
                const StatusIcon = status.icon
                const slaUsed = ticket.sla_deadline
                  ? Math.min(100, Math.round(
                      (Date.now() - new Date(ticket.created_at).getTime()) /
                      (new Date(ticket.sla_deadline).getTime() - new Date(ticket.created_at).getTime()) * 100
                    ))
                  : 50

                return (
                  <motion.div
                    key={ticket.id}
                    variants={item}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(`/student/tickets/${ticket.id}`)}
                    className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-3">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{ticket.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ticket.categories?.name || 'General'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${priority.color}`}>
                        {priority.label}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">SLA Health</span>
                        <span className="text-[10px] text-gray-500">{slaUsed}% used</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${slaUsed}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full ${priority.slaBar} rounded-full`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 ${status.color} ${status.bg} px-2.5 py-1 rounded-full`}>
                        <StatusIcon size={11} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-semibold">{status.label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock size={11} />
                        <span className="text-[10px]">{getTimeAgo(ticket.created_at)}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-40">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-around">
          {navItems.map((nav) => {
            const Icon = nav.icon
            const isActive = location.pathname === nav.route
            return (
              <motion.button
                key={nav.label}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(nav.route)}
                className="flex flex-col items-center gap-1"
              >
                {nav.special ? (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 -mt-5">
                    <Icon size={20} className="text-white" />
                  </div>
                ) : (
                  <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                )}
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'} ${nav.special ? 'mt-1' : ''}`}>
                  {nav.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}