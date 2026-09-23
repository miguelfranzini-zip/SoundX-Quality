// Netlify Build Script - Injeta VITE_API_URL no frontend
// Roda no Netlify (Linux) e localmente

const fs = require('fs');
const path = require('path');

const apiUrl = process.env.VITE_API_URL || '';
const outputPath = path.join(__dirname, 'js', 'env-config.js');

const content = `// Auto-gerado no build do Netlify
window.__ENV_API_URL = "${apiUrl}";
console.log('[SoundX] API_URL configurada:', window.__ENV_API_URL);
`;

fs.writeFileSync(outputPath, content);
console.log('✅ env-config.js gerado com API_URL:', apiUrl || '(same-origin)');