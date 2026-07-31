import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next build` et `next dev` ecrivent tous deux dans .next : lancer un build
  // pendant que le serveur dev tourne lui laisse des references de chunks
  // mortes, et la page s'affiche sans CSS. On isole donc la sortie de build.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Un package-lock.json traine dans le home de l'utilisateur : sans ca, Next
  // infere la racine de workspace au mauvais endroit.
  outputFileTracingRoot: path.join(import.meta.dirname, '.'),
}

export default nextConfig
