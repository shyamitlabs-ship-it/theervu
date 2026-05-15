import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Flag, Sparkles, CheckCircle2, X,
  ChevronDown, AlertTriangle, Clock, User
} from 'lucide-react'

const categories = [
  'IT & Network', 'Hostel', 'Academics', 'Transport',
  'Canteen', 'Medical', 'Library', 'Finance / Accounts', 'Other'
]

const flagged = [
  {
    id: 'THR-2024-0044',
    title: 'Scholarship disbursement issue',
    desc: 'My scholarship amount was not credited this month even though my attendance is above 75%. The finance office is not responding.',
    student: 'Arun Kumar', batch: '23BIT', time: '1h ago',
    aiSuggestion: 'Finance / Accounts', confidence: 42,
    reason: 'No matching category found in system',
  },
  {
    id: 'THR-2024-0039',
    title: 'Classroom projector flickering during lecture',
    desc: 'The projector in Room 301 CSE block keeps flickering every 10 minutes. Very disruptive during lectures.',
    student: 'Priya S', batch: '23BCE', time: '3h ago',
    aiSuggestion: 'IT & Network', confidence: 58,
    reason: 'Ambiguous — could be IT or Academics',
  },
  {
    id: 'THR-2024-0036',
    title: 'Sports equipment damaged and not replaced',
    desc: 'The cricket nets in the sports ground have been torn for 3 weeks. No action taken despite multiple complaints.',
    student: 'Rahul P', batch: '22BME', time: '6h ago',
    aiSuggestion: 'Other', confidence: 31,
    reason: 'Sports/Facilities not in current categories',
  },
  {
    id: 'THR-2024-0031',
    title: 'Exam hall seating not updated',
    desc: 'My seating arrangement shows wrong hall number on the portal. Exam is tomorrow.',
    student: 'Divya M', batch: '23BIT', time: '1d ago',
    aiSuggestion: 'Academics', confidence: 71,
    reason: 'Borderline confidence — needs human review',
  },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }

export default function AdminFlagged() {
  const navigate = useNavigate()
  const [resolved, setResolved] = useState<string[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string>>({})

  const handleAssign = (id: string) => {
    setResolved([...resolved, id])
    setAssigning(null)
  }

  const active = flagged.filter(t => !resolved.includes(t.id))

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
            <h1 className="text-white text-base font-bold">Flagged Tickets</h1>
            <p className="text-white/40 text-xs">Needs manual category assignment</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <Flag size={12} className="text-amber-400" />
            <span className="text-amber-400 text-xs font-bold">{active.length} pending</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5">

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 flex items-start gap-3"
        >
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">These tickets need your attention</p>
            <p className="text-[10px] text-amber-600 mt-0.5">AI confidence was below 60% for these. Assign a category and staff member to proceed.</p>
          </div>
        </motion.div>

        {/* Resolved count */}
        {resolved.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 border border-green-100 rounded-2xl p-3 mb-4 flex items-center gap-2"
          >
            <CheckCircle2 size={14} className="text-green-500" />
            <p className="text-xs font-semibold text-green-700">{resolved.length} ticket{resolved.length > 1 ? 's' : ''} assigned successfully</p>
          </motion.div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <AnimatePresence>
            {active.map((ticket) => {
              const isAssigning = assigning === ticket.id
              const cat = selectedCategory[ticket.id] || ticket.aiSuggestion
              const confColor = ticket.confidence >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200'

              return (
                <motion.div
                  key={ticket.id}
                  variants={item}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.3 } }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Top bar */}
                  <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Uncategorized</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${confColor}`}>
                      {ticket.confidence}% AI confidence
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Title + Meta */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{ticket.title}</h3>
                    <p className="text-[10px] text-gray-400 mb-3">{ticket.id} · {ticket.time}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{ticket.desc}</p>

                    {/* Student */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-700">{ticket.student}</p>
                        <p className="text-[9px] text-gray-400">{ticket.batch}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-gray-400">
                        <Clock size={10} />
                        <span className="text-[10px]">{ticket.time}</span>
                      </div>
                    </div>

                    {/* AI Reason */}
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 mb-4 flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles size={11} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-violet-800 mb-0.5">AI Analysis</p>
                        <p className="text-[10px] text-violet-600">{ticket.reason}</p>
                        <p className="text-[10px] text-violet-700 font-semibold mt-1">Best guess: {ticket.aiSuggestion}</p>
                      </div>
                    </div>

                    {/* Category Selector */}
                    <AnimatePresence>
                      {isAssigning && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 overflow-hidden"
                        >
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Select Category</p>
                          <div className="flex flex-wrap gap-2">
                            {categories.map(c => (
                              <button
                                key={c}
                                onClick={() => setSelectedCategory({ ...selectedCategory, [ticket.id]: c })}
                                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                                  cat === c
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isAssigning ? (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleAssign(ticket.id)}
                            className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-400 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 size={13} />
                            Confirm: {cat}
                          </motion.button>
                          <button
                            onClick={() => setAssigning(null)}
                            className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0"
                          >
                            <X size={15} className="text-gray-500" />
                          </button>
                        </>
                      ) : (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setAssigning(ticket.id)}
                            className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-400 shadow-sm"
                          >
                            Assign Category
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleAssign(ticket.id)}
                            className="flex-1 py-3 rounded-2xl text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100"
                          >
                            Accept AI Suggestion
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {active.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">All clear!</h3>
              <p className="text-sm text-gray-400">No flagged tickets remaining</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}