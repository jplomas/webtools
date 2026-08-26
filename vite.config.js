import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync } from 'fs'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
const qrllibPkg = JSON.parse(readFileSync(resolve('node_modules/@theqrl/qrllib-browserify/package.json'), 'utf8'))
const qrllibVersion = qrllibPkg.dependencies?.qrllib ?? qrllibPkg.version

function resolveCommit() {
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF.slice(0, 12)
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'unknown'
  }
}

const buildId = `${pkg.version}+${resolveCommit()}`

// Custom plugin to inline public assets
function inlinePublicAssets() {
  return {
    name: 'inline-public-assets',
    enforce: 'post',
    transformIndexHtml(html) {
      // Inline qrllib.js
      const qrllibPath = resolve(__dirname, 'public/qrllib.js')
      const qrllibContent = readFileSync(qrllibPath, 'utf-8')
      html = html.replace(
        /<script src="\.\/qrllib\.js"><\/script>/,
        `<script>${qrllibContent}</script>`
      )

      // Inline favicon
      const faviconPath = resolve(__dirname, 'public/favicon.ico')
      const faviconContent = readFileSync(faviconPath)
      const faviconBase64 = faviconContent.toString('base64')
      html = html.replace(
        /href="\.\/favicon\.ico"/,
        `href="data:image/x-icon;base64,${faviconBase64}"`
      )

      // Inline logo.svg
      const logoPath = resolve(__dirname, 'public/logo.svg')
      const logoContent = readFileSync(logoPath, 'utf-8')
      const logoBase64 = Buffer.from(logoContent).toString('base64')
      html = html.replace(
        /src="\/logo\.svg"/g,
        `src="data:image/svg+xml;base64,${logoBase64}"`
      )

      return html
    }
  }
}

export default defineConfig({
  plugins: [vue(), viteSingleFile(), inlinePublicAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      buffer: 'buffer',
      dompurify: resolve(__dirname, 'src/empty-module.js'),
      html2canvas: resolve(__dirname, 'src/empty-module.js'),
      canvg: resolve(__dirname, 'src/empty-module.js'),
    },
  },
  define: {
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD_ID__: JSON.stringify(buildId),
    __QRLLIB_VERSION__: JSON.stringify(qrllibVersion),
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    assetsInlineLimit: 100000000, // Inline all assets regardless of size
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  // Note: vite-plugin-singlefile creates a standalone index.html
  // The other files (qrllib.js, favicon.ico, etc.) in dist/ are build artifacts
  // and can be safely deleted - they are not referenced by the HTML
})
