'use client'

import type { LintReport } from '@/core/lint.ts'

const SEV_LABEL: Record<string, string> = {
  critical: 'critique',
  major: 'majeur',
  minor: 'mineur',
  info: 'info',
}

export function Findings({ report }: { report: LintReport }) {
  if (!report.findings.length) {
    return <p className="note">Aucun finding. Le HTML respecte les 26 modes de rupture recensés en §5.</p>
  }
  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="tag bad">{report.score.critical} critique(s)</span>
        <span className="tag warn">{report.score.major} majeur(s)</span>
        <span className="tag info">{report.score.minor} mineur(s)</span>
        <span className="tag">{report.score.info} info</span>
        <span style={{ flex: 1 }} />
        <span className="tag ok">{report.actionable} corrigeable(s) côté émetteur</span>
        <span className="tag">{report.toDocument} à documenter au client</span>
      </div>

      {report.toDocument > 0 && (
        <div className="callout" style={{ marginBottom: 16 }}>
          <strong>Pourquoi cette seconde colonne.</strong> La veille §7.4 objecte que les régressions citées sont des
          régressions de clients de <em>lecture</em> : si Outlook 2505 ignore le CSS, il l&apos;ignore pour tout le monde
          et « le correctif côté émetteur n&apos;existe pas. On produit des alertes sans correctif associé. » Un linter
          qui mélange les deux est du bruit. Ces {report.toDocument} finding(s) ne sont pas des bugs à corriger : ce sont
          des lignes à écrire dans le contrat.
        </div>
      )}

      {report.findings.map((f, i) => (
        <div key={i} className="finding" data-sev={f.severity}>
          <div className="spread">
            <h4>{f.rule.title}</h4>
            <div className="row">
              <span className={`tag ${f.severity === 'critical' ? 'bad' : f.severity === 'major' ? 'warn' : 'info'}`}>
                {SEV_LABEL[f.severity]}
              </span>
              <span className="veille">{f.rule.veille}</span>
            </div>
          </div>
          <p>{f.message}</p>
          <p style={{ color: 'var(--dim)', fontSize: 12 }}>{f.rule.why}</p>
          <p className="fix">
            {f.rule.actionable ? '→ ' : '⚠ Sans correctif émetteur — '}
            {f.rule.fix}
          </p>
          {f.evidence && (
            <pre className="code" style={{ marginTop: 6, fontSize: 10.5 }}>
              {f.evidence}
            </pre>
          )}
          <div className="row" style={{ marginTop: 5 }}>
            <span className="veille">{f.rule.id}</span>
            <span className="veille">· clients : {f.rule.clients.join(', ')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
