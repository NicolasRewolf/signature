/**
 * Linter de signature.
 *
 * Ancrage veille §5 — « 26 modes de rupture documentés ». Chaque règle porte
 * le § d'origine, le ou les clients concernes, et surtout : l'existence ou non
 * d'un correctif COTE EMETTEUR.
 *
 * Cette dernière colonne est la réponse a l'objection de fond de §7.4 :
 *   « les regressions citees sont des regressions de clients de LECTURE — si
 *     Outlook 2505 ignore le <style>, il l'ignore pour tout le monde, et le
 *     correctif côté émetteur n'existe pas. On produit des alertes sans
 *     correctif associe. »
 * Un linter qui signale ce sur quoi on ne peut pas agir est du bruit. On
 * separe donc explicitement « actionnable » de « a documenter au client ».
 */

import {
  scanTags,
  parseStyle,
  extractStyleBlocks,
  extractText,
  byteLength,
  contrastRatio,
  isNearWhiteHack,
  type Tag,
} from './html.ts'
import type { Severity } from './model.ts'

export interface LintContext {
  html: string
  tags: Tag[]
  styleBlocks: string[]
  text: string
  bytes: number
  chars: number
}

export interface Finding {
  ruleId: string
  severity: Severity
  message: string
  /** Extrait fautif, tronque. */
  evidence?: string
  count: number
}

export interface Rule {
  id: string
  title: string
  severity: Severity
  /** Clients de lecture concernes (ids de clients.ts, ou '*'). */
  clients: string[]
  veille: string
  why: string
  fix: string
  /** Existe-t-il un correctif côté émetteur ? Sinon : a documenter, pas a corriger. */
  actionable: boolean
  run(ctx: LintContext): Finding[]
}

const UNSUPPORTED_WORD_PROPS = [
  'border-radius',
  'background-image',
  'position',
  'float',
  'max-width',
  'min-width',
  'overflow',
  'z-index',
  'box-shadow',
  'transform',
  'flex',
  'display:flex',
  'display:grid',
  'gap',
]

function f(ruleId: string, severity: Severity, message: string, count = 1, evidence?: string): Finding {
  return { ruleId, severity, message, count, evidence: evidence?.slice(0, 180) }
}

const BLOCK_TAGS = new Set(['div', 'p', 'span', 'section', 'article', 'header', 'footer', 'ul', 'li'])

export const RULES: Rule[] = [
  /* ---------------- Moteur Word (Outlook Windows) ---------------- */
  {
    id: 'NO-LAYOUT-DIV',
    title: 'Mise en page en div/p/span',
    severity: 'critical',
    clients: ['outlook-win-word'],
    veille: '§5, §6.2',
    why: "Outlook Windows n'est pas un navigateur, c'est Word. Word classe div/p/span en COREEXTENDED : width et padding y sont ignores. La mise en page s'effondre.",
    fix: 'Tables uniquement. Aucun div, jamais de flex ni de grid.',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => {
        if (t.closing || !BLOCK_TAGS.has(t.name)) return false
        const s = parseStyle(t.attrs.style)
        return Boolean(s.width || s.padding || s['padding-left'] || s['padding-top'] || s.display === 'flex' || s.display === 'grid')
      })
      if (!bad.length) return []
      return [f(this.id, this.severity, `${bad.length} élément(s) de type ${[...new Set(bad.map((b) => b.name))].join('/')} portent width, padding ou display:flex.`, bad.length, bad[0].raw)]
    },
  },
  {
    id: 'WORD-UNSUPPORTED-CSS',
    title: 'Propriétés CSS non supportees par Word',
    severity: 'major',
    clients: ['outlook-win-word'],
    veille: '§5',
    why: 'border-radius, background-image, position, float, max-width, overflow, z-index non supportes.',
    fix: "Retirer, ou fournir un equivalent VML sous commentaire conditionnel mso.",
    actionable: true,
    run(ctx) {
      const hits: string[] = []
      const all = ctx.tags.map((t) => t.attrs.style ?? '').concat(ctx.styleBlocks).join(' ').toLowerCase()
      for (const p of UNSUPPORTED_WORD_PROPS) if (all.includes(p)) hits.push(p)
      if (!hits.length) return []
      return [f(this.id, this.severity, `Propriétés ignorees par le moteur Word : ${hits.join(', ')}.`, hits.length)]
    },
  },
  {
    id: 'PADDING-ON-CELL',
    title: 'padding hors cellule de tableau',
    severity: 'major',
    clients: ['outlook-win-word'],
    veille: '§5',
    why: 'Word ne gere le padding que sur les cellules.',
    fix: 'Deplacer tout padding sur des <td>.',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => {
        if (t.closing || t.name === 'td' || t.name === 'th' || t.name === 'table') return false
        const s = parseStyle(t.attrs.style)
        return Object.keys(s).some((k) => k.startsWith('padding'))
      })
      return bad.length ? [f(this.id, this.severity, `${bad.length} élément(s) non-cellule portent un padding.`, bad.length, bad[0].raw)] : []
    },
  },
  {
    id: 'MSO-DPI',
    title: 'Bloc OfficeDocumentSettings 96 dpi absent',
    severity: 'minor',
    clients: ['outlook-win-word'],
    veille: '§5, §6.2',
    why: 'Sans lui, le DPI scaling rend les images floues ou geantes en 120/144 dpi.',
    fix: 'Emettre <!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch>...',
    actionable: true,
    run(ctx) {
      return /PixelsPerInch/i.test(ctx.html) ? [] : [f(this.id, this.severity, 'Bloc DPI 96 absent.')]
    },
  },
  {
    id: 'IMG-220PPI',
    title: 'Recompression des images a 220 PPI',
    severity: 'info',
    clients: ['outlook-win-word'],
    veille: '§5',
    why: "Outlook Windows recompresse les images à l'envoi. Corrigeable uniquement par GPO sur le poste — donc hors de portee de tout SaaS.",
    fix: "Aucun correctif émetteur. A documenter au client : fournir les logos en 2x et accepter la perte, ou passer par GPO.",
    actionable: false,
    run(ctx) {
      const imgs = ctx.tags.filter((t) => t.name === 'img' && !t.closing)
      return imgs.length ? [f(this.id, this.severity, `${imgs.length} image(s) exposee(s) a la recompression 220 PPI d'Outlook Windows.`, imgs.length)] : []
    },
  },

  /* ---------------- Images ---------------- */
  {
    id: 'IMG-DIM',
    title: 'Image sans width/height explicites',
    severity: 'major',
    clients: ['outlook-win-word', 'owa'],
    veille: '§5',
    why: "Le bug de collage OWA supprime width/height : sans attributs HTML ET style inline, l'image explose a sa taille intrinseque.",
    fix: 'Poser width/height en attributs HTML et en style inline.',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => {
        if (t.name !== 'img' || t.closing) return false
        const s = parseStyle(t.attrs.style)
        return !(t.attrs.width && t.attrs.height && s.width && s.height)
      })
      return bad.length ? [f(this.id, this.severity, `${bad.length} image(s) sans dimensions doublees (attribut + style).`, bad.length, bad[0].raw)] : []
    },
  },
  {
    id: 'IMG-ALT',
    title: 'Image sans alt',
    severity: 'major',
    clients: ['*'],
    veille: '§2.A, §7.7',
    why: "Quand le client bloque les images — ou lors de la croix rouge du build 16.0.19929.20162 — l'alt est tout ce qui reste. Et c'est la seule prise du lecteur d'écran.",
    fix: 'alt descriptif sur les images porteuses de sens, alt="" sur les decoratives.',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => t.name === 'img' && !t.closing && t.attrs.alt === undefined)
      return bad.length ? [f(this.id, this.severity, `${bad.length} image(s) sans attribut alt.`, bad.length, bad[0].raw)] : []
    },
  },
  {
    id: 'IMG-SELF-HOSTED',
    title: 'Images non hébergées en absolu https',
    severity: 'critical',
    clients: ['*'],
    veille: '§2.A, §6.2',
    why: "mail-signatures.com a casse rétroactivement tout son parc installe en deplacant ses images : toute signature générée avant le 9 janvier 2026 doit être regeneree. Une URL relative ou data: se transforme en piece jointe.",
    fix: 'URL absolue https, sur un domaine que vous controlez, avec un chemin versionne.',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => {
        if (t.name !== 'img' || t.closing) return false
        const src = t.attrs.src ?? ''
        return !/^https:\/\//i.test(src)
      })
      return bad.length ? [f(this.id, this.severity, `${bad.length} image(s) en URL non-https absolue (relative, http, data: ou cid:).`, bad.length, bad[0].raw)] : []
    },
  },
  {
    id: 'IMG-65X',
    title: 'Image étirée au-delà de 65x',
    severity: 'major',
    clients: ['outlook-win-word'],
    veille: '§5',
    why: "Outlook Windows refuse d'étirer une image au-delà de 65x sa largeur intrinseque. C'est ce qui casse tous les filets séparateurs 1px.",
    fix: 'Remplacer le filet image par une cellule de tableau avec bgcolor et height="1".',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => {
        if (t.name !== 'img' || t.closing) return false
        const w = parseInt(t.attrs.width ?? '0', 10)
        return w > 65 && /(spacer|pixel|1x1|line|rule|sep)/i.test(t.attrs.src ?? '')
      })
      return bad.length ? [f(this.id, this.severity, `${bad.length} image(s) de type filet/spacer étirée(s) au-delà du plafond des 65x.`, bad.length, bad[0].raw)] : []
    },
  },
  {
    id: 'IMG-ONLY',
    title: 'Signature entièrement en image',
    severity: 'critical',
    clients: ['*'],
    veille: '§2.A',
    why: "Canva ne produit qu'une image : non cliquable, non selectionnable, invisible pour un lecteur d'écran, absente quand le client bloque les images.",
    fix: 'Le socle doit exister en texte réel. Une image ne peut porter que de la decoration.',
    actionable: true,
    run(ctx) {
      const imgs = ctx.tags.filter((t) => t.name === 'img' && !t.closing).length
      const words = ctx.text.split(/\s+/).filter(Boolean).length
      return imgs >= 1 && words < 8
        ? [f(this.id, this.severity, `Seulement ${words} mot(s) de texte réel pour ${imgs} image(s) : la signature ne survit ni au blocage d'images ni au lecteur d'écran.`)]
        : []
    },
  },

  /* ---------------- CSS / couleurs ---------------- */
  {
    id: 'NO-STYLE-TAG',
    title: 'Dépendance a un bloc <style>',
    severity: 'critical',
    clients: ['outlook-com', 'owa', 'gmail-web'],
    veille: '§5',
    why: "Outlook.com supprime les <style> du <head> depuis juin 2024. Gmail supprime le bloc entier si une seule declaration lui deplait.",
    fix: 'Tout le CSS en inline, sans exception.',
    actionable: true,
    run(ctx) {
      const meaningful = ctx.styleBlocks.filter((b) => b.replace(/\s|\/\*[\s\S]*?\*\//g, '').length > 0)
      return meaningful.length ? [f(this.id, this.severity, `${meaningful.length} bloc(s) <style> : leur contenu est perdu sur Outlook.com et fragile sur Gmail.`, meaningful.length)] : []
    },
  },
  {
    id: 'HEX-ONLY',
    title: 'Couleur en syntaxe non hexadécimale',
    severity: 'critical',
    clients: ['gmail-web', 'gmail-ios'],
    veille: '§5',
    why: 'Une seule couleur ecrite en syntaxe rgb(255 0 0) fait supprimer par Gmail le bloc <style> entier.',
    fix: 'Hexadecimal uniquement, partout.',
    actionable: true,
    run(ctx) {
      const all = ctx.tags.map((t) => t.attrs.style ?? '').concat(ctx.styleBlocks).join(' ')
      const hits = [...all.matchAll(/\b(rgba?|hsla?)\(\s*[^,)]+\s+[^,)]+/gi)]
      const any = [...all.matchAll(/\b(rgba?|hsla?)\(/gi)]
      if (!any.length) return []
      const sev = hits.length ? 'critical' : 'minor'
      return [
        f(
          this.id,
          sev as Severity,
          hits.length
            ? `${hits.length} couleur(s) en syntaxe a espaces (rgb(255 0 0)) : Gmail supprime le <style> entier.`
            : `${any.length} couleur(s) en rgb()/hsl() : passer en hexadécimal par sécurité.`,
          hits.length || any.length,
        ),
      ]
    },
  },
  {
    id: 'NEAR-WHITE-HACK',
    title: 'Parade du blanc #fffffe',
    severity: 'major',
    clients: ['yahoo'],
    veille: '§5',
    why: 'La parade classique du blanc #fffffe est retournee par Yahoo, qui la rend en vert olive #989800.',
    fix: 'Utiliser du blanc pur, ou renoncer a la parade.',
    actionable: true,
    run(ctx) {
      const all = ctx.tags.map((t) => t.attrs.style ?? '').concat(ctx.styleBlocks).join(' ')
      const hex = [...all.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0])
      const bad = hex.filter(isNearWhiteHack)
      return bad.length ? [f(this.id, this.severity, `Couleur quasi-blanche detectee (${[...new Set(bad)].join(', ')}) : Yahoo la rendra en #989800.`, bad.length)] : []
    },
  },
  {
    id: 'NO-WEBFONT',
    title: 'Webfont',
    severity: 'major',
    clients: ['outlook-win-word'],
    veille: '§6.2',
    why: 'Outlook retombe sur Times New Roman et detruit même le fallback.',
    fix: 'Pile de polices système uniquement. Aucun @font-face, aucun lien Google Fonts.',
    actionable: true,
    run(ctx) {
      const all = ctx.html.toLowerCase()
      const hit = all.includes('@font-face') || all.includes('fonts.googleapis') || all.includes('fonts.gstatic')
      return hit ? [f(this.id, this.severity, 'Webfont déclarée : Outlook Windows retombera sur Times New Roman.')] : []
    },
  },
  {
    id: 'CONTRAST-45',
    title: 'Contraste insuffisant',
    severity: 'major',
    clients: ['*'],
    veille: '§7.7',
    why: 'La convention de mettre les mentions légales en gris clair échoue mecaniquement le seuil de contraste 4,5:1.',
    fix: 'Remonter la couleur des mentions au-dessus de 4,5:1 sur fond blanc.',
    actionable: true,
    run(ctx) {
      const bad: string[] = []
      for (const t of ctx.tags) {
        const s = parseStyle(t.attrs.style)
        if (!s.color) continue
        const bg = s['background-color'] || '#ffffff'
        const r = contrastRatio(s.color, bg)
        if (r !== null && r < 4.5) bad.push(`${s.color} sur ${bg} = ${r}:1`)
      }
      return bad.length ? [f(this.id, this.severity, `${bad.length} declaration(s) sous 4,5:1 : ${[...new Set(bad)].slice(0, 3).join(' · ')}`, bad.length)] : []
    },
  },

  /* ---------------- Poids et clipping ---------------- */
  {
    id: 'WEIGHT-80K',
    title: 'Budget de poids depasse',
    severity: 'major',
    clients: ['gmail-web', 'gmail-ios'],
    veille: '§5, §6.2',
    why: "Gmail coupe a ~102 Ko. La signature, etant en fin de corps, est la première victime. Le poids de la signature déterminé directement le nombre d'allers-retours avant disparition.",
    fix: 'Rester sous 80 Ko. Chaque kilo-octet economise achete des allers-retours.',
    actionable: true,
    run(ctx) {
      return ctx.bytes > 80_000 ? [f(this.id, this.severity, `${(ctx.bytes / 1024).toFixed(1)} Ko, au-delà du budget de 80 Ko.`)] : []
    },
  },
  {
    id: 'GMAIL-SENDAS-10K',
    title: 'Plafond de 10 000 caractères (Gmail sendAs)',
    severity: 'major',
    clients: ['gmail-web'],
    veille: '§2.A, §4',
    why: "Le push sendAs de l'API Gmail est plafonné a 10 000 caractères.",
    fix: 'Reduire le HTML, ou renoncer au déploiement par sendAs.',
    actionable: true,
    run(ctx) {
      return ctx.chars > 10_000 ? [f(this.id, this.severity, `${ctx.chars} caractères : déploiement Gmail sendAs impossible (plafond 10 000).`)] : []
    },
  },

  /* ---------------- Conformité / vie privee ---------------- */
  {
    id: 'CNIL-TRACKER',
    title: 'Pixel de suivi ou redirection de liens',
    severity: 'critical',
    clients: ['*'],
    veille: '§7.3',
    why:
      "Deliberation CNIL n°2026-042 du 12 mars 2026 (publiee le 14 avril) : les pixels de suivi dans les emails sont des traceurs au sens de l'art. 82 de la loi Informatique et Libertes. Consentement préalable requis dès lors que la mesure sert des finalites marketing, statistiques ou de profilage. Le delai transitoire de trois mois est echu depuis le 14 juillet 2026. Exclaimer publie par ailleurs que la redirection de liens par domaine tiers est un signal de risque anti-spam.",
    fix: 'Retirer le pixel. Si la mesure est indispensable, elle doit reposer sur un consentement préalable documenté.',
    actionable: true,
    run(ctx) {
      const findings: Finding[] = []
      const pixels = ctx.tags.filter((t) => {
        if (t.name !== 'img' || t.closing) return false
        const w = parseInt(t.attrs.width ?? '99', 10)
        const h = parseInt(t.attrs.height ?? '99', 10)
        return (w <= 2 && h <= 2) || /\b(open|track|pixel|beacon|utm_|\/o\/|\/t\/)/i.test(t.attrs.src ?? '')
      })
      if (pixels.length) findings.push(f(this.id, 'critical', `${pixels.length} pixel(s) de suivi detecte(s).`, pixels.length, pixels[0].raw))
      const redirects = ctx.tags.filter(
        (t) => t.name === 'a' && !t.closing && /\b(click|track|r\.|link\.|redir|go\.)[a-z0-9.-]*\//i.test(t.attrs.href ?? ''),
      )
      if (redirects.length) findings.push(f(this.id, 'major', `${redirects.length} lien(s) passant par un domaine de redirection.`, redirects.length, redirects[0].raw))
      return findings
    },
  },

  /* ---------------- Accessibilite / socle ---------------- */
  {
    id: 'TABLE-PRESENTATION',
    title: 'Tableau de mise en page sans role="presentation"',
    severity: 'minor',
    clients: ['*'],
    veille: '§7.7',
    why: "Sans role=presentation, le lecteur d'écran annonce un tableau de données et lit les coordonnees de cellules.",
    fix: 'role="presentation" sur chaque table de mise en page.',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => t.name === 'table' && !t.closing && t.attrs.role !== 'presentation')
      return bad.length ? [f(this.id, this.severity, `${bad.length} table(s) sans role="presentation".`, bad.length)] : []
    },
  },
  {
    id: 'CLICKABLE-CONTACTS',
    title: 'Contacts non cliquables',
    severity: 'major',
    clients: ['*'],
    veille: '§6',
    why: "Le contrat porte sur des informations « lisibles ET cliquables ». Un numéro en texte brut sur mobile est une friction gratuite.",
    fix: 'tel: sur le téléphone (E.164, sans espaces), mailto: sur l\'email.',
    actionable: true,
    run(ctx) {
      const hrefs = ctx.tags.filter((t) => t.name === 'a' && !t.closing).map((t) => t.attrs.href ?? '')
      const out: Finding[] = []
      if (/\b0[1-9](?:[ .-]?\d{2}){4}\b|\+33/.test(ctx.text) && !hrefs.some((h) => h.startsWith('tel:')))
        out.push(f(this.id, this.severity, 'Un numéro de téléphone est présent mais aucun lien tel:.'))
      if (/@/.test(ctx.text) && !hrefs.some((h) => h.startsWith('mailto:')))
        out.push(f(this.id, this.severity, 'Une adresse email est présente mais aucun lien mailto:.'))
      return out
    },
  },
  {
    id: 'TEL-E164',
    title: 'Lien tel: non normalise',
    severity: 'minor',
    clients: ['*'],
    veille: '§6',
    why: 'Les espaces et points dans un href tel: cassent la composition sur plusieurs clients Android.',
    fix: 'tel:+33612345678, sans séparateur.',
    actionable: true,
    run(ctx) {
      const bad = ctx.tags.filter((t) => t.name === 'a' && !t.closing && /^tel:/i.test(t.attrs.href ?? '') && /[^\d+:tel]/i.test((t.attrs.href ?? '').replace(/^tel:/i, '')))
      return bad.length ? [f(this.id, this.severity, `${bad.length} lien(s) tel: contenant des séparateurs.`, bad.length, bad[0].raw)] : []
    },
  },
  {
    id: 'DISCLAIMER-NOISE',
    title: 'Disclaimer trop long',
    severity: 'minor',
    clients: ['*'],
    veille: '§10.6',
    why:
      "Le disclaimer juridique est juridiquement inopérant, occupe souvent plus de lignes que l'information utile, et est lu intégralement par les lecteurs d'écran à chaque message d'un fil. Il consomme aussi le budget d'octets qui protege du clipping Gmail.",
    fix: 'Le supprimer est le meilleur geste de design possible. A défaut, le ramener sous 40 mots.',
    actionable: true,
    run(ctx) {
      const m = /(confidentiel|confidential|destinataire|privileged|prive et confidentiel|ce message)/i.exec(ctx.text)
      if (!m) return []
      const tail = ctx.text.slice(m.index)
      const words = tail.split(/\s+/).filter(Boolean).length
      return words > 40 ? [f(this.id, this.severity, `Disclaimer d'environ ${words} mots, relu à chaque message du fil par les lecteurs d'écran.`, words, tail)] : []
    },
  },
  {
    id: 'DARK-LOGO-RISK',
    title: 'Logo a risque en mode sombre',
    severity: 'major',
    clients: ['outlook-win-word', 'gmail-ios'],
    veille: '§5',
    why:
      "Les clients à inversion totale (Outlook Windows, Office 365 Windows, Gmail iOS) n'offrent ni prefers-color-scheme ni data-ogsc. Un logo noir sur transparent devient invisible, point final.",
    fix: 'Fournir un PNG a fond blanc cuit, ou un logo dont le contraste tient dans les deux sens.',
    actionable: true,
    run(ctx) {
      const png = ctx.tags.filter((t) => t.name === 'img' && !t.closing && /\.(png|svg)(\?|$)/i.test(t.attrs.src ?? ''))
      return png.length
        ? [f(this.id, 'info', `${png.length} image(s) PNG/SVG potentiellement transparentes : vérifier le rendu après inversion totale (non detectable depuis le HTML seul).`, png.length)]
        : []
    },
  },
  {
    id: 'PREFERS-SCHEME-ILLUSION',
    title: 'Fausse sécurité du prefers-color-scheme',
    severity: 'info',
    clients: ['outlook-win-word', 'gmail-ios'],
    veille: '§5',
    why:
      "prefers-color-scheme et data-ogsc ne sont honores par AUCUN des trois clients à inversion totale. Un media query dark donne l'illusion d'avoir traite le sujet alors que le pire cas reste non cible.",
    fix: "Vérifier le socle APRES inversion plutôt que tenter de cibler. Voir le scenario « mode sombre à inversion totale » du simulateur.",
    actionable: false,
    run(ctx) {
      const hit = /prefers-color-scheme|data-ogsc/i.test(ctx.html)
      return hit ? [f(this.id, this.severity, 'Ciblage dark mode présent : sans effet sur Outlook Windows, Office 365 Windows et Gmail iOS.')] : []
    },
  },
  {
    id: 'FLOOR-IN-TEXT',
    title: 'Socle absent du texte réel',
    severity: 'critical',
    clients: ['*'],
    veille: '§6',
    why: "Si l'information n'existe qu'en image ou qu'en CSS, elle ne survit ni au blocage d'images, ni au lecteur d'écran, ni a l'alternative texte, ni au résumé par un assistant.",
    fix: 'Chaque information du socle doit exister en texte réel dans le HTML.',
    actionable: true,
    run(ctx) {
      const words = ctx.text.split(/\s+/).filter(Boolean).length
      return words < 5 ? [f(this.id, this.severity, `Seulement ${words} mot(s) de texte réel.`)] : []
    },
  },
  {
    id: 'AI-NOISE-RATIO',
    title: 'Ratio bruit/information pour les assistants',
    severity: 'info',
    clients: ['*'],
    veille: '§8.3',
    why:
      "Quand un fil de 15 messages est résumé par Copilot ou Gemini, la signature represente la majorite des tokens et zéro information. Le stripping de signature est une étape standard de preprocessing.",
    fix: 'Reduire le rapport octets HTML / mots utiles. Un socle court est aussi un socle bien résumé.',
    actionable: true,
    run(ctx) {
      const words = ctx.text.split(/\s+/).filter(Boolean).length || 1
      const ratio = Math.round(ctx.bytes / words)
      return ratio > 400 ? [f(this.id, this.severity, `${ratio} octets de HTML par mot utile. Au-dela de 400, la signature est majoritairement du bruit.`, ratio)] : []
    },
  },
  {
    id: 'NESTING-DEPTH',
    title: 'Imbrication de tableaux excessive',
    severity: 'minor',
    clients: ['outlook-win-word'],
    veille: '§5',
    why: 'Chaque niveau est un point de resérialisation supplementaire par Word, qui ressort le HTML crible de mso-*.',
    fix: 'Rester a trois niveaux de tableaux maximum.',
    actionable: true,
    run(ctx) {
      let depth = 0
      let max = 0
      for (const t of ctx.tags) {
        if (t.name !== 'table') continue
        if (t.closing) depth = Math.max(0, depth - 1)
        else max = Math.max(max, ++depth)
      }
      return max > 3 ? [f(this.id, this.severity, `Profondeur d'imbrication de ${max} tableaux.`, max)] : []
    },
  },
  {
    id: 'EMPTY-VAR',
    title: 'Variable de fusion non resolue',
    severity: 'critical',
    clients: ['*'],
    veille: '§2.C',
    why:
      "Microsoft le documente : « Rules skip lines that contain variables they can't update ». Une ligne dont l'attribut annuaire est vide est purement sautée, SILENCIEUSEMENT. Si cette ligne portait une mention légale, la signature est non conforme sans que personne ne le sache.",
    fix: 'Aucune variable sans valeur de repli déclarée. Voir le module QA annuaire.',
    actionable: true,
    run(ctx) {
      const hits = [...ctx.html.matchAll(/(\{\{[^}]+\}\}|%%[A-Za-z]+%%|\$\{[^}]+\}|%[A-Za-z]+%)/g)].map((m) => m[0])
      return hits.length ? [f(this.id, this.severity, `${hits.length} variable(s) non resolue(s) : ${[...new Set(hits)].slice(0, 4).join(', ')}`, hits.length)] : []
    },
  },
]

export interface LintReport {
  findings: Array<Finding & { rule: Rule }>
  score: { critical: number; major: number; minor: number; info: number }
  /** Findings sur lesquels un correctif émetteur existe. */
  actionable: number
  /** Findings a documenter au client faute de correctif émetteur (§7.4). */
  toDocument: number
  bytes: number
  chars: number
}

export function lint(html: string): LintReport {
  const ctx: LintContext = {
    html,
    tags: scanTags(html),
    styleBlocks: extractStyleBlocks(html),
    text: extractText(html),
    bytes: byteLength(html),
    chars: html.length,
  }
  const findings: Array<Finding & { rule: Rule }> = []
  for (const rule of RULES) {
    for (const finding of rule.run(ctx)) findings.push({ ...finding, rule })
  }
  const order: Severity[] = ['critical', 'major', 'minor', 'info']
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))
  const score = { critical: 0, major: 0, minor: 0, info: 0 }
  for (const f of findings) score[f.severity]++
  return {
    findings,
    score,
    actionable: findings.filter((f) => f.rule.actionable).length,
    toDocument: findings.filter((f) => !f.rule.actionable).length,
    bytes: ctx.bytes,
    chars: ctx.chars,
  }
}
