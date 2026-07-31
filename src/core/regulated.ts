/**
 * Packs de mentions réglementées.
 *
 * Ancrage veille §8.4 — « Les professions à mentions obligatoires : le seul
 * budget non discretionnaire du marché. [...] La signature y est un objet
 * réglementé, avec contenu impose, autorité de contrôle et sanction.
 * Zéro acteur ne les sert spécifiquement. »
 *
 * Et §8.4 encore, sur le levier europeen jamais cite : « §35a GmbHG /
 * §37a HGB en Allemagne — mentions du registre du commerce obligatoires
 * dans les emails professionnels. »
 *
 * ATTENTION — statut de ces packs.
 * Les champs listes ici sont ceux que la veille énoncé explicitement. Ils
 * sont donc structurellement fiables (quelle information doit figurer) mais
 * la redaction exacte, la formulation opposable et l'exhaustivite par ordre
 * professionnel NE SONT PAS validees juridiquement dans ce scaffold. La
 * veille elle-même classe ce segment en « a valider par entretiens avant
 * tout » (§9). Traiter comme un gabarit a faire relire, pas comme un avis.
 */

import type { ProfessionId } from './model.ts'

export interface RegulatedField {
  key: string
  label: string
  /** Exemple de valeur, affiche en placeholder. */
  hint: string
  /** Si true, son absence est une non-conformité, pas une imperfection. */
  required: boolean
}

export interface ProfessionPack {
  id: ProfessionId
  label: string
  /** Autorité de contrôle — c'est elle qui rend le budget non discretionnaire. */
  authority: string
  /** Fondement cite par la veille. */
  basis: string
  fields: RegulatedField[]
  /** Gabarit de rendu ; {{key}} substitue depuis person.professionFields. */
  template: string[]
  /** Rappel de prudence affiche dans l'interface. */
  caveat: string
}

const CAVEAT =
  'Gabarit issu de la veille §8.4, non valide juridiquement. A faire relire par le professionnel ou son ordre avant déploiement.'

export const PROFESSION_PACKS: Record<Exclude<ProfessionId, 'none'>, ProfessionPack> = {
  avocat: {
    id: 'avocat',
    label: 'Avocat',
    authority: "Ordre des avocats (barreau de rattachement)",
    basis: 'RIN art. 10 — cite veille §8.4',
    fields: [
      { key: 'barreau', label: 'Barreau de rattachement', hint: 'Barreau de Paris', required: true },
      { key: 'structure', label: "Structure d'exercice", hint: 'SELARL Dupont & Associés', required: true },
      { key: 'toque', label: 'Numéro de toque', hint: 'C1234', required: false },
    ],
    template: ['Avocat au {{barreau}}', '{{structure}}', 'Toque {{toque}}'],
    caveat: CAVEAT,
  },
  notaire: {
    id: 'notaire',
    label: 'Notaire',
    authority: 'Chambre des notaires',
    basis: 'Veille §8.4',
    fields: [
      { key: 'office', label: 'Office notarial', hint: 'Office notarial de Lyon 2e', required: true },
      { key: 'ressort', label: 'Ressort / chambre', hint: 'Chambre des notaires du Rhone', required: true },
    ],
    template: ['Notaire — {{office}}', '{{ressort}}'],
    caveat: CAVEAT,
  },
  commissaire_justice: {
    id: 'commissaire_justice',
    label: 'Commissaire de justice',
    authority: 'Chambre nationale des commissaires de justice',
    basis: 'Veille §8.4',
    fields: [
      { key: 'office', label: 'Office', hint: 'SELARL Martin, commissaires de justice', required: true },
      { key: 'ressort', label: 'Ressort de compétence', hint: "Cour d'appel de Douai", required: true },
    ],
    template: ['Commissaire de justice — {{office}}', 'Ressort : {{ressort}}'],
    caveat: CAVEAT,
  },
  expert_comptable: {
    id: 'expert_comptable',
    label: 'Expert-comptable',
    authority: "Ordre des experts-comptables",
    basis: "Numéro d'inscription a l'Ordre — cite veille §8.4",
    fields: [
      { key: 'inscription', label: "Numéro d'inscription a l'Ordre", hint: '14 75 1234 5678', required: true },
      { key: 'region', label: 'Conseil régional', hint: 'CROEC Paris Ile-de-France', required: true },
    ],
    template: ["Expert-comptable inscrit a l'Ordre sous le n° {{inscription}}", '{{region}}'],
    caveat: CAVEAT,
  },
  architecte: {
    id: 'architecte',
    label: 'Architecte',
    authority: "Ordre des architectes",
    basis: 'Numéro au tableau — cite veille §8.4',
    fields: [
      { key: 'tableau', label: 'Numéro au tableau', hint: 'S12345', required: true },
      { key: 'region', label: 'Conseil régional', hint: "Conseil régional de l'Ordre des architectes d'Occitanie", required: true },
    ],
    template: ['Architecte DPLG — inscrit au tableau n° {{tableau}}', '{{region}}'],
    caveat: CAVEAT,
  },
  agent_immobilier: {
    id: 'agent_immobilier',
    label: 'Agent immobilier',
    authority: 'CCI (delivrance de la carte) — loi Hoguet',
    basis: 'Carte professionnelle CPI, numéro, préfecture emettrice, garantie financière — cite veille §8.4',
    fields: [
      { key: 'cpi', label: 'Numéro de carte CPI', hint: 'CPI 3301 2020 000 045 678', required: true },
      { key: 'émetteur', label: 'Autorité emettrice', hint: 'CCI de Bordeaux Gironde', required: true },
      { key: 'garantie', label: 'Garantie financière', hint: 'GALIAN, 110 000 EUR', required: true },
      { key: 'rcp', label: 'Assurance RCP', hint: 'AXA n° 1234567', required: false },
    ],
    template: [
      'Carte professionnelle {{cpi}} délivrée par {{émetteur}}',
      'Garantie financière : {{garantie}}',
      'RCP : {{rcp}}',
    ],
    caveat: CAVEAT,
  },
  courtier_orias: {
    id: 'courtier_orias',
    label: 'Courtier (ORIAS)',
    authority: 'ORIAS / ACPR',
    basis: 'Numéro ORIAS — cite veille §8.4',
    fields: [
      { key: 'orias', label: 'Numéro ORIAS', hint: '12 345 678', required: true },
      { key: 'categorie', label: 'Catégorie', hint: 'Courtier en assurance (COA)', required: true },
    ],
    template: ['{{categorie}} — ORIAS n° {{orias}} (www.orias.fr)'],
    caveat: CAVEAT,
  },
  gmbh_de: {
    id: 'gmbh_de',
    label: 'GmbH (Allemagne) — §35a GmbHG',
    authority: 'Handelsregister',
    basis: '§35a GmbHG / §37a HGB — cite veille §8.4',
    fields: [
      { key: 'firma', label: 'Firma (raison sociale complete)', hint: 'Beispiel GmbH', required: true },
      { key: 'sitz', label: 'Sitz der Gesellschaft', hint: 'Berlin', required: true },
      { key: 'gericht', label: 'Registergericht', hint: 'Amtsgericht Charlottenburg', required: true },
      { key: 'hrb', label: 'Handelsregisternummer', hint: 'HRB 123456 B', required: true },
      { key: 'geschaeftsfuehrer', label: 'Geschaftsfuhrer', hint: 'Anna Muller, Jan Weber', required: true },
    ],
    template: [
      '{{firma}} — Sitz: {{sitz}}',
      'Registergericht: {{gericht}}, {{hrb}}',
      'Geschaftsfuhrer: {{geschaeftsfuehrer}}',
    ],
    caveat: CAVEAT,
  },
}

export function getPack(id: ProfessionId | undefined): ProfessionPack | undefined {
  if (!id || id === 'none') return undefined
  return PROFESSION_PACKS[id]
}

/**
 * Rend les mentions réglementées.
 *
 * Point critique — veille §2.C, défaut n°4 documenté par Microsoft :
 * « Rules skip lines that contain variables they can't update », c'est-a-dire
 * qu'une ligne dont l'attribut annuaire est vide est PUREMENT SAUTEE,
 * SILENCIEUSEMENT. Ici on ne saute pas en silence : on renvoie la liste des
 * champs manquants pour que l'appelant puisse la remonter en non-conformité.
 */
export function renderRegulated(
  pack: ProfessionPack | undefined,
  values: Record<string, string> | undefined,
): { lines: string[]; missing: RegulatedField[]; skippedLines: string[] } {
  if (!pack) return { lines: [], missing: [], skippedLines: [] }
  const v = values ?? {}
  const missing = pack.fields.filter((f) => f.required && !String(v[f.key] ?? '').trim())
  const lines: string[] = []
  const skippedLines: string[] = []

  for (const tpl of pack.template) {
    const keys = [...tpl.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
    const unresolved = keys.filter((k) => !String(v[k] ?? '').trim())
    if (unresolved.length > 0) {
      // On enregistre explicitement le saut au lieu de le taire.
      skippedLines.push(tpl)
      continue
    }
    lines.push(tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(v[k]).trim()))
  }
  return { lines, missing, skippedLines }
}
