# Monétisation — arbitrages et risques

Repris intégralement de la veille §9, §8.1 et §10, avec les contre-arguments. **Aucune de ces pistes n'est validée par
un signal d'acheteur** : la veille est une analyse d'offre à 100 %.

---

## Le cadrage économique dont il faut partir

Le prix courant du logiciel de signature est de **0,73 à 2 $/utilisateur/mois** (§1, §3). Sur ce terrain, un nouvel
entrant n'a aucun levier : le marché est mature, consolidé, commoditisé, avec des acteurs qui affichent 96 % de
rétention (§8.8) et un coût de sortie jamais instruit qui joue contre l'arrivant.

Mais §8.1 renverse le cadrage, et c'est **l'enseignement le plus actionnable de toute la veille** :

> Le marché n'est pas commoditisé à 0 €. Il est commoditisé à 0 € **pour l'acheteur IT/marketing**. Le même bloc
> d'identité se vend 5 $ à l'acheteur *sales enablement*.

HiHello inclut la signature email à tous ses paliers, Business à 5 $/user/mois avec SSO et directory sync — exactement
ce que les spécialistes vendent 1 à 2 $. Popl facture **sans siège**, ce qui invalide la grille prix-par-siège qui
structure tout le marché.

**Conséquence pratique : le prix ne se déduit pas du produit, il se déduit de l'acheteur.** Avant de fixer un tarif,
il faut savoir à quel budget on s'adresse.

---

## Les sept angles, avec leur risque

Repris tel quel du tableau §9.

### 1. Contrat de dégradation gracieuse — *implémenté dans ce scaffold*

**Pourquoi ça tient.** Seule reformulation de la thèse à la fois vraie, vérifiable et non réfutable. Travail de design
system contraint : le seul endroit du marché où l'expertise vaut plus que l'outil.

**Risque.** Promesse modeste, difficile à vendre à un directeur marketing qui veut sa bannière trackée. Il faut assumer
de dire non à une partie de la demande — et le module CNIL de ce scaffold le fait littéralement, en bloquant le
bandeau.

### 2. QA de données annuaire + connecteurs SIRH français — *implémenté partiellement*

**Pourquoi ça tient.** Vrai goulot, mode d'échec admis par Microsoft, démontrable en 30 secondes de démo. Lucca,
PayFit, Silae mal couverts.

**Risque.** Déplace le produit vers l'IAM : cycles longs, interlocuteur DSI/DRH. On perd l'achat impulsif à 1 € qui
fait vivre ce marché. Et le terrain n'est pas vierge : Siggly vend déjà un Directory Sync positionné sur l'exactitude.

### 3. Verticale professions réglementées — *packs implémentés, non validés juridiquement*

**Pourquoi ça tient.** Seul budget **non discrétionnaire** du marché. Contenu imposé, autorité de contrôle, sanction.
Personne ne le sert. Et en Allemagne, le §35a GmbHG est ce qui fait acheter de la signature centralisée aux DAF et aux
juristes — ce qui explique la valeur de Mailtastic sur ce marché.

**Risque.** Marché fragmenté, prescription ordinale, cycles de vente atypiques. **À valider par entretiens avant tout.**

### 4. Surveillance de non-régression — *registre manuel seulement*

**Pourquoi ça tient.** Aucun éditeur ne le fait sur un parc déployé. Déplace la conversation du prix/siège vers un
forfait de service — seul terrain non commoditisé.

**Risque.** Coût opérationnel réel (parc de comptes de test multi-clients). Alerte sans correctif possible sur les
régressions de client de lecture. **Copiable par Exclaimer en un trimestre.**

### 5. Linter public — *implémenté*

**Pourquoi ça tient.** Excellente machine d'acquisition : la requête monétisable n'est pas « créer une signature » mais
**« ma signature est cassée »**.

**Risque.** Espace déjà encombré — Siggly, signatureforemail.com, darkmodechecker.org, tous gratuits. **C'est un canal,
pas un business.**

### 6. Souveraineté / zéro re-routage — *non retenu*

**Risque rédhibitoire.** `Set-OutlookSignatures` occupe déjà ce terrain **gratuitement**, avec un questionnaire de
sécurité prêt pour revue RSSI. Et le client-side pur recrée le trou mobile et le trou hors-ligne — contradiction
frontale avec la promesse de couverture.

### 7. Studio + abonnement de maintenance — *le scaffold est compatible*

**Pourquoi ça tient.** Le logiciel est commoditisé. Personne ne vend le **résultat sur l'outil du client**. On capte la
marge de service sans affronter le prix plancher.

**Risque.** Peu scalable, valorisation faible, dépendance aux API des éditeurs. Et §8.3 le dit sans détour :
**l'IA rend la production de templates quasi gratuite** — c'est la plus grande menace sur un positionnement studio.

---

## Ce que l'IA change (§8.3)

Trois effets, dont deux jouent en faveur de ce produit et un contre :

1. **Pour.** L'envoi programmatique (Graph sendMail, CRM, SDR automatisé, Zapier, agents) casse totalement le
   client-side. Le server-side conserve un avantage structurel que l'IA **renforce** au lieu de l'éroder.
2. **Pour.** Quand un fil de 15 messages est résumé par Copilot ou Gemini, la signature est la majorité des tokens et
   zéro information — le stripping de signature est une étape standard de préprocessing. C'est un argument puissant en
   faveur de la brièveté et de la dégradation gracieuse.
3. **Contre.** Composer une signature est devenu quasi gratuit en coût de production. C'est l'argument le plus fort en
   faveur de « le design n'est pas le goulot ».

---

## Le scénario qui tue tout (§8.7)

> Toute la thèse client-side repose sur l'absence d'API Graph de signature. Rien n'est dit sur ce qui se passe **s'ils
> en publient une**, ou s'ils intègrent nativement la gestion centralisée dans M365 — ce serait la fin du segment
> déployeur en un cycle.

Ce scaffold y est partiellement immunisé : le contrat de dégradation et la QA annuaire restent utiles même si Microsoft
publie une API de déploiement, parce qu'ils portent sur le **contenu** et la **survie de l'information**, pas sur le
canal de distribution. Le module Déploiement, lui, deviendrait obsolète.

---

## À instruire avant toute décision (§10)

1. **Dix entretiens acheteurs.** Qui signe le chèque ? Quel budget ? Quel cycle ? Contre quel arbitrage interne ?
2. **Aucune voix du destinataire** dans tout le corpus. Que font réellement les gens d'une signature ?
3. **Aucun chiffre sur le coût du problème côté client** : temps IT, nombre de tickets, fréquence des refontes.
4. **Économie unitaire du modèle de service** : parc de comptes de test, coût Litmus refacturé, temps humain par client
   par mois, prix de vente, marge brute. Impossible d'arbitrer « SaaS ou studio » sans ça.
5. **Corpus à compléter** : Siggly, Signite, SignKit, Draftship, signatureforemail.com — précisément les acteurs qui
   occupent les gaps déclarés vides. Plus HiHello, Popl, Mobilo côté carte numérique.
