/**
 * Sorties de déploiement — et leur périmètre honnête.
 *
 * Ancrage veille §4, les deux lignes de fracture :
 *   « C'est le socle du dossier. Tout le marché est structure par ces deux
 *     arbitrages, et AUCUN DES DEUX N'A DE BONNE REPONSE. »
 *
 * Ce module ne pretend donc pas resoudre l'arbitrage. Il produit les artefacts
 * de chaque mode ET la liste de ce que ce mode ne couvre pas — pour que le
 * choix soit fait en connaissance de cause, et ecrit noir sur blanc dans le
 * contrat client. C'est exactement ce que la veille reproche au marché de ne
 * pas faire.
 */

import type { CompiledSignature } from './compile.ts'

export interface DeploymentTarget {
  id: string
  label: string
  mode: 'server-side' | 'client-side' | 'manual'
  platform: 'microsoft' | 'google' | 'any'
  /** Ce que ce mode couvre reellement. */
  covers: string[]
  /** Ce qu'il ne couvre pas. Non négociable, figure dans le contrat. */
  gaps: string[]
  veille: string
}

export const TARGETS: DeploymentTarget[] = [
  {
    id: 'exchange-transport-rule',
    label: 'Règle de transport Exchange Online',
    mode: 'server-side',
    platform: 'microsoft',
    covers: [
      '100 % des mails sortants, tous appareils',
      'Envoi programmatique : Graph sendMail, SMTP applicatif, CRM, marketing automation, agents IA',
      'Hors-ligne',
      'Non modifiable par l\'utilisateur',
    ],
    gaps: [
      'La signature ne peut pas être inseree sous la dernière réponse : elle atterrit sous tout le fil cite.',
      "Elle n'apparait pas dans les Éléments envoyes.",
      'Les images ne peuvent pas être embarquees.',
      "Une ligne dont l'attribut annuaire est vide est purement sautée, silencieusement.",
      'Impossible sur S/MIME et messages chiffres.',
      'Le fallback Wrap par défaut transforme le message original en piece jointe et casse Safe Attachments.',
      'Réponses automatiques non traitées par défaut.',
      'Le rappel de message devient impossible.',
      'Le flux mail sortant devient dépendant d\'un tiers — objection RSSI documentée.',
      "Alignement DKIM après reecriture server-side et exigences expediteurs Gmail/Yahoo 2024 : NON INSTRUIT dans la veille, a valider avant tout déploiement réel.",
    ],
    veille: '§2.C, §4',
  },
  {
    id: 'gmail-sendas',
    label: 'Push Gmail sendAs (API Gmail)',
    mode: 'client-side',
    platform: 'google',
    covers: ['Visible en redaction', 'Dans les Éléments envoyes', 'Sous la réponse'],
    gaps: [
      'Une seule signature par adresse : aucune variante réponse/transfert possible.',
      "L'utilisateur peut l'editer ou la supprimer : aucun verrouillage possible.",
      'Plafonné a 10 000 caractères.',
      'Aucune deduplication en fil : structurellement impossible.',
      "Ne couvre pas l'envoi programmatique.",
    ],
    veille: '§2.B, §4',
  },
  {
    id: 'outlook-signature-file',
    label: 'Fichier de signature Outlook (.htm) / roaming',
    mode: 'client-side',
    platform: 'microsoft',
    covers: ['Visible en redaction', 'Dans les Éléments envoyes', 'Sous la réponse', 'S/MIME et chiffre', 'Rien ne transite chez un tiers'],
    gaps: [
      "Famille Outlook uniquement — jamais Apple Mail, Thunderbird, Gmail app sur une boite M365.",
      "New Outlook ne lit plus %APPDATA%\\Microsoft\\Signatures : un script de déploiement continue de s'executer sans erreur et n'a plus aucun effet.",
      "Les add-ins événementiels exigent une connexion Internet pour se declencher.",
      "Sur mobile : OnMessageSend n'existe pas, boites partagees non supportees.",
      "Ne couvre pas l'envoi programmatique.",
      "Échéance EWS : désactivation par phases à partir du 1er oct. 2026, arrêt total le 1er avr. 2027 (MC1227454). Microsoft n'a toujours aucune API Graph de signature.",
    ],
    veille: '§2.B, §2.F, §4',
  },
  {
    id: 'manual-paste',
    label: 'Installation manuelle (copier-coller)',
    mode: 'manual',
    platform: 'any',
    covers: ['Fonctionne partout', 'Aucune dépendance éditeur'],
    gaps: [
      'Copier-coller dépendant du navigateur.',
      'Bug de collage OWA supprimant width/height des images.',
      'Images potentiellement converties en pieces jointes.',
      'Aucun contrôle, aucune mise à jour centralisee : le parc dérive des le premier mois.',
    ],
    veille: '§2.A',
  },
]

/* ------------------------------------------------------------------ *
 * Artefacts
 * ------------------------------------------------------------------ */

export function exchangeTransportRule(c: CompiledSignature, ruleName = 'Socle - signature sortante'): string {
  const html = c.html.replace(/'/g, "''")
  return [
    '# Règle de transport Exchange Online — générée par Socle',
    '#',
    '# AVERTISSEMENT — a lire avant execution.',
    '# 1. FallbackAction Wrap (défaut) transforme le message original en piece jointe',
    '#    et casse Safe Attachments. On force Ignore ci-dessous.',
    '# 2. La signature atterrit sous TOUT le fil cite, pas sous la dernière réponse.',
    "# 3. Elle n'apparaitra pas dans les Éléments envoyes de l'utilisateur.",
    '# 4. Aucune signature sur S/MIME ni sur les messages chiffres.',
    '# 5. Toute ligne contenant une variable non resolue est sautée SILENCIEUSEMENT.',
    "# 6. Alignement DKIM après reecriture et exigences expediteurs Gmail/Yahoo 2024 :",
    '#    a valider avec votre RSSI avant mise en production.',
    '',
    `New-TransportRule -Name '${ruleName}' \``,
    '  -FromScope InOrganization `',
    '  -SentToScope NotInOrganization `',
    '  -ApplyHtmlDisclaimerLocation Append `',
    '  -ApplyHtmlDisclaimerFallbackAction Ignore `',
    `  -ApplyHtmlDisclaimerText '${html}'`,
    '',
    `# Poids du fragment : ${(c.bytes / 1024).toFixed(1)} Ko`,
  ].join('\n')
}

export interface GmailSendAsExport {
  payload: { signature: string }
  chars: number
  limit: number
  withinLimit: boolean
  caveats: string[]
}

export function gmailSendAs(c: CompiledSignature): GmailSendAsExport {
  const limit = 10_000
  return {
    payload: { signature: c.html },
    chars: c.html.length,
    limit,
    withinLimit: c.html.length <= limit,
    caveats: [
      'Une seule signature par adresse : aucune variante réponse/transfert.',
      "L'utilisateur peut l'editer ou la supprimer. Aucun verrouillage n'est possible.",
      'Aucune deduplication en fil : structurellement impossible sur ce canal.',
      "Ne s'applique pas aux envois programmatiques.",
    ],
  }
}

export function outlookSignatureFiles(c: CompiledSignature, name: string): Array<{ filename: string; content: string }> {
  const safe = name.replace(/[^\w.-]+/g, '-')
  return [
    { filename: `${safe}.htm`, content: c.document },
    { filename: `${safe}.txt`, content: c.text },
  ]
}

export function manualInstructions(client: 'outlook-win' | 'owa' | 'gmail' | 'apple-mail'): string[] {
  const common = [
    "Coller en tant que HTML, pas en tant qu'image.",
    'Vérifier immédiatement que le logo est bien une image liee et non une piece jointe.',
  ]
  switch (client) {
    case 'outlook-win':
      return [...common, 'Fichier > Options > Courrier > Signatures.', "Ne PAS utiliser New Outlook : il ne lit plus %APPDATA%\\Microsoft\\Signatures."]
    case 'owa':
      return [
        ...common,
        'Paramètres > Courrier > Composer et répondre.',
        "Vérifier après collage que les images ont conserve leurs attributs width et height : le bug de collage OWA les supprime periodiquement.",
      ]
    case 'gmail':
      return [...common, 'Paramètres > General > Signature.', 'Rester sous 10 000 caractères.']
    case 'apple-mail':
      return [
        ...common,
        'Mail > Reglages > Signatures.',
        "Decocher « Toujours utiliser la police de mes messages par défaut », sinon Apple Mail ecrase le HTML.",
        "Aucun déploiement centralise possible : le payload MDM Mail d'Apple ne contient aucune cle de signature.",
      ]
  }
}
