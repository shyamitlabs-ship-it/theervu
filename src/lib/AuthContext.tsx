import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'student' | 'staff' | 'admin'
  department?: string
  batch?: string
  hostel_block?: string
  phone?: string
  roll_number?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session on load:', session)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id)
      if (session?.user) fetchProfile(session.user.id)
      else { setUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('Profile data:', data)
    console.log('Profile error:', error)

    if (data) {
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        department: data.department,
        batch: data.batch,
        hostel_block: data.hostel_block,
        phone: data.phone,
        roll_number: data.roll_number,
      })
    } else {
      console.log('No profile found, signing out')
      await supabase.auth.signOut()
    }
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)