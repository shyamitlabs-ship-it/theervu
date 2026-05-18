import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Building, GraduationCap, Phone, MapPin, LogOut, Shield, Headset, Hash } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
}

const roleConfig: Record<string, { label: string; icon: any; gradient: string }> = {
  student: { label: 'Student', icon: GraduationCap, gradient: 'from-blue-500 to-cyan-400' },
  staff: { label: 'Support Staff', icon: Headset, gradient: 'from-violet-500 to-purple-400' },
  admin: { label: 'Admin', icon: Shield, gradient: 'from-gray-700 to-gray-500' },
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, signOut } = useAuth()
  if (!user) return null

  const role = roleConfig[user.role] || roleConfig.student
  const Icon = role.icon
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'

  const handleSignOut = async () => {
    onClose()
    await signOut()
  }

  const details = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Building, label: 'Department', value: (user as any).department },
    { icon: Hash, label: 'Roll Number', value: (user as any).roll_number },
    { icon: GraduationCap, label: 'Batch', value: (user as any).batch },
    { icon: MapPin, label: 'Hostel', value: (user as any).hostel_block },
    { icon: Phone, label: 'Phone', value: (user as any).phone },
  ].filter(d => d.value)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-4 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className={`bg-gradient-to-br ${role.gradient} p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                  {initials}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <X size={15} className="text-white" />
                </button>
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">{user.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Icon size={12} className="text-white/70" />
                <span className="text-white/70 text-xs">{role.label}</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              {details.map(({ icon: ItemIcon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ItemIcon size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sign Out */}
            <div className="px-5 pb-5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSignOut}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-red-600 bg-red-50 border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}