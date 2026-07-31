let musicas = [];
let pastaAtual = "";

// Função para gerar a URL correta do áudio (usando R2_URL ou fallback)
function obterUrlAudio(key) {
  const baseUrl = CONFIG.R2_URL || CONFIG.API_URL;
  // Remove barra inicial/final se houver para evitar URL dupla
  const urlLimpa = baseUrl.replace(/\/$/, "");
  const keyLimpa = key.replace(/^\//, "");
  return `${urlLimpa}/${encodeURIComponent(keyLimpa).replace(/%2F/g, "/")}`;
}

// Carregamento Inicial das Músicas
async function carregarMusicas() {
  const container = document.getElementById("lista-musicas");
  if (container) container.innerHTML = "<p style='padding:20px; color:#888;'>Carregando biblioteca...</p>";

  try {
    const resposta = await fetch(CONFIG.API_URL);
    if (!resposta.ok) throw new Error("Erro ao acessar a API");

    const dados = await resposta.json();
    console.log("Dados recebidos da API:", dados);

    const arquivos = dados.files || (Array.isArray(dados) ? dados : []);

    musicas = arquivos
      .filter(item => {
        const k = (item.key || item.name || "").toLowerCase();
        return k.endsWith('.mp3') || k.endsWith('.wav') || k.endsWith('.m4a') || k.endsWith('.aac') || k.endsWith('.flac');
      })
      .map(item => ({
        titulo: item.key ? item.key.split('/').pop() : 'Música',
        artista: 'PH MUSIC',
        url: obterUrlAudio(item.key)
      }));

    console.log("Músicas processadas na raiz:", musicas);

    if (musicas.length > 0) {
      mostrarMusicas(musicas);
    } else {
      if (container) {
        container.innerHTML = `
          <div style="padding:20px; color:#aaa">
            Nenhuma música na raiz. Clique em <strong style="color:#00ff66; cursor:pointer;" onclick="document.getElementById('btn-pastas').click()">📁 Procurar por Pastas</strong> para navegar no R2.
          </div>
        `;
      }
    }

  } catch (erro) {
    console.error("Erro ao carregar músicas:", erro);
    if (container) {
      container.innerHTML = `<div style="padding:20px; color:#ff4444">Erro ao conectar com a API.</div>`;
    }
  }
}

// Navegador de Pastas R2
async function buscarConteudoPasta(prefixo = "") {
  pastaAtual = prefixo;
  const container = document.getElementById("conteudo-pastas");
  const elementoCaminho = document.getElementById("caminho-atual");

  if (elementoCaminho) {
    elementoCaminho.textContent = prefixo === "" ? " / (Raiz)" : ` / ${prefixo}`;
  }

  if (container) {
    container.innerHTML = "<p style='padding:15px; color:#888;'>📂 Carregando pastas do R2...</p>";
  }

  try {
    const url = `${CONFIG.API_URL}?prefix=${encodeURIComponent(prefixo)}`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Erro de conexão com o R2");

    const dados = await resposta.json();
    if (!container) return;
    
    container.innerHTML = "";

    // 1. Botão Voltar
    if (prefixo !== "") {
      const itemVoltar = document.createElement("div");
      itemVoltar.className = "item-pasta pasta-voltar";
      itemVoltar.innerHTML = "🔙 <strong>.. (Voltar para pasta anterior)</strong>";
      itemVoltar.style.cssText = "padding: 12px; color: #00ff66; cursor: pointer; border-bottom: 1px solid #333;";

      itemVoltar.onclick = () => {
        const partes = prefixo.split("/").filter(Boolean);
        partes.pop();
        const novoPrefixo = partes.length > 0 ? partes.join("/") + "/" : "";
        buscarConteudoPasta(novoPrefixo);
      };
      container.appendChild(itemVoltar);
    }

    // 2. Subpastas
    const pastas = dados.folders || [];
    if (pastas.length > 0) {
      pastas.forEach((pastaPath) => {
        const item = document.createElement("div");
        item.className = "item-pasta";

        let nomeExibicao = pastaPath.replace(prefixo, "");
        if (nomeExibicao.endsWith("/")) nomeExibicao = nomeExibicao.slice(0, -1);

        item.innerHTML = `📁 <strong>${nomeExibicao}</strong>`;
        item.style.cssText = "padding: 12px; cursor: pointer; border-bottom: 1px solid #282828; color: #fff;";

        item.onclick = () => buscarConteudoPasta(pastaPath);
        container.appendChild(item);
      });
    }

    // 3. Músicas da pasta selecionada
    const arquivos = dados.files || [];
    const faixasDaPasta = [];

    arquivos.forEach((file) => {
      const key = file.key || "";
      const keyLower = key.toLowerCase();
      if (keyLower.endsWith(".mp3") || keyLower.endsWith(".wav") || keyLower.endsWith(".m4a") || keyLower.endsWith(".aac") || keyLower.endsWith(".flac")) {
        const nomeMusica = key.split("/").pop();
        faixasDaPasta.push({
          titulo: nomeMusica,
          artista: prefixo ? prefixo.replace("/", "") : "PH MUSIC",
          url: obterUrlAudio(key)
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
      container.innerHTML = "<p style='padding:20px; color:#aaa;'>Nenhuma subpasta ou música encontrada nesta pasta.</p>";
    }

  } catch (erro) {
    console.error("Erro ao carregar pastas:", erro);
    if (container) {
      container.innerHTML = `<p style='padding:20px; color:#ff4444;'>Erro ao conectar no R2.<br><small>${erro.message}</small></p>`;
    }
  }
}
