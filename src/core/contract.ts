/**
 * Contrat de dégradation gracieuse.
 *
 * C'est le livrable vendable du produit, et la seule reformulation de la these
 * initiale que la veille juge tenable (§6, §9) :
 *
 *   « La signature qui ne casse pas est indéfendable telle quelle, et
 *     dangereuse a porter. Elle est refutable par n'importe quel prospect en
 *     une capture d'écran. Ce jour-la, la marque est morte. »
 *
 *   « Ce qui n'est jamais garantissable : la même signature partout.
 *     Ce qui l'est : la même information partout. »
 *
 * Le contrat n'est donc PAS « votre signature s'affichera correctement ».
 * Il est : « quel que soit le client, le mode sombre, le clipping ou le nombre
 * de réponses, ces N informations restent lisibles et cliquables » — assorti
 * de la liste explicite et signee de ce qui n'est PAS couvert.
 *
 * Cette liste d'exclusions est aussi importante que la garantie. Une promesse
 * dont on connait les bords est defendable ; une promesse absolue ne l'est pas.
 */

import type { CompiledSignature } from './compile.ts'
import { runScenarios, type DeploymentMode, type ScenarioResult, type FloorVerdict } from './degrade.ts'
import { lint, type LintReport } from './lint.ts'

export interface ContractCell {
  scenarioId: string
  floorKey: string
  readable: FloorVerdict
  clickable: FloorVerdict | 'n/a'
  note?: string
}

export interface Contract {
  generatedAt: string
  deployment: DeploymentMode
  floorKeys: Array<{ key: string; label: string; value: string }>
  scenarios: ScenarioResult[]
  cells: ContractCell[]
  /** Scenarios ou 100 % du socle reste lisible. */
  passed: number
  total: number
  /** Scenarios non couvrables, listes tels quels dans l'attestation. */
  uncovered: ScenarioResult[]
  lint: LintReport
  verdict: 'signable' | 'a_corriger' | 'non_signable'
  blocking: string[]
}

/**
 * Exclusions permanentes, reprises de §6 « Ce qui ne le sera jamais ».
 * Elles figurent telles quelles dans l'attestation remise au client.
 */
export const PERMANENT_EXCLUSIONS: string[] = [
  "Le mode sombre à inversion totale (Outlook Windows, Office 365 Windows, Gmail iOS) : ces clients n'offrent ni prefers-color-scheme ni data-ogsc, le ciblage est impossible.",
  'Le clipping Gmail au-delà de N réponses : le corps est coupe a ~102 Ko et la signature, en fin de corps, part la première.',
  "Le repli derriere « Afficher le contenu tronque » de Gmail : la signature est livree et conforme, mais personne ne la voit.",
  'La resérialisation par les clients intermediaires : Outlook repasse le HTML par Word et le ressort crible de mso-*.',
  "La recompression des images a 220 PPI par Outlook Windows : corrigeable uniquement par GPO sur le poste, hors de portee de tout SaaS.",
  "Le hors-ligne en déploiement client-side : les add-ins événementiels exigent une connexion Internet pour se declencher.",
  "Le mobile hors famille Outlook : le payload MDM Mail d'Apple ne contient aucune cle de signature, sur aucune plateforme ; côté Intune, la seule cle existante est un booleen de désactivation.",
  'Les regressions éditeurs non annoncees : elles surviennent sans communication et se corrigent, ou pas, a leur rythme.',
]

/**
 * Exceptions propres au mode server-side, a énoncer honnêtement (§6.1).
 */
export const SERVER_SIDE_EXCEPTIONS: string[] = [
  'S/MIME et messages chiffres : aucune signature n\'est ajoutee.',
  "La signature ne peut pas être inseree sous la dernière réponse : elle atterrit sous tout le fil cite (sauf mecanisme de deduplication dédié).",
  "Elle n'apparait pas dans les Éléments envoyes de l'utilisateur.",
  'Les images ne peuvent pas être embarquees.',
  'Les réponses automatiques ne sont pas traitées par défaut.',
  'Au-dela d\'environ 24 Mo de pieces jointes, le traitement échoue.',
  'Le rappel de message devient impossible.',
  'Le flux mail sortant devient dépendant d\'un tiers — objection RSSI documentée et recurrente.',
]

export function buildContract(
  compiled: CompiledSignature,
  deployment: DeploymentMode,
  now = '1970-01-01T00:00:00.000Z',
): Contract {
  const scenarios = runScenarios({ compiled, deployment })
  const cells: ContractCell[] = []
  for (const s of scenarios) {
    for (const fs of s.floor) {
      cells.push({
        scenarioId: s.id,
        floorKey: fs.key,
        readable: fs.readable,
        clickable: fs.clickable,
        note: fs.note,
      })
    }
  }

  const passed = scenarios.filter((s) => s.floor.every((f) => f.readable === 'ok')).length
  const uncovered = scenarios.filter((s) => s.mitigable === 'no')
  const report = lint(compiled.html)

  const blocking: string[] = []
  for (const f of report.findings) {
    if (f.severity === 'critical' && f.rule.actionable) blocking.push(`${f.rule.id} — ${f.message}`)
  }
  for (const w of compiled.warnings) {
    if (w.severity === 'critical') blocking.push(`${w.code} — ${w.message}`)
  }

  let verdict: Contract['verdict'] = 'signable'
  if (blocking.length > 0) verdict = 'a_corriger'
  if (uncovered.length > 0 && deployment === 'client-side') verdict = 'non_signable'

  return {
    generatedAt: now,
    deployment,
    floorKeys: compiled.floor.map((f) => ({ key: f.key, label: f.label, value: f.value })),
    scenarios,
    cells,
    passed,
    total: scenarios.length,
    uncovered,
    lint: report,
    verdict,
    blocking,
  }
}

/**
 * Attestation en Markdown, remise au client.
 *
 * Volontairement redigee comme une obligation de MOYENS, jamais de résultat —
 * c'est la formulation que la veille §6 juge tenable :
 * « la signature testée avant déploiement et re-testée à chaque mise à jour
 *   Outlook et Gmail ».
 */
export function renderAttestation(c: Contract, orgName: string): string {
  const L: string[] = []
  const mark = (v: FloorVerdict | 'n/a') => (v === 'ok' ? 'OK' : v === 'degraded' ? '~' : v === 'n/a' ? '—' : 'PERDU')

  L.push(`# Contrat de dégradation gracieuse — ${orgName}`)
  L.push('')
  L.push(`Mode de déploiement : **${c.deployment}**`)
  L.push('')
  L.push('## Ce qui est garanti')
  L.push('')
  L.push(
    "Quel que soit le client de lecture, le mode sombre, le blocage d'images ou le rang du message dans le fil, les informations suivantes restent lisibles et, lorsque c'est indique, cliquables :",
  )
  L.push('')
  for (const f of c.floorKeys) L.push(`- **${f.label}** — ${f.value}`)
  L.push('')
  L.push("Cette garantie est une obligation de MOYENS : la signature est testée avant déploiement et re-testée à chaque mise à jour majeure d'Outlook et de Gmail. Elle n'est pas une obligation de résultat sur le rendu visuel, qui depend du client de lecture du destinataire et n'est controlable par personne.")
  L.push('')

  L.push('## Matrice de survie du socle')
  L.push('')
  L.push('| Scenario | ' + c.floorKeys.map((f) => f.label).join(' | ') + ' | Mitigation |')
  L.push('|---|' + c.floorKeys.map(() => '---|').join('') + '---|')
  for (const s of c.scenarios) {
    const cellsFor = c.floorKeys.map((fk) => {
      const cell = c.cells.find((x) => x.scenarioId === s.id && x.floorKey === fk.key)
      if (!cell) return '—'
      const r = mark(cell.readable)
      const k = cell.clickable === 'n/a' ? '' : ` / ${mark(cell.clickable)}`
      return r + k
    })
    L.push(`| ${s.label} | ${cellsFor.join(' | ')} | ${s.mitigable} |`)
  }
  L.push('')
  L.push('Lecture : `lisible / cliquable`. `—` = non applicable.')
  L.push('')
  L.push(`**${c.passed} scenarios sur ${c.total}** preservent l'intégralité du socle.`)
  L.push('')

  L.push("## Ce qui n'est pas garanti, et ne le sera jamais")
  L.push('')
  for (const e of PERMANENT_EXCLUSIONS) L.push(`- ${e}`)
  L.push('')

  if (c.deployment !== 'client-side') {
    L.push('## Exceptions propres au mode server-side')
    L.push('')
    for (const e of SERVER_SIDE_EXCEPTIONS) L.push(`- ${e}`)
    L.push('')
  }

  if (c.uncovered.length) {
    L.push('## Scenarios non couverts par le mode de déploiement retenu')
    L.push('')
    for (const s of c.uncovered) L.push(`- **${s.label}** — ${s.mitigation}`)
    L.push('')
  }

  if (c.blocking.length) {
    L.push('## Points bloquants a corriger avant signature')
    L.push('')
    for (const b of c.blocking) L.push(`- ${b}`)
    L.push('')
  }

  L.push('---')
  L.push('')
  L.push(
    `Verdict : **${c.verdict}**. Linter : ${c.lint.score.critical} critique(s), ${c.lint.score.major} majeur(s), ${c.lint.score.minor} mineur(s). ${c.lint.actionable} finding(s) actionnable(s) côté émetteur, ${c.lint.toDocument} a documenter faute de correctif émetteur possible.`,
  )
  return L.join('\n')
}
