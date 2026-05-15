import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, CheckCircle2, Clock, Loader2, AlertCircle,
  MessageCircle, Send, User, Headset
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { getTicketById, getTicketComments, addComment } from '../../lib/tickets'

const steps = [
  { id: 'open', label: 'Raised', icon: AlertCircle },
  { id: 'assigned', label: 'Assigned', icon: User },
  { id: 'in_progress', label: 'In Progress', icon: Loader2 },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
]

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-100' },
  high: { label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  low: { label: 'Low', color: 'text-green-600 bg-green-50 border-green-100' },
}

const statusOrder = ['open', 'assigned', 'in_progress', 'resolved']

export default function TicketDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()

      // Realtime subscription for ticket status changes
      const ticketSub = supabase
        .channel(`ticket-${id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${id}`
        }, (payload) => {
          setTicket((prev: any) => ({ ...prev, ...payload.new }))
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${id}`
        }, async (payload) => {
          // Fetch the author profile for the new comment
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', payload.new.author_id)
            .single()
          setComments((prev: any[]) => [...prev, { ...payload.new, profiles: profile }])
        })
        .subscribe()

      return () => { supabase.removeChannel(ticketSub) }
    }
  }, [id])

  const loadData = async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      getTicketById(id!),
      getTicketComments(id!)
    ])
    if (t) setTicket(t)
    if (c) setComments(c)
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!message.trim() || !user || !id) return
    setSending(true)
    const { data } = await addComment(id, user.id, message, false)
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
      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  if (!ticket) return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <p className="text-gray-400">Ticket not found</p>
    </div>
  )

  const priority = priorityConfig[ticket.priority_label] || priorityConfig['medium']
  const currentStepIndex = statusOrder.indexOf(ticket.status)
  const slaUsed = ticket.sla_deadline
    ? Math.min(100, Math.round(
        (Date.now() - new Date(ticket.created_at).getTime()) /
        (new Date(ticket.sla_deadline).getTime() - new Date(ticket.created_at).getTime()) * 100
      ))
    : 50

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">

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
            <h1 className="text-base font-bold text-gray-900">{ticket.ticket_number}</h1>
            <p className="text-xs text-gray-400">{ticket.categories?.name} · {getTimeAgo(ticket.created_at)}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${priority.color}`}>
            {priority.label}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 flex-1 w-full space-y-4">

        {/* Status Stepper */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Ticket Progress</p>
          <div className="flex items-center">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isDone = i < currentStepIndex
              const isActive = i === currentStepIndex
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive ? 'bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30'
                          : isDone ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Icon size={16} className={`${isActive || isDone ? 'text-white' : 'text-gray-400'} ${isActive && step.id === 'in_progress' ? 'animate-spin' : ''}`} />
                    </motion.div>
                    <span className={`text-[9px] font-semibold text-center leading-tight ${
                      isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'
                    }`}>{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full overflow-hidden bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isDone ? '100%' : '0%' }}
                        transition={{ duration: 0.8, delay: i * 0.2 }}
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 bg-blue-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
              <Headset size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-800">
                {ticket.status === 'open' ? 'Ticket received — awaiting assignment'
                  : ticket.status === 'in_progress' ? 'Team is working on it'
                  : ticket.status === 'resolved' ? 'Issue resolved!'
                  : 'Being processed'}
              </p>
              <p className="text-[10px] text-blue-500">Score: {Math.round(ticket.priority_score)} · {ticket.active_event_context || 'Normal period'}</p>
            </div>
          </motion.div>
        </div>

        {/* SLA Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">SLA Health</p>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">{slaUsed}% used</span>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${slaUsed}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${slaUsed > 80 ? 'bg-red-500' : slaUsed > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">Raised {getTimeAgo(ticket.created_at)}</span>
            <span className="text-[10px] text-gray-400">
              Deadline: {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Issue Details</p>
          <h2 className="text-base font-bold text-gray-900 mb-2">{ticket.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">{ticket.description}</p>
          <div className="flex flex-wrap gap-2">
            {ticket.location && (
              <span className="text-[10px] bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                📍 {ticket.location}
              </span>
            )}
            <span className="text-[10px] bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
              👤 {ticket.profiles?.name}
            </span>
            <span className="text-[10px] bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
              🕐 {getTimeAgo(ticket.created_at)}
            </span>
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
            <MessageCircle size={11} className="inline mr-1" />
            Conversation {comments.length > 0 && `(${comments.length})`}
          </p>

          {comments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No messages yet. Add a comment below.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.profiles?.role === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.profiles?.role !== 'student' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mr-2 mt-auto flex-shrink-0">
                      <Headset size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${msg.profiles?.role === 'student'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-3xl rounded-br-sm'
                    : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-3xl rounded-bl-sm'
                  } px-4 py-2.5`}>
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${msg.profiles?.role === 'student' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={sending}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm"
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} className="text-white" />
              }
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}