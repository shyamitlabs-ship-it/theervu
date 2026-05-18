import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Search, CheckCircle2,
  X, Shield, Headset, GraduationCap, MoreVertical,
  Mail, Building
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const roleConfig: Record<string, { label: string; icon: any; gradient: string; bg: string }> = {
  admin: { label: 'Admin', icon: Shield, gradient: 'from-gray-700 to-gray-500', bg: 'bg-gray-50 text-gray-700 border-gray-200' },
  staff: { label: 'Support Staff', icon: Headset, gradient: 'from-violet-500 to-purple-400', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
  student: { label: 'Student', icon: GraduationCap, gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
}

const roleFilters = ['All', 'Admin', 'Staff', 'Student']

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setUsers(data)
    setLoading(false)
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from('profiles').update({ active: !currentActive }).eq('id', id)
    setUsers(users.map(u => u.id === id ? { ...u, active: !currentActive } : u))
    setOpenMenu(null)
  }

  const filtered = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase()
    return matchesSearch && matchesRole
  })

  const counts = {
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    student: users.filter(u => u.role === 'student').length,
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Dark Header */}
      <div className="bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/admin')}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-white text-base font-bold">User Management</h1>
            <p className="text-white/40 text-xs">{users.length} registered users</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5">

        {/* Role Stats */}
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

        {/* Search + Filter */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all shadow-sm" />
          </div>
          <div className="flex gap-2">
            {roleFilters.map(f => (
              <button key={f} onClick={() => setRoleFilter(f)}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${
                  roleFilter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-full animate-pulse w-1/2" />
                    <div className="h-3 bg-gray-100 rounded-full animate-pulse w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <p className="text-sm text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            <AnimatePresence>
              {filtered.map((user) => {
                const config = roleConfig[user.role] || roleConfig.student
                const Icon = config.icon
                return (
                  <motion.div key={user.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                    className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-4 ${user.active === false ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-white font-bold text-sm">
                          {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name || 'Unknown'}</p>
                          {user.active === false && (
                            <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Mail size={10} className="text-gray-400" />
                          <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${config.bg}`}>
                            <Icon size={9} /> {config.label}
                          </span>
                          {user.department && (
                            <span className="text-[9px] font-bold bg-gray-50 text-gray-500 border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-1">
                              <Building size={9} /> {user.department}
                            </span>
                          )}
                          {user.batch && (
                            <span className="text-[9px] font-bold bg-blue-50 text-blue-500 border border-blue-100 px-2 py-1 rounded-lg">
                              {user.batch}
                            </span>
                          )}
                          {user.roll_number && (
                            <span className="text-[9px] font-bold bg-green-50 text-green-600 border border-green-100 px-2 py-1 rounded-lg">
                              {user.roll_number}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                          <MoreVertical size={15} className="text-gray-500" />
                        </motion.button>
                        <AnimatePresence>
                          {openMenu === user.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-0 top-10 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50 min-w-[140px]">
                              <button onClick={() => toggleActive(user.id, user.active !== false)}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                                {user.active === false
                                  ? <><CheckCircle2 size={12} className="text-green-500" /> Activate</>
                                  : <><X size={12} className="text-red-500" /> Deactivate</>
                                }
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
        )}
      </div>
    </div>
  )
}