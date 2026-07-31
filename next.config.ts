import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Un package-lock.json traîne dans le home de l'utilisateur : sans ça, Next
  // infère la racine de workspace au mauvais endroit.
  outputFileTracingRoot: path.join(import.meta.dirname, '.'),
}

export default nextConfig
