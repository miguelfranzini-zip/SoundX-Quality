#!/bin/bash
# Netlify Build Script - Injeta variáveis de ambiente no frontend
# Este script roda no Netlify durante o build

echo "🔧 Iniciando build do frontend..."

# Cria arquivo de configuração runtime com a URL da API
cat > ./js/env-config.js <<EOF
// Auto-gerado no build do Netlify - NÃO EDITE MANUALMENTE
window.__ENV_API_URL = "${VITE_API_URL:-}/api";
console.log('[SoundX] API_URL configurada:', window.__ENV_API_URL);
EOF

echo "✅ Build concluído! API_URL = ${VITE_API_URL:-'(same-origin)'}"