# Ancrage — quel code sort de quel §

Table de correspondance entre la veille et le scaffold. Elle sert à deux choses : vérifier qu'on n'a rien inventé, et
repérer immédiatement ce qu'il faudra changer si une affirmation de la veille est infirmée.

## Fondations

| § | Affirmation | Traduction dans le code |
|---|---|---|
| §6 | « On choisit le rendu à l'écriture, la casse se produit chez le client de lecture » | `clients.ts` décrit exclusivement des clients de **lecture**. `degrade.ts` teste la survie après coup, jamais le rendu à l'émission. |
| §6 | « Ce qui l'est : la même information partout » | Type `FloorItem` + `deriveFloor()`. Le socle est l'unité de garantie ; tout le reste est décoration. |
| §6 | « ces cinq informations restent lisibles **et cliquables** » | `FloorItem.mustBeClickable`, vérifié séparément de la lisibilité dans chaque scénario. |
| §6 | Obligation de moyens, pas de résultat | `renderAttestation()` écrit explicitement « obligation de MOYENS ». |
| §6 | « Ce qui ne le sera jamais » | `PERMANENT_EXCLUSIONS`, reproduites dans l'attestation client. |

## Compilateur — §6.2

Chaque contrainte de la liste « ce qui est garantissable » est appliquée par construction dans `compile.ts` :

| Contrainte | Application |
|---|---|
| tables uniquement, jamais div/flex | `tableOpen()`, aucun `<div>` émis ; testé |
| jamais de webfont | `Brand.fontStack` limité aux piles système ; règle `NO-WEBFONT` |
| jamais de `background-image` ni `border-radius` | jamais émis ; règle `WORD-UNSUPPORTED-CSS` |
| accents en entités HTML | `toNumericEntities()` — **entités numériques**, pas nommées (voir note ci-dessous) |
| bloc `OfficeDocumentSettings` à 96 dpi | `layout.msoDpiFix` ; règle `MSO-DPI` |
| images hébergées et versionnées | règle `IMG-SELF-HOSTED`, critique |
| poids sous 80 Ko | `CompiledSignature.bytes` + règle `WEIGHT-80K` |
| padding sur cellules uniquement | règle `PADDING-ON-CELL` |
| pas d'image étirée au-delà de 65× | filet en `<td bgcolor>` ; règle `IMG-65X` |

### Une précision d'ingénierie que la veille ne fait pas

§6.2 recommande « accents en entités HTML » **et** un budget de poids (§5, clipping Gmail à ~102 Ko). Les deux
recommandations sont en tension, ce que la veille ne relève pas :

- `é` en UTF-8 quoted-printable → `=C3=A9` = **6 octets**
- `&#233;` (entité numérique) → **6 octets** — neutre
- `&eacute;` (entité nommée) → **9 octets** — +50 %

On retient donc l'entité **numérique** : robustesse de charset face à la resérialisation par les clients intermédiaires
(§5), à coût d'octet nul. Testé dans `core.test.ts`.

## Modes de rupture — §5 → règles du linter

| Mode documenté | Règle |
|---|---|
| Word classe div/p/span en COREEXTENDED | `NO-LAYOUT-DIV` |
| border-radius, background-image, position, float, max-width, overflow, z-index | `WORD-UNSUPPORTED-CSS` |
| padding uniquement sur les cellules | `PADDING-ON-CELL` |
| DPI scaling 120/144 | `MSO-DPI` |
| recompression 220 PPI, corrigeable seulement par GPO | `IMG-220PPI` — **non actionnable**, marquée comme telle |
| plafond des 65× | `IMG-65X` |
| Gmail coupe à ~102 Ko | `WEIGHT-80K` + `estimateGmailClipping()` |
| plafond 10 000 caractères Gmail sendAs | `GMAIL-SENDAS-10K` |
| trois régimes d'inversion, aucun ciblage sur le pire | `DARK-LOGO-RISK`, `PREFERS-SCHEME-ILLUSION` |
| `#fffffe` rendu `#989800` par Yahoo | `NEAR-WHITE-HACK` |
| Outlook.com supprime les `<style>` du `<head>` | `NO-STYLE-TAG` |
| `rgb(255 0 0)` fait tomber le `<style>` Gmail | `HEX-ONLY` |
| Outlook retombe sur Times New Roman | `NO-WEBFONT` |
| bug de collage OWA supprimant width/height | `IMG-DIM` |
| croix rouge build 16.0.19929.20162 | `IMG-ALT`, `IMG-ONLY`, `FLOOR-IN-TEXT` |
| mail-signatures.com déplace ses images | `IMG-SELF-HOSTED` |
| Canva ne produit qu'une image | `IMG-ONLY` |
| ligne à variable vide sautée silencieusement | `EMPTY-VAR` |
| mentions légales en gris clair sous 4,5:1 | `CONTRAST-45` |
| disclaimer relu par les lecteurs d'écran (§10.6) | `DISCLAIMER-NOISE` |
| pixel de suivi = traceur CNIL (§7.3) | `CNIL-TRACKER` |
| signature = bruit pour les résumés IA (§8.3) | `AI-NOISE-RATIO` |
| resérialisation par Word | `NESTING-DEPTH` |

**Actionnable vs à documenter.** §7.4 objecte que beaucoup de ces régressions sont des régressions de clients de
lecture, sans correctif côté émetteur : « On produit des alertes sans correctif associé. » Chaque règle porte donc un
booléen `actionable`, et l'interface sépare visuellement les deux colonnes.

## Scénarios de dégradation — §5, §2, §4

| Scénario | § | Mitigable |
|---|---|---|
| Images bloquées ou cassées | §2.A, §5 | oui |
| Mode sombre à inversion totale | §5 | partiel — le ciblage est impossible |
| Clipping Gmail après N allers-retours | §5 | partiel — seul levier : le poids |
| Outlook Windows (moteur Word) | §5 | oui |
| Bloc `<style>` supprimé | §5 | oui |
| Lecture en texte brut | §6 | oui |
| Lecteur d'écran | §7.7, §10.6 | oui |
| Envoi programmatique (Graph, CRM, agent) | §2.B, §8.3 | **non** en client-side |
| Mobile hors famille Outlook | §2.B, §7.5 | **non** en client-side |

Les deux derniers font basculer le contrat en `non signable` si le mode retenu est client-side pur. C'est la
traduction directe de §4 : « aucun des deux n'a de bonne réponse ».

## Ce que la veille a démenti, et qu'on ne revend pas

| § | Verdict | Conséquence dans le code |
|---|---|---|
| §7.7 | L'European Accessibility Act ne couvre pas l'email d'organisation | Aucune règle ne s'appuie sur l'EAA. Le contraste est justifié par la qualité et le RGAA, pas par une obligation inventée. |
| §7.8 | Il existe bien des offres MSP (Exclaimer, CodeTwo) | Aucun angle « personne ne sert les MSP ». |
| §7.9 | Le sous-10 sièges est déjà servi | Aucun angle « segment vierge ». |
| §8.5 | MSSanté est fermé aux estampilleurs tiers | Documenté dans `/perimetre`, jamais présenté comme cible. |

## Corrections de la veille intégrées

Les chiffres corrigés en §3 (Exclaimer ~47 M£ annualisés et non 100 M$ d'ARR, Signitic = 40 salariés et 8 M€, Sigilium
non vendu en détresse) ne sont utilisés nulle part dans le code : aucune projection économique n'est bâtie dessus.
C'est volontaire — §3 précise que « tout calcul de revenu moyen par boîte bâti là-dessus est à jeter ».
