/**
 * Utilitaires HTML sans dépendance.
 *
 * Volontairement pas de DOMParser : le moteur doit tourner a l'identique
 * dans le navigateur (studio, linter public) et sous node --test. Un
 * scanner de balises tolerant suffit largement pour les règles visees,
 * qui portent toutes sur des attributs, des declarations CSS inline ou
 * la presence de certaines balises.
 */

export interface Tag {
  name: string
  attrs: Record<string, string>
  raw: string
  index: number
  closing: boolean
  selfClosing: boolean
}

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>`]+))?)*)\s*(\/?)>/g
const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g

export function scanTags(html: string): Tag[] {
  const out: Tag[] = []
  TAG_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TAG_RE.exec(html))) {
    const attrs: Record<string, string> = {}
    ATTR_RE.lastIndex = 0
    let a: RegExpExecArray | null
    while ((a = ATTR_RE.exec(m[3] ?? ''))) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? ''
    }
    out.push({
      name: m[2].toLowerCase(),
      attrs,
      raw: m[0],
      index: m.index,
      closing: m[1] === '/',
      selfClosing: m[4] === '/',
    })
  }
  return out
}

/** Declarations CSS d'un attribut style, en minuscules. */
export function parseStyle(style: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!style) return out
  for (const decl of style.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    out[decl.slice(0, i).trim().toLowerCase()] = decl.slice(i + 1).trim()
  }
  return out
}

/** Contenu des blocs <style>. */
export function extractStyleBlocks(html: string): string[] {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])
}

/** Texte visible approximatif : balises retirees, entités decodees, espaces normalises. */
export function extractText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(tr|p|div|table|li)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n')
    .trim()
}

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â',
  ccedil: 'ç', ugrave: 'ù', ucirc: 'û', uuml: 'ü', ocirc: 'ô', icirc: 'î',
  iuml: 'ï', laquo: '«', raquo: '»', hellip: '…', euro: '€', deg: '°',
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
}

/** Echappe le texte destine a du HTML. */
export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Encode tout caractère non-ASCII en entité NUMERIQUE.
 *
 * Veille §6.2 : « accents en entités HTML ». Précision d'ingenierie que la
 * veille ne fait pas, et qui compte parce qu'elle recommande par ailleurs un
 * budget de poids (§5, clipping Gmail a ~102 Ko) :
 *   - « é » en UTF-8 quoted-printable  => =C3=A9        = 6 octets
 *   - « &#233; » (entité numérique)    => &#233;        = 6 octets  (neutre)
 *   - « &eacute; » (entité nommee)     => &eacute;      = 9 octets  (+50 %)
 * On prend donc l'entité numérique : robustesse de charset face a la
 * resérialisation par les clients intermediaires (§5), a cout d'octet nul.
 */
export function toNumericEntities(s: string): string {
  let out = ''
  for (const ch of s) {
    const cp = ch.codePointAt(0)!
    out += cp > 127 ? `&#${cp};` : ch
  }
  return out
}

/** Taille en octets UTF-8. */
export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length
}

/* ------------------------------------------------------------------ *
 * Contraste WCAG — §7.7 : « la convention de mettre les mentions légales
 * en gris clair échoue mecaniquement le seuil de contraste 4,5:1 ».
 * ------------------------------------------------------------------ */

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(rgb: [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
}

export function contrastRatio(a: string, b: string): number | null {
  const ra = parseHex(a)
  const rb = parseHex(b)
  if (!ra || !rb) return null
  const la = relativeLuminance(ra)
  const lb = relativeLuminance(rb)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

/**
 * Inversion « forced-invert » approximee.
 *
 * Veille §5 : Outlook Windows, Office 365 Windows et Gmail iOS inversent
 * totalement, sans offrir ni prefers-color-scheme ni data-ogsc. On ne peut
 * donc pas cibler ces clients : la seule strategie est de vérifier que le
 * socle reste lisible APRES inversion. C'est ce que simule cette fonction.
 */
export function invertHex(hex: string): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  const inv = rgb.map((c) => 255 - c) as [number, number, number]
  return '#' + inv.map((c) => c.toString(16).padStart(2, '0')).join('')
}

/**
 * Veille §5 : la parade classique du blanc #fffffe est retournee par Yahoo,
 * qui la rend en vert olive #989800.
 */
export function isNearWhiteHack(hex: string): boolean {
  const rgb = parseHex(hex)
  if (!rgb) return false
  const [r, g, b] = rgb
  const isWhite = r === 255 && g === 255 && b === 255
  return !isWhite && r >= 250 && g >= 250 && b >= 250
}
