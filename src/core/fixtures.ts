/**
 * Jeux d'essai.
 *
 * BAD_SIGNATURE reproduit deliberement les modes de rupture les plus courants
 * documentés en veille §5 et §2.A. Il sert de test de non-regression du linter
 * et de demonstration client : c'est la signature qu'on colle dans le linter
 * public pour montrer, en dix secondes, ce que personne ne vérifié.
 */

import { DEFAULT_BRAND, DEFAULT_LAYOUT, type SignatureSource } from './model.ts'

export const DEMO_SOURCE: SignatureSource = {
  id: 'demo',
  name: 'Demo — cabinet',
  version: 1,
  state: 'draft',
  audit: [],
  org: {
    id: 'org-demo',
    name: 'Cabinet Vermeil',
    legalEntity: 'SELARL Vermeil & Associés',
    country: 'FR',
  },
  person: {
    id: 'p1',
    firstName: 'Camille',
    lastName: 'Vermeil',
    jobTitle: 'Avocate associée',
    department: 'Droit social',
    email: 'camille.vermeil@cabinet-vermeil.fr',
    mobile: '+33 6 12 34 56 78',
    url: 'https://cabinet-vermeil.fr',
    profession: 'avocat',
    professionFields: {
      barreau: 'Barreau de Paris',
      structure: 'SELARL Vermeil & Associés',
      toque: 'C1234',
    },
  },
  brand: { ...DEFAULT_BRAND },
  layout: { ...DEFAULT_LAYOUT },
  legal: { regulated: [] },
  logo: {
    src: 'https://cabinet-vermeil.fr/assets/v3/logo-96.png',
    width: 96,
    height: 96,
    alt: 'Cabinet Vermeil',
    darkBehaviour: 'opaque-light',
    intrinsicWidth: 192,
  },
}

/** Signature volontairement fautive — 10 modes de rupture de la veille §5. */
export const BAD_SIGNATURE = `
<style>.sig{font-family:'Inter',sans-serif;color:rgb(153 153 153)}</style>
<div class="sig" style="display:flex;gap:12px;max-width:600px;padding:12px;border-radius:8px;background-image:url(https://cdn.example.com/bg.png)">
  <img src="/img/logo.png" class="logo">
  <div style="width:400px;padding:8px">
    <span style="color:#bfbfbf">Camille Vermeil — Avocate associée</span><br>
    <span style="color:#cccccc">Tel. 06 12 34 56 78 · camille.vermeil@cabinet-vermeil.fr</span><br>
    <span style="color:#fffffe">.</span>
    <img src="https://track.example.com/o/open.gif?uid=42" width="1" height="1">
    <a href="https://click.example.com/r/abc">Notre actualité</a><br>
    <span style="color:#dddddd">Ce message et toutes les pieces jointes sont confidentiels et etablis a l'intention exclusive de ses destinataires. Toute utilisation ou diffusion non autorisee est interdite. Si vous recevez ce message par erreur, merci de le detruire et d'en avertir immédiatement l'expediteur. L'intégrité de ce message n'etant pas assuree sur Internet, le cabinet ne peut être tenu responsable de son contenu.</span>
  </div>
</div>`

export const DEMO_DIRECTORY_CSV = `mail;givenName;surname;jobTitle;department;mobilePhone;companyName
camille.vermeil@cabinet-vermeil.fr;Camille;Vermeil;Avocate associée;Droit social;+33612345678;SELARL Vermeil & Associés
jonas.abitbol@cabinet-vermeil.fr;Jonas;Abitbol;Avocat collaborateur;Droit social;+33612345679;SELARL Vermeil & Associés
lea.marchand@cabinet-vermeil.fr;Lea;Marchand;;Contentieux;;
sami.oueslati@cabinet-vermeil.fr;Sami;Oueslati;Juriste;;+33612345681;
nina.perreau@cabinet-vermeil.fr;Nina;Perreau;Office manager;Administration;;SELARL Vermeil & Associés
theo.blanchard@cabinet-vermeil.fr;Theo;Blanchard;Avocat collaborateur;;;
`
