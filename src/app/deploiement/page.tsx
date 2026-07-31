'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { compile } from '@/core/compile.ts'
import { TARGETS, exchangeTransportRule, gmailSendAs, outlookSignatureFiles, manualInstructions } from '@/core/exports.ts'
import { CLIENT_PROFILES } from '@/core/clients.ts'

export default function DeploiementPage() {
  const { src } = useStore()
  const compiled = useMemo(() => compile(src), [src])
  const [target, setTarget] = useState(TARGETS[0].id)
  const t = TARGETS.find((x) => x.id === target)!
  const gmail = useMemo(() => gmailSendAs(compiled), [compiled])

  function dl(name: string, content: string, mime = 'text/plain;charset=utf-8') {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type: mime }))
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <h1>Déploiement</h1>
      <p className="lede">
        §4 : « Tout le marché est structuré par ces deux arbitrages, et <strong>aucun des deux n&apos;a de bonne
        réponse</strong>. » Cet écran ne prétend donc pas trancher. Il produit les artefacts de chaque mode{' '}
        <em>et</em> la liste de ce qu&apos;il ne couvre pas — pour que le choix soit fait en connaissance de cause et
        écrit dans le contrat. C&apos;est exactement ce que la veille reproche au marché de ne pas faire.
      </p>

      <div className="card">
        <div className="row">
          {TARGETS.map((x) => (
            <button key={x.id} className={target === x.id ? 'primary' : ''} onClick={() => setTarget(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 14, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, color: 'var(--ok)' }}>Ce que ce mode couvre</h3>
          <ul className="tight">
            {t.covers.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ borderColor: 'var(--line)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--bad)' }}>Ce qu&apos;il ne couvre pas</h3>
          <ul className="tight">
            {t.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
          <p className="veille">{t.veille}</p>
        </div>
      </div>

      <h2>Artefact</h2>
      <div className="card">
        {t.id === 'exchange-transport-rule' && (
          <>
            <div className="spread">
              <span className="tag">PowerShell — Exchange Online</span>
              <button onClick={() => dl('socle-transport-rule.ps1', exchangeTransportRule(compiled))}>Télécharger</button>
            </div>
            <pre className="code" style={{ marginTop: 10 }}>
              {exchangeTransportRule(compiled)}
            </pre>
          </>
        )}

        {t.id === 'gmail-sendas' && (
          <>
            <div className="spread">
              <div className="row">
                <span className="tag">API Gmail — users.settings.sendAs</span>
                <span className={`tag ${gmail.withinLimit ? 'ok' : 'bad'}`}>
                  {gmail.chars.toLocaleString('fr-FR')} / {gmail.limit.toLocaleString('fr-FR')} caractères
                </span>
              </div>
              <button onClick={() => dl('gmail-sendas.json', JSON.stringify(gmail.payload, null, 2), 'application/json')}>
                Télécharger
              </button>
            </div>
            <ul className="tight" style={{ marginTop: 10 }}>
              {gmail.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <pre className="code">{JSON.stringify(gmail.payload, null, 2).slice(0, 1200)}…</pre>
          </>
        )}

        {t.id === 'outlook-signature-file' && (
          <>
            <div className="row">
              {outlookSignatureFiles(compiled, src.person.lastName).map((f) => (
                <button key={f.filename} onClick={() => dl(f.filename, f.content)}>
                  {f.filename}
                </button>
              ))}
            </div>
            <p className="note">
              Compatible avec un déploiement <code>Set-OutlookSignatures</code>. La veille §2.F rappelle que ce projet
              open source est mature, activement maintenu, et livré avec un questionnaire de sécurité prêt pour revue
              RSSI — ce qui affaiblit sérieusement tout angle « souveraineté / zéro re-routage » : le terrain est déjà
              occupé, gratuitement.
            </p>
            <pre className="code" style={{ marginTop: 10 }}>
              {compiled.document.slice(0, 900)}…
            </pre>
          </>
        )}

        {t.id === 'manual-paste' && (
          <div className="grid g2">
            {(['outlook-win', 'owa', 'gmail', 'apple-mail'] as const).map((c) => (
              <div key={c}>
                <h3 style={{ marginTop: 0 }}>{c}</h3>
                <ul className="tight">
                  {manualInstructions(c).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2>Matrice des clients de lecture</h2>
      <div className="card scroll-x">
        <table className="data">
          <thead>
            <tr>
              <th>Client</th>
              <th>Moteur</th>
              <th>&lt;style&gt;</th>
              <th>radius</th>
              <th>bg-image</th>
              <th>max-width</th>
              <th>flex</th>
              <th>Mode sombre</th>
              <th>Clipping</th>
            </tr>
          </thead>
          <tbody>
            {CLIENT_PROFILES.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.label}</strong>
                  <div className="veille">{c.veille}</div>
                </td>
                <td>{c.engine}</td>
                {[c.styleTag, c.borderRadius, c.backgroundImage, c.maxWidth, c.flexOrGrid].map((v, i) => (
                  <td key={i}>{v ? <span className="tag ok">oui</span> : <span className="tag bad">non</span>}</td>
                ))}
                <td>
                  <span
                    className={`tag ${c.darkRegime === 'forced-invert' ? 'bad' : c.darkRegime === 'targetable' ? 'warn' : ''}`}
                  >
                    {c.darkRegime === 'forced-invert' ? 'inversion totale' : c.darkRegime === 'targetable' ? 'ciblable' : 'aucun'}
                  </span>
                </td>
                <td>{c.clipBytes ? `${(c.clipBytes / 1024).toFixed(0)} Ko` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          Cette matrice ne décrit jamais l&apos;outil d&apos;envoi. Elle décrit ce que le destinataire va réellement
          recevoir — c&apos;est le point aveugle que §6 reproche au marché entier.
        </p>
      </div>
    </div>
  )
}
