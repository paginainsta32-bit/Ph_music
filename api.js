let musicas = [];
let pastaAtual = "";

// Carregamento Padrão Inicial
async function carregarMusicas() {
  try {
    const resposta = await fetch(CONFIG.API_URL);
    if (!resposta.ok) throw new Error("Erro ao acessar a API");

    musicas = await resposta.json();
    console.log("Músicas carregadas:", musicas);
    mostrarMusicas(musicas);
  } catch (erro) {
    console.error(erro);
    document.getElementById("lista-musicas").innerHTML = `
            <div style="padding:30px;color:#ff4444">
                Não foi possível carregar as músicas.
            </div>
        `;
  }
}

// Buscar Pastas e Arquivos no Worker R2
async function buscarConteudoPasta(prefixo = "") {
  pastaAtual = prefixo;
  const container = document.getElementById("conteudo-pastas");
  const elementoCaminho = document.getElementById("caminho-atual");
  elementoCaminho.textContent = `/${prefixo}`;
  container.innerHTML = "<p class='loading'>Carregando diretórios...</p>";

  try {
    const url = `${CONFIG.API_URL}/folders?prefix=${encodeURIComponent(prefixo)}`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Erro ao consultar pastas no R2");

    const dados = await resposta.json();
    container.innerHTML = "";

    // Botão de Voltar para Diretório Pai
    if (prefixo !== "") {
      const itemVoltar = document.createElement("div");
      itemVoltar.className = "item-pasta pasta-voltar";
      itemVoltar.innerHTML = "📁 .. (Voltar)";
      itemVoltar.onclick = () => {
        const partes = prefixo.split("/").filter(Boolean);
        partes.pop();
        const novoPrefixo = partes.length > 0 ? partes.join("/") + "/" : "";
        buscarConteudoPasta(novoPrefixo);
      };
      container.appendChild(itemVoltar);
    }

    // Listar Subpastas
    if (dados.folders && dados.folders.length > 0) {
      dados.folders.forEach((pasta) => {
        const item = document.createElement("div");
        item.className = "item-pasta";
        const nomePasta = pasta.replace(prefixo, "");
        item.innerHTML = `📁 ${nomePasta}`;
        item.onclick = () => buscarConteudoPasta(pasta);
        container.appendChild(item);
      });
    }

    // Listar e Carregar Músicas da Pasta Atual na Fila do Player
    if (dados.files && dados.files.length > 0) {
      const musicasDaPasta = dados.files
        .filter((f) => f.key.endsWith(".mp3") || f.key.endsWith(".wav") || f.key.endsWith(".m4a"))
        .map((f) => ({
          titulo: f.key.split("/").pop(),
          artista: prefixo ? prefixo.replace("/", "") : "R2 Storage",
          url: `${CONFIG.API_URL}/file/${f.key}`
        }));

      musicasDaPasta.forEach((musica) => {
        const item = document.createElement("div");
        item.className = "item-arquivo";
        item.innerHTML = `🎵 ${musica.titulo}`;
        item.onclick = () => {
          musicas = musicasDaPasta;
          mostrarMusicas(musicas);
          const idx = musicas.findIndex((m) => m.url === musica.url);
          tocarMusica(idx);
          document.getElementById("modal-pastas").classList.add("hidden");
        };
        container.appendChild(item);
      });
    }
  } catch (erro) {
    console.error(erro);
    container.innerHTML = "<p style='color:#ff4444'>Erro ao carregar diretórios do R2.</p>";
  }
}
