'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS: Array<{ title: string; items: Array<[string, string]> }> = [
  {
    title: 'Produire',
    items: [
      ['/', 'Tableau de bord'],
      ['/studio', 'Studio'],
      ['/contrat', 'Contrat de dégradation'],
    ],
  },
  {
    title: 'Vérifier',
    items: [
      ['/linter', 'Linter'],
      ['/annuaire', 'QA annuaire'],
      ['/registre', 'Registre des régressions'],
    ],
  },
  {
    title: 'Déployer',
    items: [
      ['/deploiement', 'Déploiement'],
      ['/perimetre', 'Périmètre honnête'],
    ],
  },
]

export function Nav() {
  const path = usePathname()
  return (
    <aside className="side">
      <div className="brand">
        Socle
        <small>la même information partout</small>
      </div>
      <nav className="nav">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <div className="sec">{s.title}</div>
            {s.items.map(([href, label]) => (
              <Link key={href} href={href} data-active={path === href}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <p className="note" style={{ marginTop: 24, fontSize: 11 }}>
        Ancré sur <code>veille-signatures-email.md</code> (31 juillet 2026). Chaque règle porte son §.
      </p>
    </aside>
  )
}
