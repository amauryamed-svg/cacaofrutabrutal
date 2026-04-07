import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'es' | 'en'

interface LangState {
  lang:    Lang
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangState>({ lang: 'es', setLang: () => {} })

export const useLang = () => useContext(LangContext)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es')
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}
