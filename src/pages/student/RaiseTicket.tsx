import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { createTicket } from '../../lib/tickets'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Wifi, Zap, BookOpen, Bus, UtensilsCrossed,
  Stethoscope, Library, MapPin, Paperclip, Send,
  Sparkles, CheckCircle2, ChevronRight, X
} from 'lucide-react'

const categories = [
  { id: 'hostel', label: 'Hostel', icon: Zap, gradient: 'from-orange-400 to-amber-300', light: 'bg-orange-50 border-orange-200' },
  { id: 'it', label: 'IT & Network', icon: Wifi, gradient: 'from-blue-500 to-cyan-400', light: 'bg-blue-50 border-blue-200' },
  { id: 'academics', label: 'Academics', icon: BookOpen, gradient: 'from-violet-500 to-purple-400', light: 'bg-violet-50 border-violet-200' },
  { id: 'transport', label: 'Transport', icon: Bus, gradient: 'from-green-500 to-emerald-400', light: 'bg-green-50 border-green-200' },
  { id: 'canteen', label: 'Canteen', icon: UtensilsCrossed, gradient: 'from-pink-500 to-rose-400', light: 'bg-pink-50 border-pink-200' },
  { id: 'medical', label: 'Medical', icon: Stethoscope, gradient: 'from-red-500 to-rose-400', light: 'bg-red-50 border-red-200' },
  { id: 'library', label: 'Library', icon: Library, gradient: 'from-indigo-500 to-blue-400', light: 'bg-indigo-50 border-indigo-200' },
]

const locations = ['Hostel Block A', 'Hostel Block B', 'Hostel Block C', 'Main Block', 'CSE Block', 'IT Block', 'Library', 'Canteen', 'Sports Block']

const similarTickets = [
  { id: 's1', title: 'WiFi down in Block C — Room 301', resolvedIn: '2h', solution: 'Router was reset by IT team. Fixed.' },
  { id: 's2', title: 'No internet in hostel after 10pm', resolvedIn: '4h', solution: 'ISP issue, escalated and resolved.' },
  { id: 's3', title: 'WiFi password not working', resolvedIn: '30m', solution: 'Password reset by IT. Contact IT desk.' },
]

const steps = ['Category', 'Details', 'Review']

export default function RaiseTicket() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [categoryDbId, setCategoryDbId] = useState('')
  const [categories_db, setCategories_db] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [showSimilar, setShowSimilar] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [deflected, setDeflected] = useState(false)

  const selectedCat = categories.find(c => c.id === selectedCategory)

  const handleDescriptionChange = (val: string) => {
    setDescription(val)
    if (val.length > 20 && !showSimilar) {
      setTimeout(() => setShowSimilar(true), 800)
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setSubmitted(true)

    // Find category ID from Supabase
    const { data: cats } = await supabase.from('categories').select('*')
    const matchedCat = cats?.find((c: any) =>
      c.name.toLowerCase() === selectedCat?.label.toLowerCase()
    )

    await createTicket({
      studentId: user.id,
      title,
      description,
      categoryId: matchedCat?.id || '',
      location: location || 'Not specified',
    })

    setTimeout(() => navigate('/student'), 2500)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30"
          >
            <CheckCircle2 size={48} className="text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Raised!</h2>
          <p className="text-gray-500 text-sm mb-2">THR-2024-0043</p>
          <p className="text-gray-400 text-sm">We're on it. Redirecting you back...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => step === 0 ? navigate('/student') : setStep(step - 1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Raise a Ticket</h1>
            <p className="text-xs text-gray-400">Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="max-w-2xl mx-auto px-5 pb-4">
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
                <p className={`text-[10px] mt-1 font-medium ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <AnimatePresence mode="wait">

          {/* Step 0 — Category */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-1">What's the issue about?</h2>
              <p className="text-sm text-gray-400 mb-6">Pick the category that best fits</p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = selectedCategory === cat.id
                  return (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected ? `${cat.light} border-opacity-100 shadow-md` : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <span className="font-semibold text-sm text-gray-800 text-left">{cat.label}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                        >
                          <CheckCircle2 size={12} className="text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={!selectedCategory}
                onClick={() => setStep(1)}
                className={`w-full mt-6 py-4 rounded-2xl font-semibold text-sm transition-all ${
                  selectedCategory
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                Continue <ChevronRight size={16} className="inline" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 1 — Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {selectedCat && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${selectedCat.light} border mb-5`}>
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${selectedCat.gradient} flex items-center justify-center`}>
                    <selectedCat.icon size={11} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{selectedCat.label}</span>
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-900 mb-1">Describe your issue</h2>
              <p className="text-sm text-gray-400 mb-5">More detail = faster resolution</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Title</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Description</label>
                  <textarea
                    value={description}
                    onChange={e => handleDescriptionChange(e.target.value)}
                    placeholder="Explain what's happening in detail..."
                    rows={4}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    <MapPin size={11} className="inline mr-1" />Location
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {locations.map(loc => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                          location === loc
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    <Paperclip size={11} className="inline mr-1" />Attach proof (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-white hover:border-blue-300 transition-all cursor-pointer">
                    <Paperclip size={20} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Tap to upload image or PDF</p>
                  </div>
                </div>
              </div>

              {/* AI Similar Tickets Panel */}
              <AnimatePresence>
                {showSimilar && !deflected && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4 bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 rounded-3xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                          <Sparkles size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Similar issues found</p>
                          <p className="text-[10px] text-gray-400">Did any of these solve it?</p>
                        </div>
                      </div>
                      <button onClick={() => setShowSimilar(false)}>
                        <X size={16} className="text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {similarTickets.map((t) => (
                        <motion.div
                          key={t.id}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white rounded-2xl p-3 border border-white shadow-sm"
                        >
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">{t.title}</p>
                          <p className="text-[10px] text-gray-400 mb-2">{t.solution}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                              Resolved in {t.resolvedIn}
                            </span>
                            <button
                              onClick={() => { setDeflected(true); setShowSimilar(false) }}
                              className="text-[10px] text-blue-600 font-semibold"
                            >
                              This solved it ✓
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {deflected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-4 text-center"
                >
                  <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-green-800">Great, glad it helped!</p>
                  <p className="text-xs text-green-600 mt-0.5">No ticket needed. Going back...</p>
                  {setTimeout(() => navigate('/student'), 2000) && null}
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={!title || !description}
                onClick={() => setStep(2)}
                className={`w-full mt-5 py-4 rounded-2xl font-semibold text-sm transition-all ${
                  title && description
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                Continue <ChevronRight size={16} className="inline" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2 — Review */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Submit</h2>
              <p className="text-sm text-gray-400 mb-6">Everything look right?</p>

              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm mb-4">
                <div className={`h-2 bg-gradient-to-r ${selectedCat?.gradient}`} />
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Category</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedCat?.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Title</p>
                    <p className="text-sm font-semibold text-gray-800">{title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Description</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                  </div>
                  {location && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Location</p>
                      <p className="text-sm font-semibold text-gray-800">{location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Preview */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800">AI Priority Assessment</p>
                  <p className="text-[10px] text-amber-600">Estimated: High · Exam week detected</p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Submit Ticket
              </motion.button>

              <p className="text-center text-xs text-gray-400 mt-3">
                You'll get notified when your ticket is assigned
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}