# Audit d'utilisabilité — Socle

**31 juillet 2026** · Revue experte par personas sur l'application réelle (`localhost:4311`, commit `eae53ea`).
Aucune modification de code n'a été faite. Ce document constate, il n'arbitre pas.

---

## Avertissement de méthode — à lire avant le reste

**Ceci n'est pas de la recherche utilisateur.** Ce sont six personas construits par moi, joués par moi, sur un produit
écrit par moi. C'est très exactement le biais que la veille reproche à sa propre analyse (§10) :

> Chaque gap est établi par une absence d'offre constatée sur des pages produit, **jamais par un signal d'acheteur**.
> Pas un entretien, pas un appel d'offres, pas un prix testé.

Une revue experte trouve les fautes de fabrication — libellés opaques, chemins cassés, accessibilité. Elle est aveugle
à tout le reste : ce que les gens veulent réellement, ce qu'ils sont prêts à payer, ce qu'ils feraient à la place. Les
constats mécaniques ci-dessous (contraste mesuré, boutons absents, labels non associés) sont **factuels et vérifiés**.
Les inférences sur ce qu'un persona « comprend » ou « ressent » sont **des hypothèses**, et doivent être traitées comme
telles.

**Ce qui est mesuré est marqué [mesuré]. Ce qui est supposé est marqué [hypothèse].**

---

## Verdict en cinq lignes

1. **Le produit est lisible et honnête, mais il parle à quelqu'un qui a lu la veille.** Les § partout, le mot « socle »,
   les verdicts `non_signable` : c'est un outil d'auteur, pas encore un outil de client.
2. **Le chemin « sortir la signature vers un vrai client mail » est cassé pour tout le monde sauf toi.** Il n'existe
   aucun bouton copier dans tout le Studio. [mesuré]
3. **La page Déploiement → Installation manuelle donne quatre blocs d'instructions et zéro chose à coller.** [mesuré]
4. **L'outil échoue deux de ses propres règles** : contraste à 2,89:1 sur une grande partie de l'interface, et zéro
   champ de formulaire nommé pour un lecteur d'écran. [mesuré]
5. **Un seul client à la fois.** Un slot `localStorage`, pas de liste, pas de sauvegarde. Inutilisable en agence.

---

## 1. La question centrale : basculer l'output vers un vrai client mail

Tu l'as posée en premier, elle mérite d'être traitée en premier. **C'est le point le plus faible du produit.**

### Ce qui existe réellement [mesuré]

| Écran | Boutons de sortie disponibles |
|---|---|
| Studio → onglet `rendu` | **aucun** |
| Studio → onglet `html` | **aucun** |
| Studio → onglet `texte` | **aucun** |
| Déploiement → Règle de transport Exchange | `Télécharger` (.ps1) |
| Déploiement → Push Gmail sendAs | `Télécharger` (.json) |
| Déploiement → Fichier de signature Outlook | `Télécharger` (.htm, .txt) |
| Déploiement → **Installation manuelle** | **aucun** |

La dernière ligne est le problème. L'écran affiche : *« Coller en tant que HTML, pas en tant qu'image »* — et ne
propose **rien à coller**. C'est un cul-de-sac fonctionnel dans le seul mode que 100 % des personas non-IT vont
utiliser.

### Le piège du copier-coller, que personne n'a documenté

Pour installer une signature dans Gmail ou Apple Mail, il faut du HTML **rendu** dans le presse-papier
(`text/html`), pas du code source. Or :

- L'onglet `html` affiche le **code source** dans un `<pre>`. Le copier et le coller dans Gmail affiche littéralement
  `<table role="presentation" cellpadding="0"...>` dans la signature. **Échec silencieux et déroutant.**
- L'onglet `rendu` contient bien du HTML rendu, sélectionnable à la souris. Le copier fonctionne.
  **Mais rien dans l'application ne le dit.**

Un utilisateur qui suit l'intuition évidente — « je veux le HTML, je clique sur l'onglet html » — obtient le mauvais
résultat. Un utilisateur qui réussit l'a fait par accident. [mesuré pour l'absence d'indication ; hypothèse pour le
comportement de l'utilisateur]

### Nombre d'actions pour arriver au but, par cible

| Cible | Parcours | Verdict |
|---|---|---|
| Exchange transport rule | 2 clics → .ps1 prêt | **fluide** — mais suppose un admin M365 |
| Outlook .htm / roaming | 2 clics → fichiers prêts | **fluide** — suppose un déploiement scripté |
| Gmail sendAs | 2 clics → .json | **trompeur** : le JSON n'est pas installable tel quel, il faut appeler l'API |
| Gmail (à la main) | aucun chemin documenté | **cassé** |
| Apple Mail | aucun chemin documenté | **cassé** |
| Outlook Windows (à la main) | aucun chemin documenté | **cassé** |

**Constat.** Les trois sorties qui fonctionnent visent l'administrateur système. Les trois qui manquent visent
l'utilisateur final. Le produit est aujourd'hui utilisable par un profil que la veille décrit comme le plus difficile
à convaincre (§2.C, l'objection RSSI), et inutilisable par celui qui a le budget non discrétionnaire (§8.4).

---

## 2. Les six personas

### Persona A — Nicolas, studio, sert plusieurs clients

*Vient chercher : produire une signature propre pour un client, prouver le sérieux, facturer.*

**Ce qu'il comprend.** Tout, évidemment — il a écrit la thèse. C'est précisément pourquoi il est le pire juge de
l'ergonomie du produit. [hypothèse]

**Où il bloque. [mesuré]**
- **Un seul client à la fois.** L'état tient dans un unique slot `localStorage` (`socle.v1`). Pas de liste de clients,
  pas de « nouveau projet », pas d'export/import de la source. Passer du cabinet A au cabinet B veut dire écraser A.
- Le bouton `Réinitialiser` détruit le travail en cours **sans confirmation**.
- Le CSV de la QA annuaire et le HTML du linter ne sont **pas persistés** : naviguer vers un autre onglet et revenir
  vide le champ.

**Verdict.** Utilisable pour une démo, pas pour un dossier client. Le produit ne survit pas au deuxième client.

---

### Persona B — Camille, avocate associée, cabinet de 6 personnes

*Le budget non discrétionnaire de §8.4. Non technique. Vient chercher une signature conforme au RIN.*

**Ce qu'elle comprend. [hypothèse, mais fondée sur les libellés mesurés]**
- La page d'accueil lui parle : « la même information partout », le tableau du socle avec son nom dedans. Bon départ.
- Le sélecteur de profession et les champs *Barreau de rattachement* / *Structure d'exercice* / *Toque* sont
  immédiatement compréhensibles. **C'est la meilleure partie du produit pour elle.**
- L'avertissement « Gabarit issu de la veille §8.4, non validé juridiquement » est honnête et bien placé.

**Où elle bloque.**
- **Le logo est cassé dans l'aperçu.** [mesuré — `cabinet-vermeil.fr` est un domaine fictif, l'image renvoie une
  erreur] Le tout premier écran produit montre une image brisée. Pour un utilisateur non technique, le signal est
  « l'outil ne marche pas », pas « c'est une démo ». Et il n'existe aucun moyen d'uploader un logo : le champ attend
  une **URL absolue https versionnée**, ce qu'elle n'a pas et ne sait pas fabriquer.
- **`server-side` / `client-side` / `combo`** : trois boutons en anglais technique, aucune explication à leur niveau.
- **`non_signable`** s'affiche brut, avec un underscore, sans qu'aucune section de la page n'explique pourquoi.
  [mesuré : en mode client-side la page n'affiche ni carte « bloquant » ni section « scénarios non couverts »]
- Elle ne peut pas installer sa signature (voir §1).
- L'attestation se télécharge en **`.md`**. Elle ne l'ouvrira pas. Elle attend un PDF à faire signer.

**Verdict.** Elle comprend la promesse et le bloc réglementaire — les deux choses qui comptent. Elle ne peut rien
faire du résultat. **C'est le persona où l'écart entre valeur perçue et valeur livrée est le plus grand.**

---

### Persona C — Admin IT / DSI, tenant M365 de 300 boîtes

*L'acheteur que le produit sert le mieux aujourd'hui.*

**Ce qu'il comprend. [hypothèse]**
- Immédiatement : la matrice des clients de lecture, les trous par mode de déploiement, le script PowerShell commenté.
- Le fait que la règle de transport force `FallbackAction Ignore` et documente Safe Attachments va lui inspirer
  confiance. C'est un détail que seul quelqu'un qui a fait le travail écrit.
- La mention explicite « DKIM et exigences expéditeurs Gmail/Yahoo 2024 : à valider avec votre RSSI » **désamorce**
  l'objection au lieu de l'attendre. Bon réflexe.

**Où il bloque.**
- Le script est généré pour **une seule personne**. Une règle de transport sert un tenant entier avec des variables
  d'annuaire (`%%DisplayName%%`). Le produit compile une signature nominative, pas un template à variables.
  **C'est le trou fonctionnel le plus profond du produit** : il y a un abîme entre « une signature » et « un parc ».
- La QA annuaire et le Studio ne sont **pas reliés** : on audite un CSV d'un côté, on compile une personne de
  l'autre, rien ne circule entre les deux.
- Pas de connexion tenant, pas de test d'envoi, pas de préproduction.

**Verdict.** Il fait confiance à l'analyse et se méfie de l'outil. Il repartira avec le PowerShell et le fera
lui-même — ce qui est peut-être exactement le business (§9, angle studio), mais alors l'application est un support
de vente, pas un produit.

---

### Persona D — Directrice marketing

*Celle à qui le produit dit non.*

**Ce qu'elle comprend.** Que son bandeau est interdit. L'avertissement CNIL est clair, daté, sourcé. [mesuré : le
compilateur classe `BANNER-CNIL` en critique et le contrat bascule en `a_corriger`]

**Où elle bloque.**
- Il n'existe **aucun moyen d'ajouter un bandeau** dans l'interface, même pour se voir refuser. Le champ existe dans
  le modèle de données mais n'est pas exposé au formulaire. Elle ne peut donc pas *vivre* le refus, seulement le lire.
- Rien ne lui propose d'alternative conforme (lien texte non tracké, page campagne).
- Le mot « campagne » n'apparaît nulle part.

**Verdict.** Le produit assume de dire non — c'est cohérent avec §9 (« il faut assumer de dire non à une partie de la
demande »). Mais un refus sans contre-proposition est un refus perdu. **Question à arbitrer : ce persona est-il une
cible, ou un non-client revendiqué ?** Le produit ne tranche pas aujourd'hui, il l'ignore.

---

### Persona E — Office manager, propriétaire de fait de la donnée

*Le vrai destinataire de §7.1.*

**Ce qu'elle comprend. [hypothèse]** La page QA annuaire est **la plus réussie du produit** sur le plan de la
formulation. « 3 collaborateurs sans entité juridique : leur mention légale est sautée silencieusement, leur signature
est non conforme » — c'est actionnable, ça se transfère par mail tel quel, ça n'a pas besoin de glossaire.

**Où elle bloque.**
- Il faut **fournir un CSV**. Elle a un export Excel, ou rien du tout. Le bouton `Exemple` est utile mais ne dit pas
  quelles colonnes sont attendues avant qu'on clique.
- Les noms d'attributs affichés sont ceux d'Entra ID (`givenName`, `companyName`, `mobilePhone`) — vocabulaire
  d'annuaire technique, pas de RH.
- Le CSV importé n'est pas conservé. [mesuré]
- Le CSV de corrections exporté n'est routé vers personne : il faut savoir soi-même à qui l'envoyer, alors que le
  texte de la veille parle de « workflow de correction routé vers le bon propriétaire ». La promesse est écrite sur
  la page, la fonction n'existe pas.

**Verdict.** Le meilleur rapport valeur/friction du produit. C'est le module qui démontre le plus vite.

---

### Persona F — MSP / agence, 12 clients

**Ce qu'il comprend.** Rien de spécifique à son cas, parce que rien ne lui est adressé.

**Où il bloque. [mesuré]** Un seul slot de stockage. Pas de notion de client, d'espace, ni de modèle réutilisable.
Le produit est mono-tenant par construction.

**Verdict.** Hors de portée aujourd'hui — ce qui est peut-être sage, la veille §7.8 démontrant que la marge MSP est
mauvaise et le terrain occupé.

---

## 3. L'outil échoue deux de ses propres règles

C'est le constat le plus gênant, et le plus facile à retourner contre le produit en démo.

### Contraste — la règle `CONTRAST-45` [mesuré]

Le linter refuse à ses utilisateurs ce qu'il s'autorise. Mesure sur le fond clair `#f7f7f5` :

| Variable | Couleur | Contraste | Seuil 4,5:1 |
|---|---|---|---|
| `--ink` | `#16181d` | 16,56:1 | conforme |
| `--muted` | `#5b6472` | 5,58:1 | conforme |
| **`--dim`** | **`#8b93a1`** | **2,89:1** | **échoue** |
| `--accent` | `#2b52c4` | 6,3:1 | conforme |

`--dim` n'est pas un détail : il colore **les paragraphes d'explication (`.note`), toutes les références § (`.veille`),
tous les en-têtes de colonnes de tableaux, et tous les libellés de champs de formulaire**. C'est-à-dire la majorité du
texte explicatif de l'application.

Et §7.7 dit mot pour mot : *« la convention de mettre les mentions légales en gris clair échoue mécaniquement le seuil
de contraste 4,5:1 »*. Le produit reproduit la faute qu'il facture.

### Labels de formulaire [mesuré]

Sur la page Studio : **21 `<label>`, dont 0 avec `for`. 22 champs, dont 0 avec `id` et 0 avec `aria-label`.**

Aucun champ n'est nommé pour un lecteur d'écran. L'arbre d'accessibilité annonce les champs par leur *valeur*
(« Camille »), jamais par leur rôle (« Prénom »). Un utilisateur non-voyant ne peut pas remplir ce formulaire.

Accessoirement, la hiérarchie de titres saute un niveau : `h1` puis six `h3`, zéro `h2`. [mesuré]

### Lignes de tableau cliquables non atteignables [mesuré]

Sur la page Contrat, les 9 lignes de scénario s'ouvrent au clic (`cursor: pointer`) mais **aucune n'a `role`,
`tabindex` ni gestionnaire clavier**. Le détail de chaque scénario — le contenu le plus riche du produit — est
inaccessible au clavier et invisible pour un lecteur d'écran.

---

## 4. Frictions transverses

### Langue et jargon [mesuré]

Chaînes techniques affichées telles quelles à l'utilisateur : `non_signable`, `a_corriger`, `signable`,
`server-side`, `client-side`, `combo`, `yes` / `partial`, `critical` / `major` / `minor`, `outlook-win`, `owa`,
`apple-mail`, `implemented` / `stub` / `planned`, et les identifiants de règles (`NO-LAYOUT-DIV`, `IMG-65X`…).

Le mot **« socle »** n'est défini nulle part avant d'être utilisé partout. Sur la page d'accueil il apparaît dans le
chapô, en incise, entre tirets.

### Accents manquants dans les chaînes de déploiement [mesuré]

La page Déploiement affiche encore : « pieces jointes », « mise à jour centralisee », « des le premier mois », « image
liee », « ont conserve », « Parametres > General », « Mail > Reglages », « Decocher », « ecrase », « aucune cle de
signature ». Résidus d'un passage d'accentuation incomplet sur `exports.ts`. Visible par un client.

### Mobile [mesuré]

Pas de débordement horizontal — bon point. Mais sous 900 px la navigation se déplie en bloc de **533 px de haut
au-dessus du contenu** : il faut faire défiler tout le menu avant d'atteindre le premier mot de la page. Pas de menu
repliable.

### Absence de premier pas

Aucun écran d'accueil, aucune indication de par où commencer. L'application s'ouvre sur un tableau de bord dense qui
suppose qu'on sait déjà ce qu'on cherche. [hypothèse]

---

## 5. Ce qui marche, et qu'il ne faut pas casser

Pour équilibrer — ces points sont solides et rares sur ce marché :

- **La matrice de survie du socle** est une idée juste, lisible d'un coup d'œil, et immédiatement montrable en
  rendez-vous. Le double marquage *lisible / cliquable* par cellule est précis sans être lourd.
- **La séparation « corrigeable côté émetteur » / « à documenter »** dans le linter est ce qui distingue l'outil d'un
  validateur générique. Elle répond à une objection réelle avant qu'on la pose.
- **Les alertes de la QA annuaire** sont rédigées pour être transférées, pas contemplées. C'est le seul endroit du
  produit où le texte fait le travail à la place de l'utilisateur.
- **La page Périmètre honnête** est un actif commercial déguisé en page technique. Peu de produits assument d'écrire
  ce qu'ils ne font pas.
- **Le refus du bandeau tracké** est cohérent de bout en bout : modèle, compilateur, linter, contrat.
- **Le bloc profession réglementée** est la fonction la plus différenciante et la plus vite comprise.

---

## 6. Ce que cet audit n'a pas pu tester

- **Aucun utilisateur réel.** Voir l'avertissement de méthode.
- **Aucun rendu dans un vrai client mail.** Je n'ai pas envoyé un seul email. La chaîne complète
  compilation → envoi → réception dans Outlook / Gmail / Apple Mail reste non vérifiée.
- **Aucun test avec un lecteur d'écran réel** (VoiceOver, NVDA). Les constats d'accessibilité sont structurels
  (attributs absents), pas expérientiels.
- **Aucun test de charge** sur la QA annuaire : le CSV de démo fait 6 lignes. Comportement à 300 ou 3 000 inconnu.
- **Aucun test sur un logo réel.** Le seul aperçu produit contient une image cassée.
- **Aucun test navigateur croisé** : tout a été fait dans un seul moteur.

---

## 7. Récapitulatif, pour arbitrage

Classement par gravité constatée. **Aucune de ces lignes n'est une recommandation** — l'ordre reflète l'écart entre
ce que le produit promet et ce qu'il livre, pas une priorité de développement.

| # | Constat | Persona touché | Nature | Effort estimé |
|---|---|---|---|---|
| 1 | Aucun bouton copier dans tout le Studio ; « Installation manuelle » ne fournit rien à coller | B, D, E | fonctionnel | faible |
| 2 | Le piège onglet `html` (source) vs `rendu` (collable) n'est expliqué nulle part | B, E | fonctionnel | faible |
| 3 | Le produit compile une personne, pas un parc à variables d'annuaire | C | structurel | **élevé** |
| 4 | Un seul client stocké ; pas de liste, pas d'export de la source | A, F | structurel | moyen |
| 5 | Contraste `--dim` à 2,89:1 sur la majorité du texte explicatif | tous | conformité | faible |
| 6 | 0 label associé sur 22 champs ; lignes de tableau non atteignables au clavier | tous | conformité | faible |
| 7 | Verdict `non_signable` affiché sans explication sur la page | B, C | compréhension | faible |
| 8 | Logo de démo cassé au premier écran ; pas d'upload de logo possible | B | perception | moyen |
| 9 | Attestation en `.md` seulement | B | livrable | moyen |
| 10 | Jargon technique brut affiché (`server-side`, `a_corriger`, ids de règles) | B, E | compréhension | faible |
| 11 | QA annuaire et Studio non reliés | C, E | structurel | moyen |
| 12 | Accents manquants dans `exports.ts` | tous | finition | faible |
| 13 | Navigation mobile : 533 px de menu avant le contenu | tous | ergonomie | faible |
| 14 | `Réinitialiser` sans confirmation ; champs CSV et linter non persistés | A | ergonomie | faible |
| 15 | Aucun chemin pour le persona marketing, ni cible ni refus argumenté | D | positionnement | à décider |

---

## 8. Les trois questions que cet audit ne peut pas trancher

Elles sont pour toi, pas pour moi.

1. **Le produit s'adresse-t-il à l'utilisateur final ou à l'administrateur ?** Aujourd'hui il livre à l'admin et
   séduit l'utilisateur final. Les constats 1, 2, 3 et 8 découlent tous de cette ambiguïté, et aucun ne se corrige
   proprement tant qu'elle n'est pas levée.
2. **Est-ce un produit, ou le support de vente d'une prestation ?** Si c'est le second (§9, angle studio), alors les
   constats 3, 4 et 11 ne sont pas des défauts — et l'effort doit aller vers le livrable client, pas vers l'outil.
3. **Le persona marketing est-il un client ou un non-client assumé ?** La veille dit qu'il faut « assumer de dire non
   à une partie de la demande ». Le produit ne dit pas non : il ne dit rien.

Et le rappel de §10, qui vaut plus que tout ce document : **dix entretiens acheteurs valent plus que dix pages
d'analyse supplémentaire.** Celle-ci comprise.
