'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { compile } from '@/core/compile.ts'
import { buildContract, renderAttestation, PERMANENT_EXCLUSIONS, SERVER_SIDE_EXCEPTIONS } from '@/core/contract.ts'
import type { FloorVerdict } from '@/core/degrade.ts'

function Mark({ v }: { v: FloorVerdict | 'n/a' }) {
  if (v === 'n/a') return <span className="tag">—</span>
  if (v === 'ok') return <span className="tag ok">ok</span>
  if (v === 'degraded') return <span className="tag warn">dégradé</span>
  return <span className="tag bad">perdu</span>
}

export default function ContratPage() {
  const { src, deployment, setDeployment } = useStore()
  const compiled = useMemo(() => compile(src), [src])
  const contract = useMemo(() => buildContract(compiled, deployment), [compiled, deployment])
  const [open, setOpen] = useState<string | null>(null)
  const [showMd, setShowMd] = useState(false)

  const md = useMemo(() => renderAttestation(contract, src.org.name), [contract, src.org.name])

  function download() {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `contrat-dégradation-${src.org.name.toLowerCase().replace(/\W+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <h1>Contrat de dégradation gracieuse</h1>
      <p className="lede">
        C&apos;est le livrable vendable, et la seule reformulation de la thèse que la veille juge tenable. Pas « votre
        signature s&apos;affichera correctement » — cette phrase est réfutable par n&apos;importe quel prospect en une
        capture d&apos;écran. Mais : « quel que soit le client, le mode sombre, le clipping ou le nombre de réponses,{' '}
        <strong>ces informations restent lisibles et cliquables</strong> » — assorti de la liste signée de ce qui
        n&apos;est pas couvert. <span className="veille">veille §6, §9</span>
      </p>

      <div className="card">
        <div className="spread">
          <div className="row">
            {(['server-side', 'client-side', 'combo'] as const).map((m) => (
              <button key={m} className={deployment === m ? 'primary' : ''} onClick={() => setDeployment(m)}>
                {m}
              </button>
            ))}
          </div>
          <div className="row">
            <span
              className={`tag ${contract.verdict === 'signable' ? 'ok' : contract.verdict === 'a_corriger' ? 'warn' : 'bad'}`}
            >
              {contract.verdict}
            </span>
            <button onClick={() => setShowMd((v) => !v)}>{showMd ? 'Masquer' : 'Voir'} l&apos;attestation</button>
            <button className="primary" onClick={download}>
              Télécharger
            </button>
          </div>
        </div>
      </div>

      {contract.blocking.length > 0 && (
        <div className="card" style={{ marginTop: 14, borderColor: 'var(--bad)' }}>
          <h3 style={{ marginTop: 0 }}>Bloquant avant signature</h3>
          <ul className="tight">
            {contract.blocking.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <h2>Matrice de survie du socle</h2>
      <div className="card scroll-x">
        <table className="data">
          <thead>
            <tr>
              <th style={{ minWidth: 210 }}>Scénario</th>
              {contract.floorKeys.map((f) => (
                <th key={f.key}>{f.label}</th>
              ))}
              <th>Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {contract.scenarios.map((s) => (
              <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setOpen(open === s.id ? null : s.id)}>
                <td>
                  <strong>{s.label}</strong>
                  <div className="veille">{s.veille}</div>
                </td>
                {contract.floorKeys.map((fk) => {
                  const cell = contract.cells.find((c) => c.scenarioId === s.id && c.floorKey === fk.key)!
                  return (
                    <td key={fk.key}>
                      <Mark v={cell.readable} />
                      {cell.clickable !== 'n/a' && (
                        <>
                          {' '}
                          <Mark v={cell.clickable} />
                        </>
                      )}
                    </td>
                  )
                })}
                <td>
                  <span className={`tag ${s.mitigable === 'yes' ? 'ok' : s.mitigable === 'partial' ? 'warn' : 'bad'}`}>
                    {s.mitigable === 'yes' ? 'traité' : s.mitigable === 'partial' ? 'partiel' : 'hors de portée'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          Chaque cellule affiche <em>lisible</em> puis <em>cliquable</em>. Cliquer une ligne pour la détailler.{' '}
          <strong>{contract.passed}</strong> scénarios sur {contract.total} préservent l&apos;intégralité du socle.
        </p>
      </div>

      {open && (
        <div className="card" style={{ marginTop: 14 }}>
          {(() => {
            const s = contract.scenarios.find((x) => x.id === open)!
            return (
              <>
                <div className="spread">
                  <h3 style={{ marginTop: 0 }}>{s.label}</h3>
                  <span className="veille">{s.veille}</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>{s.mitigation}</p>
                <ul className="tight">
                  {s.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
                {s.preview && (
                  <>
                    <h3>Aperçu dégradé (approximation déterministe)</h3>
                    <div
                      className={`preview-frame ${s.id === 'dark-forced-invert' ? 'dark' : ''}`}
                      dangerouslySetInnerHTML={{ __html: s.preview }}
                    />
                  </>
                )}
                {s.previewText && (
                  <>
                    <h3>Ce qu&apos;il reste</h3>
                    <pre className="code">{s.previewText}</pre>
                  </>
                )}
              </>
            )
          })()}
        </div>
      )}

      <h2>Ce qui n&apos;est pas garanti, et ne le sera jamais</h2>
      <div className="card">
        <ul className="tight">
          {PERMANENT_EXCLUSIONS.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        <p className="note">
          Cette liste figure telle quelle dans l&apos;attestation remise au client. Une promesse dont on connaît les
          bords est défendable ; une promesse absolue ne l&apos;est pas — « elle est réfutable par n&apos;importe quel
          prospect en une capture d&apos;écran. Ce jour-là, la marque est morte. »
        </p>
      </div>

      {deployment !== 'client-side' && (
        <>
          <h2>Exceptions propres au server-side</h2>
          <div className="card">
            <ul className="tight">
              {SERVER_SIDE_EXCEPTIONS.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {showMd && (
        <>
          <h2>Attestation</h2>
          <pre className="code">{md}</pre>
        </>
      )}
    </div>
  )
}
