'use client'

import { useMemo, useState } from 'react'
import { lint } from '@/core/lint.ts'
import { RULES } from '@/core/lint.ts'
import { Findings } from '@/components/Findings'
import { BAD_SIGNATURE } from '@/core/fixtures.ts'
import { estimateGmailClipping } from '@/core/compile.ts'

export default function LinterPage() {
  const [html, setHtml] = useState('')
  const report = useMemo(() => (html.trim() ? lint(html) : null), [html])
  const clip = useMemo(() => (report ? estimateGmailClipping(report.bytes) : null), [report])
  const [showRules, setShowRules] = useState(false)

  return (
    <div>
      <h1>Linter</h1>
      <p className="lede">
        Coller n&apos;importe quelle signature existante — la vôtre, celle d&apos;un prospect, celle qu&apos;un
        générateur gratuit vient de produire. §9 : « la requête monétisable n&apos;est pas “créer une signature” mais
        <strong> “ma signature est cassée”</strong> ». C&apos;est une machine d&apos;acquisition autant qu&apos;un outil
        de QA — et la veille prévient que l&apos;espace est déjà encombré (Siggly, signatureforemail.com,
        darkmodechecker.org, tous gratuits) : c&apos;est un canal, pas un business.
      </p>

      <div className="card">
        <div className="spread" style={{ marginBottom: 8 }}>
          <label style={{ margin: 0 }}>HTML de la signature</label>
          <div className="row">
            <button onClick={() => setHtml(BAD_SIGNATURE.trim())}>Charger un exemple fautif</button>
            <button onClick={() => setHtml('')} disabled={!html}>
              Vider
            </button>
          </div>
        </div>
        <textarea
          rows={10}
          value={html}
          placeholder="Coller ici le HTML source de la signature…"
          onChange={(e) => setHtml(e.target.value)}
        />
      </div>

      {report && (
        <>
          <div className="grid g3" style={{ marginTop: 14 }}>
            <div className="card">
              <div className="stat">
                {(report.bytes / 1024).toFixed(1)} <small>Ko — budget 80 Ko</small>
              </div>
            </div>
            <div className="card">
              <div className="stat">
                {report.chars.toLocaleString('fr-FR')} <small>caractères — plafond Gmail sendAs 10 000</small>
              </div>
            </div>
            <div className="card">
              <div className="stat">
                ~{clip!.rounds} <small>allers-retours avant clipping Gmail (modèle)</small>
              </div>
            </div>
          </div>

          <h2>Findings</h2>
          <div className="card">
            <Findings report={report} />
          </div>
        </>
      )}

      <h2>
        Les {RULES.length} règles{' '}
        <button style={{ marginLeft: 8 }} onClick={() => setShowRules((v) => !v)}>
          {showRules ? 'Masquer' : 'Afficher'}
        </button>
      </h2>
      {showRules && (
        <div className="card scroll-x">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Règle</th>
                <th>Gravité</th>
                <th>Clients</th>
                <th>Correctif émetteur</th>
                <th>Veille</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="veille">{r.id}</span>
                  </td>
                  <td>
                    <strong>{r.title}</strong>
                    <div style={{ color: 'var(--dim)', fontSize: 11.5 }}>{r.why}</div>
                  </td>
                  <td>
                    <span
                      className={`tag ${r.severity === 'critical' ? 'bad' : r.severity === 'major' ? 'warn' : 'info'}`}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td style={{ fontSize: 11 }}>{r.clients.join(', ')}</td>
                  <td>
                    {r.actionable ? <span className="tag ok">oui</span> : <span className="tag bad">non</span>}
                  </td>
                  <td>
                    <span className="veille">{r.veille}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
