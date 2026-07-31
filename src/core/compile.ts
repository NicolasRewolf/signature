/**
 * Compilateur de signature défensive.
 *
 * Ancrage veille §6.2 — la liste exacte de ce qui est garantissable :
 *   « Que le HTML émis soit défensif et teste : tables uniquement, jamais de
 *     div/flex, jamais de webfont (Outlook retombe sur Times New Roman et
 *     detruit même le fallback), jamais de background-image ni border-radius
 *     sans VML, accents en entités HTML, bloc OfficeDocumentSettings a 96 dpi,
 *     images hébergées et versionnées, poids sous 80 Ko. »
 *
 * Le compilateur applique ces contraintes PAR CONSTRUCTION : sa sortie doit
 * passer le linter avec zéro finding critique ou majeur. C'est le test
 * d'intégrité du système (voir __tests__/compile.test.ts).
 */

import {
  type SignatureSource,
  type FloorItem,
  deriveFloor,
  floorHref,
} from './model.ts'
import { getPack, renderRegulated } from './regulated.ts'
import { esc, toNumericEntities, byteLength, contrastRatio } from './html.ts'

export interface CompileWarning {
  code: string
  severity: 'critical' | 'major' | 'minor' | 'info'
  message: string
  veille: string
}

export interface CompiledSignature {
  /** Fragment pret a coller ou a injecter dans une règle de transport. */
  html: string
  /** Document .htm complet, pour fichier de signature Outlook / roaming. */
  document: string
  /** Alternative text/plain. Porte le socle : c'est le dernier filet. */
  text: string
  bytes: number
  chars: number
  floor: FloorItem[]
  /** Lignes réglementaires effectivement rendues. */
  regulatedLines: string[]
  /** Lignes réglementaires SAUTEES faute de donnée (§2.C défaut n°4). */
  regulatedSkipped: string[]
  warnings: CompileWarning[]
}

const RESET = 'margin:0;padding:0;border:0;border-collapse:collapse;'

function tableOpen(width: number | undefined, extra = ''): string {
  const w = width ? ` width="${width}"` : ''
  const ws = width ? `width:${width}px;` : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${w} style="${RESET}${ws}${extra}">`
}

function enc(s: string, on: boolean): string {
  return on ? toNumericEntities(esc(s)) : esc(s)
}

export function compile(src: SignatureSource): CompiledSignature {
  const warnings: CompileWarning[] = []
  const { brand, layout, legal, logo, org, person } = src
  const E = layout.entityEncode
  const floor = src.floor ?? deriveFloor(src)

  /* --- Garde-fous amont ------------------------------------------- */

  if (layout.banner) {
    warnings.push({
      code: 'BANNER-CNIL',
      severity: 'critical',
      message:
        "Bandeau marketing actif. Deliberation CNIL n°2026-042 du 12 mars 2026 : les pixels de suivi et redirections de liens sont des traceurs (art. 82 LIL), consentement préalable requis. Le delai transitoire est echu depuis le 14 juillet 2026.",
      veille: '§7.3',
    })
  }
  if (logo && logo.darkBehaviour === 'ink-on-transparent') {
    warnings.push({
      code: 'LOGO-DARK',
      severity: 'major',
      message:
        "Logo encre sombre sur fond transparent : invisible sur les clients à inversion totale (Outlook Windows, Office 365 Windows, Gmail iOS), qui n'offrent ni prefers-color-scheme ni data-ogsc. Fournir une version a fond blanc cuit.",
      veille: '§5',
    })
  }
  if (logo?.intrinsicWidth && logo.width / logo.intrinsicWidth > 65) {
    warnings.push({
      code: 'IMG-65X',
      severity: 'major',
      message:
        "Image étirée au-delà de 65x sa largeur intrinseque : Outlook Windows refuse. C'est ce qui casse tous les filets séparateurs 1px.",
      veille: '§5',
    })
  }
  const legalContrast = contrastRatio(brand.muted, '#ffffff')
  if (legalContrast !== null && legalContrast < 4.5) {
    warnings.push({
      code: 'CONTRAST-LEGAL',
      severity: 'major',
      message: `Couleur des mentions (${brand.muted}) a ${legalContrast}:1 sur blanc, sous le seuil WCAG 4,5:1. La convention du gris clair échoue mecaniquement.`,
      veille: '§7.7',
    })
  }
  if (legal.disclaimer) {
    const words = legal.disclaimer.trim().split(/\s+/).length
    if (words > 40) {
      warnings.push({
        code: 'DISCLAIMER-NOISE',
        severity: 'minor',
        message: `Disclaimer de ${words} mots : juridiquement inopérant, plus long que l'information utile, et lu intégralement par les lecteurs d'écran à chaque message du fil. Le supprimer est le meilleur geste de design possible.`,
        veille: '§10.6',
      })
    }
  }

  /* --- Mentions réglementées --------------------------------------- */

  const pack = getPack(person.profession)
  const reg = renderRegulated(pack, person.professionFields)
  for (const f of reg.missing) {
    warnings.push({
      code: 'REG-MISSING',
      severity: 'critical',
      message: `Mention réglementée manquante : « ${f.label} » (${pack?.authority}). Sans elle la ligne est sautée silencieusement et la signature est non conforme.`,
      veille: '§8.4, §2.C',
    })
  }

  /* --- Corps -------------------------------------------------------- */

  const line = (html: string, size: number, color: string, weight = 'normal', extra = '') =>
    `<span style="font-family:${brand.fontStack};font-size:${size}px;line-height:${Math.round(size * 1.4)}px;color:${color};font-weight:${weight};${extra}">${html}</span>`

  const rows: string[] = []

  // 1. Identité + fonction
  const fullName = `${person.firstName} ${person.lastName}`.trim()
  rows.push(
    `<tr><td style="${RESET}padding:0 0 2px 0;">${line(
      enc(fullName, E),
      brand.baseSize + 2,
      brand.ink,
      'bold',
    )}</td></tr>`,
  )
  if (person.jobTitle) {
    const t = person.department ? `${person.jobTitle} · ${person.department}` : person.jobTitle
    rows.push(`<tr><td style="${RESET}padding:0 0 2px 0;">${line(enc(t, E), brand.baseSize, brand.muted)}</td></tr>`)
  }
  const orgLine = org.legalEntity ? `${org.name} — ${org.legalEntity}` : org.name
  rows.push(
    `<tr><td style="${RESET}padding:0 0 8px 0;">${line(enc(orgLine, E), brand.baseSize, brand.ink)}</td></tr>`,
  )

  // 2. Filet séparateur : cellule coloree. Jamais une image 1px étirée (§5).
  if (layout.showRule) {
    rows.push(
      `<tr><td style="${RESET}padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${RESET}"><tr><td height="1" bgcolor="${brand.rule}" style="${RESET}height:1px;line-height:1px;font-size:0;background-color:${brand.rule};">&#160;</td></tr></table></td></tr>`,
    )
    rows.push(`<tr><td style="${RESET}height:8px;line-height:8px;font-size:0;">&#160;</td></tr>`)
  }

  // 3. Contacts cliquables
  const contactRows: string[] = []
  for (const item of floor) {
    if (item.kind === 'text') continue
    const href = floorHref(item)
    const label = enc(item.label, E)
    const value = enc(item.value, E)
    const inner = href
      ? `<a href="${esc(href)}" style="font-family:${brand.fontStack};font-size:${brand.baseSize}px;line-height:${brand.lineHeight}px;color:${brand.accent};text-decoration:underline;">${value}</a>`
      : line(value, brand.baseSize, brand.ink)
    contactRows.push(
      `<tr><td style="${RESET}padding:0 8px 2px 0;white-space:nowrap;">${line(label, brand.baseSize, brand.muted)}</td><td style="${RESET}padding:0 0 2px 0;">${inner}</td></tr>`,
    )
  }
  if (contactRows.length) {
    rows.push(
      `<tr><td style="${RESET}padding:0 0 8px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${RESET}">${contactRows.join('')}</table></td></tr>`,
    )
  }

  // 4. Mentions réglementées — non supprimables (§8.4)
  if (reg.lines.length) {
    rows.push(
      `<tr><td style="${RESET}padding:0 0 6px 0;">${reg.lines
        .map((l) => line(enc(l, E), brand.baseSize - 1, brand.muted))
        .join(`<br />`)}</td></tr>`,
    )
  }

  // 5. Disclaimer
  if (legal.disclaimer) {
    rows.push(
      `<tr><td style="${RESET}padding:0;">${line(enc(legal.disclaimer, E), brand.baseSize - 2, brand.muted)}</td></tr>`,
    )
  }

  const contentTable = `${tableOpen(undefined)}${rows.join('')}</table>`

  /* --- Logo --------------------------------------------------------- */

  const logoHtml = logo
    ? `<img src="${esc(logo.src)}" width="${logo.width}" height="${logo.height}" alt="${enc(logo.alt, E)}" border="0" style="display:block;width:${logo.width}px;height:${logo.height}px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`
    : ''

  let body: string
  if (logo && layout.variant === 'aside') {
    body = `${tableOpen(layout.width)}<tr><td valign="top" style="${RESET}padding:0 14px 0 0;width:${logo.width}px;">${logoHtml}</td><td valign="top" style="${RESET}">${contentTable}</td></tr></table>`
  } else if (logo) {
    body = `${tableOpen(layout.width)}<tr><td style="${RESET}padding:0 0 10px 0;">${logoHtml}</td></tr><tr><td style="${RESET}">${contentTable}</td></tr></table>`
  } else {
    body = `${tableOpen(layout.width)}<tr><td style="${RESET}">${contentTable}</td></tr></table>`
  }

  const msoDpi = layout.msoDpiFix
    ? `<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->`
    : ''

  const html = `${msoDpi}${body}`

  /* --- Alternative texte : le dernier filet ------------------------- */

  const textLines: string[] = []
  textLines.push(fullName + (person.jobTitle ? ` — ${person.jobTitle}` : ''))
  textLines.push(orgLine)
  for (const item of floor) {
    if (item.kind === 'text') continue
    textLines.push(`${item.label} : ${item.value}`)
  }
  for (const l of reg.lines) textLines.push(l)
  const text = textLines.join('\n')

  /* --- Document complet (fichier .htm de signature) ----------------- */

  const document = [
    '<!DOCTYPE html>',
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="generator" content="Socle" />',
    msoDpi,
    '</head>',
    `<body style="${RESET}">`,
    body,
    '</body></html>',
  ].join('\n')

  const bytes = byteLength(html)
  if (bytes > 80_000) {
    warnings.push({
      code: 'WEIGHT-80K',
      severity: 'major',
      message: `Fragment a ${(bytes / 1024).toFixed(1)} Ko, au-delà du budget de 80 Ko.`,
      veille: '§6.2',
    })
  }

  return {
    html,
    document,
    text,
    bytes,
    chars: html.length,
    floor,
    regulatedLines: reg.lines,
    regulatedSkipped: reg.skippedLines,
    warnings,
  }
}

/* ------------------------------------------------------------------ *
 * Modèle de clipping Gmail
 * ------------------------------------------------------------------ */

export interface ClipEstimate {
  rounds: number
  limitBytes: number
  trace: number[]
  assumptions: string
}

/**
 * Estime le nombre d'allers-retours avant que Gmail ne tronque la signature.
 *
 * Veille §5 : « Gmail coupe a ~102 Ko. La signature, etant en fin de corps,
 * est la première victime. [...] Après huit a quinze allers-retours, toutes
 * les signatures disparaissent, mentions légales comprises. »
 *
 * C'EST UN MODELE, PAS UNE MESURE. Il sert a rendre visible un levier :
 * diviser le poids de la signature achete des allers-retours. Les paramètres
 * sont exposes pour pouvoir être recalibres sur un vrai fil client.
 */
export function estimateGmailClipping(
  signatureBytes: number,
  opts: { avgBodyBytes?: number; quoteOverhead?: number; limitBytes?: number } = {},
): ClipEstimate {
  const avgBodyBytes = opts.avgBodyBytes ?? 2_500
  const quoteOverhead = opts.quoteOverhead ?? 1.15
  const limitBytes = opts.limitBytes ?? 102_400
  const perRound = avgBodyBytes + signatureBytes
  const trace: number[] = []
  let cumulative = 0
  let rounds = 0
  while (cumulative <= limitBytes && rounds < 200) {
    cumulative = cumulative * quoteOverhead + perRound
    rounds++
    trace.push(Math.round(cumulative))
  }
  return {
    rounds: rounds - 1,
    limitBytes,
    trace,
    assumptions: `corps moyen ${avgBodyBytes} o, surcoût de citation ×${quoteOverhead}, limite ${limitBytes} o`,
  }
}
