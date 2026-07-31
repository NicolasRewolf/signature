/**
 * Socle — modèle de données.
 *
 * Principe directeur, tire de la veille §6 :
 *   « Ce qui n'est jamais garantissable : la même signature partout.
 *     Ce qui l'est : la même information partout. »
 *
 * Le modèle est donc organise autour du SOCLE (floor) : la liste finie
 * d'informations qui doivent rester lisibles ET cliquables quel que soit
 * le client de lecture, le mode sombre, le clipping ou le rang dans le fil.
 * Tout le reste (logo, couleurs, bandeau, disclaimer) est de la decoration
 * négociable, et le compilateur la traite comme telle.
 */

export type Severity = 'critical' | 'major' | 'minor' | 'info'

/* ------------------------------------------------------------------ *
 * Le socle
 * ------------------------------------------------------------------ */

export type FloorKind = 'text' | 'tel' | 'mailto' | 'url'

export interface FloorItem {
  /** Identifiant stable, utilise dans la matrice du contrat. */
  key: string
  /** Libellé humain, affiche dans l'attestation. */
  label: string
  /** Valeur brute, non echappee. */
  value: string
  kind: FloorKind
  /**
   * true => l'élément doit rester *cliquable*, pas seulement lisible.
   * La veille §6 formule le contrat ainsi : « ces cinq informations
   * restent lisibles et cliquables ».
   */
  mustBeClickable: boolean
}

/** Construit le href défensif d'un item de socle. */
export function floorHref(item: FloorItem): string | undefined {
  switch (item.kind) {
    case 'tel':
      // tel: doit être en E.164 sans espaces : Outlook et iOS sont
      // tolerants, Gmail Android beaucoup moins.
      return 'tel:' + item.value.replace(/[^\d+]/g, '')
    case 'mailto':
      return 'mailto:' + item.value.trim()
    case 'url':
      return /^https?:\/\//i.test(item.value) ? item.value : 'https://' + item.value
    default:
      return undefined
  }
}

/* ------------------------------------------------------------------ *
 * Organisation, personne, marque
 * ------------------------------------------------------------------ */

export interface Org {
  id: string
  name: string
  /** Entité juridique. §7.1 : son absence fait sauter la mention légale. */
  legalEntity?: string
  /** Pays de rattachement — pilote les packs réglementaires (§8.4). */
  country: 'FR' | 'DE' | 'BE' | 'CH' | 'LU' | 'OTHER'
  siret?: string
  rcs?: string
  /** Allemagne : §35a GmbHG / §37a HGB. */
  handelsregister?: { court: string; number: string; managers: string[] }
}

export interface Person {
  id: string
  firstName: string
  lastName: string
  jobTitle?: string
  department?: string
  email: string
  phone?: string
  mobile?: string
  /** URL canonique : site, page profil, page equipe. */
  url?: string
  /** Profession réglementée eventuelle (§8.4). */
  profession?: ProfessionId
  /** Valeurs des mentions réglementées, indexees par champ du pack. */
  professionFields?: Record<string, string>
  /** Attributs annuaire bruts (Entra ID, Lucca, PayFit, Silae...). */
  raw?: Record<string, string>
}

export interface LogoAsset {
  /** URL absolue https, versionnée. §2.A : le fournisseur qui bouge ses
   *  images casse rétroactivement tout le parc installe. */
  src: string
  /** Largeur d'affichage en px CSS. */
  width: number
  height: number
  alt: string
  /**
   * Comportement en mode sombre à inversion totale (§5).
   * - 'opaque-light'  : fond blanc cuit dans l'image -> survit a l'inversion
   * - 'ink-on-transparent' : encre sombre sur transparent -> DISPARAIT
   * - 'light-on-transparent' : encre claire sur transparent -> illisible en clair
   */
  darkBehaviour: 'opaque-light' | 'ink-on-transparent' | 'light-on-transparent'
  /** Largeur intrinseque du fichier, pour la règle des 65x (§5). */
  intrinsicWidth?: number
  /** Poids du fichier en octets, si connu (budget §6.2 : < 80 Ko total). */
  bytes?: number
}

export interface Brand {
  /** Couleurs en hexadécimal uniquement. La syntaxe rgb(255 0 0) fait
   *  supprimer par Gmail le bloc <style> entier (§5). */
  ink: string
  muted: string
  accent: string
  rule: string
  /**
   * Pile de polices système. Aucune webfont : Outlook retombe sur
   * Times New Roman et detruit même le fallback (§6.2).
   */
  fontStack: string
  baseSize: number
  lineHeight: number
}

export const DEFAULT_BRAND: Brand = {
  ink: '#111827',
  muted: '#4b5563',
  accent: '#1d4ed8',
  rule: '#d1d5db',
  fontStack: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  baseSize: 13,
  lineHeight: 18,
}

/* ------------------------------------------------------------------ *
 * Bloc légal
 * ------------------------------------------------------------------ */

export interface LegalBlock {
  /**
   * Mentions réglementées issues du pack profession (§8.4).
   * Non supprimables : c'est le budget non discretionnaire du marché.
   */
  regulated: string[]
  /**
   * Disclaimer de confidentialite. §10.6 : juridiquement inopérant,
   * plus long que l'information utile, et lu intégralement par les
   * lecteurs d'écran à chaque message d'un fil.
   */
  disclaimer?: string
  /** Mention RGPD / DPO eventuelle. */
  privacy?: string
}

/* ------------------------------------------------------------------ *
 * Mise en page
 * ------------------------------------------------------------------ */

export interface LayoutOptions {
  /** 'stack' = une colonne (le plus robuste). 'aside' = logo a gauche. */
  variant: 'stack' | 'aside'
  /** Largeur maximale en px. Outlook ignore max-width : on fixe width. */
  width: number
  /** Filet séparateur : cellule coloree, jamais une image 1px étirée (§5). */
  showRule: boolean
  /** Encode les caractères non-ASCII en entités numériques. */
  entityEncode: boolean
  /** Emet le bloc OfficeDocumentSettings 96 dpi (§6.2). */
  msoDpiFix: boolean
  /**
   * Bandeau marketing. Interdit par défaut : pixel de suivi et
   * redirection de liens = traceurs au sens CNIL 2026-042 (§7.3),
   * et signal de risque anti-spam publie par Exclaimer lui-même.
   */
  banner?: { src: string; href: string; width: number; height: number; alt: string }
}

export const DEFAULT_LAYOUT: LayoutOptions = {
  variant: 'aside',
  width: 480,
  showRule: true,
  entityEncode: true,
  msoDpiFix: true,
}

/* ------------------------------------------------------------------ *
 * Source de signature + versionnement (§7.2)
 * ------------------------------------------------------------------ */

export type ReviewState =
  | 'draft'
  | 'review_brand'
  | 'review_legal'
  | 'approved'
  | 'published'
  | 'superseded'
  | 'rolled_back'

export interface AuditEntry {
  at: string
  actor: string
  from: ReviewState
  to: ReviewState
  note?: string
}

export interface SignatureSource {
  id: string
  name: string
  version: number
  state: ReviewState
  audit: AuditEntry[]
  org: Org
  person: Person
  brand: Brand
  layout: LayoutOptions
  legal: LegalBlock
  logo?: LogoAsset
  /** Socle explicite. Si absent, deduit de person/org par deriveFloor(). */
  floor?: FloorItem[]
}

/**
 * Deduit le socle par défaut : cinq informations, dont trois cliquables.
 * C'est volontairement court — la veille §6 fixe le contrat sur « ces cinq
 * informations », pas sur la signature entière.
 */
export function deriveFloor(src: Pick<SignatureSource, 'person' | 'org'>): FloorItem[] {
  const { person, org } = src
  const items: FloorItem[] = []
  const fullName = `${person.firstName} ${person.lastName}`.trim()

  items.push({
    key: 'identité',
    label: 'Identité',
    value: person.jobTitle ? `${fullName} — ${person.jobTitle}` : fullName,
    kind: 'text',
    mustBeClickable: false,
  })
  // Le séparateur doit être IDENTIQUE a celui du compilateur : le contrat se
  // vérifié en cherchant la valeur du socle dans le rendu dégradé, donc les
  // deux doivent produire la même chaine. C'est la seule source de vérité.
  items.push({
    key: 'organisation',
    label: 'Organisation',
    value: org.legalEntity ? `${org.name} — ${org.legalEntity}` : org.name,
    kind: 'text',
    mustBeClickable: false,
  })
  const tel = person.mobile || person.phone
  if (tel) {
    items.push({ key: 'téléphone', label: 'Téléphone', value: tel, kind: 'tel', mustBeClickable: true })
  }
  items.push({ key: 'email', label: 'Email', value: person.email, kind: 'mailto', mustBeClickable: true })
  if (person.url) {
    items.push({ key: 'lien', label: 'Lien canonique', value: person.url, kind: 'url', mustBeClickable: true })
  }
  return items
}

export type ProfessionId =
  | 'avocat'
  | 'notaire'
  | 'commissaire_justice'
  | 'expert_comptable'
  | 'architecte'
  | 'agent_immobilier'
  | 'courtier_orias'
  | 'gmbh_de'
  | 'none'
