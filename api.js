let musicas = [];
let pastaAtual = "";

// Carregamento inicial (Padrão)
async function carregarMusicas() {
  try {
    const resposta = await fetch(CONFIG.API_URL);
    if (!resposta.ok) throw new Error("Erro ao acessar a API");

    const dados = await resposta.json();
    
    // Se a API retornar objeto ou array
    const listaGeral = dados.files || (Array.isArray(dados) ? dados : []);

    musicas = listaGeral
      .filter(item => {
        const k = item.key || item.name || "";
        return k.endsWith('.mp3') || k.endsWith('.wav') || k.endsWith('.m4a');
      })
      .map(item => ({
        titulo: item.key ? item.key.split('/').pop() : 'Música',
        artista: 'PH MUSIC',
        url: `${CONFIG.API_URL}/${item.key}`
      }));

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

// Buscar Pastas e Músicas do R2
async function buscarConteudoPasta(prefixo = "") {
  pastaAtual = prefixo;
  const container = document.getElementById("conteudo-pastas");
  const elementoCaminho = document.getElementById("caminho-atual");
  
  if (elementoCaminho) {
    elementoCaminho.textContent = prefixo === "" ? " / (Raiz)" : ` / ${prefixo}`;
  }
  
  container.innerHTML = "<p style='padding:15px; color:#888;'>📂 Carregando pastas...</p>";

  try {
    const url = `${CONFIG.API_URL}?prefix=${encodeURIComponent(prefixo)}`;
    console.log("Requisitando R2:", url);

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Erro de conexão com o Worker/R2");

    const dados = await resposta.json();
    console.log("Resposta R2:", dados);

    container.innerHTML = "";

    // 1. Botão para Voltar de Pasta
    if (prefixo !== "") {
      const itemVoltar = document.createElement("div");
      itemVoltar.className = "item-pasta pasta-voltar";
      itemVoltar.innerHTML = "🔙 <strong>.. (Voltar)</strong>";
      itemVoltar.style.cssText = "padding: 12px; color: #00ff66; cursor: pointer; border-bottom: 1px solid #333;";

      itemVoltar.onclick = () => {
        const partes = prefixo.split("/").filter(Boolean);
        partes.pop();
        const novoPrefixo = partes.length > 0 ? partes.join("/") + "/" : "";
        buscarConteudoPasta(novoPrefixo);
      };
      container.appendChild(itemVoltar);
    }

    // 2. Listar Pastas (ex: 1 SERTANEJO/, Raça Negra/, etc.)
    const pastas = dados.folders || [];
    if (pastas.length > 0) {
      pastas.forEach((pastaPath) => {
        const item = document.createElement("div");
        item.className = "item-pasta";
        
        // Remove o prefixo pai para exibir apenas o nome da pasta
        let nomeExibicao = pastaPath.replace(prefixo, "");
        if (nomeExibicao.endsWith("/")) nomeExibicao = nomeExibicao.slice(0, -1);

        item.innerHTML = `📁 <strong>${nomeExibicao}</strong>`;
        item.style.cssText = "padding: 12px; cursor: pointer; border-bottom: 1px solid #282828; color: #fff;";

        item.onclick = () => {
          buscarConteudoPasta(pastaPath);
        };
        container.appendChild(item);
      });
    }

    // 3. Listar Arquivos de Áudio da Pasta
    const arquivos = dados.files || [];
    const faixasDaPasta = [];

    arquivos.forEach((file) => {
      const key = file.key || "";
      if (key.endsWith(".mp3") || key.endsWith(".wav") || key.endsWith(".m4a")) {
        const nomeMusica = key.split("/").pop();
        faixasDaPasta.push({
          titulo: nomeMusica,
          artista: prefixo ? prefixo.replace("/", "") : "PH MUSIC",
          url: `${CONFIG.API_URL}/${key}`
        });
      }
    });

    if (faixasDaPasta.length > 0) {
      faixasDaPasta.forEach((musica) => {
        const item = document.createElement("div");
        item.className = "item-arquivo";
        item.innerHTML = `🎵 ${musica.titulo}`;
        item.style.cssText = "padding: 12px; cursor: pointer; border-bottom: 1px solid #222; color: #b3b3b3;";

        item.onclick = () => {
          musicas = faixasDaPasta;
          mostrarMusicas(musicas);
          const index = musicas.findIndex(m => m.url === musica.url);
          tocarMusica(index >= 0 ? index : 0);
          
          const modal = document.getElementById("modal-pastas");
          if (modal) modal.classList.add("hidden");
        };
        container.appendChild(item);
      });
    }

    if (pastas.length === 0 && faixasDaPasta.length === 0) {
      container.innerHTML = "<p style='padding:20px; color:#aaa;'>Nenhuma subpasta ou música encontrada aqui.</p>";
    }

  } catch (erro) {
    console.error("Erro ao carregar pastas:", erro);
    container.innerHTML = `<p style='padding:20px; color:#ff4444;'>Erro ao carregar diretórios do R2.<br><small>${erro.message}</small></p>`;
  }
}
