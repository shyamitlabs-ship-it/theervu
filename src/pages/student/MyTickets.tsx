import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Clock, CheckCircle2, AlertCircle,
  Loader2, Bell, ChevronRight, Search, Plus, TrendingUp
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { getStudentTickets } from '../../lib/tickets'

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  open: { label: 'Open', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  in_progress: { label: 'In Progress', icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-50' },
  awaiting_student: { label: 'Awaiting You', icon: Bell, color: 'text-violet-600', bg: 'bg-violet-50' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  closed: { label: 'Closed', icon: CheckCircle2, color: 'text-gray-600', bg: 'bg-gray-50' },
}

const priorityConfig: Record<string, { label: string; color: string; bar: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-100', bar: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-100', bar: 'bg-orange-400' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-100', bar: 'bg-amber-400' },
  low: { label: 'Low', color: 'text-green-600 bg-green-50 border-green-100', bar: 'bg-green-400' },
}

const filters = ['All', 'Open', 'In Progress', 'Resolved']

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }

export default function MyTickets() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) loadTickets()
  }, [user])

  const loadTickets = async () => {
    const { data } = await getStudentTickets(user!.id)
    if (data) setTickets(data)
    setLoading(false)
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  const filtered = tickets.filter(t => {
    const matchesFilter = filter === 'All' ||
      (filter === 'Open' && t.status === 'open') ||
      (filter === 'In Progress' && t.status === 'in_progress') ||
      (filter === 'Resolved' && t.status === 'resolved')
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/student')}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">My Tickets</h1>
            <p className="text-xs text-gray-400">{tickets.length} total</p>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto px-5 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your tickets..."
              className="w-full bg-gray-100 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-gray-200 transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-2xl mx-auto px-5 pb-4 flex gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 pb-10">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading your tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <p className="text-3xl mb-3">🎉</p>
            <p className="text-sm font-semibold text-gray-700">No tickets found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'All' ? 'Raise one if you need help' : `No ${filter.toLowerCase()} tickets`}
            </p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filtered.map((ticket) => {
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
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {ticket.ticket_number} · {ticket.categories?.name || 'General'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${priority.color}`}>
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
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full ${priority.bar} rounded-full`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 ${status.color} ${status.bg} px-2.5 py-1 rounded-full`}>
                      <StatusIcon size={11} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                      <span className="text-[10px] font-semibold">{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={11} />
                      <span className="text-[10px]">{getTimeAgo(ticket.created_at)}</span>
                      <ChevronRight size={12} className="text-gray-300" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-40">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-around">
          {[
            { label: 'Home', icon: TrendingUp, route: '/student' },
            { label: 'My Tickets', icon: Clock, route: '/student/tickets' },
            { label: 'Raise', icon: Plus, route: '/student/raise', special: true },
            { label: 'Notifications', icon: Bell, route: '/student' },
          ].map((nav) => {
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