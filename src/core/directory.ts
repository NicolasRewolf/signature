/**
 * QA de la donnée annuaire.
 *
 * Ancrage veille §7.1 — désigné comme « le meilleur des neuf » gaps :
 *
 *   « Une signature est un rendu de données. Microsoft documente le mode
 *     d'échec : attribut vide → ligne sautée SILENCIEUSEMENT. Personne ne
 *     propose de tableau de bord de complétude, d'alerte proactive (« 340
 *     collaborateurs sans entité juridique, leur mention légale est non
 *     conforme »), ni de workflow de correction route vers le bon
 *     propriétaire. »
 *
 * Et la preuve commerciale, §7.1 :
 *   « L'existence même de l'Attributes Manager de CodeTwo est l'aveu que les
 *     annuaires clients sont sales — et il crée un référentiel RH fantôme,
 *     puisqu'une valeur modifiee "will not be changed by any subsequent
 *     changes in your tenant's Entra ID" : un collaborateur promu garde son
 *     ancien titre indefiniment. »
 *
 * D'ou le parti pris de ce module : on ne propose PAS de champ de surcharge
 * silencieux. Toute valeur corrigée ici est horodatee, tracee, et signalee
 * comme dérive potentielle des que la source repasse dessus.
 *
 * Nuance honnête a garder (§7.1) : « le terrain n'est pas vierge — Siggly vend
 * un Directory Sync positionne sur l'exactitude des données, Signite publie du
 * contenu dédié a l'audit préalable. »
 */

export type DirectoryRow = Record<string, string>

/** Parseur CSV minimal, tolerant aux guillemets et aux retours dans les champs. */
export function parseCsv(text: string, delimiter?: string): { headers: string[]; rows: DirectoryRow[] } {
  const src = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const d = delimiter ?? guessDelimiter(src)
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
      continue
    }
    if (c === '"') { inQuotes = true; continue }
    if (c === d) { record.push(field); field = ''; continue }
    if (c === '\n') { record.push(field); records.push(record); record = []; field = ''; continue }
    field += c
  }
  if (field.length || record.length) { record.push(field); records.push(record) }

  const nonEmpty = records.filter((r) => r.some((c) => c.trim().length))
  if (!nonEmpty.length) return { headers: [], rows: [] }
  const headers = nonEmpty[0].map((h) => h.trim())
  const rows = nonEmpty.slice(1).map((r) => {
    const o: DirectoryRow = {}
    headers.forEach((h, i) => (o[h] = (r[i] ?? '').trim()))
    return o
  })
  return { headers, rows }
}

function guessDelimiter(s: string): string {
  const line = s.slice(0, s.indexOf('\n') + 1 || s.length)
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 }
  for (const c of line) if (c in counts) counts[c]++
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ','
}

/* ------------------------------------------------------------------ *
 * Exigences
 * ------------------------------------------------------------------ */

export interface AttributeRequirement {
  attribute: string
  label: string
  /** Ligne de signature qui disparaît SILENCIEUSEMENT si l'attribut est vide. */
  breaksLine: string
  /** Cette ligne porte-t-elle une mention réglementée ? Si oui : non-conformité. */
  regulated: boolean
  severity: 'critical' | 'major' | 'minor'
}

/**
 * Jeu par défaut. A adapter par client : c'est la traduction du template en
 * contrat de données, et c'est la moitie du travail d'un déploiement réel.
 */
export const DEFAULT_REQUIREMENTS: AttributeRequirement[] = [
  { attribute: 'givenName', label: 'Prenom', breaksLine: 'Ligne identité', regulated: false, severity: 'critical' },
  { attribute: 'surname', label: 'Nom', breaksLine: 'Ligne identité', regulated: false, severity: 'critical' },
  { attribute: 'mail', label: 'Email', breaksLine: 'Ligne contact', regulated: false, severity: 'critical' },
  { attribute: 'jobTitle', label: 'Fonction', breaksLine: 'Ligne fonction', regulated: false, severity: 'major' },
  { attribute: 'department', label: 'Direction', breaksLine: 'Ligne fonction', regulated: false, severity: 'minor' },
  { attribute: 'mobilePhone', label: 'Mobile', breaksLine: 'Ligne téléphone', regulated: false, severity: 'major' },
  { attribute: 'companyName', label: 'Entité juridique', breaksLine: 'Mention légale', regulated: true, severity: 'critical' },
]

export interface AttributeAudit {
  attribute: string
  label: string
  filled: number
  missing: number
  rate: number
  severity: AttributeRequirement['severity']
  regulated: boolean
  breaksLine: string
  /** Quelques identifiants concernes, pour rendre l'alerte actionnable. */
  sample: string[]
}

export interface DirectoryAudit {
  total: number
  attributes: AttributeAudit[]
  /** Personnes dont au moins une mention réglementée saute. */
  nonCompliant: Array<{ id: string; missing: string[] }>
  /** Formulation prete a envoyer au propriétaire de la donnée. */
  alerts: string[]
  /** Attributs présents dans le fichier mais utilises par aucune exigence. */
  unusedColumns: string[]
  /** Exigences dont la colonne est totalement absente du fichier. */
  absentColumns: string[]
}

export function auditDirectory(
  rows: DirectoryRow[],
  requirements: AttributeRequirement[] = DEFAULT_REQUIREMENTS,
  idKey = 'mail',
): DirectoryAudit {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const absentColumns = requirements.filter((r) => !headers.includes(r.attribute)).map((r) => r.attribute)
  const usedColumns = new Set(requirements.map((r) => r.attribute))
  const unusedColumns = headers.filter((h) => !usedColumns.has(h))

  const attributes: AttributeAudit[] = requirements.map((req) => {
    const missingRows = rows.filter((r) => !String(r[req.attribute] ?? '').trim())
    return {
      attribute: req.attribute,
      label: req.label,
      filled: rows.length - missingRows.length,
      missing: missingRows.length,
      rate: rows.length ? Math.round(((rows.length - missingRows.length) / rows.length) * 1000) / 10 : 0,
      severity: req.severity,
      regulated: req.regulated,
      breaksLine: req.breaksLine,
      sample: missingRows.slice(0, 5).map((r) => r[idKey] || r.mail || r.userPrincipalName || '(sans identifiant)'),
    }
  })

  const regulatedReqs = requirements.filter((r) => r.regulated)
  const nonCompliant = rows
    .map((r) => ({
      id: r[idKey] || r.mail || '(sans identifiant)',
      missing: regulatedReqs.filter((req) => !String(r[req.attribute] ?? '').trim()).map((req) => req.label),
    }))
    .filter((x) => x.missing.length > 0)

  const alerts: string[] = []
  for (const a of attributes) {
    if (a.missing === 0) continue
    if (a.regulated) {
      alerts.push(
        `${a.missing} collaborateur(s) sans ${a.label.toLowerCase()} : leur « ${a.breaksLine} » est sautée silencieusement, leur signature est non conforme.`,
      )
    } else if (a.severity === 'critical') {
      alerts.push(`${a.missing} collaborateur(s) sans ${a.label.toLowerCase()} : la ligne « ${a.breaksLine} » disparaît sans erreur.`)
    } else {
      alerts.push(`${a.missing} collaborateur(s) sans ${a.label.toLowerCase()} (${a.rate}% de complétude).`)
    }
  }
  for (const c of absentColumns) {
    alerts.push(`Colonne « ${c} » absente du fichier : l'exigence correspondante ne peut pas être evaluee.`)
  }

  return { total: rows.length, attributes, nonCompliant, alerts, unusedColumns, absentColumns }
}

/** Export CSV des corrections a router vers le propriétaire de la donnée. */
export function correctionCsv(rows: DirectoryRow[], audit: DirectoryAudit, idKey = 'mail'): string {
  const lines = ['identifiant;attribut_manquant;ligne_impactee;gravité']
  const byAttr = new Map(audit.attributes.map((a) => [a.attribute, a]))
  for (const row of rows) {
    for (const [attr, a] of byAttr) {
      if (String(row[attr] ?? '').trim()) continue
      lines.push(
        [row[idKey] || '(sans identifiant)', a.label, a.breaksLine, a.regulated ? 'non-conformité' : a.severity].join(';'),
      )
    }
  }
  return lines.join('\n')
}

/* ------------------------------------------------------------------ *
 * Connecteurs SIRH
 * ------------------------------------------------------------------ */

export interface ConnectorSpec {
  id: string
  label: string
  status: 'implemented' | 'stub' | 'planned'
  note: string
}

/**
 * Veille §7.1 : « Sur le marché français : Lucca, PayFit, Eurecia et Silae sont
 * la source de vérité réelle. Seuls Signitic (plan Custom, sur devis) et Boost
 * My Mail proposent Lucca. Exclaimer reserve ses connecteurs SIRH au palier Pro. »
 *
 * Ces entrees sont déclarées honnêtement en 'stub' : aucune n'est implementee
 * dans ce scaffold. Import CSV/manuel uniquement pour l'instant.
 */
export const CONNECTORS: ConnectorSpec[] = [
  { id: 'csv', label: 'Import CSV / Excel', status: 'implemented', note: 'Le seul chemin reellement fonctionnel a ce stade.' },
  { id: 'entra', label: 'Microsoft Entra ID', status: 'planned', note: 'Graph /users. Attention : pas d\'API Graph de signature, seulement de l\'annuaire.' },
  { id: 'google', label: 'Google Workspace Directory', status: 'planned', note: 'Admin SDK Directory API.' },
  { id: 'lucca', label: 'Lucca', status: 'stub', note: 'Source de vérité RH courante en France. Mal couvert par le marché.' },
  { id: 'payfit', label: 'PayFit', status: 'stub', note: 'Idem.' },
  { id: 'silae', label: 'Silae', status: 'stub', note: 'Idem.' },
  { id: 'eurecia', label: 'Eurecia', status: 'stub', note: 'Idem.' },
]
