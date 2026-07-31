import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { compile, estimateGmailClipping } from '../compile.ts'
import { lint } from '../lint.ts'
import { runScenarios } from '../degrade.ts'
import { buildContract, renderAttestation } from '../contract.ts'
import { auditDirectory, parseCsv, correctionCsv } from '../directory.ts'
import { renderRegulated, PROFESSION_PACKS } from '../regulated.ts'
import { contrastRatio, invertHex, isNearWhiteHack, toNumericEntities, byteLength } from '../html.ts'
import { gmailSendAs, exchangeTransportRule } from '../exports.ts'
import { DEMO_SOURCE, BAD_SIGNATURE, DEMO_DIRECTORY_CSV } from '../fixtures.ts'
import { deriveFloor } from '../model.ts'

/* ================================================================== *
 * Test d'intégrité central : notre propre sortie doit passer le linter.
 * Si ce test tombe, le compilateur emet du HTML que la veille §5 désigné
 * comme casse. C'est le seul test non négociable du projet.
 * ================================================================== */

describe('compilateur — intégrité', () => {
  test('la sortie du compilateur ne produit aucun finding critique ou majeur actionnable', () => {
    const c = compile(DEMO_SOURCE)
    const r = lint(c.html)
    const blocking = r.findings.filter(
      (f) => (f.severity === 'critical' || f.severity === 'major') && f.rule.actionable,
    )
    assert.deepEqual(
      blocking.map((f) => `${f.rule.id}: ${f.message}`),
      [],
      'Le compilateur doit satisfaire ses propres règles',
    )
  })

  test('aucun div/flex, aucune webfont, aucun bloc style', () => {
    const { html } = compile(DEMO_SOURCE)
    assert.ok(!/<div\b/i.test(html), 'aucun div')
    assert.ok(!/display\s*:\s*(flex|grid)/i.test(html), 'aucun flex/grid')
    assert.ok(!/@font-face|fonts\.googleapis/i.test(html), 'aucune webfont')
    assert.ok(!/<style\b/i.test(html), 'aucun bloc <style>')
  })

  test('emet le bloc OfficeDocumentSettings a 96 dpi', () => {
    assert.match(compile(DEMO_SOURCE).html, /PixelsPerInch>96</)
  })

  test('le filet séparateur est une cellule coloree, jamais une image étirée', () => {
    const { html } = compile(DEMO_SOURCE)
    assert.match(html, /bgcolor="#d1d5db"/)
    assert.ok(!/spacer|1x1|pixel\.gif/i.test(html))
  })

  test('les couleurs sont exclusivement hexadécimales', () => {
    const { html } = compile(DEMO_SOURCE)
    assert.ok(!/\brgba?\(/i.test(html), 'la syntaxe rgb() fait tomber le <style> de Gmail')
  })

  test('images en https absolu, dimensions doublees, alt présent', () => {
    const { html } = compile(DEMO_SOURCE)
    assert.match(html, /<img src="https:\/\//)
    assert.match(html, /width="96" height="96"/)
    assert.match(html, /alt="/)
    assert.match(html, /style="[^"]*width:96px;height:96px/)
  })

  test('tel: normalise en E.164 sans séparateur', () => {
    const { html } = compile(DEMO_SOURCE)
    assert.match(html, /href="tel:\+33612345678"/)
  })

  test('le poids tient sous le budget de 80 Ko', () => {
    assert.ok(compile(DEMO_SOURCE).bytes < 80_000)
  })

  test("l'alternative texte porte tout le socle", () => {
    const c = compile(DEMO_SOURCE)
    for (const item of c.floor) {
      const needle = item.value.replace(/\s/g, '')
      assert.ok(c.text.replace(/\s/g, '').includes(needle), `socle « ${item.label} » absent du texte brut`)
    }
  })
})

/* ================================================================== *
 * Le linter attrape bien les modes de rupture de la veille §5
 * ================================================================== */

describe('linter — detection des modes de rupture documentés', () => {
  const r = lint(BAD_SIGNATURE)
  const ids = new Set(r.findings.map((f) => f.rule.id))

  const expected = [
    'NO-LAYOUT-DIV',
    'WORD-UNSUPPORTED-CSS',
    'NO-STYLE-TAG',
    'HEX-ONLY',
    'NEAR-WHITE-HACK',
    'CONTRAST-45',
    'IMG-DIM',
    'IMG-ALT',
    'IMG-SELF-HOSTED',
    'CNIL-TRACKER',
    'DISCLAIMER-NOISE',
    'MSO-DPI',
  ]
  for (const id of expected) {
    test(`detecte ${id}`, () => assert.ok(ids.has(id), `${id} non detecte`))
  }

  test('detecte TABLE-PRESENTATION sur une signature a base de tableaux', () => {
    const out = lint('<table width="480"><tr><td>Camille Vermeil</td></tr></table>')
    assert.ok(out.findings.some((f) => f.rule.id === 'TABLE-PRESENTATION'))
  })

  test('separe l\'actionnable de ce qui est seulement a documenter', () => {
    assert.ok(r.actionable > 0)
    assert.equal(r.actionable + r.toDocument, r.findings.length)
  })

  test('le pixel de suivi est classe critique (CNIL 2026-042)', () => {
    const cnil = r.findings.filter((f) => f.rule.id === 'CNIL-TRACKER')
    assert.ok(cnil.some((f) => f.severity === 'critical'))
  })

  test('IMG-ONLY ne se declenche pas sur une signature riche en texte', () => {
    assert.ok(!lint(compile(DEMO_SOURCE).html).findings.some((f) => f.rule.id === 'IMG-ONLY'))
  })

  test('EMPTY-VAR attrape les variables de fusion non resolues', () => {
    const out = lint('<table role="presentation"><tr><td>%%JobTitle%% et {{company}}</td></tr></table>')
    assert.ok(out.findings.some((f) => f.rule.id === 'EMPTY-VAR'))
  })
})

/* ================================================================== *
 * Mentions réglementées — jamais de saut silencieux (§2.C, §8.4)
 * ================================================================== */

describe('mentions réglementées', () => {
  test('une valeur manquante produit une ligne SAUTEE explicitement tracee', () => {
    const pack = PROFESSION_PACKS.avocat
    const out = renderRegulated(pack, { barreau: 'Barreau de Lyon' })
    assert.ok(out.skippedLines.length > 0, 'le saut doit être trace, pas silencieux')
    assert.ok(out.missing.some((m) => m.key === 'structure'))
    assert.ok(!out.lines.some((l) => l.includes('{{')))
  })

  test('le compilateur remonte la mention manquante en critique', () => {
    const src = structuredClone(DEMO_SOURCE)
    src.person.professionFields = { barreau: 'Barreau de Paris' }
    const c = compile(src)
    assert.ok(c.warnings.some((w) => w.code === 'REG-MISSING' && w.severity === 'critical'))
    assert.ok(c.regulatedSkipped.length > 0)
  })

  test('le pack allemand couvre les mentions §35a GmbHG', () => {
    const keys = PROFESSION_PACKS.gmbh_de.fields.map((f) => f.key)
    for (const k of ['firma', 'sitz', 'gericht', 'hrb', 'geschaeftsfuehrer']) assert.ok(keys.includes(k))
  })

  test('chaque pack porte un avertissement de non-validation juridique', () => {
    for (const p of Object.values(PROFESSION_PACKS)) assert.match(p.caveat, /non valide juridiquement/)
  })
})

/* ================================================================== *
 * Simulateur de dégradation (§6)
 * ================================================================== */

describe('simulateur de dégradation', () => {
  const c = compile(DEMO_SOURCE)

  test('le socle survit au blocage des images', () => {
    const s = runScenarios({ compiled: c, deployment: 'server-side' }).find((x) => x.id === 'images-blocked')!
    assert.ok(s.floor.every((f) => f.readable === 'ok'), 'le socle doit exister en texte réel')
  })

  test('le socle survit a la suppression du bloc <style> et au moteur Word', () => {
    const all = runScenarios({ compiled: c, deployment: 'server-side' })
    for (const id of ['style-stripped', 'word-engine']) {
      const s = all.find((x) => x.id === id)!
      assert.ok(s.floor.every((f) => f.readable === 'ok'), `socle perdu dans ${id}`)
    }
  })

  test('le clipping Gmail est déclaré non entièrement mitigeable — on ne ment pas dessus', () => {
    const s = runScenarios({ compiled: c, deployment: 'server-side' }).find((x) => x.id === 'gmail-clip-thread')!
    assert.equal(s.mitigable, 'partial')
    assert.ok(s.floor.every((f) => f.readable === 'lost'))
    assert.ok(s.notes.some((n) => /MODELE, PAS MESURE/.test(n)))
  })

  test('en client-side pur, envoi programmatique et mobile hors-Outlook sont perdus (§4)', () => {
    const all = runScenarios({ compiled: c, deployment: 'client-side' })
    for (const id of ['programmatic-send', 'mobile-non-outlook']) {
      const s = all.find((x) => x.id === id)!
      assert.equal(s.mitigable, 'no')
      assert.ok(s.floor.every((f) => f.readable === 'lost'))
    }
  })

  test('en server-side, ces deux scenarios sont couverts', () => {
    const all = runScenarios({ compiled: c, deployment: 'server-side' })
    for (const id of ['programmatic-send', 'mobile-non-outlook']) {
      assert.ok(all.find((x) => x.id === id)!.floor.every((f) => f.readable === 'ok'))
    }
  })
})

/* ================================================================== *
 * Modèle de clipping Gmail
 * ================================================================== */

describe('modèle de clipping Gmail', () => {
  test('une signature typique tombe dans la fourchette 8-15 allers-retours de la veille §5', () => {
    for (const bytes of [1_500, 3_000, 5_000]) {
      const r = estimateGmailClipping(bytes)
      assert.ok(r.rounds >= 6 && r.rounds <= 15, `${bytes} o -> ${r.rounds} allers-retours, hors fourchette plausible`)
    }
  })

  test('alleger la signature achete des allers-retours — c\'est le seul levier', () => {
    assert.ok(estimateGmailClipping(1_500).rounds > estimateGmailClipping(8_000).rounds)
  })
})

/* ================================================================== *
 * Contrat
 * ================================================================== */

describe('contrat de dégradation gracieuse', () => {
  test('server-side : signable, avec les exclusions permanentes énoncées', () => {
    const c = buildContract(compile(DEMO_SOURCE), 'server-side')
    assert.equal(c.verdict, 'signable')
    assert.equal(c.blocking.length, 0)
    const md = renderAttestation(c, 'Cabinet Vermeil')
    assert.match(md, /Ce qui n'est pas garanti, et ne le sera jamais/)
    assert.match(md, /obligation de MOYENS/)
    assert.match(md, /Exceptions propres au mode server-side/)
    assert.match(md, /S\/MIME/)
  })

  test('client-side : non signable, parce que deux scenarios sont hors de portee', () => {
    const c = buildContract(compile(DEMO_SOURCE), 'client-side')
    assert.equal(c.verdict, 'non_signable')
    assert.ok(c.uncovered.length >= 2)
  })

  test('un bandeau marketing rend le contrat non signable en l\'état (CNIL 2026-042)', () => {
    const src = structuredClone(DEMO_SOURCE)
    src.layout.banner = { src: 'https://x/b.png', href: 'https://x', width: 400, height: 80, alt: 'b' }
    const c = buildContract(compile(src), 'server-side')
    assert.equal(c.verdict, 'a_corriger')
    assert.ok(c.blocking.some((b) => /BANNER-CNIL/.test(b)))
  })

  test('la matrice couvre chaque croisement scenario x socle', () => {
    const c = buildContract(compile(DEMO_SOURCE), 'server-side')
    assert.equal(c.cells.length, c.scenarios.length * c.floorKeys.length)
  })
})

/* ================================================================== *
 * QA annuaire (§7.1)
 * ================================================================== */

describe('QA de la donnée annuaire', () => {
  const { rows } = parseCsv(DEMO_DIRECTORY_CSV)

  test('parse le CSV a point-virgule', () => {
    assert.equal(rows.length, 6)
    assert.equal(rows[0].givenName, 'Camille')
  })

  test('detecte la non-conformité sur mention réglementée (entité juridique vide)', () => {
    const a = auditDirectory(rows)
    assert.ok(a.nonCompliant.length >= 3)
    assert.ok(a.alerts.some((x) => /non conforme/.test(x)))
  })

  test('formule une alerte actionnable, pas un pourcentage abstrait', () => {
    const a = auditDirectory(rows)
    const alert = a.alerts.find((x) => /entité juridique/i.test(x))
    assert.ok(alert && /collaborateur/.test(alert) && /sautée silencieusement/.test(alert))
  })

  test('produit un CSV de corrections routable', () => {
    const a = auditDirectory(rows)
    const csv = correctionCsv(rows, a)
    assert.match(csv, /identifiant;attribut_manquant/)
    assert.ok(csv.split('\n').length > 5)
  })

  test('signale les colonnes exigees absentes du fichier', () => {
    const a = auditDirectory([{ mail: 'a@b.c' }])
    assert.ok(a.absentColumns.includes('companyName'))
  })
})

/* ================================================================== *
 * Utilitaires
 * ================================================================== */

describe('utilitaires', () => {
  test('contraste WCAG', () => {
    assert.equal(contrastRatio('#000000', '#ffffff'), 21)
    assert.ok((contrastRatio('#bfbfbf', '#ffffff') ?? 0) < 4.5)
  })

  test('inversion totale simulee', () => {
    assert.equal(invertHex('#000000'), '#ffffff')
    assert.equal(invertHex('#111827'), '#eee7d8')
  })

  test('la parade #fffffe est identifiee (Yahoo la rend en #989800)', () => {
    assert.ok(isNearWhiteHack('#fffffe'))
    assert.ok(!isNearWhiteHack('#ffffff'))
  })

  test('les entités numériques sont neutres en octets face au quoted-printable', () => {
    // « e accent aigu » : UTF-8 = 2 octets -> =C3=A9 = 6 octets en QP.
    // &#233; = 6 octets ASCII. &eacute; = 9. On choisit donc le numérique.
    assert.equal(toNumericEntities('é'), '&#233;')
    assert.equal(byteLength('&#233;'), 6)
    assert.ok(byteLength('&eacute;') > 6)
  })
})

/* ================================================================== *
 * Exports de déploiement
 * ================================================================== */

describe('exports de déploiement', () => {
  const c = compile(DEMO_SOURCE)

  test('la règle de transport force FallbackAction Ignore et documenté ses trous', () => {
    const ps = exchangeTransportRule(c)
    assert.match(ps, /-ApplyHtmlDisclaimerFallbackAction Ignore/)
    assert.match(ps, /Éléments envoyes/)
    assert.match(ps, /S\/MIME/)
    assert.match(ps, /SILENCIEUSEMENT/)
    assert.match(ps, /DKIM/)
  })

  test('gmail sendAs vérifié le plafond de 10 000 caractères et liste ses limites', () => {
    const g = gmailSendAs(c)
    assert.equal(g.limit, 10_000)
    assert.equal(g.withinLimit, true)
    assert.ok(g.caveats.some((x) => /une seule signature par adresse/i.test(x)))
  })
})

/* ================================================================== *
 * Socle
 * ================================================================== */

describe('socle', () => {
  test('le socle par défaut tient en cinq informations, dont trois cliquables', () => {
    const floor = deriveFloor(DEMO_SOURCE)
    assert.equal(floor.length, 5)
    assert.equal(floor.filter((f) => f.mustBeClickable).length, 3)
  })
})
