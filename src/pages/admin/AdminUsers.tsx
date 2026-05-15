import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Search, CheckCircle2,
  X, Shield, Headset, GraduationCap, MoreVertical,
  Mail, Building
} from 'lucide-react'

const roleConfig: Record<string, { label: string; icon: any; gradient: string; bg: string }> = {
  admin: { label: 'Admin', icon: Shield, gradient: 'from-gray-700 to-gray-500', bg: 'bg-gray-50 text-gray-700 border-gray-200' },
  staff: { label: 'Support Staff', icon: Headset, gradient: 'from-violet-500 to-purple-400', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
  student: { label: 'Student', icon: GraduationCap, gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
}

const depts = ['IT', 'CSE', 'ECE', 'Mechanical', 'Civil', 'All Departments']

const initialUsers = [
  { id: '1', name: 'Dr. Ramesh Kumar', email: 'ramesh@kct.ac.in', role: 'admin', dept: 'Administration', active: true },
  { id: '2', name: 'Senthil IT Staff', email: 'senthil.it@kct.ac.in', role: 'staff', dept: 'IT', active: true },
  { id: '3', name: 'Kavitha Hostel Staff', email: 'kavitha@kct.ac.in', role: 'staff', dept: 'Hostel', active: true },
  { id: '4', name: 'Arun Academic Staff', email: 'arun@kct.ac.in', role: 'staff', dept: 'Academics', active: false },
  { id: '5', name: 'Shyam Sundar', email: 'shyam@kct.ac.in', role: 'student', dept: 'IT', active: true },
  { id: '6', name: 'Priya S', email: 'priya@kct.ac.in', role: 'student', dept: 'CSE', active: true },
]

const roleFilters = ['All', 'Admin', 'Staff', 'Student']

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'staff', dept: 'IT' })
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase()
    return matchesSearch && matchesRole
  })

  const addUser = () => {
    if (!form.name || !form.email) return
    setUsers([...users, { id: Date.now().toString(), ...form, active: true }])
    setForm({ name: '', email: '', role: 'staff', dept: 'IT' })
    setShowForm(false)
  }

  const toggleActive = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u))
    setOpenMenu(null)
  }

  const counts = {
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    student: users.filter(u => u.role === 'student').length,
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/admin')} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-white text-base font-bold">User Management</h1>
            <p className="text-white/40 text-xs">{users.length} total users</p>
          </div>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl">
            <Plus size={14} /> Add User
          </motion.button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {Object.entries(counts).map(([role, count]) => {
            const config = roleConfig[role]
            const Icon = config.icon
            return (
              <div key={role} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-2`}>
                  <Icon size={14} className="text-white" />
                </div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-[10px] text-gray-500">{config.label}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all shadow-sm" />
          </div>
          <div className="flex gap-2">
            {roleFilters.map(f => (
              <button key={f} onClick={() => setRoleFilter(f)}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${roleFilter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-3xl border border-blue-100 shadow-md p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">Add New User</p>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" type="email"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Role</label>
                  <div className="flex gap-2">
                    {['staff', 'admin'].map(r => {
                      const config = roleConfig[r]
                      const Icon = config.icon
                      return (
                        <button key={r} onClick={() => setForm({ ...form, role: r })}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            form.role === r ? `bg-gradient-to-r ${config.gradient} text-white border-transparent` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          <Icon size={12} /> {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Department</label>
                  <div className="flex flex-wrap gap-2">
                    {depts.map(d => (
                      <button key={d} onClick={() => setForm({ ...form, dept: d })}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                          form.dept === d ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addUser} disabled={!form.name || !form.email}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    form.name && form.email ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                  Create User
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3 pb-8">
          <AnimatePresence>
            {filtered.map((user) => {
              const config = roleConfig[user.role]
              const Icon = config.icon
              return (
                <motion.div key={user.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                  className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-4 ${!user.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-white font-bold text-sm">{user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                        {!user.active && <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">Inactive</span>}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <Mail size={10} className="text-gray-400" />
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${config.bg}`}>
                          <Icon size={9} /> {config.label}
                        </span>
                        <span className="text-[9px] font-bold bg-gray-50 text-gray-500 border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Building size={9} /> {user.dept}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <MoreVertical size={15} className="text-gray-500" />
                      </motion.button>
                      <AnimatePresence>
                        {openMenu === user.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-0 top-10 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50 min-w-[140px]">
                            <button onClick={() => toggleActive(user.id)}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                              {user.active ? <X size={12} className="text-red-500" /> : <CheckCircle2 size={12} className="text-green-500" />}
                              {user.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}