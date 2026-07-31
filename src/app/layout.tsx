import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'
import { StoreProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: 'Socle — la même information partout',
  description:
    "Compilateur de signatures email défensives, linter des 26 modes de rupture, simulateur de dégradation et contrat opposable.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <StoreProvider>
          <div className="shell">
            <Nav />
            <main className="main">{children}</main>
          </div>
        </StoreProvider>
      </body>
    </html>
  )
}
