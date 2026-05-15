import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Loader2, AlertCircle,
  MessageCircle, Send, User, Zap, Sparkles, Eye, EyeOff,
  ChevronDown, MapPin, Calendar
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { getTicketById, updateTicketStatus, addComment } from '../../lib/tickets'
import { supabase } from '../../lib/supabase'

const statusOptions = [
  { id: 'open', label: 'Open', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'in_progress', label: 'In Progress', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'awaiting_student', label: 'Awaiting Student', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'resolved', label: 'Resolved', color: 'text-green-600 bg-green-50 border-green-200' },
]

const priorityConfig: Record<string, { label: string; gradient: string }> = {
  critical: { label: 'Critical', gradient: 'from-red-500 to-rose-400' },
  high: { label: 'High', gradient: 'from-amber-500 to-orange-500' },
  medium: { label: 'Medium', gradient: 'from-yellow-400 to-amber-400' },
  low: { label: 'Low', gradient: 'from-green-500 to-emerald-400' },
}

export default function StaffTicketDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('open')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSimilar, setShowSimilar] = useState(true)

  useEffect(() => {
    if (id) {
      loadData()

      // Realtime for new comments
      const commentSub = supabase
        .channel(`staff-ticket-${id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${id}`
        }, async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', payload.new.author_id)
            .single()
          setComments((prev: any[]) => [...prev, { ...payload.new, profiles: profile }])
        })
        .subscribe()

      return () => { supabase.removeChannel(commentSub) }
    }
  }, [id])

  const loadData = async () => {
    const { data: t } = await getTicketById(id!)
    if (t) {
      setTicket(t)
      setStatus(t.status)
    }

    const { data: c } = await supabase
      .from('ticket_comments')
      .select('*, profiles(name, role)')
      .eq('ticket_id', id!)
      .order('created_at', { ascending: true })
    if (c) setComments(c)
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    setShowStatusMenu(false)
    await updateTicketStatus(id!, newStatus)
  }

  const sendMessage = async () => {
    if (!message.trim() || !user || !id) return
    setSending(true)
    const { data } = await addComment(id, user.id, message, isInternal)
    if (data) {
      setComments([...comments, { ...data, profiles: { name: user.name, role: user.role } }])
      setMessage('')
    }
    setSending(false)
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

  if (loading) return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )

  if (!ticket) return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <p className="text-gray-400">Ticket not found</p>
    </div>
  )

  const priority = priorityConfig[ticket.priority_label] || priorityConfig['medium']
  const currentStatus = statusOptions.find(s => s.id === status)!
  const slaUsed = ticket.sla_deadline
    ? Math.min(100, Math.round(
        (Date.now() - new Date(ticket.created_at).getTime()) /
        (new Date(ticket.sla_deadline).getTime() - new Date(ticket.created_at).getTime()) * 100
      ))
    : 50

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/staff')}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">{ticket.ticket_number}</h1>
            <p className="text-xs text-gray-400">{ticket.categories?.name} · Assigned to you</p>
          </div>

          {/* Status Selector */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${currentStatus.color}`}
            >
              {currentStatus.label}
              <ChevronDown size={12} />
            </motion.button>
            <AnimatePresence>
              {showStatusMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50 min-w-[160px]"
                >
                  {statusOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleStatusChange(opt.id)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors ${
                        status === opt.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 space-y-4">

        {/* Priority Banner */}
        <div className={`bg-gradient-to-r ${priority.gradient} rounded-3xl p-4 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{priority.label} Priority</p>
            <p className="text-white/80 text-[10px]">
              {ticket.active_event_context ? `📅 ${ticket.active_event_context} · ` : ''}
              🕐 {getTimeAgo(ticket.created_at)} · SLA {slaUsed}% used
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[9px] font-semibold uppercase">Score</p>
            <p className="text-white font-bold text-lg">{Math.round(ticket.priority_score)}</p>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Student</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
              {ticket.profiles?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{ticket.profiles?.name || 'Student'}</p>
              <p className="text-xs text-gray-400">{ticket.profiles?.batch || ''} · {ticket.profiles?.department || ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ticket.profiles?.hostel_block && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-[10px] text-gray-600 font-medium">{ticket.location || ticket.profiles?.hostel_block}</span>
              </div>
            )}
            {ticket.profiles?.batch && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-[10px] text-gray-600 font-medium">Batch {ticket.profiles?.batch}</span>
              </div>
            )}
          </div>
        </div>

        {/* Issue Details */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Issue</p>
          <h2 className="text-base font-bold text-gray-900 mb-2">{ticket.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{ticket.description}</p>
        </div>

        {/* SLA */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">SLA Health</p>
            <span className={`text-xs font-bold ${slaUsed > 80 ? 'text-red-500' : slaUsed > 50 ? 'text-amber-500' : 'text-green-500'}`}>
              {slaUsed}% used
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${slaUsed}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${slaUsed > 80 ? 'bg-red-500' : slaUsed > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Deadline: {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
          </p>
        </div>

        {/* AI Similar Tickets */}
        <AnimatePresence>
          {showSimilar && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 rounded-3xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">How similar tickets were resolved</p>
                    <p className="text-[10px] text-gray-400">Based on category and description</p>
                  </div>
                </div>
                <button onClick={() => setShowSimilar(false)} className="text-[10px] text-gray-400">Hide</button>
              </div>
              <div className="space-y-2">
                {[
                  { title: `Similar ${ticket.categories?.name} issue`, solution: 'Check the main infrastructure unit and reset if needed.', time: '3 days ago' },
                  { title: 'Recurring issue in same area', solution: 'Escalate to facilities team if not resolved within 2 hours.', time: '1 week ago' },
                ].map((t, i) => (
                  <div key={i} className="bg-white rounded-2xl p-3 border border-white shadow-sm">
                    <p className="text-xs font-semibold text-gray-800 mb-0.5">{t.title}</p>
                    <p className="text-[10px] text-gray-500 mb-1.5">💡 {t.solution}</p>
                    <span className="text-[9px] text-gray-400">{t.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
            <MessageCircle size={11} className="inline mr-1" />
            Conversation {comments.length > 0 && `(${comments.length})`}
          </p>

          {comments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No messages yet.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.profiles?.role === 'student' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.profiles?.role === 'student' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-2 mt-auto flex-shrink-0">
                      <User size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[78%] px-4 py-2.5 ${
                    msg.is_internal
                      ? 'bg-amber-50 border border-amber-200 border-dashed rounded-3xl rounded-br-sm'
                      : msg.profiles?.role === 'student'
                      ? 'bg-gray-50 border border-gray-100 text-gray-800 rounded-3xl rounded-bl-sm'
                      : 'bg-gradient-to-br from-violet-500 to-purple-400 text-white rounded-3xl rounded-br-sm'
                  }`}>
                    {msg.is_internal && (
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <EyeOff size={9} /> Internal note
                      </p>
                    )}
                    <p className={`text-xs leading-relaxed ${msg.profiles?.role !== 'student' && !msg.is_internal ? 'text-white' : 'text-gray-800'}`}>
                      {msg.content}
                    </p>
                    <p className={`text-[9px] mt-1 ${msg.profiles?.role !== 'student' && !msg.is_internal ? 'text-violet-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setIsInternal(false)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                !isInternal ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Eye size={11} /> Reply to student
            </button>
            <button
              onClick={() => setIsInternal(true)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                isInternal ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <EyeOff size={11} /> Internal note
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={isInternal ? 'Internal note (staff only)...' : 'Reply to student...'}
              className={`flex-1 border rounded-2xl px-4 py-2.5 text-sm focus:outline-none transition-all ${
                isInternal
                  ? 'bg-amber-50 border-amber-200 text-gray-900 placeholder-amber-400 focus:border-amber-400'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400'
              }`}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={sending}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                isInternal
                  ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                  : 'bg-gradient-to-br from-violet-500 to-purple-400'
              }`}
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} className="text-white" />
              }
            </motion.button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          {[
            { label: 'Mark Resolved', icon: CheckCircle2, gradient: 'from-green-500 to-emerald-400', shadow: 'shadow-green-500/25', action: () => handleStatusChange('resolved') },
            { label: 'Escalate', icon: AlertCircle, gradient: 'from-red-500 to-rose-400', shadow: 'shadow-red-500/25', action: () => handleStatusChange('in_progress') },
          ].map(btn => {
            const Icon = btn.icon
            return (
              <motion.button
                key={btn.label}
                whileTap={{ scale: 0.97 }}
                onClick={btn.action}
                className={`py-3.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r ${btn.gradient} shadow-lg ${btn.shadow} flex items-center justify-center gap-2`}
              >
                <Icon size={15} />
                {btn.label}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}