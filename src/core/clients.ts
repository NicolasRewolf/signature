/**
 * Matrice de capacites des clients de LECTURE + registre des regressions.
 *
 * Ancrage veille §6 — c'est le point aveugle du marché entier :
 *   « On choisit le rendu au moment de l'ECRITURE, alors que la casse depend
 *     du client de LECTURE. »
 *
 * Conséquence de conception : cette matrice ne decrit jamais l'outil
 * d'envoi. Elle decrit ce que le destinataire va reellement recevoir.
 */

export type DarkRegime =
  /** Inversion totale, non ciblable : ni prefers-color-scheme ni data-ogsc (§5). */
  | 'forced-invert'
  /** Le client applique un theme mais expose un point d'accroche CSS. */
  | 'targetable'
  /** Pas d'inversion notable. */
  | 'none'

export interface ClientProfile {
  id: string
  label: string
  family: 'outlook' | 'gmail' | 'apple' | 'other'
  /** Moteur de rendu. 'word' = Outlook Windows : ce n'est pas un navigateur. */
  engine: 'word' | 'webkit' | 'blink' | 'gecko' | 'proprietary'
  /** Honore un bloc <style> dans le <head> ? */
  styleTag: boolean
  borderRadius: boolean
  backgroundImage: boolean
  maxWidth: boolean
  /** padding sur autre chose qu'une cellule de tableau. */
  paddingOnBlock: boolean
  flexOrGrid: boolean
  webfont: boolean
  darkRegime: DarkRegime
  /** Tronque le corps au-delà de N octets (0 = pas de clipping). */
  clipBytes: number
  /** Notes sourcees depuis la veille. */
  notes: string[]
  veille: string
}

export const CLIENT_PROFILES: ClientProfile[] = [
  {
    id: 'outlook-win-word',
    label: 'Outlook Windows (2016 → 365)',
    family: 'outlook',
    engine: 'word',
    styleTag: true,
    borderRadius: false,
    backgroundImage: false,
    maxWidth: false,
    paddingOnBlock: false,
    flexOrGrid: false,
    webfont: false,
    darkRegime: 'forced-invert',
    clipBytes: 0,
    notes: [
      "div/p/span sans effet utile : Word les classe COREEXTENDED, width et padding y sont ignores.",
      'border-radius, background-image, position, float, max-width, overflow, z-index non supportes.',
      'padding uniquement sur les cellules.',
      'DPI scaling : images floues ou geantes en 120/144 dpi sans le bloc OfficeDocumentSettings 96 dpi.',
      "Recompression des images a 220 PPI à l'envoi, corrigeable uniquement par GPO sur le poste — hors de portee de tout SaaS.",
      "Impossible d'étirer une image au-delà de 65x sa largeur intrinseque : casse tous les filets séparateurs 1px.",
      'Outlook 365 build 2505 (2025) se met a ignorer le CSS sur des emails intacts.',
    ],
    veille: '§5',
  },
  {
    id: 'outlook-com',
    label: 'Outlook.com / New Outlook (web)',
    family: 'outlook',
    engine: 'blink',
    styleTag: false,
    borderRadius: true,
    backgroundImage: true,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: false,
    webfont: false,
    darkRegime: 'targetable',
    clipBytes: 0,
    notes: [
      'Supprime les <style> du <head> depuis juin 2024 — tout CSS non inline est perdu.',
      "La nouvelle version d'Outlook n'offre plus « afficher la source » pour diagnostiquer.",
    ],
    veille: '§5',
  },
  {
    id: 'owa',
    label: 'Outlook Web App (OWA, entreprise)',
    family: 'outlook',
    engine: 'blink',
    styleTag: false,
    borderRadius: true,
    backgroundImage: true,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: false,
    webfont: false,
    darkRegime: 'targetable',
    clipBytes: 0,
    notes: [
      'Bug de collage supprimant width/height des images : apparu mi-mai 2024, corrige le 11 juin, regresse le 12, re-corrige debut juillet. Aucune communication Microsoft.',
    ],
    veille: '§5',
  },
  {
    id: 'gmail-web',
    label: 'Gmail (web)',
    family: 'gmail',
    engine: 'blink',
    styleTag: true,
    borderRadius: true,
    backgroundImage: true,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: true,
    webfont: false,
    darkRegime: 'targetable',
    clipBytes: 102_400,
    notes: [
      'Coupe le corps a ~102 Ko. La signature, en fin de corps, est la première victime.',
      "Une seule couleur ecrite en syntaxe rgb(255 0 0) fait supprimer le bloc <style> entier.",
      'Replie la signature derriere « Afficher le contenu tronque » dans un fil : livree, conforme, et personne ne la voit.',
      'Proxifie et cache les images depuis 2013.',
    ],
    veille: '§5, §2.E',
  },
  {
    id: 'gmail-ios',
    label: 'Gmail app (iOS)',
    family: 'gmail',
    engine: 'webkit',
    styleTag: true,
    borderRadius: true,
    backgroundImage: false,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: true,
    webfont: false,
    darkRegime: 'forced-invert',
    clipBytes: 102_400,
    notes: [
      "Inversion totale sans prefers-color-scheme ni data-ogsc : un logo noir sur transparent devient invisible, point final.",
    ],
    veille: '§5',
  },
  {
    id: 'apple-mail-macos',
    label: 'Apple Mail (macOS)',
    family: 'apple',
    engine: 'webkit',
    styleTag: true,
    borderRadius: true,
    backgroundImage: true,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: true,
    webfont: true,
    darkRegime: 'targetable',
    clipBytes: 0,
    notes: [
      'Mail Privacy Protection precharge toutes les images depuis 2021 : toute mesure de « vu » y est fausse.',
      "Aucun payload MDM Apple ne contient de cle de signature, sur aucune plateforme : impossible a pousser.",
    ],
    veille: '§2.E, §6',
  },
  {
    id: 'apple-mail-ios',
    label: 'Apple Mail (iOS)',
    family: 'apple',
    engine: 'webkit',
    styleTag: true,
    borderRadius: true,
    backgroundImage: true,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: true,
    webfont: true,
    darkRegime: 'targetable',
    clipBytes: 0,
    notes: ['Signature mobile residuelle « Envoye de mon iPhone » : aucun levier admin ne permet de la purger.'],
    veille: '§7.5',
  },
  {
    id: 'yahoo',
    label: 'Yahoo Mail',
    family: 'other',
    engine: 'blink',
    styleTag: true,
    borderRadius: true,
    backgroundImage: true,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: true,
    webfont: false,
    darkRegime: 'targetable',
    clipBytes: 0,
    notes: ["Retourne la parade du blanc #fffffe en vert olive #989800."],
    veille: '§5',
  },
  {
    id: 'thunderbird',
    label: 'Thunderbird',
    family: 'other',
    engine: 'gecko',
    styleTag: true,
    borderRadius: true,
    backgroundImage: true,
    maxWidth: true,
    paddingOnBlock: true,
    flexOrGrid: true,
    webfont: false,
    darkRegime: 'none',
    clipBytes: 0,
    notes: ["Jamais couvert par l'add-in Office.js (§2.B)."],
    veille: '§2.B',
  },
]

export function getClient(id: string): ClientProfile | undefined {
  return CLIENT_PROFILES.find((c) => c.id === id)
}

/* ------------------------------------------------------------------ *
 * Registre des regressions éditeurs (§5, §7.4)
 * ------------------------------------------------------------------ */

export interface Regression {
  id: string
  date: string
  client: string
  title: string
  détail: string
  /** Existe-t-il un correctif côté EMETTEUR ? */
  emitterFix: 'yes' | 'partial' | 'none'
  /** Règles du linter declenchees par cette regression. */
  linkedRules: string[]
  status: 'open' | 'fixed' | 'regressed'
  veille: string
}

/**
 * Seed du registre. Toutes les entrees proviennent de la veille §5 et §2.A.
 *
 * Objection de fond a garder en tete (§7.4) : « les regressions citees sont
 * des regressions de clients de LECTURE — si Outlook 2505 ignore le <style>,
 * il l'ignore pour tout le monde, et le correctif côté émetteur n'existe pas.
 * On produit des alertes sans correctif associe. »
 * D'ou le champ emitterFix : le registre distingue explicitement ce sur quoi
 * on peut agir de ce qu'on ne peut que constater.
 */
export const REGRESSIONS: Regression[] = [
  {
    id: 'REG-2024-05-OWA-PASTE',
    date: '2024-05-15',
    client: 'owa',
    title: 'OWA supprime width/height des images au collage',
    détail:
      'Apparu mi-mai 2024, corrige le 11 juin, regresse le 12, re-corrige debut juillet. Aucune communication Microsoft.',
    emitterFix: 'partial',
    linkedRules: ['IMG-DIM'],
    status: 'fixed',
    veille: '§5',
  },
  {
    id: 'REG-2024-06-OUTLOOKCOM-STYLE',
    date: '2024-06-01',
    client: 'outlook-com',
    title: 'Outlook.com supprime les <style> du <head>',
    détail: 'Tout CSS non inline est perdu. Le correctif émetteur existe : ne jamais dépendre d’un bloc <style>.',
    emitterFix: 'yes',
    linkedRules: ['NO-STYLE-TAG', 'INLINE-ONLY'],
    status: 'open',
    veille: '§5',
  },
  {
    id: 'REG-2025-OUTLOOK-2505',
    date: '2025-06-01',
    client: 'outlook-win-word',
    title: 'Outlook 365 build 2505 ignore le CSS sur des emails intacts',
    détail:
      "Regression côté lecture. Aucun correctif émetteur. La nouvelle version d'Outlook n'offre même plus « afficher la source » pour diagnostiquer.",
    emitterFix: 'none',
    linkedRules: [],
    status: 'open',
    veille: '§5',
  },
  {
    id: 'REG-2026-05-REDCROSS',
    date: '2026-05-01',
    client: 'outlook-win-word',
    title: 'Croix rouge sur toutes les images de signature (build 16.0.19929.20162)',
    détail: 'Non corrigée un mois plus tard. Aucun correctif émetteur : seule mitigation, un socle qui survit sans images.',
    emitterFix: 'none',
    linkedRules: ['IMG-ONLY', 'FLOOR-IN-TEXT'],
    status: 'open',
    veille: '§5',
  },
  {
    id: 'REG-GMAIL-RGB-SYNTAX',
    date: '2024-01-01',
    client: 'gmail-web',
    title: 'Syntaxe rgb(255 0 0) : Gmail supprime le bloc <style> entier',
    détail: "Une seule couleur en syntaxe espace fait tomber tout le CSS. Correctif émetteur direct : hexadécimal uniquement.",
    emitterFix: 'yes',
    linkedRules: ['HEX-ONLY'],
    status: 'open',
    veille: '§5',
  },
  {
    id: 'REG-2026-01-MAILSIG-ASSETS',
    date: '2026-01-09',
    client: '*',
    title: 'mail-signatures.com deplace ses images et casse rétroactivement tout le parc',
    détail:
      "Toute signature générée avant le 9 janvier 2026 doit être regeneree. Le fournisseur gratuit est lui-même un facteur d'instabilite.",
    emitterFix: 'yes',
    linkedRules: ['IMG-SELF-HOSTED'],
    status: 'open',
    veille: '§2.A',
  },
]
