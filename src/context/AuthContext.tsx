import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthContextValue {
  user: string | null
  setUser: (u: string | null) => void
}

const AuthContext = createContext<AuthContextValue>({ user: null, setUser: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
