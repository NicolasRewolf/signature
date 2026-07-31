'use client'

import { useMemo, useState } from 'react'
import { parseCsv, auditDirectory, correctionCsv, DEFAULT_REQUIREMENTS, CONNECTORS } from '@/core/directory.ts'
import { DEMO_DIRECTORY_CSV } from '@/core/fixtures.ts'

export default function AnnuairePage() {
  const [csv, setCsv] = useState('')
  const parsed = useMemo(() => (csv.trim() ? parseCsv(csv) : null), [csv])
  const audit = useMemo(() => (parsed ? auditDirectory(parsed.rows) : null), [parsed])

  function downloadCorrections() {
    if (!parsed || !audit) return
    const blob = new Blob([correctionCsv(parsed.rows, audit)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'corrections-annuaire.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCsv(await file.text())
  }

  return (
    <div>
      <h1>QA de la donnée annuaire</h1>
      <p className="lede">
        §7.1, désigné dans la veille comme <strong>« le meilleur des neuf »</strong> gaps. Une signature est un rendu de
        données. Microsoft documente le mode d&apos;échec : <em>« Rules skip lines that contain variables they
        can&apos;t update »</em> — attribut vide, ligne sautée <strong>silencieusement</strong>. Personne ne propose de
        tableau de bord de complétude, d&apos;alerte proactive, ni de workflow de correction routé vers le bon
        propriétaire.
      </p>

      <div className="callout" style={{ marginBottom: 16 }}>
        <strong>Nuance de la critique, §7.1 :</strong> le terrain n&apos;est pas vierge — Siggly vend un Directory Sync
        positionné sur l&apos;exactitude des données, Signite publie du contenu dédié à l&apos;audit préalable. Et le
        risque de fond de ce module est de déplacer le produit vers l&apos;IAM : cycles longs, interlocuteur DSI/DRH, et
        perte de l&apos;achat impulsif à 1 € qui fait vivre ce marché (§9).
      </div>

      <div className="card">
        <div className="spread" style={{ marginBottom: 8 }}>
          <label style={{ margin: 0 }}>Export annuaire (CSV : Entra ID, Google Directory, Lucca, PayFit, Silae…)</label>
          <div className="row">
            <input type="file" accept=".csv,.txt" onChange={onFile} style={{ width: 'auto' }} />
            <button onClick={() => setCsv(DEMO_DIRECTORY_CSV.trim())}>Exemple</button>
          </div>
        </div>
        <textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="mail;givenName;surname;…" />
      </div>

      {audit && parsed && (
        <>
          <div className="grid g3" style={{ marginTop: 14 }}>
            <div className="card">
              <div className="stat">
                {audit.total} <small>collaborateurs</small>
              </div>
            </div>
            <div className="card">
              <div className="stat" style={{ color: audit.nonCompliant.length ? 'var(--bad)' : 'var(--ok)' }}>
                {audit.nonCompliant.length} <small>signatures non conformes (mention réglementée sautée)</small>
              </div>
            </div>
            <div className="card">
              <div className="stat">
                {audit.attributes.reduce((n, a) => n + a.missing, 0)} <small>valeurs manquantes au total</small>
              </div>
            </div>
          </div>

          <h2>Alertes — formulées pour être envoyées, pas contemplées</h2>
          <div className="card">
            <ul className="tight">
              {audit.alerts.map((a, i) => (
                <li key={i} style={{ color: /non conforme/.test(a) ? 'var(--bad)' : undefined }}>
                  {a}
                </li>
              ))}
            </ul>
            <button className="primary" onClick={downloadCorrections} style={{ marginTop: 8 }}>
              Exporter les corrections (CSV)
            </button>
          </div>

          <h2>Complétude par attribut</h2>
          <div className="card scroll-x">
            <table className="data">
              <thead>
                <tr>
                  <th>Attribut</th>
                  <th>Ligne impactée</th>
                  <th>Complétude</th>
                  <th>Manquants</th>
                  <th>Effet</th>
                  <th>Exemples</th>
                </tr>
              </thead>
              <tbody>
                {audit.attributes.map((a) => (
                  <tr key={a.attribute}>
                    <td>
                      <strong>{a.label}</strong>
                      <div className="veille">{a.attribute}</div>
                    </td>
                    <td>{a.breaksLine}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="meter">
                        <i data-level={a.rate === 100 ? undefined : a.rate >= 80 ? 'warn' : 'bad'} style={{ width: `${a.rate}%` }} />
                      </div>
                      <span className="veille">{a.rate}%</span>
                    </td>
                    <td>{a.missing}</td>
                    <td>
                      {a.regulated ? (
                        <span className="tag bad">non-conformité</span>
                      ) : (
                        <span className={`tag ${a.severity === 'critical' ? 'warn' : ''}`}>ligne sautée</span>
                      )}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--dim)' }}>{a.sample.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {audit.unusedColumns.length > 0 && (
            <p className="note">Colonnes présentes mais inutilisées : {audit.unusedColumns.join(', ')}.</p>
          )}
        </>
      )}

      <h2>Exigences par défaut</h2>
      <div className="card">
        <p className="note" style={{ marginTop: 0 }}>
          Traduire le template en contrat de données, c&apos;est la moitié du travail d&apos;un déploiement réel. Ce jeu
          est à adapter par client.
        </p>
        <table className="data">
          <thead>
            <tr>
              <th>Attribut</th>
              <th>Ligne</th>
              <th>Réglementé</th>
              <th>Gravité</th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_REQUIREMENTS.map((r) => (
              <tr key={r.attribute}>
                <td>
                  {r.label} <span className="veille">{r.attribute}</span>
                </td>
                <td>{r.breaksLine}</td>
                <td>{r.regulated ? <span className="tag bad">oui</span> : '—'}</td>
                <td>{r.severity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Connecteurs</h2>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Source</th>
              <th>État</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {CONNECTORS.map((c) => (
              <tr key={c.id}>
                <td>{c.label}</td>
                <td>
                  <span className={`tag ${c.status === 'implemented' ? 'ok' : c.status === 'planned' ? 'info' : ''}`}>
                    {c.status === 'implemented' ? 'fonctionnel' : c.status === 'planned' ? 'prévu' : 'déclaré, non implémenté'}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)' }}>{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          §7.1 : « Sur le marché français : Lucca, PayFit, Eurecia et Silae sont la source de vérité réelle. Seuls
          Signitic (plan Custom, sur devis) et Boost My Mail proposent Lucca. Exclaimer réserve ses connecteurs SIRH au
          palier Pro. » Aucun n&apos;est implémenté ici : l&apos;import CSV est le seul chemin réellement fonctionnel à
          ce stade.
        </p>
      </div>

      <div className="callout" style={{ marginTop: 16 }}>
        <strong>Parti pris.</strong> Aucun champ de surcharge silencieux. §7.1 relève que l&apos;
        <code>Attributes Manager</code> de CodeTwo crée un référentiel RH fantôme : une valeur modifiée{' '}
        <em>« will not be changed by any subsequent changes in your tenant&apos;s Entra ID »</em> — un collaborateur
        promu garde son ancien titre indéfiniment. On corrige à la source, ou on trace l&apos;écart. Jamais on ne recopie
        en silence.
      </div>
    </div>
  )
}
