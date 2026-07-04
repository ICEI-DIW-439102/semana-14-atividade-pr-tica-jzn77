[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/jbkAuwcN)

# Trabalho Prático - Semana 14

A partir dos dados que você tem no seu projeto, vamos trabalhar formas de apresentação que representem de forma clara e interativa essas informações. Você poderá usar gráficos (barra, linha, pizza), mapas, calendários ou outras formas de visualização. Seu desafio é entregar uma página Web que organize, processe e exiba os dados de forma compreensível e esteticamente agradável.

Com base nos tipos de projetos escohidos, você deve propor **visualizações que estimulem a interpretação, agrupamento e exibição criativa dos dados**, trabalhando tanto a lógica quanto o design da aplicação.

Sugerimos o uso das seguintes ferramentas acessíveis: [FullCalendar](https://fullcalendar.io/), [Chart.js](https://www.chartjs.org/), [Mapbox](https://docs.mapbox.com/api/), para citar algumas.

## Informações do trabalho

- Nome: João Pedro Lemos Faria
- Matricula: (inserir matrícula)
- Proposta de projeto escolhida: Catálogo de Filmes
- Breve descrição sobre seu projeto: Catálogo interativo de filmes integrado com a API pública do TMDB (The Movie Database). O projeto permite explorar filmes populares, mais votados, em cartaz e em breve, além de busca por título. Na semana 14, foi adicionada uma página de visualização dinâmica com gráficos gerados via Chart.js a partir dos dados consumidos diretamente da API do TMDB.

## Implementação da visualização dinâmica

A página `graficos.html` apresenta três visualizações interativas com dados reais obtidos do TMDB:

- **Gráfico de pizza** — distribuição percentual dos filmes por gênero (ação, drama, comédia, etc.)
- **Gráfico de barras** — nota média de avaliação por gênero, permitindo comparar a qualidade percebida entre categorias
- **Gráfico de barras horizontal** — quantidade total de filmes por gênero, em ordem decrescente

Os dados são coletados a cada acesso buscando filmes populares e mais votados da API do TMDB (6 páginas = ~120 filmes únicos), processados em JavaScript puro e renderizados com a biblioteca **Chart.js 4.x** sem dependências adicionais.

A página também exibe quatro cards com estatísticas gerais: total de filmes analisados, nota média geral, gênero mais frequente e filme mais bem avaliado.

## Prints da tela

### Tela 1 — Página de gráficos com pizza e barras de nota

> Captura mostrando os cards de estatísticas, o gráfico de pizza com a distribuição por gênero e o gráfico de barras com a nota média por gênero.

![Tela 1 - Gráficos](print1.png)

### Tela 2 — Gráfico de barras horizontal e catálogo de filmes

> Captura mostrando o gráfico de barras horizontal com a quantidade de filmes por gênero e a página principal do catálogo com os cards de filmes.

![Tela 2 - Catálogo](print2.png)
