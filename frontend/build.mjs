// Netlify Build Script - Injeta VITE_API_URL no frontend
// Roda no Netlify (Linux) e localmente

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let apiUrl = (
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ''
).trim();

if (apiUrl) {
  apiUrl = apiUrl.replace(/\/+$/, '');
  if (!apiUrl.endsWith('/api')) {
    apiUrl += '/api';
  }
}
const outputPath = path.join(__dirname, 'js', 'env-config.js');

const content = `// Auto-gerado no build do Netlify
window.__ENV_API_URL = "${apiUrl}";
console.log('[SoundX] API_URL configurada no build:', window.__ENV_API_URL || '(nenhuma)');
`;

fs.writeFileSync(outputPath, content);
console.log('✅ env-config.js gerado com API_URL:', apiUrl || '(nenhuma - aguardando configuração)');