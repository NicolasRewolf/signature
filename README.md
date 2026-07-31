# Socle

**« La même information partout »** — jamais « la même signature partout ».

Scaffold d'une webapp de création et de contrôle de signatures email, entièrement dérivé de
[`veille-signatures-email.md`](./veille-signatures-email.md) (31 juillet 2026). Chaque module, chaque règle et chaque
exclusion porte le § de la veille dont elle sort. Rien n'a été ajouté qui n'y figure.

```bash
npm install
npm run dev      # http://localhost:4311
npm test         # 53 tests, moteur pur TypeScript
npm run build
```

---

## Pourquoi cette forme et pas une autre

La veille tue la thèse de départ en une phrase (§6) :

> « La signature qui ne casse pas » est indéfendable telle quelle, et dangereuse à porter. Elle est réfutable par
> n'importe quel prospect en une capture d'écran.

Parce qu'on choisit le rendu à l'**écriture** et que la casse se produit chez le client de **lecture**. Elle donne aussi
la seule reformulation tenable :

> Ce qui n'est jamais garantissable : *la même signature partout*. Ce qui l'est : **la même information partout**.

Tout le produit découle de là. Il n'essaie pas de garantir un rendu. Il garantit qu'un nombre fini d'informations — le
**socle** — reste lisible et cliquable quand tout se passe mal, et il écrit noir sur blanc ce qui n'est pas couvert.

Le livrable vendable n'est donc pas un template : c'est le **contrat de dégradation gracieuse**, une matrice
socle × scénarios exportable, assortie de la liste signée des exclusions permanentes.

---

## Ce que fait le scaffold

| Module | Ce qu'il fait | Gap de la veille |
|---|---|---|
| **Studio** | Compile un HTML défensif *par construction* : tables seules, zéro `div`/flex, zéro webfont, zéro bloc `<style>`, hexadécimal seul, entités numériques, `OfficeDocumentSettings` 96 dpi, images https absolues à dimensions doublées, filet en cellule colorée. Émet aussi une alternative `text/plain`. | §6.2 |
| **Contrat** | Matrice socle × 9 scénarios de dégradation, verdict `signable` / `à corriger` / `non signable`, attestation Markdown téléchargeable. | §6, §9 |
| **Linter** | 28 règles exécutables tirées des 26 modes de rupture. Sépare ce qui est **corrigeable côté émetteur** de ce qui est seulement **à documenter**. | §5, §7.4 |
| **QA annuaire** | Import CSV, complétude par attribut, détection du saut de ligne silencieux, non-conformités réglementaires, export des corrections routables. | §7.1 |
| **Déploiement** | Artefacts par cible (règle de transport Exchange, payload Gmail `sendAs`, fichiers `.htm` Outlook, instructions manuelles) — chacun avec sa liste de trous. | §2, §4 |
| **Registre** | Régressions éditeurs documentées + matrice de capacités des clients de lecture. | §5, §7.4 |
| **Périmètre honnête** | Ce que l'outil ne fait pas, les gaps tombés à la vérification, les angles morts non adressés. | §7.7–7.9, §8, §10 |

### Professions réglementées (§8.4)

Packs pour avocat, notaire, commissaire de justice, expert-comptable, architecte, agent immobilier (loi Hoguet),
courtier ORIAS, et **§35a GmbHG** allemand — le seul budget non discrétionnaire du marché, que personne ne sert
spécifiquement. Chaque pack porte son autorité de contrôle et un avertissement de non-validation juridique.

### Conformité CNIL (§7.3)

Aucun pixel de suivi, aucune redirection de liens. Le linter les classe **critiques** : délibération n°2026-042 du
12 mars 2026, délai transitoire échu depuis le 14 juillet 2026.

---

## Architecture

```
src/core/        moteur pur TypeScript, zéro dépendance, testé sous node --test
  model.ts       socle, personne, organisation, marque, versionnement
  regulated.ts   packs de mentions réglementées
  clients.ts     capacités des clients de lecture + registre des régressions
  html.ts        tokenizer, contraste WCAG, inversion, entités
  compile.ts     compilateur défensif + modèle de clipping Gmail
  lint.ts        28 règles
  degrade.ts     9 scénarios de dégradation
  contract.ts    matrice, verdict, attestation
  directory.ts   QA annuaire
  exports.ts     cibles de déploiement et leurs trous
src/app/         Next.js App Router, 8 pages
```

Le moteur ne dépend ni de React ni du DOM : il tourne à l'identique dans le navigateur et sous `node --test`.

**Test d'intégrité central** : la sortie du compilateur doit passer son propre linter sans finding critique ou majeur
actionnable. Si ce test tombe, on émet du HTML que la veille désigne comme cassé.

---

## Ce que ce scaffold ne fait pas

Lister ces trous fait partie du produit. Voir `/perimetre` dans l'app.

- **Aucun déploiement effectif.** Il produit des artefacts, il ne les pousse pas. Pas de connexion tenant.
- **Aucun connecteur SIRH implémenté.** Lucca, PayFit, Silae, Eurecia sont déclarés, pas branchés.
- **Aucun rendu réel multi-clients.** Les scénarios sont des approximations déterministes, pas des captures. §7.4
  rappelle que Litmus, Email on Acid, Siggly et darkmodechecker.org font déjà le test ponctuel — gratuitement.
- **Le modèle de clipping Gmail est un modèle, pas une mesure.** Calibré pour tomber dans la fourchette 8–15
  allers-retours de §5. À recalibrer sur un vrai fil client avant d'en faire un argument commercial.
- **Aucun workflow d'approbation ni rollback** (§7.2 est modélisé dans les types, pas câblé).
- **Aucune surveillance continue d'un parc déployé** (§7.4) : le registre est manuel.
- **Aucune validation juridique** des packs réglementaires : ce sont des gabarits à faire relire.
- **Aucun BIMI, aucun DMARC, aucune carte de visite numérique** (§8.1, §8.2).
- **L'alignement DKIM après réécriture server-side** et les exigences expéditeurs Gmail/Yahoo 2024 ne sont pas
  instruits — la veille les signale elle-même comme angle mort `[à instruire]`.

---

## Avant d'investir davantage

La veille pose sa propre limite en §6 du préambule et en §10 :

> C'est une analyse d'**offre** à 100 %. Zéro entretien acheteur, zéro donnée de demande. Sur un marché consolidé,
> l'absence d'une fonctionnalité est plus souvent la preuve que personne ne l'achète que la preuve d'une opportunité.

> **Dix entretiens acheteurs valent plus que dix pages d'analyse supplémentaire.**

Ce scaffold est un artefact de démonstration et un outil de travail personnel. Il ne vaut pas validation de marché.
Voir [`docs/monetisation.md`](./docs/monetisation.md) pour les arbitrages économiques et leurs risques,
tous repris de §9 avec leurs contre-arguments.
