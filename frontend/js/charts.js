// =========================================================
// SOUNDX QUALITY — Wrapper do Chart.js
// Paleta oficial do Design System, tema consistente e
// destruição segura de instâncias para evitar vazamentos.
// =========================================================

// Chart.js é carregado via script UMD (<script src="assets/vendor/chart.umd.js">)
const Chart = (typeof window !== 'undefined' ? window.Chart : null) || (typeof globalThis !== 'undefined' ? globalThis.Chart : null);

// Paleta SoundX (tokens de cores do Design System)
export const PALETTE = {
  laranja:  '#FF9800',
  dourado:  '#FFBD2B',
  marrom:   '#602100',
  marrom2:  '#8D4622',
  marromProfundo: '#290E00',
  terracota:'#BB7A59',
  sucesso:  '#2E7D32',
  erro:     '#C62828',
  atencao:  '#FF9800',
  info:     '#602100',
  texto:    '#602100',
  textoSuave:'#8a5a3a',
  bg:       '#FFF8E8'
};

// Cores padrão para séries (cicla se houver mais de 6)
const CORES_SERIE = [
  PALETTE.laranja,
  PALETTE.dourado,
  PALETTE.terracota,
  PALETTE.marrom2,
  PALETTE.erro,
  PALETTE.sucesso
];

function corSerie(idx) {
  return CORES_SERIE[idx % CORES_SERIE.length];
}

// Tema global aplicado a toda instancia de Chart se presente
if (Chart && Chart.defaults) {
  Chart.defaults.color = PALETTE.texto;
  Chart.defaults.font.family = "'Muli', 'Segoe UI', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.position = 'bottom';
  Chart.defaults.plugins.legend.labels = {
    color: PALETTE.textoSuave,
    padding: 20,
    boxWidth: 14
  };
  Chart.defaults.plugins.tooltip = {
    backgroundColor: 'rgba(41, 14, 0, 0.85)',
    titleColor: PALETTE.dourado,
    bodyColor: '#FFFFFF',
    borderColor: PALETTE.laranja,
    borderWidth: 1,
    cornerRadius: 6,
    displayColors: false,
    padding: 10
  };
}

// Instâncias criadas pelo wrapper (chave = id do canvas)
const instances = new Map();

export function createChart(canvasId, type, data, options = {}) {
  const currentChart = (typeof window !== 'undefined' ? window.Chart : null) || Chart;
  if (!currentChart) {
    console.warn(`[charts.js] Chart.js não está carregado no navegador. Canvas '#${canvasId}' não pôde ser renderizado.`);
    return null;
  }

  // Destrói uma instância anterior no mesmo canvas, se existir
  const existing = instances.get(canvasId);
  if (existing) {
    existing.destroy();
    instances.delete(canvasId);
  }

  const cfg = {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: options.legend !== false },
        title: options.title ? { display: true, text: options.title, color: PALETTE.marrom, font: { size: 16, weight: '700' } } : false
      },
      ...options
    }
  };

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`[charts.js] Canvas '#${canvasId}' não encontrado.`);
    return null;
  }

  const chart = new currentChart(canvas, cfg);
  instances.set(canvasId, chart);
  return chart;
}

// Destrói todas as instâncias (útil ao navegar entre páginas SPA)
export function destroyAllCharts() {
  for (const [id, chart] of instances) {
    chart.destroy();
  }
  instances.clear();
}

// Destrói uma instância específica
export function destroyChart(canvasId) {
  const chart = instances.get(canvasId);
  if (chart) {
    chart.destroy();
    instances.delete(canvasId);
  }
}

// Helpers de montagem rápida de datasets
export function linha(datasetLabel, valores, { cor, borda = true } = {}) {
  return {
    label: datasetLabel,
    data: valores,
    borderColor: cor || corSerie(0),
    backgroundColor: cor ? cor + '20' : corSerie(0) + '20',
    fill: borda ? false : true,
    tension: 0.35,
    pointRadius: 3,
    pointHoverRadius: 5,
    borderWidth: 2
  };
}

export function barra(datasetLabel, valores, { cor } = {}) {
  return {
    label: datasetLabel,
    data: valores,
    backgroundColor: cor || corSerie(0),
    borderRadius: 4,
    borderSkipped: false
  };
}

export function rosca(datasetLabel, rotulos, valores, { cores } = {}) {
  return {
    labels: rotulos,
    datasets: [{
      label: datasetLabel,
      data: valores,
      backgroundColor: cores || valores.map((_, i) => corSerie(i)),
      borderColor: '#FFFFFF',
      borderWidth: 2
    }]
  };
}

// Formata número com sufixo (k, M)
export function formatarNumero(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toString();
}

export { Chart };
export default Chart;
