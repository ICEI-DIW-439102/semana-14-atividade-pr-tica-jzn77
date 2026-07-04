/* =============================================================
   Catálogo de Filmes — app.js
   Semana 14: Apresentação Dinâmica de Dados
   Funcionalidades: pesquisa, filtros, cards, paginação,
   tratamento de erros, async/await
   ============================================================= */
'use strict';

// ================================================================
// CONFIGURAÇÃO
// ================================================================
const API_KEY  = 'c0d66930c8c9d888f00fcefe0ae7b614';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w500';

const CATEGORIAS = {
  popular:     'Filmes Populares',
  top_rated:   'Mais Votados',
  now_playing: 'Em Cartaz',
  upcoming:    'Em Breve'
};

// ================================================================
// ESTADO DA APLICAÇÃO
// ================================================================
let estado = {
  tipo:   'popular',
  busca:  '',
  pagina: 1,
  total:  1
};

// ================================================================
// UTILITÁRIOS DE UI
// ================================================================
function mostrarLoading(visivel) {
  document.getElementById('loading').classList.toggle('d-none', !visivel);
}

function mostrarAlerta(mensagem, tipo = 'danger') {
  const el = document.getElementById('alerta');
  const icone = tipo === 'danger' ? 'exclamation-triangle-fill' : 'info-circle-fill';
  el.className = `alert alert-${tipo} d-flex align-items-center`;
  el.innerHTML = `<i class="bi bi-${icone} me-2 flex-shrink-0"></i><span>${mensagem}</span>`;
  el.classList.remove('d-none');
}

function ocultarAlerta() {
  document.getElementById('alerta').classList.add('d-none');
}

function atualizarInfo(texto) {
  document.getElementById('info-resultados').textContent = texto;
}

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
    if (resposta.status === 401) {
      throw new Error('API Key inválida. Verifique a configuração.');
    }
    throw new Error(`Erro ${resposta.status}: ${resposta.statusText}`);
  }

  return resposta.json();
}

// ================================================================
// LISTAR (popular / top_rated / now_playing / upcoming)
// ================================================================
async function listar(tipo, pagina = 1) {
  estado.tipo   = tipo;
  estado.busca  = '';
  estado.pagina = pagina;

  ocultarAlerta();
  mostrarLoading(true);
  limparGrid();

  try {
    const dados = await fetchTMDB(`/movie/${tipo}`, { page: pagina });
    estado.total = dados.total_pages || 1;

    mostrarLoading(false);
    atualizarInfo(`${CATEGORIAS[tipo]} — ${dados.total_results?.toLocaleString('pt-BR')} filmes`);
    renderCards(dados.results || []);
    renderPaginacao();
  } catch (erro) {
    mostrarLoading(false);
    mostrarAlerta(erro.message);
    console.error('[TMDB listar]', erro);
  }
}

// ================================================================
// BUSCAR (pesquisa livre)
// ================================================================
async function buscar(termo, pagina = 1) {
  if (!termo.trim()) return;

  estado.busca  = termo;
  estado.pagina = pagina;

  ocultarAlerta();
  mostrarLoading(true);
  limparGrid();

  try {
    const dados = await fetchTMDB('/search/multi', { query: termo, page: pagina });
    estado.total = dados.total_pages || 1;

    mostrarLoading(false);

    if (!dados.results?.length) {
      atualizarInfo('Nenhum resultado encontrado');
      mostrarAlerta(`Nenhum resultado para "${termo}". Tente outro termo.`, 'warning');
      return;
    }

    atualizarInfo(
      `${dados.total_results.toLocaleString('pt-BR')} resultado(s) para "${termo}"`
    );
    renderCards(dados.results);
    renderPaginacao();
  } catch (erro) {
    mostrarLoading(false);
    mostrarAlerta(erro.message);
    console.error('[TMDB buscar]', erro);
  }
}

// ================================================================
// RENDERIZAÇÃO — CARDS
// ================================================================
function corDaNota(nota) {
  if (nota >= 7) return 'success';
  if (nota >= 5) return 'warning';
  return 'danger';
}

function criarCardHTML(item) {
  const titulo   = item.title || item.name || 'Sem título';
  const ano      = (item.release_date || item.first_air_date || '').substring(0, 4) || '—';
  const nota     = item.vote_average ? item.vote_average.toFixed(1) : '—';
  const votos    = item.vote_count   ? `${item.vote_count.toLocaleString('pt-BR')} votos` : '';
  const sinopse  = item.overview
    ? (item.overview.length > 160 ? item.overview.substring(0, 157) + '…' : item.overview)
    : 'Sinopse não disponível.';
  const badgeTipo = item.media_type === 'tv'
    ? '<span class="badge bg-info text-dark badge-tipo">Série</span>'
    : '<span class="badge bg-primary badge-tipo">Filme</span>';

  const poster = item.poster_path
    ? `<img src="${IMG_URL}${item.poster_path}"
            class="card-img-top poster-img"
            alt="${titulo}"
            loading="lazy">`
    : `<div class="poster-sem-imagem d-flex align-items-center justify-content-center">
         <i class="bi bi-camera-video-off display-3 text-secondary"></i>
       </div>`;

  return `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3">
      <article class="card card-filme h-100 border-0 shadow-sm">
        <div class="position-relative">
          ${poster}
          ${badgeTipo}
          <span class="badge bg-${corDaNota(item.vote_average)} badge-nota">
            <i class="bi bi-star-fill me-1"></i>${nota}
          </span>
        </div>
        <div class="card-body d-flex flex-column">
          <h2 class="card-title h6 fw-bold mb-1">${titulo}</h2>
          <p class="text-muted small mb-2">
            <i class="bi bi-calendar3 me-1"></i>${ano}
            ${votos ? `&nbsp;·&nbsp;<i class="bi bi-people me-1"></i>${votos}` : ''}
          </p>
          <p class="card-text text-secondary small flex-grow-1">${sinopse}</p>
        </div>
      </article>
    </div>
  `;
}

function renderCards(itens) {
  const grid = document.getElementById('grid-filmes');

  if (!itens.length) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-film display-2 text-muted"></i>
        <h3 class="mt-3 text-muted">Nenhum filme encontrado</h3>
      </div>`;
    return;
  }

  grid.innerHTML = itens.map(criarCardHTML).join('');
}

function limparGrid() {
  document.getElementById('grid-filmes').innerHTML = '';
  document.getElementById('paginacao').innerHTML = '';
  atualizarInfo('');
}

// ================================================================
// RENDERIZAÇÃO — PAGINAÇÃO
// ================================================================
function renderPaginacao() {
  const nav = document.getElementById('paginacao');
  const max = Math.min(estado.total, 500);
  if (max <= 1) { nav.innerHTML = ''; return; }

  const atual    = estado.pagina;
  const anterior = atual > 1 ? atual - 1 : null;
  const proxima  = atual < max ? atual + 1 : null;

  const paginas = [];
  for (let i = Math.max(1, atual - 2); i <= Math.min(max, atual + 2); i++) {
    paginas.push(i);
  }

  nav.innerHTML = `
    <ul class="pagination justify-content-center flex-wrap">
      <li class="page-item ${!anterior ? 'disabled' : ''}">
        <button class="page-link" data-pagina="${anterior}" ${!anterior ? 'disabled' : ''}>
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
      ${paginas.map(p => `
        <li class="page-item ${p === atual ? 'active' : ''}">
          <button class="page-link" data-pagina="${p}">${p}</button>
        </li>
      `).join('')}
      <li class="page-item ${!proxima ? 'disabled' : ''}">
        <button class="page-link" data-pagina="${proxima}" ${!proxima ? 'disabled' : ''}>
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
    </ul>`;

  nav.querySelectorAll('button[data-pagina]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pagina = Number(btn.dataset.pagina);
      if (!pagina) return;
      if (estado.busca) {
        buscar(estado.busca, pagina);
      } else {
        listar(estado.tipo, pagina);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ================================================================
// FILTROS — ativar botão selecionado
// ================================================================
function ativarFiltro(tipo) {
  document.querySelectorAll('.btn-filtro').forEach(btn => {
    const ativo = btn.dataset.tipo === tipo;
    btn.classList.toggle('btn-primary', ativo);
    btn.classList.toggle('active', ativo);
    btn.classList.toggle('btn-outline-primary', !ativo);
  });

  document.querySelectorAll('.btn-filtro-nav').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tipo === tipo);
  });
}

// ================================================================
// INICIALIZAÇÃO
// ================================================================
document.addEventListener('DOMContentLoaded', () => {

  listar('popular');

  document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo;
      ativarFiltro(tipo);
      document.getElementById('input-busca').value = '';
      listar(tipo);
    });
  });

  document.querySelectorAll('.btn-filtro-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo;
      ativarFiltro(tipo);
      document.getElementById('input-busca').value = '';
      listar(tipo);
    });
  });

  document.getElementById('form-busca').addEventListener('submit', (e) => {
    e.preventDefault();
    const termo = document.getElementById('input-busca').value.trim();
    if (!termo) return;

    document.querySelectorAll('.btn-filtro, .btn-filtro-nav').forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-outline-primary');
    });

    buscar(termo);
  });

});
