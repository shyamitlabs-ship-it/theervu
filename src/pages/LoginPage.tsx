import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Headset, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const roles = [
  { id: 'student', label: 'Student', icon: GraduationCap, gradient: 'from-blue-500 to-cyan-400', bg: 'from-blue-600/20 to-cyan-400/10', description: 'Raise and track your tickets' },
  { id: 'staff', label: 'Support Staff', icon: Headset, gradient: 'from-violet-500 to-purple-400', bg: 'from-violet-600/20 to-purple-400/10', description: 'Manage and resolve tickets' },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, gradient: 'from-gray-700 to-gray-500', bg: 'from-gray-700/20 to-gray-500/10', description: 'Oversee operations & analytics' },
]

const studentDepartments = [
  'B.E (Aeronautical Engineering)',
  'B.E (Automobile Engineering)',
  'B.E (Civil Engineering)',
  'B.E (Computer Science and Engineering)',
  'B.E (Electrical and Electronics Engineering)',
  'B.E (Electronics and Communication Engineering)',
  'B.E (Electronics and Instrumentation Engineering)',
  'B.Tech (Artificial Intelligence & Data Science)',
  'B.Tech (Biotechnology)',
  'B.Tech (Fashion Technology)',
  'B.Tech (Information Technology)',
  'B.E (Mechanical Engineering)',
  'B.E (Mechatronics Engineering)',
  'B.Tech (Textile Technology)',
]

const staffDepartments = [
  'IT Department', 'Hostel Office', 'Academic Office', 'Transport Office',
  'Library', 'Medical Centre', 'Canteen', 'Administration', 'Sports',
  'Examination Cell', 'Finance Office', 'Placement Cell',
]

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const batches = ['2022–2026', '2023–2027', '2024–2028', '2025–2029']
const hostelOptions = ['Hostel (Boys)', 'Hostel (Girls)', 'Day Scholar']

// Map batch year range to batch code prefix
const batchCodeMap: Record<string, string> = {
  '2022–2026': '22',
  '2023–2027': '23',
  '2024–2028': '24',
  '2025–2029': '25',
}

// Map department to short code
const deptCodeMap: Record<string, string> = {
  'B.Tech (Information Technology)': 'BIT',
  'B.E (Computer Science and Engineering)': 'BCE',
  'B.E (Electronics and Communication Engineering)': 'BEC',
  'B.E (Electrical and Electronics Engineering)': 'BEE',
  'B.E (Mechanical Engineering)': 'BME',
  'B.E (Civil Engineering)': 'BCE',
  'B.Tech (Artificial Intelligence & Data Science)': 'BAD',
  'B.Tech (Biotechnology)': 'BBT',
  'B.Tech (Fashion Technology)': 'BFT',
  'B.Tech (Textile Technology)': 'BTT',
  'B.E (Aeronautical Engineering)': 'BAE',
  'B.E (Automobile Engineering)': 'BAU',
  'B.E (Electronics and Instrumentation Engineering)': 'BEI',
  'B.E (Mechatronics Engineering)': 'BMT',
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [selected, setSelected] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [batch, setBatch] = useState('')
  const [hostelBlock, setHostelBlock] = useState('')
  const [phone, setPhone] = useState('')
  const [rollNumber, setRollNumber] = useState('')

  const { signIn } = useAuth()
  const selectedRole = roles.find(r => r.id === selected)!

  // Auto-generate batch code like 23BIT from batch year + department
  const getBatchCode = () => {
    if (selected !== 'student' || !batch || !department) return null
    const yearPrefix = batchCodeMap[batch] || ''
    const deptCode = deptCodeMap[department] || ''
    return yearPrefix && deptCode ? `${yearPrefix}${deptCode}` : null
  }

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')
    const { error } = await signIn(email, password)
    if (error) { setError('Invalid email or password.'); setLoading(false) }
  }

  const handleSignup = async () => {
    if (!email || !password || !name) { setError('Please fill all required fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')

    const batchCode = getBatchCode()

    // Step 1 — Create auth user with metadata
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: selected,
          department: department || null,
          batch: batchCode || (selected === 'student' ? batch : null),
          hostel_block: selected === 'student' ? hostelBlock || null : null,
          phone: phone || null,
          roll_number: selected === 'student' ? rollNumber || null : null,
        }
      }
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Step 2 — Sign in immediately to get authenticated session
      await supabase.auth.signInWithPassword({ email, password })

      // Step 3 — Update profile with full details now that we're authenticated
      const { error: updateError } = await supabase.from('profiles').update({
        name,
        department: department || null,
        batch: batchCode || (selected === 'student' ? batch || null : null),
        hostel_block: selected === 'student' ? hostelBlock || null : null,
        phone: phone || null,
        roll_number: selected === 'student' ? rollNumber || null : null,
      }).eq('id', data.user.id)

      if (updateError) console.error('Profile update error:', updateError)
    }

    setSuccess('Account created! Signing you in...')
    setLoading(false)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition-all"
  const selectClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"

  const batchCode = getBatchCode()

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] py-8">
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

          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold tracking-tight" style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>தீர்வு</h1>
            <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">Theervu · KCT Help Desk</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mode === m ? 'bg-white/15 text-white' : 'text-white/40'
                }`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {roles.map((role) => {
              const Icon = role.icon
              const isActive = selected === role.id
              return (
                <motion.button key={role.id} onClick={() => { setSelected(role.id); setError('') }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 ${
                    isActive ? `bg-gradient-to-b ${role.bg} border-white/20` : 'border-white/5 hover:bg-white/5'
                  }`}>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${isActive ? role.gradient : 'from-white/10 to-white/5'}`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/40'}`}>{role.label}</span>
                </motion.button>
              )
            })}
          </div>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p key={selected} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="text-center text-white/40 text-xs mb-5">
              {selectedRole.description}
            </motion.p>
          </AnimatePresence>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-4">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 mb-4">
                <p className="text-green-400 text-xs font-medium">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <div className="space-y-3 mb-4">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">

                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Full Name *" className={inputClass} />

                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className={selectClass} style={{ background: 'rgba(20,20,40,0.95)' }}>
                    <option value="">Select Department *</option>
                    {(selected === 'staff' || selected === 'admin' ? staffDepartments : studentDepartments).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {selected === 'student' && (
                    <>
                      <input value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                        placeholder="Roll Number (e.g. 23BIT105) *" className={inputClass} />

                      <select value={year} onChange={e => setYear(e.target.value)}
                        className={selectClass} style={{ background: 'rgba(20,20,40,0.95)' }}>
                        <option value="">Select Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>

                      <select value={batch} onChange={e => setBatch(e.target.value)}
                        className={selectClass} style={{ background: 'rgba(20,20,40,0.95)' }}>
                        <option value="">Select Batch</option>
                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>

                      {/* Auto batch code preview */}
                      {batchCode && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-2.5">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                          <p className="text-blue-400 text-xs font-semibold">
                            Batch code: <span className="font-bold">{batchCode}</span> — used for event matching
                          </p>
                        </motion.div>
                      )}

                      <select value={hostelBlock} onChange={e => setHostelBlock(e.target.value)}
                        className={selectClass} style={{ background: 'rgba(20,20,40,0.95)' }}>
                        <option value="">Hostel / Day Scholar</option>
                        {hostelOptions.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </>
                  )}

                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="Phone Number" className={inputClass} type="tel" />
                </motion.div>
              )}
            </AnimatePresence>

            <input type="email" placeholder="Email address *" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
              className={inputClass} />

            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password *" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
                className={inputClass + ' pr-12'} />
              <button onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }}
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-semibold text-white text-sm bg-gradient-to-r ${selectedRole.gradient} shadow-lg flex items-center justify-center gap-2 transition-all`}>
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : mode === 'login' ? `Sign in as ${selectedRole.label}` : `Create ${selectedRole.label} Account`
            }
          </motion.button>

          <p className="text-center text-white/20 text-xs mt-5">Kumaraguru College of Technology · 2025</p>
        </div>
      </motion.div>
    </div>
  )
}