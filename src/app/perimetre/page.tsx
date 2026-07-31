'use client'

import { PERMANENT_EXCLUSIONS, SERVER_SIDE_EXCEPTIONS } from '@/core/contract.ts'

const TOMBES = [
  {
    titre: '7.7 — L’accessibilité via l’European Accessibility Act',
    verdict: 'Le levier juridique n’existe pas.',
    détail:
      "L'EAA (dir. 2019/882) vise une liste FERMÉE de produits et services destinés aux CONSOMMATEURS. La correspondance email d'une organisation n'y figure pas, et les micro-entreprises de service sont explicitement exemptées. Ce qui reste vrai : aucun outil de déploiement n'impose de contrainte d'accessibilité bloquante dans son éditeur, et la convention du gris clair échoue mécaniquement le seuil 4,5:1. Sur le marché français, le RGAA (secteur public et délégataires) est un fondement solide ; pour le privé, argumenter qualité et réputation, pas obligation.",
  },
  {
    titre: '7.8 — L’absence d’offre MSP/agences',
    verdict: 'Factuellement faux.',
    détail:
      "Exclaimer opère un programme MSP & Reseller public et dédié, CodeTwo un programme partenaire multi-tenant. Les verbatims r/msp ne disent pas qu'il n'y a pas d'offre — ils disent que la marge est mauvaise. C'est un gap de modèle économique, pas d'offre, et attaquer une structure de marge dans un marché à 1 $/siège contre des acteurs qui ont déjà le canal est le pire terrain possible.",
  },
  {
    titre: '7.9 — Le segment sous 10 sièges',
    verdict: 'Autoréfutant.',
    détail: 'Signitic (gratuit <20), Bybrand (8 $/mois), Sigsync (aucun minimum), SyncSignature (dès 5 sièges) le servent déjà.',
  },
]

const ANGLES_MORTS = [
  {
    titre: '8.1 — La carte de visite numérique est un concurrent FRONTAL',
    détail:
      "HiHello inclut la signature email à tous ses paliers, Business à 5 $/user/mois avec SSO et directory sync. C'est-à-dire exactement ce que les spécialistes vendent 1 à 2 $, vendu 3 à 7× plus cher, à un AUTRE acheteur (sales enablement, pas IT). Popl facture sans siège, ce qui invalide la grille prix-par-siège qui structure tout ce marché. Conclusion : le marché n'est pas commoditisé à 0 €. Il est commoditisé à 0 € pour l'acheteur IT/marketing. C'est probablement l'enseignement le plus actionnable de toute la veille.",
  },
  {
    titre: '8.2 — BIMI',
    détail:
      "Le logo qui compte migre HORS du corps du message, vers l'avatar expéditeur, rendu par Gmail, Yahoo et Apple Mail avant même l'ouverture, et prouvé cryptographiquement (VMC/CMC). Prérequis : DMARC en enforcement stricte. C'est à la fois un concurrent direct pour le budget « marque dans l'email » et le seul canal identitaire qui ne casse jamais. Non traité par cet outil.",
  },
  {
    titre: '8.5 — Santé, public, éducation',
    détail:
      "MSSanté est un espace de confiance fermé, à opérateurs homologués : un estampilleur server-side tiers y est structurellement impossible, et l'HDS interdit de faire transiter des données de santé chez un éditeur non certifié. Public et éducation : achat par marché public (UGAP), donc pas d'achat impulsif à 1 €, et RGAA opposable.",
  },
  {
    titre: '8.7 — Aucun scénario Microsoft',
    détail:
      "Toute la thèse client-side repose sur l'absence d'API Graph de signature. Si Microsoft en publie une, ou intègre nativement la gestion centralisée dans M365, c'est la fin du segment déployeur en un cycle. L'échéance EWS prouve qu'ils redessinent unilatéralement le terrain.",
  },
  {
    titre: '8.8 — Le coût de sortie',
    détail:
      "Jamais instruit : durée d'engagement, reconstruction des templates, reconfiguration du connecteur, re-consentement admin, fenêtre de bascule. C'est l'obstacle n°1 de tout nouvel entrant. Exclaimer affiche 96 % de rétention dans son argumentaire MSP.",
  },
]

export default function PerimetrePage() {
  return (
    <div>
      <h1>Périmètre honnête</h1>
      <p className="lede">
        Cette page existe pour que l&apos;outil ne se raconte pas d&apos;histoires. Elle liste ce qu&apos;il ne fait pas,
        ce que la veille a explicitement démenti, et les angles morts que le scaffold n&apos;adresse pas. §10 :{' '}
        <em>
          « chaque gap est établi par une absence d&apos;offre constatée sur des pages produit, jamais par un signal
          d&apos;acheteur. Pas un entretien, pas un appel d&apos;offres, pas un prix testé. »
        </em>
      </p>

      <div className="callout" style={{ borderLeftColor: 'var(--bad)' }}>
        <strong>Limite majeure de la veille, à lire avant tout arbitrage.</strong> C&apos;est une analyse
        d&apos;<em>offre</em> à 100 %. Zéro entretien acheteur, zéro donnée de demande. Sur un marché consolidé,
        l&apos;absence d&apos;une fonctionnalité est plus souvent la preuve que personne ne l&apos;achète que la preuve
        d&apos;une opportunité. <strong>Dix entretiens acheteurs valent plus que dix pages d&apos;analyse
        supplémentaire</strong> — et plus que ce scaffold.
      </div>

      <h2>Ce que cet outil ne garantit jamais</h2>
      <div className="card">
        <ul className="tight">
          {PERMANENT_EXCLUSIONS.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>

      <h2>Exceptions du mode server-side</h2>
      <div className="card">
        <ul className="tight">
          {SERVER_SIDE_EXCEPTIONS.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        <p className="note">
          §2.C signale en outre un angle mort non instruit : <strong>l&apos;alignement DKIM après réécriture
          server-side</strong> et les exigences expéditeurs Gmail/Yahoo entrées en vigueur en 2024. Ce sont des
          objections techniques de premier ordre. À valider avant tout déploiement réel — ce scaffold ne les traite pas.
        </p>
      </div>

      <h2>Ce que cet outil ne fait pas du tout</h2>
      <div className="card">
        <ul className="tight">
          <li>Aucun déploiement effectif : il produit des artefacts, il ne les pousse pas. Pas de connexion tenant.</li>
          <li>Aucun connecteur SIRH implémenté (Lucca, PayFit, Silae, Eurecia sont déclarés, pas branchés).</li>
          <li>
            Aucun rendu réel multi-clients : les scénarios sont des approximations déterministes, pas des captures. Ils
            ne remplacent pas Litmus ou Email on Acid — que §7.4 rappelle être déjà gratuits.
          </li>
          <li>Aucun workflow d&apos;approbation ni rollback opérationnel (§7.2 modélisé dans les types, pas câblé).</li>
          <li>Aucune surveillance continue d&apos;un parc déployé (§7.4) : le registre est manuel.</li>
          <li>Aucune validation juridique des packs de mentions réglementées (§8.4) : ce sont des gabarits à relire.</li>
          <li>Aucun BIMI, aucun DMARC, aucune carte de visite numérique.</li>
        </ul>
      </div>

      <h2>Gaps tombés à la vérification — ne pas les revendre</h2>
      <div className="grid g2">
        {TOMBES.map((t) => (
          <div className="card" key={t.titre}>
            <div className="spread">
              <strong>{t.titre}</strong>
              <span className="tag bad">tombé</span>
            </div>
            <p style={{ color: 'var(--warn)', fontSize: 12.5, margin: '4px 0' }}>{t.verdict}</p>
            <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: 0 }}>{t.détail}</p>
          </div>
        ))}
      </div>

      <h2>Angles morts non adressés</h2>
      <div className="grid g2">
        {ANGLES_MORTS.map((a) => (
          <div className="card" key={a.titre}>
            <strong>{a.titre}</strong>
            <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '6px 0 0' }}>{a.détail}</p>
          </div>
        ))}
      </div>

      <h2>À instruire avant de décider (§10)</h2>
      <div className="card">
        <ul className="tight">
          <li>Dix entretiens acheteurs. Qui signe le chèque ? Quel budget ? Quel cycle ? Contre quel arbitrage interne ?</li>
          <li>Aucune voix du destinataire dans tout le corpus : que font réellement les gens d&apos;une signature ?</li>
          <li>Aucun chiffre sur le coût du problème côté client : temps IT, tickets, fréquence des refontes.</li>
          <li>
            Économie unitaire du modèle de service : parc de comptes de test, coût Litmus refacturé, temps humain par
            client par mois, prix de vente, marge brute. Impossible d&apos;arbitrer « SaaS ou studio » sans ça.
          </li>
          <li>Corpus à compléter : Siggly, Signite, SignKit, Draftship, signatureforemail.com, HiHello, Popl, Mobilo.</li>
        </ul>
      </div>
    </div>
  )
}
