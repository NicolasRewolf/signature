'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_SOURCE } from '@/core/fixtures.ts'
import type { SignatureSource } from '@/core/model.ts'
import type { DeploymentMode } from '@/core/degrade.ts'

const KEY = 'socle.v1'

interface StoreShape {
  src: SignatureSource
  setSrc: (updater: (s: SignatureSource) => SignatureSource) => void
  deployment: DeploymentMode
  setDeployment: (d: DeploymentMode) => void
  reset: () => void
  ready: boolean
}

const Ctx = createContext<StoreShape | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [src, setSrcState] = useState<SignatureSource>(DEMO_SOURCE)
  const [deployment, setDeployment] = useState<DeploymentMode>('server-side')
  const [ready, setReady] = useState(false)

  // Persistance locale volontairement minimale : ce scaffold doit pouvoir
  // être teste seul, sans base ni compte. Le passage multi-client (workspaces,
  // versionnement §7.2, audit trail) est le premier chantier serveur.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.src) setSrcState(parsed.src)
        if (parsed.deployment) setDeployment(parsed.deployment)
      }
    } catch {
      /* stockage indisponible : on reste sur la demo */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ src, deployment }))
    } catch {
      /* quota ou mode prive */
    }
  }, [src, deployment, ready])

  const value = useMemo<StoreShape>(
    () => ({
      src,
      setSrc: (updater) => setSrcState((s) => updater(structuredClone(s))),
      deployment,
      setDeployment,
      reset: () => setSrcState(structuredClone(DEMO_SOURCE)),
      ready,
    }),
    [src, deployment, ready],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreShape {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore hors StoreProvider')
  return c
}
