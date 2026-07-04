/* =============================================================
   Gráficos de Filmes — graficos.js
   Semana 14: Apresentação Dinâmica de Dados
   Biblioteca: Chart.js
   Fonte dos dados: TMDB API
   ============================================================= */
'use strict';

// ================================================================
// CONFIGURAÇÃO
// ================================================================
const API_KEY  = 'c0d66930c8c9d888f00fcefe0ae7b614';
const BASE_URL = 'https://api.themoviedb.org/3';

// Paleta de cores do projeto (inspirada no TMDB)
const CORES = [
  '#032541', '#0b3d6b', '#1a6496', '#2d8bc2', '#3ba8e0',
  '#90cea1', '#f5c518', '#e87c3e', '#cb4335', '#8e44ad'
];

// ================================================================
// FETCH — TMDB API
// ================================================================
async function fetchTMDB(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'pt-BR');

  for (const [chave, valor] of Object.entries(params)) {
    url.searchParams.set(chave, valor);
  }

  const resposta = await fetch(url.toString());

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status}: ${resposta.statusText}`);
  }

  return resposta.json();
}

// ================================================================
// COLETA DE DADOS
// ================================================================
async function coletarDados() {
  // Busca gêneros + filmes populares e mais votados em paralelo
  const [genreData, pop1, pop2, pop3, top1, top2] = await Promise.all([
    fetchTMDB('/genre/movie/list'),
    fetchTMDB('/movie/popular',   { page: 1 }),
    fetchTMDB('/movie/popular',   { page: 2 }),
    fetchTMDB('/movie/popular',   { page: 3 }),
    fetchTMDB('/movie/top_rated', { page: 1 }),
    fetchTMDB('/movie/top_rated', { page: 2 }),
  ]);

  // Mapa id → nome de gênero
  const generoMap = {};
  genreData.genres.forEach(g => { generoMap[g.id] = g.name; });

  // Une todos os filmes sem repetição
  const filmes = [];
  const vistos = new Set();
  [pop1, pop2, pop3, top1, top2].forEach(pagina => {
    (pagina.results || []).forEach(filme => {
      if (!vistos.has(filme.id)) {
        vistos.add(filme.id);
        filmes.push(filme);
      }
    });
  });

  return { generoMap, filmes };
}

// ================================================================
// PROCESSAMENTO
// ================================================================
function processarDados(filmes, generoMap) {
  const contagemGenero = {};
  const notasPorGenero = {};

  filmes.forEach(filme => {
    (filme.genre_ids || []).forEach(gid => {
      const nome = generoMap[gid];
      if (!nome) return;

      contagemGenero[nome] = (contagemGenero[nome] || 0) + 1;

      if (filme.vote_average > 0) {
        if (!notasPorGenero[nome]) notasPorGenero[nome] = [];
        notasPorGenero[nome].push(filme.vote_average);
      }
    });
  });

  // Ordena por contagem decrescente e pega os top 9 gêneros
  const topGeneros = Object.entries(contagemGenero)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9);

  const nomes      = topGeneros.map(([n]) => n);
  const contagens  = topGeneros.map(([, c]) => c);
  const mediasNota = nomes.map(nome => {
    const notas = notasPorGenero[nome] || [];
    if (!notas.length) return 0;
    const media = notas.reduce((s, n) => s + n, 0) / notas.length;
    return parseFloat(media.toFixed(1));
  });

  return { nomes, contagens, mediasNota };
}

// ================================================================
// ESTATÍSTICAS — cards de resumo
// ================================================================
function preencherEstatisticas(filmes, nomes, contagens) {
  const comNota  = filmes.filter(f => f.vote_average > 0);
  const mediaGeral = comNota.length
    ? (comNota.reduce((s, f) => s + f.vote_average, 0) / comNota.length).toFixed(1)
    : '—';
  const topFilme = [...filmes].sort((a, b) => b.vote_average - a.vote_average)[0];

  document.getElementById('stat-total').textContent  = filmes.length;
  document.getElementById('stat-nota').textContent   = mediaGeral;
  document.getElementById('stat-genero').textContent = nomes[0] || '—';
  document.getElementById('stat-genero-count').textContent =
    contagens[0] ? `${contagens[0]} filmes` : '';

  const tituloEl = document.getElementById('stat-top-titulo');
  const titulo   = topFilme?.title || '—';
  tituloEl.textContent  = titulo.length > 20 ? titulo.substring(0, 18) + '…' : titulo;
  tituloEl.title        = titulo;

  document.getElementById('stat-top-nota').textContent =
    topFilme ? `${topFilme.vote_average.toFixed(1)} / 10` : '';
}

// ================================================================
// GRÁFICOS — Chart.js
// ================================================================

// Configurações globais
Chart.defaults.font.family = "'Segoe UI', system-ui, -apple-system, sans-serif";
Chart.defaults.color       = '#6c757d';

function criarGraficoPizza(nomes, contagens) {
  const ctx = document.getElementById('chart-pizza').getContext('2d');

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: nomes,
      datasets: [{
        data:            contagens,
        backgroundColor: CORES.slice(0, nomes.length),
        borderColor:     '#ffffff',
        borderWidth:     2,
        hoverOffset:     8
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font:     { size: 12 },
            boxWidth: 14,
            padding:  10
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.parsed} filmes (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function criarGraficoBarrasNota(nomes, mediasNota) {
  const ctx = document.getElementById('chart-barras-nota').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: nomes,
      datasets: [{
        label:           'Nota média',
        data:            mediasNota,
        backgroundColor: CORES.slice(0, nomes.length),
        borderRadius:    6,
        borderWidth:     0
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Nota média: ${ctx.parsed.y.toFixed(1)} / 10`
          }
        }
      },
      scales: {
        y: {
          min:   5,
          max:   9,
          title: { display: true, text: 'Nota média (0–10)', font: { size: 12 } },
          ticks: { font: { size: 11 } }
        },
        x: {
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

function criarGraficoBarrasQuantidade(nomes, contagens) {
  const ctx = document.getElementById('chart-barras-qtd').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: nomes,
      datasets: [{
        label:           'Filmes',
        data:            contagens,
        backgroundColor: '#032541',
        hoverBackgroundColor: '#0b3d6b',
        borderRadius:    6,
        borderWidth:     0
      }]
    },
    options: {
      indexAxis:           'y',
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} filmes`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Quantidade de filmes', font: { size: 12 } },
          ticks: { font: { size: 11 } }
        },
        y: {
          ticks: { font: { size: 12 } }
        }
      }
    }
  });
}

// ================================================================
// INICIALIZAÇÃO
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
  const elLoading  = document.getElementById('loading-graficos');
  const elAlerta   = document.getElementById('alerta-graficos');
  const elConteudo = document.getElementById('conteudo-graficos');

  try {
    const { generoMap, filmes } = await coletarDados();
    const { nomes, contagens, mediasNota } = processarDados(filmes, generoMap);

    preencherEstatisticas(filmes, nomes, contagens);
    criarGraficoPizza(nomes, contagens);
    criarGraficoBarrasNota(nomes, mediasNota);
    criarGraficoBarrasQuantidade(nomes, contagens);

    elLoading.classList.add('d-none');
    elConteudo.classList.remove('d-none');

  } catch (erro) {
    console.error('[Gráficos]', erro);
    elLoading.classList.add('d-none');
    elAlerta.classList.remove('d-none');
    elAlerta.innerHTML = `
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      Erro ao carregar os dados: ${erro.message}
    `;
  }
});
