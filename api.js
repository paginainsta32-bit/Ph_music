let musicas = [];
let pastaAtual = "";

// Carregamento Padrão Inicial de Músicas
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
  
  if (elementoCaminho) elementoCaminho.textContent = `/${prefixo}`;
  container.innerHTML = "<p class='loading' style='padding:15px; color:#888;'>Carregando pastas e arquivos...</p>";

  try {
    // Monta a URL de busca de pastas
    const url = `${CONFIG.API_URL}?prefix=${encodeURIComponent(prefixo)}`;
    console.log("Buscando pastas na URL:", url);

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Erro ao consultar a API");

    const dados = await resposta.json();
    console.log("Dados recebidos da API R2:", dados); // Veja isso no Console (F12)

    container.innerHTML = "";

    // Botão de Voltar para a Pasta Anterior
    if (prefixo !== "") {
      const itemVoltar = document.createElement("div");
      itemVoltar.className = "item-pasta pasta-voltar";
      itemVoltar.innerHTML = "📂 <strong>.. (Voltar)</strong>";
      itemVoltar.style.cursor = "pointer";
      itemVoltar.style.padding = "10px";
      itemVoltar.style.color = "#00ff66";

      itemVoltar.onclick = () => {
        const partes = prefixo.split("/").filter(Boolean);
        partes.pop();
        const novoPrefixo = partes.length > 0 ? partes.join("/") + "/" : "";
        buscarConteudoPasta(novoPrefixo);
      };
      container.appendChild(itemVoltar);
    }

    // 1. PROCESSAR SUBPASTAS (Garantindo compatibilidade com objetos ou delimitadores)
    const pastas = dados.folders || dados.delimitedPrefixes || [];
    
    if (pastas.length > 0) {
      pastas.forEach((pasta) => {
        const item = document.createElement("div");
        item.className = "item-pasta";
        const nomePasta = pasta.replace(prefixo, "").replace("/", "");
        item.innerHTML = `📁 ${nomePasta}`;
        item.style.cursor = "pointer";
        item.style.padding = "10px";
        item.style.borderBottom = "1px solid #282828";
        
        item.onclick = () => buscarConteudoPasta(pasta.endsWith("/") ? pasta : pasta + "/");
        container.appendChild(item);
      });
    }

    // 2. PROCESSAR ARQUIVOS DA PASTA
    const arquivos = dados.files || (Array.isArray(dados) ? dados : dados.objects) || [];
    
    // Filtrar apenas arquivos de áudio válidos
    const musicasDaPasta = arquivos
      .filter((f) => {
        const key = f.key || f.titulo || f.name || f.url || "";
        return key.endsWith(".mp3") || key.endsWith(".wav") || key.endsWith(".m4a") || key.endsWith(".aac");
      })
      .map((f) => {
        const rawKey = f.key || f.name || f.titulo || "";
        const nomeArquivo = rawKey.split("/").pop();
        return {
          titulo: f.titulo || nomeArquivo,
          artista: prefixo ? prefixo.replace("/", "") : (f.artista || "R2 Storage"),
          url: f.url || `${CONFIG.API_URL}/file/${rawKey}`
        };
      });

    if (musicasDaPasta.length > 0) {
      musicasDaPasta.forEach((musica) => {
        const item = document.createElement("div");
        item.className = "item-arquivo";
        item.innerHTML = `🎵 ${musica.titulo}`;
        item.style.cursor = "pointer";
        item.style.padding = "10px";
        item.style.borderBottom = "1px solid #282828";

        item.onclick = () => {
          musicas = musicasDaPasta;
          mostrarMusicas(musicas);
          const idx = musicas.findIndex((m) => m.url === musica.url);
          tocarMusica(idx >= 0 ? idx : 0);
          
          const modal = document.getElementById("modal-pastas");
          if (modal) modal.classList.add("hidden");
        };
        container.appendChild(item);
      });
    }

    // Se nada for encontrado
    if (pastas.length === 0 && musicasDaPasta.length === 0) {
      container.innerHTML = "<p style='padding:15px; color:#aaa;'>Nenhuma subpasta ou música encontrada neste diretório.</p>";
    }

  } catch (erro) {
    console.error("Erro no buscarConteudoPasta:", erro);
    container.innerHTML = `<p style='padding:15px; color:#ff4444;'>Erro ao carregar diretórios do R2. Verifique o console (F12).</p>`;
  }
}
