let musicas = [];
let listaAtual = [];
let emModoPastas = false;

window.onload = () => {
  carregarMusicas();
  configurarBotaoPasta();
  configurarBusca();
};

async function carregarMusicas() {
  console.log("Iniciando busca de músicas...");

  try {
    if (typeof CONFIG === "undefined" || !CONFIG.API_URL) {
      throw new Error("CONFIG.API_URL não está definida em config.js");
    }

    // Normaliza a URL base da API sem barra no final
    const baseUrl = CONFIG.API_URL.replace(/\/$/, "");

    const resposta = await fetch(baseUrl);

    if (!resposta.ok) {
      throw new Error(`Erro na API (${resposta.status}): ${resposta.statusText}`);
    }

    const dadosBrutos = await resposta.json();

    if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
      const container = obterContainerLista();
      if (container) {
        container.innerHTML = `<div style="padding:30px;color:#e6c200">Nenhuma música encontrada no catálogo.</div>`;
      }
      return;
    }

    // Trata e monta a URL completa da mídia
    musicas = dadosBrutos.map((item) => {
      // Identifica a chave do arquivo no R2
      const chaveArquivo = item.key || item.id || item.caminho;

      // Se item.url já existir, usa ela; caso contrário, constrói apontando para a rota /audio
      let urlFinal = item.url || item.src || item.urlAudio;
      
      if (!urlFinal && chaveArquivo) {
        urlFinal = `${baseUrl}/audio?key=${encodeURIComponent(chaveArquivo)}`;
      }

      return {
        ...item,
        titulo: item.titulo || item.nome || item.title || "Sem Título",
        artista: item.artista || item.artist || "Artista Desconhecido",
        pasta: item.pasta || item.categoria || item.genero || item.artista || "Outros",
        capa: item.capa || item.cover || "assets/capa-default.jpg",
        url: urlFinal,
        src: urlFinal,
        urlAudio: urlFinal
      };
    });

    window.musicas = musicas;
    mostrarMusicas(musicas);
  } catch (erro) {
    console.error("Erro em carregarMusicas:", erro);
    const container = obterContainerLista();
    if (container) {
      container.innerHTML = `<div style="padding:30px;color:#ff4444">Não foi possível carregar as músicas online.</div>`;
    }
  }
}

function obterContainerLista() {
  return document.getElementById("lista-musicas") || document.querySelector(".lista");
}

function mostrarMusicas(lista) {
  emModoPastas = false;
  listaAtual = lista;
  window.musicas = listaAtual;

  const container = document.getElementById("lista-musicas") || document.querySelector(".lista");
  if (!container) return;

  container.innerHTML = "";

  lista.forEach((musica, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.cursor = "pointer";

    const imagemCapa = musica.capa || "assets/capa-default.jpg";

    card.innerHTML = `
      <img src="${imagemCapa}" alt="${musica.titulo}">
      <div class="card-info">
        <h3>${musica.titulo}</h3>
        <p>${musica.artista}</p>
      </div>
    `;

    // DISPARO DIRETO E GARANTIDO
    card.addEventListener("click", () => {
      console.log("Clicou no card:", musica.titulo);
      if (typeof window.tocarMusica === "function") {
        window.tocarMusica(index);
      } else {
        console.error("window.tocarMusica não está disponível!");
      }
    });

    container.appendChild(card);
  });
}

function mostrarPastas() {
  emModoPastas = true;
  const container = obterContainerLista();
  if (!container) return;

  container.innerHTML = "";

  const pastas = {};
  musicas.forEach((musica) => {
    const nomePasta = musica.pasta || "Geral";
    if (!pastas[nomePasta]) {
      pastas[nomePasta] = [];
    }
    pastas[nomePasta].push(musica);
  });

  Object.keys(pastas).forEach((nomePasta) => {
    const qtd = pastas[nomePasta].length;
    const card = document.createElement("div");
    card.className = "card card-pasta";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <div style="height:200px; background:#1f1f1f; display:flex; align-items:center; justify-content:center; font-size:64px; border-bottom: 1px solid #333;">
        📁
      </div>
      <div class="card-info">
        <h3>${nomePasta}</h3>
        <p>${qtd} ${qtd === 1 ? "música" : "músicas"}</p>
      </div>
    `;

    card.onclick = () => {
      mostrarMusicas(pastas[nomePasta]);
      const btnPasta = document.getElementById("btn-pasta");
      if (btnPasta) btnPasta.innerHTML = "🎵 Ver Todas";
    };

    container.appendChild(card);
  });
}

function configurarBotaoPasta() {
  const btnPasta = document.getElementById("btn-pasta") || document.querySelector(".btn-pasta");
  if (!btnPasta) return;

  btnPasta.onclick = () => {
    if (emModoPastas) {
      mostrarMusicas(musicas);
      btnPasta.innerHTML = "📁 Ver por Pastas";
    } else {
      mostrarPastas();
      btnPasta.innerHTML = "🎵 Ver Todas";
    }
  };
}

function configurarBusca() {
  const campoBusca = document.querySelector("header input");
  if (!campoBusca) return;

  campoBusca.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase().trim();

    if (!termo) {
      mostrarMusicas(musicas);
      return;
    }

    const filtradas = musicas.filter(
      (m) =>
        m.titulo.toLowerCase().includes(termo) ||
        m.artista.toLowerCase().includes(termo) ||
        m.pasta.toLowerCase().includes(termo)
    );

    mostrarMusicas(filtradas);
  });
}
