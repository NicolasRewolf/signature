'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { compile, estimateGmailClipping } from '@/core/compile.ts'
import { buildContract } from '@/core/contract.ts'

export default function Dashboard() {
  const { src, deployment, setDeployment, ready } = useStore()
  const compiled = useMemo(() => compile(src), [src])
  const contract = useMemo(() => buildContract(compiled, deployment), [compiled, deployment])
  const clip = useMemo(() => estimateGmailClipping(compiled.bytes), [compiled.bytes])

  const weightLevel = compiled.bytes > 80_000 ? 'bad' : compiled.bytes > 40_000 ? 'warn' : 'ok'

  return (
    <div>
      <h1>La même information partout</h1>
      <p className="lede">
        La promesse « la signature qui ne casse pas » est indéfendable : on choisit le rendu à l&apos;<em>écriture</em>,
        la casse se produit chez le client de <em>lecture</em>. Cet outil ne promet donc pas un rendu identique. Il
        garantit qu&apos;un nombre fini d&apos;informations — le socle — reste lisible et cliquable quand tout se passe
        mal, et il écrit noir sur blanc ce qui n&apos;est pas couvert. <span className="veille">veille §6</span>
      </p>

      <div className="grid g3">
        <div className="card">
          <div className="stat" style={{ color: `var(--${contract.verdict === 'signable' ? 'ok' : contract.verdict === 'a_corriger' ? 'warn' : 'bad'})` }}>
            {contract.verdict === 'signable' ? 'Signable' : contract.verdict === 'a_corriger' ? 'À corriger' : 'Non signable'}
            <small>verdict du contrat</small>
          </div>
          {contract.blocking.length > 0 && (
            <p className="note">{contract.blocking.length} point(s) bloquant(s)</p>
          )}
        </div>
        <div className="card">
          <div className="stat">
            {contract.passed}/{contract.total}
            <small>scénarios où le socle survit intégralement</small>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            ~{clip.rounds}
            <small>allers-retours avant clipping Gmail (modèle)</small>
          </div>
        </div>
      </div>

      <h2>Le socle</h2>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Information</th>
              <th>Valeur</th>
              <th>Cliquable exigé</th>
            </tr>
          </thead>
          <tbody>
            {compiled.floor.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td>{f.value}</td>
                <td>{f.mustBeClickable ? <span className="tag ok">oui</span> : <span className="tag">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          C&apos;est court volontairement. Le contrat de §6 porte sur « ces cinq informations », pas sur la signature
          entière. Tout le reste — logo, couleurs, bandeau, disclaimer — est de la décoration négociable.
        </p>
      </div>

      <h2>Mode de déploiement</h2>
      <div className="card">
        <div className="row">
          {(['server-side', 'client-side', 'combo'] as const).map((m) => (
            <button key={m} className={deployment === m ? 'primary' : ''} onClick={() => setDeployment(m)}>
              {m}
            </button>
          ))}
        </div>
        <p className="note" style={{ marginTop: 10 }}>
          §4 : « Tout le marché est structuré par ces deux arbitrages, et aucun des deux n&apos;a de bonne réponse. » En
          client-side pur, l&apos;envoi programmatique (Graph sendMail, CRM, agents IA) et le mobile hors famille Outlook
          sont structurellement perdus — le contrat bascule en <em>non signable</em>. C&apos;est voulu : mieux vaut
          l&apos;apprendre ici qu&apos;en réunion client.
        </p>
      </div>

      <h2>Poids</h2>
      <div className="card">
        <div className="spread" style={{ marginBottom: 8 }}>
          <span>
            {(compiled.bytes / 1024).toFixed(1)} Ko · {compiled.chars.toLocaleString('fr-FR')} caractères
          </span>
          <span className="veille">budget 80 Ko · plafond Gmail sendAs 10 000 car.</span>
        </div>
        <div className="meter">
          <i data-level={weightLevel} style={{ width: `${Math.min(100, (compiled.bytes / 80_000) * 100)}%` }} />
        </div>
        <p className="note">
          Gmail coupe le corps à ~102 Ko et la signature, en fin de corps, part la première. Le poids n&apos;est pas une
          coquetterie : c&apos;est le seul levier sur le clipping. {clip.assumptions}.
        </p>
      </div>

      <h2>Où aller</h2>
      <div className="grid g2">
        <Link className="card" href="/studio" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>Studio</strong>
          <p className="note">Éditer la source, voir le HTML défensif compilé et le linter en direct.</p>
        </Link>
        <Link className="card" href="/contrat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>Contrat de dégradation</strong>
          <p className="note">La matrice socle × scénarios, et l&apos;attestation à remettre au client.</p>
        </Link>
        <Link className="card" href="/linter" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>Linter</strong>
          <p className="note">
            Coller n&apos;importe quelle signature existante. §9 : « la requête monétisable n&apos;est pas “créer une
            signature” mais “ma signature est cassée” ».
          </p>
        </Link>
        <Link className="card" href="/annuaire" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong>QA annuaire</strong>
          <p className="note">§7.1, « le meilleur des neuf » gaps : attribut vide → ligne sautée silencieusement.</p>
        </Link>
      </div>

      {!ready && <p className="note">Chargement de l&apos;état local…</p>}
    </div>
  )
}
