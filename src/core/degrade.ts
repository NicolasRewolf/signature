/**
 * Simulateur de dégradation.
 *
 * Ancrage veille §6, le point aveugle du marché entier :
 *   « On choisit le rendu au moment de l'ECRITURE, alors que la casse depend
 *     du client de LECTURE. Tu ne controles ni le client du destinataire, ni
 *     les passerelles anti-spam intermediaires, ni les mises à jour d'Outlook. »
 *
 * Conséquence : on ne teste pas « est-ce que ma signature est belle ». On teste
 * « est-ce que ces N informations restent lisibles et cliquables quand tout se
 * passe mal ». Chaque scenario ci-dessous correspond a un mode de rupture
 * documenté dans la veille, et repond a une seule question binaire par
 * information du socle.
 *
 * Les scenarios sont des APPROXIMATIONS déterministes, pas des rendus réels.
 * Ils ne remplacent pas un test Litmus / Email on Acid — la veille §7.4 rappelle
 * d'ailleurs que ce test ponctuel existe déjà et qu'il est gratuit. Leur intérêt
 * est ailleurs : ils sont reproductibles, versionnables, et ils produisent une
 * matrice opposable plutôt qu'une capture d'écran.
 */

import type { CompiledSignature } from './compile.ts'
import { estimateGmailClipping } from './compile.ts'
import { extractText, invertHex, contrastRatio, parseStyle, scanTags } from './html.ts'
import { floorHref, type FloorItem } from './model.ts'

export type DeploymentMode = 'server-side' | 'client-side' | 'combo'

export interface DegradeInput {
  compiled: CompiledSignature
  deployment: DeploymentMode
}

export type FloorVerdict = 'ok' | 'degraded' | 'lost'

export interface FloorStatus {
  key: string
  label: string
  readable: FloorVerdict
  clickable: FloorVerdict | 'n/a'
  note?: string
}

export interface ScenarioResult {
  id: string
  label: string
  veille: string
  /** Peut-on faire quelque chose côté émetteur ? */
  mitigable: 'yes' | 'partial' | 'no'
  /** Ce qu'on fait — ou pourquoi on ne peut rien faire. */
  mitigation: string
  floor: FloorStatus[]
  notes: string[]
  /** Aperçu HTML dégradé, quand la simulation en produit un. */
  preview?: string
  previewText?: string
}

/* ------------------------------------------------------------------ *
 * Aides
 * ------------------------------------------------------------------ */

/**
 * Comparaison au niveau de l'INFORMATION, pas de la chaine.
 *
 * C'est la traduction technique de « la même information partout » (§6) :
 * on se moque de la ponctuation, de la casse, des accents, des séparateurs
 * et des retours a la ligne — ce qui compte est de savoir si l'information
 * est encore la. Un numéro de téléphone reste le même numéro qu'il soit
 * ecrit « +33 6 12 34 56 78 » ou « +33612345678 ».
 */
function textContains(text: string, value: string): boolean {
  const norm = (s: string) =>
    s
            .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9+@]/gi, '')
      .toLowerCase()
  return norm(text).includes(norm(value))
}

function hrefPresent(html: string, item: FloorItem): boolean {
  const href = floorHref(item)
  if (!href) return false
  const norm = (s: string) => s.replace(/\s/g, '').toLowerCase()
  return scanTags(html).some((t) => t.name === 'a' && !t.closing && norm(t.attrs.href ?? '') === norm(href))
}

function baseStatus(html: string, text: string, floor: FloorItem[]): FloorStatus[] {
  return floor.map((item) => ({
    key: item.key,
    label: item.label,
    readable: textContains(text, item.value) ? 'ok' : 'lost',
    clickable: item.mustBeClickable ? (hrefPresent(html, item) ? 'ok' : 'lost') : 'n/a',
  }))
}

/** Remplace chaque <img> par son alt, comme le fait un client qui bloque les images. */
function stripImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = /alt\s*=\s*"([^"]*)"/i.exec(tag)?.[1] ?? ''
    return alt ? `<span>${alt}</span>` : ''
  })
}

/** Inverse toutes les couleurs hexadécimales des styles inline. */
function invertColors(html: string): string {
  return html.replace(/#[0-9a-fA-F]{6}\b/g, (h) => invertHex(h))
}

/** Retire les propriétés que le moteur Word ignore, et neutralise les div de mise en page. */
function applyWordEngine(html: string): string {
  const drop = /(border-radius|background-image|position|float|max-width|min-width|overflow|z-index|box-shadow|transform|display\s*:\s*(flex|grid)|gap)\s*:[^;"]*;?/gi
  let out = html.replace(/style\s*=\s*"([^"]*)"/gi, (_m, s: string) => `style="${s.replace(drop, '')}"`)
  // Sur un div/p/span, Word ignore width et padding (COREEXTENDED).
  out = out.replace(/<(div|p|span|section|article)\b([^>]*)>/gi, (m, tag: string, attrs: string) => {
    const cleaned = attrs.replace(/style\s*=\s*"([^"]*)"/i, (_x, s: string) =>
      `style="${s.replace(/(width|padding[a-z-]*)\s*:[^;"]*;?/gi, '')}"`,
    )
    return `<${tag}${cleaned}>`
  })
  return out
}

function stripStyleBlocks(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
}

/* ------------------------------------------------------------------ *
 * Scenarios
 * ------------------------------------------------------------------ */

export function runScenarios(input: DegradeInput): ScenarioResult[] {
  const { compiled, deployment } = input
  const floor = compiled.floor
  const out: ScenarioResult[] = []

  /* --- S1 : images bloquées -------------------------------------- */
  {
    const html = stripImages(compiled.html)
    const status = baseStatus(html, extractText(html), floor)
    out.push({
      id: 'images-blocked',
      label: 'Images bloquées ou cassées',
      veille: '§2.A, §5',
      mitigable: 'yes',
      mitigation:
        "Le socle existe en texte réel, pas en image. C'est aussi la seule parade a la croix rouge du build 16.0.19929.20162 (mai 2026), non corrigée et sans correctif émetteur.",
      floor: status,
      notes: [
        "Un logo perdu n'est pas une information perdue tant qu'il ne porte pas le nom de l'organisation.",
        'Canva ne produit qu\'une image : dans ce scenario, une signature Canva est vide.',
      ],
      preview: html,
    })
  }

  /* --- S2 : mode sombre à inversion totale ------------------------ */
  {
    const html = invertColors(compiled.html)
    const status = baseStatus(html, extractText(html), floor)
    const notes: string[] = [
      "Clients concernes : Outlook Windows, Office 365 Windows, Gmail iOS. Aucun n'offre prefers-color-scheme ni data-ogsc : le ciblage est impossible, seule la vérification après inversion a un sens.",
    ]
    // Contraste après inversion sur fond sombre.
    for (const t of scanTags(compiled.html)) {
      const s = parseStyle(t.attrs.style)
      if (!s.color) continue
      const r = contrastRatio(invertHex(s.color), '#1b1b1b')
      if (r !== null && r < 4.5) {
        notes.push(`Couleur ${s.color} → ${invertHex(s.color)} après inversion : ${r}:1 sur fond sombre, sous le seuil.`)
        const idx = status.findIndex((f) => f.readable === 'ok')
        if (idx >= 0) status[idx].readable = 'degraded'
        break
      }
    }
    out.push({
      id: 'dark-forced-invert',
      label: 'Mode sombre à inversion totale',
      veille: '§5',
      mitigable: 'partial',
      mitigation:
        "On ne peut pas cibler ces clients. On peut choisir des couleurs dont le contraste tient dans les deux sens, et proscrire la parade #fffffe que Yahoo rend en vert olive #989800.",
      floor: status,
      notes,
      preview: `<div style="background:#1b1b1b;padding:16px;">${html}</div>`,
    })
  }

  /* --- S3 : clipping Gmail après N allers-retours ----------------- */
  {
    const est = estimateGmailClipping(compiled.bytes)
    const status: FloorStatus[] = floor.map((item) => ({
      key: item.key,
      label: item.label,
      readable: 'lost',
      clickable: item.mustBeClickable ? 'lost' : 'n/a',
      note: `Disparaît à partir du ${est.rounds + 1}e aller-retour`,
    }))
    out.push({
      id: 'gmail-clip-thread',
      label: `Clipping Gmail (au-delà de ~${est.rounds} allers-retours)`,
      veille: '§5',
      mitigable: 'partial',
      mitigation:
        `Aucun correctif : Gmail coupe a ~102 Ko et la signature, en fin de corps, est la première victime. Le seul levier est le poids. Modèle : ${est.assumptions}. A ${(compiled.bytes / 1024).toFixed(1)} Ko, environ ${est.rounds} allers-retours avant disparition.`,
      floor: status,
      notes: [
        'Le français y arrive plus vite que l\'anglais : en quoted-printable un « e accent aigu » pese trois octets.',
        'Avant même la troncature, Gmail replie la signature derriere « Afficher le contenu tronque » dans un fil : elle est livree, conforme, et personne ne la voit.',
        'MODELE, PAS MESURE. Recalibrer sur un vrai fil client avant d\'en faire un argument commercial.',
      ],
    })
  }

  /* --- S4 : moteur Word ------------------------------------------- */
  {
    const html = applyWordEngine(compiled.html)
    const status = baseStatus(html, extractText(html), floor)
    out.push({
      id: 'word-engine',
      label: 'Outlook Windows (moteur Word)',
      veille: '§5',
      mitigable: 'yes',
      mitigation:
        'Tables uniquement, padding sur cellules, filet en cellule coloree, dimensions doublees sur les images, bloc OfficeDocumentSettings 96 dpi. Le compilateur applique ces contraintes par construction.',
      floor: status,
      notes: [
        "Outlook Windows n'est pas un navigateur, c'est Word.",
        "La recompression des images a 220 PPI n'est corrigeable que par GPO sur le poste : hors de portee de tout SaaS.",
        'Le build 2505 (2025) ignore le CSS sur des emails intacts — regression de lecture, sans correctif émetteur.',
      ],
      preview: html,
    })
  }

  /* --- S5 : bloc <style> supprime --------------------------------- */
  {
    const html = stripStyleBlocks(compiled.html)
    const status = baseStatus(html, extractText(html), floor)
    out.push({
      id: 'style-stripped',
      label: 'Bloc <style> supprime',
      veille: '§5',
      mitigable: 'yes',
      mitigation: 'Tout le CSS est inline. Aucune règle ne depend d\'un bloc <style>.',
      floor: status,
      notes: [
        'Outlook.com supprime les <style> du <head> depuis juin 2024.',
        'Gmail supprime le bloc entier si une seule couleur est ecrite en syntaxe rgb(255 0 0).',
      ],
      preview: html,
    })
  }

  /* --- S6 : alternative texte brut -------------------------------- */
  {
    const text = compiled.text
    const status: FloorStatus[] = floor.map((item) => ({
      key: item.key,
      label: item.label,
      readable: textContains(text, item.value) ? 'ok' : 'lost',
      clickable: item.mustBeClickable ? 'degraded' : 'n/a',
      note: item.mustBeClickable ? 'Cliquable seulement via autolink du client' : undefined,
    }))
    out.push({
      id: 'plain-text',
      label: 'Lecture en texte brut',
      veille: '§6',
      mitigable: 'yes',
      mitigation:
        "Le compilateur emet une alternative text/plain qui porte le socle. C'est le dernier filet : passerelles anti-spam, clients en mode texte, archivage.",
      floor: status,
      notes: ['La plupart des clients autolinkent email et URL. Le téléphone, beaucoup moins.'],
      previewText: text,
    })
  }

  /* --- S7 : lecteur d'écran --------------------------------------- */
  {
    const text = extractText(compiled.html)
    const words = text.split(/\s+/).filter(Boolean).length
    const status = baseStatus(compiled.html, text, floor)
    const notes = [
      `Ordre de lecture linearise, ${words} mots annonces à chaque message du fil.`,
    ]
    if (words > 60) {
      notes.push(
        "Au-dela d'une soixantaine de mots, la signature devient le contenu dominant relu à chaque message. Le disclaimer juridique est le premier candidat a la suppression : il est juridiquement inopérant.",
      )
    }
    out.push({
      id: 'screen-reader',
      label: "Lecteur d'écran",
      veille: '§7.7, §10.6',
      mitigable: 'yes',
      mitigation:
        "role=presentation sur les tables de mise en page, alt sur les images, contraste des mentions au-dessus de 4,5:1, et surtout : brievete.",
      floor: status,
      notes,
      previewText: text,
    })
  }

  /* --- S8 : envoi programmatique ---------------------------------- */
  {
    const covered = deployment !== 'client-side'
    const status: FloorStatus[] = floor.map((item) => ({
      key: item.key,
      label: item.label,
      readable: covered ? 'ok' : 'lost',
      clickable: item.mustBeClickable ? (covered ? 'ok' : 'lost') : 'n/a',
    }))
    out.push({
      id: 'programmatic-send',
      label: 'Envoi programmatique (Graph sendMail, CRM, agent IA)',
      veille: '§2.B, §8.3',
      mitigable: covered ? 'yes' : 'no',
      mitigation: covered
        ? "Le mode server-side estampille aussi les envois programmatiques. L'IA renforce cet avantage structurel au lieu de l'eroder."
        : "En client-side pur, rien de tout cela ne passe par l'add-in : brouillon généré par un agent, réponse via Graph sendMail, CRM, SDR automatise, Zapier. C'est le trou le plus sous-estime du marché, et il grandit.",
      floor: status,
      notes: [
        'Souvent les envois les plus exposes commercialement : relances, devis, factures.',
      ],
    })
  }

  /* --- S9 : mobile hors famille Outlook --------------------------- */
  {
    const covered = deployment !== 'client-side'
    const status: FloorStatus[] = floor.map((item) => ({
      key: item.key,
      label: item.label,
      readable: covered ? 'ok' : 'lost',
      clickable: item.mustBeClickable ? (covered ? 'ok' : 'lost') : 'n/a',
    }))
    out.push({
      id: 'mobile-non-outlook',
      label: 'Mobile hors famille Outlook (Apple Mail, Gmail app)',
      veille: '§2.B, §7.5',
      mitigable: covered ? 'yes' : 'no',
      mitigation: covered
        ? 'Le server-side couvre tous les appareils, y compris ceux ou aucune API ne permet de pousser une signature.'
        : "Techniquement hors de portee : le payload MDM Mail d'Apple ne contient aucune cle de signature, sur aucune plateforme ; côté Intune, la seule cle existante est un booleen de désactivation. Sur mobile, OnMessageSend n'existe pas.",
      floor: status,
      notes: [
        "L'add-in Office.js ne couvre que la famille Outlook — jamais Apple Mail, Thunderbird, Gmail app sur une boite M365.",
        "Il exige aussi une connexion Internet pour se declencher.",
      ],
    })
  }

  return out
}
