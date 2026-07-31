'use client'

import { REGRESSIONS, CLIENT_PROFILES } from '@/core/clients.ts'
import { RULES } from '@/core/lint.ts'

export default function RegistrePage() {
  const withFix = REGRESSIONS.filter((r) => r.emitterFix !== 'none')
  const withoutFix = REGRESSIONS.filter((r) => r.emitterFix === 'none')

  return (
    <div>
      <h1>Registre des régressions</h1>
      <p className="lede">
        §7.4, le gap « le plus séduisant, et celui dont la formulation initiale était la plus abusive ». Le test ponctuel
        multi-clients existe déjà et il est gratuit. Le résidu défendable est bien plus étroit : personne ne surveille en
        continu un parc déjà déployé. Mais l&apos;objection de fond tient — ce sont des régressions de clients de{' '}
        <em>lecture</em>, donc pour une partie d&apos;entre elles <strong>le correctif côté émetteur n&apos;existe
        pas</strong>. Ce registre sépare les deux, sinon il ne produit que des alertes sans correctif associé.
      </p>

      <div className="grid g2">
        <div className="card">
          <div className="stat" style={{ color: 'var(--ok)' }}>
            {withFix.length} <small>régressions avec correctif émetteur — automatisables</small>
          </div>
        </div>
        <div className="card">
          <div className="stat" style={{ color: 'var(--bad)' }}>
            {withoutFix.length} <small>sans correctif — à documenter au client, pas à corriger</small>
          </div>
        </div>
      </div>

      <h2>Entrées</h2>
      <div className="card scroll-x">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Régression</th>
              <th>Client</th>
              <th>Correctif émetteur</th>
              <th>Règles liées</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            {[...REGRESSIONS]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="veille">{r.date}</span>
                  </td>
                  <td>
                    <strong>{r.title}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: 11.5 }}>{r.détail}</div>
                    <div className="veille">{r.veille}</div>
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {r.client === '*' ? 'tous' : CLIENT_PROFILES.find((c) => c.id === r.client)?.label ?? r.client}
                  </td>
                  <td>
                    <span
                      className={`tag ${r.emitterFix === 'yes' ? 'ok' : r.emitterFix === 'partial' ? 'warn' : 'bad'}`}
                    >
                      {r.emitterFix === 'yes' ? 'oui' : r.emitterFix === 'partial' ? 'partiel' : 'aucun'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {r.linkedRules.length
                      ? r.linkedRules.map((id) => (
                          <div key={id} className="veille">
                            {RULES.find((x) => x.id === id)?.title ?? id}
                          </div>
                        ))
                      : '—'}
                  </td>
                  <td>
                    <span className={`tag ${r.status === 'fixed' ? 'ok' : r.status === 'regressed' ? 'bad' : 'warn'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h2>Comportements documentés par client</h2>
      <div className="grid g2">
        {CLIENT_PROFILES.filter((c) => c.notes.length).map((c) => (
          <div className="card" key={c.id}>
            <div className="spread">
              <strong>{c.label}</strong>
              <span className="veille">{c.veille}</span>
            </div>
            <ul className="tight">
              {c.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="callout" style={{ marginTop: 18 }}>
        <strong>Ce qui manque pour que ce module vaille de l&apos;argent.</strong> Un parc de comptes de test réels
        (Outlook Windows sous plusieurs builds, OWA, Gmail web et iOS, Apple Mail, Yahoo) et une boucle d&apos;envoi
        automatisée. C&apos;est le poste de coût que §10.4 demande d&apos;instruire avant tout arbitrage « SaaS ou
        studio » — et §7.4 prévient que c&apos;est « copiable par Exclaimer en un trimestre ».
      </div>
    </div>
  )
}
