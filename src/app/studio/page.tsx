'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { compile } from '@/core/compile.ts'
import { lint } from '@/core/lint.ts'
import { Findings } from '@/components/Findings'
import { PROFESSION_PACKS, getPack } from '@/core/regulated.ts'
import type { ProfessionId } from '@/core/model.ts'

export default function Studio() {
  const { src, setSrc, reset } = useStore()
  const compiled = useMemo(() => compile(src), [src])
  const report = useMemo(() => lint(compiled.html), [compiled.html])
  const [tab, setTab] = useState<'rendu' | 'html' | 'texte' | 'linter'>('rendu')
  const pack = getPack(src.person.profession)

  const P = <K extends keyof typeof src.person>(k: K, v: (typeof src.person)[K]) =>
    setSrc((s) => ({ ...s, person: { ...s.person, [k]: v } }))
  const O = <K extends keyof typeof src.org>(k: K, v: (typeof src.org)[K]) =>
    setSrc((s) => ({ ...s, org: { ...s.org, [k]: v } }))

  return (
    <div>
      <h1>Studio</h1>
      <p className="lede">
        Le compilateur applique par construction les contraintes de §6.2 : tables uniquement, jamais de div ni de flex,
        aucune webfont, aucun bloc <code>&lt;style&gt;</code>, couleurs hexadécimales seules, accents en entités
        numériques, bloc <code>OfficeDocumentSettings</code> à 96 dpi, images en https absolu avec dimensions doublées,
        filet séparateur en cellule colorée. Sa sortie doit passer son propre linter sans finding actionnable —
        c&apos;est le test non négociable du projet.
      </p>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        {/* ---------------- Formulaire ---------------- */}
        <div className="card">
          <div className="spread">
            <h3 style={{ margin: 0 }}>Source</h3>
            <button onClick={reset}>Réinitialiser</button>
          </div>

          <div className="grid g2" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Prénom</label>
              <input value={src.person.firstName} onChange={(e) => P('firstName', e.target.value)} />
            </div>
            <div className="field">
              <label>Nom</label>
              <input value={src.person.lastName} onChange={(e) => P('lastName', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Fonction</label>
            <input value={src.person.jobTitle ?? ''} onChange={(e) => P('jobTitle', e.target.value)} />
          </div>
          <div className="grid g2">
            <div className="field">
              <label>Direction</label>
              <input value={src.person.department ?? ''} onChange={(e) => P('department', e.target.value)} />
            </div>
            <div className="field">
              <label>Mobile</label>
              <input value={src.person.mobile ?? ''} onChange={(e) => P('mobile', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <input value={src.person.email} onChange={(e) => P('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Lien canonique</label>
            <input value={src.person.url ?? ''} onChange={(e) => P('url', e.target.value)} />
          </div>

          <h3>Organisation</h3>
          <div className="field">
            <label>Nom</label>
            <input value={src.org.name} onChange={(e) => O('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Entité juridique</label>
            <input value={src.org.legalEntity ?? ''} onChange={(e) => O('legalEntity', e.target.value)} />
            <p className="note">
              §7.1 : c&apos;est l&apos;attribut dont l&apos;absence fait sauter la mention légale — silencieusement.
            </p>
          </div>

          <h3>Profession réglementée</h3>
          <div className="field">
            <select
              value={src.person.profession ?? 'none'}
              onChange={(e) => P('profession', e.target.value as ProfessionId)}
            >
              <option value="none">Aucune</option>
              {Object.values(PROFESSION_PACKS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {pack && (
            <>
              <div className="callout" style={{ marginBottom: 10 }}>
                <strong>{pack.authority}</strong> — {pack.basis}. {pack.caveat}
              </div>
              {pack.fields.map((f) => (
                <div className="field" key={f.key}>
                  <label>
                    {f.label} {f.required && <span style={{ color: 'var(--bad)' }}>*</span>}
                  </label>
                  <input
                    placeholder={f.hint}
                    value={src.person.professionFields?.[f.key] ?? ''}
                    onChange={(e) =>
                      setSrc((s) => ({
                        ...s,
                        person: {
                          ...s.person,
                          professionFields: { ...(s.person.professionFields ?? {}), [f.key]: e.target.value },
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </>
          )}

          <h3>Marque</h3>
          <div className="grid g2">
            <div className="field">
              <label>Encre</label>
              <input value={src.brand.ink} onChange={(e) => setSrc((s) => ({ ...s, brand: { ...s.brand, ink: e.target.value } }))} />
            </div>
            <div className="field">
              <label>Secondaire (mentions)</label>
              <input value={src.brand.muted} onChange={(e) => setSrc((s) => ({ ...s, brand: { ...s.brand, muted: e.target.value } }))} />
            </div>
            <div className="field">
              <label>Accent (liens)</label>
              <input value={src.brand.accent} onChange={(e) => setSrc((s) => ({ ...s, brand: { ...s.brand, accent: e.target.value } }))} />
            </div>
            <div className="field">
              <label>Filet</label>
              <input value={src.brand.rule} onChange={(e) => setSrc((s) => ({ ...s, brand: { ...s.brand, rule: e.target.value } }))} />
            </div>
          </div>

          <h3>Logo</h3>
          <div className="field">
            <label>URL absolue https, versionnée</label>
            <input
              value={src.logo?.src ?? ''}
              onChange={(e) =>
                setSrc((s) => ({ ...s, logo: s.logo ? { ...s.logo, src: e.target.value } : undefined }))
              }
            />
          </div>
          <div className="field">
            <label>Comportement en mode sombre</label>
            <select
              value={src.logo?.darkBehaviour ?? 'opaque-light'}
              onChange={(e) =>
                setSrc((s) => ({
                  ...s,
                  logo: s.logo ? { ...s.logo, darkBehaviour: e.target.value as never } : undefined,
                }))
              }
            >
              <option value="opaque-light">Fond blanc cuit — survit à l&apos;inversion</option>
              <option value="ink-on-transparent">Encre sombre sur transparent — disparaît</option>
              <option value="light-on-transparent">Encre claire sur transparent — illisible en clair</option>
            </select>
          </div>

          <h3>Mise en page</h3>
          <div className="grid g2">
            <div className="field">
              <label>Variante</label>
              <select
                value={src.layout.variant}
                onChange={(e) => setSrc((s) => ({ ...s, layout: { ...s.layout, variant: e.target.value as never } }))}
              >
                <option value="aside">Logo à gauche</option>
                <option value="stack">Une colonne</option>
              </select>
            </div>
            <div className="field">
              <label>Largeur (px)</label>
              <input
                type="number"
                value={src.layout.width}
                onChange={(e) => setSrc((s) => ({ ...s, layout: { ...s.layout, width: Number(e.target.value) } }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Disclaimer</label>
            <textarea
              rows={3}
              value={src.legal.disclaimer ?? ''}
              onChange={(e) => setSrc((s) => ({ ...s, legal: { ...s.legal, disclaimer: e.target.value } }))}
            />
            <p className="note">
              §10.6 : juridiquement inopérant, plus long que l&apos;information utile, relu intégralement par les
              lecteurs d&apos;écran à chaque message du fil, et il consomme le budget d&apos;octets qui protège du
              clipping Gmail. Le supprimer est le meilleur geste de design possible.
            </p>
          </div>
        </div>

        {/* ---------------- Sortie ---------------- */}
        <div>
          <div className="card">
            <div className="row" style={{ marginBottom: 12 }}>
              {(['rendu', 'html', 'texte', 'linter'] as const).map((t) => (
                <button key={t} className={tab === t ? 'primary' : ''} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
              <span style={{ flex: 1 }} />
              <span className="tag">{(compiled.bytes / 1024).toFixed(1)} Ko</span>
              <span className={`tag ${report.score.critical + report.score.major > 0 ? 'bad' : 'ok'}`}>
                {report.findings.length} finding(s)
              </span>
            </div>

            {tab === 'rendu' && (
              <div className="preview-frame" dangerouslySetInnerHTML={{ __html: compiled.html }} />
            )}
            {tab === 'html' && <pre className="code">{compiled.html}</pre>}
            {tab === 'texte' && <pre className="code">{compiled.text}</pre>}
            {tab === 'linter' && <Findings report={report} />}
          </div>

          {compiled.warnings.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <h3 style={{ marginTop: 0 }}>Avertissements du compilateur</h3>
              {compiled.warnings.map((w, i) => (
                <div key={i} className="finding" data-sev={w.severity}>
                  <div className="spread">
                    <h4>{w.code}</h4>
                    <span className="veille">{w.veille}</span>
                  </div>
                  <p>{w.message}</p>
                </div>
              ))}
            </div>
          )}

          {compiled.regulatedSkipped.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <h3 style={{ marginTop: 0 }}>Lignes réglementaires sautées</h3>
              <p className="note">
                Microsoft le documente : « Rules skip lines that contain variables they can&apos;t update ». Ici on ne
                saute pas en silence.
              </p>
              <ul className="tight">
                {compiled.regulatedSkipped.map((l, i) => (
                  <li key={i}>
                    <code>{l}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
