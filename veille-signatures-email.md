# Veille — Marché des outils de signature email
**Juillet 2026** · 13 agents de recherche, ~900 requêtes web, dont 2 passes de vérification adversariale.

> **Note de méthode.** Ce document a été soumis à deux critiques indépendantes qui ont corrigé plusieurs erreurs de la première synthèse. Les corrections sont intégrées. Chaque affirmation structurante porte un niveau de confiance : **[vérifié]** (source primaire), **[probable]** (source secondaire cohérente), **[à instruire]** (non re-sourcé).
>
> **Limite majeure, à lire avant tout arbitrage :** c'est une analyse d'**offre** à 100 %. Zéro entretien acheteur, zéro donnée de demande. Sur un marché consolidé, l'absence d'une fonctionnalité est plus souvent la preuve que personne ne l'achète que la preuve d'une opportunité. Voir §8.

---

## 1. Ce qu'il faut retenir en dix lignes

1. Le marché est **mature, consolidé et commoditisé** sur sa partie logicielle. Prix courant : **0,73 à 2 $/utilisateur/mois**.
2. **Ta thèse technique est juste** : la casse est réelle, massive et documentée — 26 modes de rupture distincts recensés.
3. **Mais la promesse « la signature qui ne casse pas » est indéfendable telle quelle.** On choisit le rendu à l'*écriture*, la casse se produit chez le client de *lecture*. Voir §6.
4. Le vrai goulot n'est pas le design : des centaines de beaux templates existent, quasi gratuits. Ce que personne ne vend, c'est **que ça marche encore dans six mois**.
5. Les trois causes documentées d'échec projet sont, dans l'ordre : **qualité de la donnée annuaire**, **propriété organisationnelle du sujet**, **support/facturation**. Aucune n'est un problème de rendu.
6. Deux angles morts graves de ce marché : **la carte de visite numérique** (HiHello, Popl) vend le même bloc d'identité 3 à 7× plus cher à un autre acheteur — et **BIMI**, où le logo qui compte migre hors du corps du message.
7. **L'IA change l'arbitrage** : l'envoi programmatique (Graph sendMail, CRM, agents) casse totalement le client-side, et le stripping de signature est une étape standard de préprocessing des résumés de fil.
8. Le seul levier juridique **dur et déjà exigible** n'est pas celui qu'on croit : c'est la **CNIL 2026-042** (échéance dépassée depuis le 14 juillet 2026) et le **§35a GmbHG allemand** — pas l'European Accessibility Act.
9. Le segment **des professions à mentions réglementées** (avocats, notaires, experts-comptables, agents immobiliers) est le seul budget **non discrétionnaire** du marché. Personne ne le sert spécifiquement.
10. Reformulation tenable de la promesse : **« la même information partout »**, jamais « la même signature partout ».

---

## 2. Cartographie : six familles, pas une

### A. Générateurs self-serve — *le design, pas le déploiement*
HubSpot, Canva, WiseStamp, MySignature, Gimmio, SyncSignature, Signature.email, mail-signatures.com (CodeTwo), Zoho, Designhill, HoneyBook.

- **Promesse** : une belle signature en 2 minutes, gratuitement. **Prix** : 0 à 4 $/mois.
- **Deux familles économiques** : les appâts SEO non monétisés (HubSpot, Canva, Zoho — la signature est un aimant à leads) et les vrais freemium (WiseStamp, MySignature, Gimmio).
- **Où ça casse** : le produit s'arrête exactement là où commence le problème — **l'installation**. 12 points de rupture documentés : copier-coller dépendant du navigateur, plafond de 10 000 caractères Gmail, bug de collage OWA qui supprime `width`/`height` des images, disparition du dossier `Signatures` dans New Outlook, images converties en pièces jointes.
- **Le fournisseur gratuit est lui-même un facteur d'instabilité** : mail-signatures.com a cassé rétroactivement tout son parc installé en changeant l'emplacement web de ses images — toute signature générée avant le 9 janvier 2026 doit être régénérée. **[vérifié]**
- **Canva ne produit qu'une image** : non cliquable, non sélectionnable, invisible pour un lecteur d'écran, absente quand le client bloque les images.

### B. Déployeurs client-side — *add-in Office.js, roaming signatures, push Gmail sendAs*
CodeTwo (mode Outlook), Exclaimer (add-in + agent CSUA), Signitic, Letsignit, Dynasend, Bybrand, Newoldstamp, Xink, Set-OutlookSignatures (open source).

- **Promesse** : l'utilisateur voit sa signature en écrivant, elle est dans ses Éléments envoyés, rien ne transite chez un tiers. **Prix** : 0 à 2 $/user/mois.
- **Où ça casse** : la **couverture**.
  - L'add-in Office.js ne couvre **que la famille Outlook** — jamais Apple Mail, Thunderbird, Gmail app sur une boîte M365.
  - Il **exige une connexion Internet** pour se déclencher (« Event-based add-ins require an internet connection to be able to launch »). **[vérifié — doc Microsoft]**
  - Toute mise à jour du manifeste **bloque les utilisateurs** jusqu'au consentement admin.
  - Sur mobile : `OnMessageSend` n'existe pas (aucune garantie à l'envoi), boîtes partagées non supportées, changer d'expéditeur supprime la signature.
  - **Il ne couvre pas non plus l'envoi programmatique** — Graph sendMail, SMTP applicatif, CRM, marketing automation, agents IA. Volume croissant, et souvent les envois les plus exposés commercialement (relances, devis, factures). *Correction issue de la critique — c'est le trou le plus sous-estimé.*
  - Sur Google, le push `sendAs` n'autorise qu'**une signature par adresse** (donc aucune variante réponse/transfert — Letsignit le documente noir sur blanc), et l'utilisateur peut l'éditer ou la supprimer : **aucun verrouillage possible**.

### C. Estampilleurs server-side — *règle de transport, routage SMTP*
Exclaimer, CodeTwo (mode Cloud), Crossware, Symprex Signature 365, Sigsync, Opensense, Rocketseed, Templafy ESS.

- **Promesse** : 100 % des mails sortants signés, tous appareils, rien à installer, non modifiable par l'utilisateur. **Prix** : 0,73 à 1,75 $/user/mois — sauf Opensense (plancher 350 $/mois) et Rocketseed (min 50 salariés + frais de setup).
- **Où ça casse — quatre défauts que Microsoft documente lui-même** **[vérifié]** :
  1. La signature **ne peut pas être insérée sous la dernière réponse** — elle atterrit sous tout le fil cité.
  2. Elle **n'apparaît pas dans les Éléments envoyés**.
  3. Les **images ne peuvent pas être embarquées**.
  4. Une ligne dont l'attribut annuaire est vide est **purement sautée, silencieusement** (« Rules skip lines that contain variables they can't update »).
- **S'y ajoutent** : impossible sur S/MIME et messages chiffrés (Exclaimer : *« no signature is appended »*), fallback `Wrap` par défaut qui transforme le message original en pièce jointe et casse Safe Attachments, réponses automatiques non traitées par défaut, échec au-delà de ~24 Mo de pièces jointes chez Exclaimer, **rappel de message impossible** (seul Templafy l'écrit noir sur blanc).
- **Objection RSSI récurrente et documentée** : le flux mail sortant devient dépendant d'un tiers. Verbatim r/sysadmin : *« Nothing stopping them from modifying the content of your email... it just puts far too big a target on them as a company. »*
- **Angle mort de l'analyse initiale** : l'alignement DKIM après réécriture server-side, et les exigences expéditeurs Gmail/Yahoo entrées en vigueur en 2024, sont des objections techniques de premier ordre non instruites ici. **[à instruire]**

> **CodeTwo est le seul dont la documentation décrit explicitement la déduplication en fil de discussion** : signature sous la dernière réponse *et* suppression des occurrences précédentes dans le thread. C'est le point technique le plus proche de ta promesse déjà résolu par quelqu'un. **[vérifié]**

### D. Plateformes de gouvernance de marque — *la signature comme module*
Templafy, Frontify (community block), Letsignit (module Slides), BrandQuantum, Exclaimer Brand Kits. Prix non publics.

- **Où ça casse** : ce que le marché appelle « Brand Kit » est **un bac à actifs, pas un design system** — pas de tokens sémantiques, pas de versioning, pas d'API de tokens, aucune intégration Figma documentée.
- Le block Frontify est révélateur : il verrouille correctement les assets du DAM et gère les dates de campagne, mais sa doc liste *« custom brand fonts are not supported »* et *« signatures must be manually copied and pasted, there is no direct installation into email clients »*. **[vérifié]**

### E. Canal média / signature marketing
Opensense, Rocketseed, Terminus (ex-Sigstr), Mailtastic (absorbé), campagnes Letsignit/Signitic.

- **La thèse a été démentie par le marché** : Sigstr racheté par Terminus (déc. 2019), Terminus absorbé par DemandScience (nov. 2024), Mailtastic racheté par Cognism (2020) puis revendu (2025). Aucun de ces rachats n'a produit de leader.
- **La mesure s'effondre** : Apple Mail Privacy Protection précharge toutes les images depuis 2021, Gmail proxifie et cache depuis 2013, précision d'un pixel estimée à 70-85 % au mieux. Les taux de clic publiés divergent d'un **facteur 10** (Exclaimer 4 %, Rocketseed 12 à 64 %) sans qu'aucun n'explique sa méthode.
- **Et surtout** : Gmail replie la signature derrière « Afficher le contenu tronqué » dans un fil. Elle est livrée, conforme, et **personne ne la voit**.

### F. Natif gratuit et DIY — *le vrai concurrent du bas de marché*
Règles de transport Exchange, Google Append footer, API Gmail sendAs + GAM, roaming signatures, PowerShell/GPO/Intune, Set-OutlookSignatures.

- **Le natif couvre la conformité, pas la signature** : Append footer *« doesn't support HTML content »*, aucun token de personnalisation, granularité limitée à l'unité organisationnelle, propagation jusqu'à 24 h, incompatible avec le chiffrement CSE. **[vérifié]**
- **Le DIY casse à chaque évolution Microsoft**, et de la pire façon : New Outlook ne lit plus `%APPDATA%\Microsoft\Signatures`, donc **le script continue de s'exécuter sans erreur et n'a plus aucun effet**. Le mode d'échec le plus vicieux qui soit.
- **Set-OutlookSignatures** est une référence open source mature et activement maintenue : bibliothèque `libphonenumber` de Google intégrée, huit contournements documentés de bugs Microsoft sur le roaming en 18 mois, questionnaire de sécurité prêt pour revue RSSI. *Cela affaiblit sérieusement tout angle « souveraineté / zéro re-routage » : le terrain est déjà occupé, gratuitement.*

---

## 3. Le paysage économique — corrigé

| Acteur | Prix public | Minimum | Note |
|---|---|---|---|
| **Exclaimer** | 0,90 / 1,45 / 1,75 $ (Starter/Standard/Pro) | 10 sièges | Upsell fonctionnel marqué : Brand Kits 1/3/∞, connecteurs SIRH réservés au Pro |
| **CodeTwo** | 1,22 → 0,73 $ (dégressif 10→500) | 10 sièges | Tarification la plus lisible, la moins segmentée |
| **Signitic** | Gratuit <20, puis 1 €/user | 20 licences au payant | Le gratuit = 1 template, 1 campagne, **et le logo Signitic dans la signature** |
| **Letsignit** | 2 $/user | — | Le bundle Platform (signatures + vCards + campagnes + slides) est **au même prix** que le plan signature seul |
| **Sigsync** | ~0,91 $ | aucun | |
| **Dynasend** | 50 $/mois jusqu'à 50 signatures, puis dégressif jusqu'à 0,20 $ | — | Refuse assumé du re-routage |
| **Xink** | 0,53 → 0,34 € (grille partenaire) | — | Danois, discret, prix cassé |
| **Bybrand** | 8 $/mois + 0,80 $/signature | — | Seul modèle vraiment adapté aux petits volumes |
| **Opensense** | 1 à 5 $ mais **plancher 350 $/mois** | ~ | Une équipe de 10 paie 35 $/user/mois effectifs |
| **Rocketseed** | sur devis | 50 salariés + setup | |
| **Crossware / Templafy / Symprex S365** | **non publics** | — | |

**Corrections importantes apportées par la vérification :**

- ❌ *« Exclaimer, ~100 M$ d'ARR »* → **Faux.** Le communiqué du 9 déc. 2025 s'intitule *« Exclaimer on Path to $100m ARR »* et dit *« on track to reach »*. Dernier chiffre déposé : **59,2 M£ sur 15 mois clos au 31/12/2024** (~47 M£ annualisés). Tout calcul de revenu moyen par boîte bâti là-dessus est à jeter.
- ❌ *« Sigilium est mort d'avoir vendu 3 €/user »* → **Spéculation non étayée.** Le fondateur de Signitic présente l'opération comme une consolidation offensive : *« Nous étions numéro deux du marché français. Avec le rachat de Sigilium, nous sommes passés premiers. »* Rien n'indique une vente en détresse.
- ⚠️ *« Signitic adossé à un groupe de 50 M€ »* → **Trompeur.** L'ensemble signature du groupe (Signitic + Mailtastic + Sigilium) = **40 salariés, 8 M€ de CA**. Le Groupe Positive (~70 M€ 2025, 400 salariés) est majoritairement sur d'autres métiers.
- ⚠️ *« Le plancher français est à 0 € »* → **À nuancer.** Pour un acheteur dont le problème *est* la gouvernance de marque, une signature portant le logo d'un tiers est disqualifiante. Le plancher réel pour ce besoin reste **1 €/user, min. 20 licences**.

**Consolidation récente** **[vérifié]** : Signitic a absorbé **Mailtastic** (nov. 2025) puis **Sigilium** (13 janv. 2026, sigilium.com redirige en 301). Crossware a racheté **CI Solutions GmbH** (janv. 2026), premier acteur allemand. Symprex organise la mort de son produit perpétuel : **fin du support M365 au 30 septembre 2026**, migration forcée vers l'abonnement.

---

## 4. Les deux lignes de fracture techniques

C'est le socle du dossier. Tout le marché est structuré par ces deux arbitrages, et **aucun des deux n'a de bonne réponse**.

### Microsoft 365
| | Server-side | Client-side |
|---|---|---|
| Couverture appareils | ✅ Totale | ❌ Famille Outlook seulement |
| Visible en rédaction | ❌ Non | ✅ Oui |
| Dans les Éléments envoyés | ❌ Non | ✅ Oui |
| Position dans le fil | ❌ Sous tout le fil cité | ✅ Sous la réponse |
| S/MIME et chiffré | ❌ Impossible | ✅ OK |
| Hors-ligne | ✅ OK | ❌ Ne se déclenche pas |
| Envoi programmatique (Graph, CRM, agents) | ✅ OK | ❌ Ignoré |
| Données chez un tiers | ❌ Oui | ✅ Non |

Conséquence : quasiment tous les éditeurs poussent le mode **combo** server + client — ce qui double la surface de configuration et crée le risque de **double signature** (documenté chez Crossware et Templafy).

### Google Workspace — structurellement moins bien servi
Il n'existe **aucun équivalent à l'add-in Outlook**. D'où une polarisation entre :
- **Push `sendAs`** (pas cher, simple) : une seule signature par adresse, éditable par l'utilisateur, plafonnée à **10 000 caractères**, aucune variante réponse/transfert possible.
- **Routage SMTP Content Compliance** (complet, cher) : signature invisible en rédaction.

> **Angle mort relevé par la critique** : l'**extension navigateur** contourne ces deux limites d'API réputées infranchissables. C'est la voie d'installation de Streak, Mailtrack et HubSpot Sales dans des centaines de milliers de boîtes. Zéro acteur signature ne l'exploite. **[à instruire]**

### Échéance EWS — réelle mais moins urgente qu'annoncé
Désactivation par phases à partir du **1er oct. 2026**, arrêt total le **1er avr. 2027** (message MC1227454). Microsoft documente un mécanisme d'**AppID AllowList** permettant de maintenir l'accès pendant la phase de désactivation — la vraie échéance dure est **avril 2027, soit 9 mois**, pas deux. Impact limité aux déploiements client-side reposant encore sur EWS. Et **Microsoft n'a toujours aucune API Graph de signature**. **[vérifié]**

---

## 5. Pourquoi ça casse — la mécanique

26 modes de rupture documentés. Les structurants :

**Outlook Windows n'est pas un navigateur, c'est Word.**
`div`/`p`/`span` sans effet utile (Word les classe `COREEXTENDED`, donc `width` et `padding` y sont ignorés) · `border-radius`, `background-image`, `position`, `float`, `max-width`, `overflow`, `z-index` non supportés · padding uniquement sur les cellules · DPI scaling qui rend les images floues ou géantes en 120/144 dpi · **recompression des images à 220 PPI à l'envoi**, corrigeable uniquement par GPO sur le poste — donc hors de portée de tout SaaS · impossible d'étirer une image au-delà de 65× sa largeur intrinsèque, ce qui casse tous les filets séparateurs 1px.

**Gmail coupe à ~102 Ko.**
La signature, étant en fin de corps, est la **première victime**. Le français y arrive plus vite qu'un texte anglais : en `quoted-printable`, un « é » pèse trois octets. **Après huit à quinze allers-retours, toutes les signatures disparaissent, mentions légales comprises.** C'est très exactement le phénomène que tu as observé.

**Dark mode : trois régimes d'inversion, et aucun ciblage possible sur le pire.**
Les clients à inversion totale (Outlook Windows, Office 365 Windows, Gmail iOS) n'offrent **ni `prefers-color-scheme` ni `data-ogsc`**. Un logo noir sur transparent devient invisible, point final. Et la parade classique du blanc `#fffffe` est retournée par Yahoo, qui la rend en **vert olive `#989800`**.

**Le HTML est resérialisé par chaque client intermédiaire.** Outlook le repasse par Word et le ressort criblé de `mso-*`.

**Les régressions éditeurs non annoncées** — le point le plus important pour ta thèse :
- Bug de collage OWA : apparu mi-mai 2024, corrigé le 11 juin, **régressé le 12**, re-corrigé début juillet. Aucune communication Microsoft.
- Outlook.com supprime les `<style>` du `<head>` depuis juin 2024.
- Outlook 365 build 2505 (2025) se met à ignorer le CSS sur des emails intacts — et la nouvelle version d'Outlook n'offre même plus « afficher la source » pour diagnostiquer.
- Croix rouge sur toutes les images de signature, build 16.0.19929.20162 (mai 2026), non corrigée un mois plus tard.
- Une seule couleur écrite en syntaxe `rgb(255 0 0)` fait supprimer par Gmail le bloc `<style>` entier.

---

## 6. Verdict sur ta promesse

> **« La signature qui ne casse pas » est indéfendable telle quelle, et dangereuse à porter.** Elle est réfutable par n'importe quel prospect en une capture d'écran. Ce jour-là, la marque est morte.

**Le point aveugle du marché entier** : on choisit le rendu au moment de l'**écriture**, alors que la casse dépend du client de **lecture**. Tu ne contrôles ni le client du destinataire, ni les passerelles anti-spam intermédiaires, ni les mises à jour d'Outlook.

### Ce qui est garantissable
1. **Que la signature soit appliquée** — en server-side, avec les exceptions énoncées honnêtement (S/MIME, calendrier, >24 Mo, réponses automatiques).
2. **Que le HTML émis soit défensif et testé** : tables uniquement, jamais de `div`/flex, jamais de webfont (Outlook retombe sur Times New Roman et détruit même le fallback), jamais de `background-image` ni `border-radius` sans VML, accents en entités HTML, bloc `OfficeDocumentSettings` à 96 dpi, images hébergées et versionnées, poids sous 80 Ko.
3. **Que la donnée soit à jour** — si l'annuaire est propre.
4. **Que la signature ne s'empile pas dans un fil** — sur Microsoft, CodeTwo le prouve. Sur Google en push `sendAs`, **structurellement impossible**.

### Ce qui ne le sera jamais
Le dark mode à inversion totale. Le clipping Gmail après N réponses. Le repli derrière « Afficher le contenu tronqué ». La resérialisation par les clients intermédiaires. La recompression d'images à 220 PPI. Le hors-ligne. Le mobile hors-Outlook (le payload MDM Mail d'Apple ne contient **aucune clé de signature**, sur aucune plateforme ; côté Intune, la seule clé existante est un booléen de *désactivation*). Et les régressions éditeurs non annoncées.

### Reformulations tenables
- **Obligation de moyens** : « la signature testée avant déploiement et re-testée à chaque mise à jour Outlook et Gmail ».
- **Contrat de dégradation gracieuse** : « quel que soit le client, le mode sombre, le clipping ou le nombre de réponses, **ces cinq informations restent lisibles et cliquables** ».

> Ce qui n'est jamais garantissable : *« la même signature partout »*.
> Ce qui l'est : **« la même information partout »**.

---

## 7. Les gaps — triés par ce qui a survécu à la critique

### ✅ Solides

**7.1 — La QA de la donnée annuaire.** *(le meilleur des neuf)*
Une signature est un rendu de données. Microsoft documente le mode d'échec : attribut vide → ligne sautée **silencieusement**. Personne ne propose de tableau de bord de complétude, d'alerte proactive (« 340 collaborateurs sans entité juridique, leur mention légale est non conforme »), ni de workflow de correction routé vers le bon propriétaire.
*Preuve commerciale* : l'existence même de l'`Attributes Manager` de CodeTwo est l'aveu que les annuaires clients sont sales — et il crée un référentiel RH fantôme, puisqu'une valeur modifiée *« will not be changed by any subsequent changes in your tenant's Entra ID »* : un collaborateur promu garde son ancien titre indéfiniment.
*Sur le marché français* : Lucca, PayFit, Eurecia et Silae sont la source de vérité réelle. Seuls Signitic (plan Custom, sur devis) et Boost My Mail proposent Lucca. Exclaimer réserve ses connecteurs SIRH au palier Pro.
⚠️ *Nuance de la critique* : le terrain n'est pas vierge — Siggly vend un Directory Sync positionné sur l'exactitude des données, Signite publie du contenu dédié à l'audit préalable.

**7.2 — La propriété organisationnelle du sujet.**
Le RBAC règle la question des droits, pas le **coût cognitif**. Aucun éditeur ne propose de workflow d'approbation éditorial (brouillon → revue marque → revue juridique → publication datée → historique → **rollback**). On peut empêcher quelqu'un d'agir ; on ne peut pas orchestrer une validation ni revenir en arrière après un déploiement fautif.
*Preuve* — trois récits d'abandon complet dans un seul fil r/sysadmin de février 2025 :
> *« Marketing paid for a year of Exclaimer and then approached IT to implement. The hapless manager they assigned gave up somewhere around the 15th signature request that had a clear business case, never rolled out a single thing, and they dropped Exclaimer at the first renewal. »*

> *« We did a POC, signed off on it. Bought it. Configured it. Turned it over to marketing… and not been used yet. But they do complain that everyone has a different signature. »*

⚠️ *Nuance* : c'est le terrain de Templafy, acteur bien financé. Espace occupé, pas libre.

**7.3 — La conformité CNIL du tracking.** *(le seul argument à la fois vérifié, daté et déjà exigible)*
**Délibération n°2026-042 du 12 mars 2026**, publiée le 14 avril 2026 : les pixels de suivi dans les emails sont qualifiés de traceurs au sens de l'art. 82 de la loi Informatique et Libertés. Consentement préalable requis dès lors que la mesure sert des finalités marketing, statistiques ou de profilage. Deux exceptions étroites seulement (dont la mesure de délivrabilité individuelle pour purger les inactifs). Pour les adresses collectées avant le 14 avril 2026, un délai de trois mois était accordé — **échu le 14 juillet 2026, donc déjà dépassé.** **[vérifié — Légifrance JORFTEXT000053876850]**
→ Les clients actuels d'Opensense, Rocketseed, Newoldstamp, Letsignit, Signitic et Mailtastic sont **hors délai**.
⚠️ *Réserve honnête* : l'articulation exacte entre mail 1:1 professionnel et campagne de prospection reste à faire trancher avant d'en faire un argument commercial. Et Exclaimer publie lui-même que la redirection de liens par domaine tiers est un signal de risque pour les filtres anti-spam — les acteurs qui vendent du tracking ont un **conflit d'intérêt structurel avec la délivrabilité qu'ils facturent**.

### ⚠️ Réels mais plus étroits qu'annoncé

**7.4 — La non-régression.** Le gap le plus séduisant, et celui dont la formulation initiale était la plus abusive. Le test ponctuel multi-clients **existe déjà et il est gratuit** : Siggly, signatureforemail.com, darkmodechecker.org, Litmus, Email on Acid. Le résidu défendable est bien plus étroit : **personne ne surveille en continu un parc déjà déployé et ne pousse le correctif**. Mais c'est aussi le plus coûteux à opérer, et copiable par Exclaimer en un trimestre. *Objection de fond* : les régressions citées sont des régressions de clients de **lecture** — si Outlook 2505 ignore le `<style>`, il l'ignore pour tout le monde, et le correctif côté émetteur n'existe pas. On produit des alertes sans correctif associé.

**7.5 — Le mobile hors-Outlook.** Techniquement **hors de portée** (aucune API MDM ne permet de pousser une signature). Ce qui est faisable et que personne ne vend : **détecter les signatures mobiles résiduelles, mesurer le taux de couverture réel, orchestrer une remédiation**. Google a résolu la signature mobile riche en avril 2025 — mais uniquement si le champ mobile est **vide**, et aucun levier admin ne permet de purger les « Envoyé de mon iPhone » hérités.

**7.6 — Le pont design system → signature.** Classé *niche*, et probablement encore surestimé. Emailify et Marka exportent du Figma vers HTML, aucun ne supporte les Figma Variables, aucun ne resynchronise. Mais sur un marché à 1-2 $/siège, l'absence d'un pont Figma est **plus probablement le signe qu'aucun acheteur ne le demande** qu'une opportunité.

### ❌ Tombés à la vérification

**7.7 — L'accessibilité via l'European Accessibility Act.** Le levier juridique **n'existe pas**. L'EAA (dir. 2019/882) vise une liste **fermée** de produits et services destinés aux **consommateurs** (e-commerce, banque de détail, transport de voyageurs, e-books, télécoms, DAB). La correspondance email d'une organisation n'y figure pas, et les micro-entreprises de service sont explicitement exemptées. Et l'affirmation « aucun outil ne fait rien » est fausse : Exclaimer publie un guide dédié, WiseStamp des ressources ADA, SignKit une checklist WCAG, Draftship un contrôleur de contraste email.
→ *Ce qui reste vrai* : aucun outil de **déploiement** n'impose de contrainte d'accessibilité **bloquante** dans son éditeur. Et la convention de mettre les mentions légales en gris clair échoue mécaniquement le seuil de contraste 4,5:1. Sur le marché français, le **RGAA** (secteur public et délégataires) est un fondement solide ; pour le privé, argumenter qualité et réputation, pas obligation.

**7.8 — L'absence d'offre MSP/agences.** **Factuellement faux.** Exclaimer opère un programme MSP & Reseller public et dédié, CodeTwo un programme partenaire multi-tenant. Les verbatims r/msp ne disent pas qu'il n'y a pas d'offre — ils disent que **la marge est mauvaise et la facturation reste par client final** :
> *« Exclaimer claim to be MSP friendly but no vendor is truly MSP until they treat the actual MSP as the customer. »* · *« CodeTwo's product is good but their MSP program is shit. The margin is TERRIBLE. »*

C'est un gap de **modèle économique**, pas d'offre — et attaquer une structure de marge dans un marché à 1 $/siège contre des acteurs installés qui ont déjà le canal est le pire terrain possible pour un nouvel entrant.

**7.9 — Le segment sous 10 sièges.** **Autoréfutant.** Quatre acteurs le servent déjà : Signitic (gratuit <20), Bybrand (8 $/mois), Sigsync (aucun minimum), SyncSignature (dès 5 sièges).

---

## 8. Les angles morts — ce que la critique a trouvé et qui manque à tout ce dossier

**8.1 — La carte de visite numérique est un concurrent FRONTAL, pas un adjacent.**
HiHello inclut la signature email à **tous** ses paliers : Business à 5 $/user/mois avec SSO et directory sync, Enterprise avec SAML SSO + SCIM et attribute mapping. C'est-à-dire **exactement les fonctions que les spécialistes vendent 1 à 2 $** — vendues 3 à 7× plus cher, à un **autre acheteur** (sales enablement, pas IT). Popl revendique 90 % du Fortune 500 et facture **sans siège** : *« No seat restrictions. No usage restrictions »* — ce qui invalide la grille prix-par-siège qui structure tout ce marché. Mobilo a SSO, RBAC et contrôle de marque mais pas encore de signature.
→ **Conclusion à réviser : le marché n'est pas commoditisé à 0 €. Il est commoditisé à 0 € *pour l'acheteur IT/marketing*. Le même bloc d'identité se vend 5 $ à l'acheteur sales enablement.** C'est probablement l'enseignement le plus actionnable de toute la veille.

**8.2 — BIMI : zéro ligne dans toute la veille initiale.**
C'est le seul endroit où signature et **confiance** se rejoignent — et le logo qui compte est en train de migrer **hors du corps du message**, vers l'avatar expéditeur, rendu par Gmail, Yahoo et Apple Mail **avant même l'ouverture**, et prouvé cryptographiquement (VMC/CMC). Prérequis : DMARC en enforcement stricte sur le domaine organisationnel **et** les sous-domaines. Double angle mort : c'est un concurrent direct pour le budget « marque dans l'email », et c'est le seul canal identitaire qui ne casse jamais.

**8.3 — L'IA, totalement absente d'une veille datée 2026.**
- **La signature comme bruit** : quand un fil de 15 messages est résumé par Copilot ou Gemini, la signature représente la majorité des tokens et zéro information. Le stripping de signature est une étape standard de préprocessing. → *Argument qui renforce puissamment la thèse de dégradation gracieuse.*
- **L'envoi programmatique casse le client-side** : brouillon généré par un agent, réponse via Graph sendMail, CRM, SDR automatisé, Zapier — rien de tout ça ne passe par un add-in. → *Le server-side conserve un avantage structurel que l'IA renforce au lieu de l'éroder.*
- **Composer une signature est devenu quasi gratuit** en coût de production. C'est l'argument le plus fort en faveur de « le design n'est pas le goulot » — et la plus grande menace sur un positionnement studio.

**8.4 — Les professions à mentions obligatoires : le seul budget non discrétionnaire du marché.**
Avocats (RIN art. 10, barreau de rattachement, structure d'exercice — contrôlé par l'Ordre), notaires et commissaires de justice, experts-comptables (numéro d'inscription à l'Ordre), architectes (numéro au tableau), agents immobiliers (carte professionnelle CPI, numéro, préfecture émettrice, garantie financière — loi Hoguet), courtiers (ORIAS). La signature y est un **objet réglementé**, avec contenu imposé, autorité de contrôle et sanction. **Zéro acteur ne les sert spécifiquement.**
Et le vrai levier juridique européen, jamais cité : **§35a GmbHG / §37a HGB** en Allemagne — mentions du registre du commerce obligatoires dans les emails professionnels. C'est ce qui fait acheter de la signature centralisée aux DAF et aux juristes, et ce qui explique la valeur de Mailtastic sur le marché allemand.

**8.5 — Santé, public, éducation : trois hypothèses cassées.**
**MSSanté est un espace de confiance fermé, à opérateurs homologués** : un estampilleur server-side tiers y est **structurellement impossible**, et l'HDS interdit de faire transiter des données de santé chez un éditeur non certifié. → Cela invalide localement toute la catégorie présentée comme « la seule à couvrir tous les appareils ». Public et éducation : achat par marché public (UGAP), donc **pas d'achat impulsif à 1 €** — l'argument du prix plancher est neutralisé — et RGAA opposable.

**8.6 — Freelances et associations : l'unité n'est pas le siège, c'est la personne.**
Le raisonnement « le sous-20 est mort parce que Signitic est gratuit » ne vaut que pour des **organisations**. Il ne dit rien d'un marché où l'acheteur est un individu, où le point de comparaison n'est pas Exclaimer mais Canva ou rien, et où le consentement à payer est démontré (HiHello Professional à 6 $/mois). En France : plusieurs millions d'indépendants, plus d'un million d'associations.

**8.7 — Aucun scénario Microsoft.**
Toute la thèse client-side repose sur l'absence d'API Graph de signature. Rien n'est dit sur ce qui se passe **s'ils en publient une**, ou s'ils intègrent nativement la gestion centralisée dans M365 — ce serait la fin du segment déployeur en un cycle. L'échéance EWS prouve que Microsoft redessine unilatéralement le terrain.

**8.8 — Le coût de sortie, jamais instruit.**
Rien sur la façon dont un client sort réellement d'Exclaimer ou de CodeTwo : durée d'engagement, reconstruction des templates, reconfiguration du connecteur, re-consentement admin, fenêtre de bascule. C'est l'obstacle n°1 de tout nouvel entrant. Exclaimer affiche **96 % de rétention** dans son argumentaire MSP — contre-argument direct à l'hypothèse d'un marché prenable.

---

## 9. Angles de différenciation, avec leurs risques

| Angle | Pourquoi ça tient | Risque |
|---|---|---|
| **Contrat de dégradation gracieuse** — garantir un plancher lisible, pas un rendu identique | Seule reformulation de ta thèse à la fois vraie, vérifiable et non réfutable. Travail de design system contraint : le seul endroit du marché où l'expertise vaut plus que l'outil. | Promesse modeste, difficile à vendre à un DirMarketing qui veut sa bannière trackée. Il faut assumer de dire non à une partie de la demande. |
| **QA de données annuaire + connecteurs SIRH français** | Vrai goulot, mode d'échec admis par Microsoft, démontrable en 30 secondes de démo. Lucca/PayFit/Silae mal couverts. | Déplace le produit vers l'IAM : cycles longs, interlocuteur DSI/DRH. On perd l'achat impulsif à 1 € qui fait vivre ce marché. |
| **Verticale professions réglementées** | Seul budget **non discrétionnaire**. Contenu imposé, autorité de contrôle, sanction. Personne ne le sert. | Marché fragmenté, prescription ordinale, cycles de vente atypiques. À valider par entretiens avant tout. |
| **Surveillance de non-régression** | Aucun éditeur ne le fait sur un parc déployé. Déplace la conversation du prix/siège vers un forfait de service — seul terrain non commoditisé. | Coût opérationnel réel (parc de comptes de test multi-clients). Alerte sans correctif possible sur les régressions de client de lecture. Copiable en un trimestre. |
| **Linter public de signature** | Excellente machine d'acquisition : la requête monétisable n'est pas « créer une signature » mais **« ma signature est cassée »**. | **Espace déjà encombré** (Siggly, signatureforemail.com, darkmodechecker.org — tous gratuits). C'est un canal, pas un business. |
| **Souveraineté / zéro re-routage** | Objection RSSI documentée et récurrente. | Set-OutlookSignatures occupe déjà ce terrain **gratuitement**, avec questionnaire de sécurité prêt pour revue RSSI. Et le client-side pur recrée le trou mobile et le trou hors-ligne — contradiction frontale avec la promesse de couverture. |
| **Ne pas faire un logiciel de signature** — studio + abonnement de maintenance | Le logiciel est commoditisé. Personne ne vend le **résultat sur l'outil du client**. On capte la marge de service sans affronter le prix plancher. | Peu scalable, valorisation faible, dépendance aux API des éditeurs. Et l'IA rend la production de templates quasi gratuite. |

---

## 10. Ce qu'il faut instruire avant de décider

Le défaut méthodologique central de cette veille : **chaque gap est établi par une absence d'offre constatée sur des pages produit, jamais par un signal d'acheteur.** Pas un entretien, pas un appel d'offres, pas un prix testé.

1. **Dix entretiens acheteurs valent plus que dix pages d'analyse supplémentaire.** Qui signe le chèque ? Quel budget ? Quel cycle ? Contre quel arbitrage interne ?
2. **Aucune voix du destinataire.** Que font réellement les gens d'une signature ? Personne ne le sait, dans tout ce corpus.
3. **Aucun chiffre sur le coût du problème côté client** : temps IT, nombre de tickets, fréquence des refontes de charte.
4. **Économie unitaire du modèle de service** : parc de comptes de test, coût Litmus refacturé, temps humain par client par mois, prix de vente, marge brute. Impossible d'arbitrer « SaaS ou studio » sans ça.
5. **Corpus à compléter** : Siggly, Signite, SignKit, Draftship, signatureforemail.com — ce sont précisément les acteurs qui occupent les gaps déclarés vides. Plus HiHello, Popl, Mobilo côté carte numérique.
6. **Question de design à trancher** : le disclaimer juridique est juridiquement inopérant, occupe souvent plus de lignes que l'information utile, et est lu **intégralement par les lecteurs d'écran à chaque message d'un fil**. Le supprimer est le meilleur geste de design possible — et personne dans l'entreprise n'a le mandat de le faire.

---

## Sources principales

Légifrance — [Délibération n°2026-042 du 12 mars 2026](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053876850) · CNIL — [Recommandation pixels de suivi](https://www.cnil.fr/fr/recommandation-pixel-suivi-courriels) · Microsoft Learn (règles de transport, add-ins événementiels, roaming signatures, MC1227454) · Google Workspace Admin Help (Append footer, API Gmail `sendAs`) · [caniemail.com](https://www.caniemail.com) · [email-bugs](https://github.com/hteumeuleu/email-bugs) (#141, #146, #148, #160, #163, #164) · [BIMI Group](https://bimigroup.org) · Pages tarifaires et documentation support : exclaimer.com, codetwo.com, crossware.co.nz, symprex.com, signitic.com, letsignit.com, sigsync.com, dynasend.com, bybrand.io, opensense.com, rocketseed.com, wisestamp.com, hihello.com, popl.co · r/sysadmin, r/msp, r/Office365 · G2, Capterra, Trustpilot

---
*Veille produite le 31 juillet 2026.*
