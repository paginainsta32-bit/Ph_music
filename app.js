let musicas = [];
let listaAtual = []; // Guarda a lista que está sendo exibida no momento
let emModoPastas = false;

window.onload = () => {
  carregarMusicas();
  configurarBotaoPasta();
  configurarBusca();
};

// Busca as músicas na sua API/R2
async function carregarMusicas() {
  console.log("Iniciando busca de músicas...");

  try {
    if (typeof CONFIG === "undefined" || !CONFIG.API_URL) {
      throw new Error("CONFIG.API_URL não está definida em config.js");
    }

    const resposta = await fetch(CONFIG.API_URL);

    if (!resposta.ok) {
      throw new Error(`Erro na API (${resposta.status}): ${resposta.statusText}`);
    }

    const dadosBrutos = await resposta.json();

    if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
      const container = document.getElementById("lista-musicas");
      if (container) {
        container.innerHTML = `<div style="padding:30px;color:#e6c200">Nenhuma música encontrada no catálogo.</div>`;
      }
      return;
    }

    // Mapeia os dados da API garantindo os campos necessários
    musicas = dadosBrutos.map((item) => ({
      ...item,
      titulo: item.titulo || item.nome || item.title || "Sem Título",
      artista: item.artista || item.artist || "Artista Desconhecido",
      pasta: item.pasta || item.categoria || item.genero || item.artista || "Outros",
      capa: item.capa || item.cover || "assets/capa-default.jpg",
      // Garante que a propriedade URL/src exista para o player tocar
      url: item.url || item.src || item.urlAudio,
    }));

    // Sincroniza a variável global que o player.js consome
    window.musicas = musicas;

    mostrarMusicas(musicas);
  } catch (erro) {
    console.error("Erro em carregarMusicas:", erro);
    const container = document.getElementById("lista-musicas");
    if (container) {
      container.innerHTML = `<div style="padding:30px;color:#ff4444">Não foi possível carregar as músicas online.</div>`;
    }
  }
}

// Renderiza a lista de músicas
function mostrarMusicas(lista) {
  emModoPastas = false;
  listaAtual = lista;

  const container = document.getElementById("lista-musicas");
  if (!container) return;

  container.innerHTML = "";

  lista.forEach((musica, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const imagemCapa = musica.capa || "assets/capa-default.jpg";

    card.innerHTML = `
      <img src="${imagemCapa}" alt="${musica.titulo}">
      <div class="card-info">
        <h3>${musica.titulo}</h3>
        <p>${musica.artista}</p>
      </div>
    `;

    card.onclick = () => {
      // Sincroniza a playlist ativa globalmente com a lista exibida na tela
      window.musicas = listaAtual;

      if (typeof tocarMusica === "function") {
        tocarMusica(index);
      }
    };

    container.appendChild(card);
  });
}

// Agrupa as músicas por pasta e mostra na tela
function mostrarPastas() {
  emModoPastas = true;
  const container = document.getElementById("lista-musicas");
  if (!container) return;

  container.innerHTML = "";

  // Agrupa as músicas pelos nomes das pastas
  const pastas = {};
  musicas.forEach((musica) => {
    const nomePasta = musica.pasta || "Geral";
    if (!pastas[nomePasta]) {
      pastas[nomePasta] = [];
    }
    pastas[nomePasta].push(musica);
  });

  // Cria os cards visuais para cada pasta
  Object.keys(pastas).forEach((nomePasta) => {
    const qtd = pastas[nomePasta].length;
    const card = document.createElement("div");
    card.className = "card card-pasta";

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

// Configuração do botão "Ver por Pastas"
function configurarBotaoPasta() {
  const btnPasta = document.getElementById("btn-pasta");
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

// Configuração da barra de pesquisa em tempo real
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
