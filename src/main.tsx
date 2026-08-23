import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { getRouter } from "./router";
import "./styles.css";

// Cada publicação gera arquivos de código com nomes novos e apaga os antigos.
// Uma aba aberta desde antes da publicação continua pedindo os arquivos velhos:
// a navegação falha com "Importing a module script failed" e a tela mostra um
// erro de carregamento que recarregar resolve. Fazemos isso automaticamente.
//
// A marca de tempo evita laço de recarga: se a falha se repetir logo em
// seguida, a causa é outra (rede, arquivo corrompido) e o erro segue para a
// tela, onde é possível ler a mensagem.
const CHAVE_RECARGA = "contingencia.recarga-por-versao-nova";
const INTERVALO_MINIMO = 15_000;

window.addEventListener("vite:preloadError", (evento) => {
  let ultima = 0;
  try {
    ultima = Number(window.sessionStorage.getItem(CHAVE_RECARGA) ?? 0);
  } catch {
    // Navegador sem sessionStorage disponível: segue com uma única tentativa.
  }
  if (Date.now() - ultima < INTERVALO_MINIMO) return;

  evento.preventDefault();
  try {
    window.sessionStorage.setItem(CHAVE_RECARGA, String(Date.now()));
  } catch {
    // Sem registro não há proteção contra laço, mas recarregar ainda é o
    // comportamento certo para o caso comum.
  }
  window.location.reload();
});

const container = document.getElementById("root");
if (!container) throw new Error('Elemento raiz "#root" não encontrado.');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={getRouter()} />
  </StrictMode>,
);
