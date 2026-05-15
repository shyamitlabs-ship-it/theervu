import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Headset, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const roles = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'from-blue-600/20 to-cyan-400/10',
    glow: 'shadow-blue-500/25',
    description: 'Raise and track your tickets',
  },
  {
    id: 'staff',
    label: 'Support Staff',
    icon: Headset,
    gradient: 'from-violet-500 to-purple-400',
    bg: 'from-violet-600/20 to-purple-400/10',
    glow: 'shadow-violet-500/25',
    description: 'Manage and resolve tickets',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    gradient: 'from-gray-700 to-gray-500',
    bg: 'from-gray-700/20 to-gray-500/10',
    glow: 'shadow-gray-500/25',
    description: 'Oversee operations & analytics',
  },
]

export default function LoginPage() {
  const [selected, setSelected] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const selectedRole = roles.find(r => r.id === selected)!

  const handleLogin = async () => {
    console.log('Login clicked', email, password)
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    console.log('Sign in result:', error)
    if (error) {
      setError('Invalid email or password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white tracking-tight">थीर्वु</h1>
            <p className="text-white/40 text-sm mt-1 tracking-widest uppercase">Theervu · KCT Help Desk</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map((role) => {
              const Icon = role.icon
              const isActive = selected === role.id
              return (
                <motion.button
                  key={role.id}
                  onClick={() => setSelected(role.id)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 ${
                    isActive ? `bg-gradient-to-b ${role.bg} border-white/20 shadow-lg ${role.glow}` : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${isActive ? role.gradient : 'from-white/10 to-white/5'}`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/40'}`}>{role.label}</span>
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={selected}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-center text-white/40 text-xs mb-6"
            >
              {selectedRole.description}
            </motion.p>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-4"
            >
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </motion.div>
          )}

          <div className="space-y-3 mb-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-semibold text-white text-sm bg-gradient-to-r ${selectedRole.gradient} shadow-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              `Sign in as ${selectedRole.label}`
            )}
          </motion.button>

          <p className="text-center text-white/20 text-xs mt-6">Kumaraguru College of Technology · 2024</p>
        </div>
      </motion.div>
    </div>
  )
}