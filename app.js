let musicas = [];

// Função JSONP para buscar capa no Deezer (evita erro de CORS no GitHub Pages)
function buscarCapaDeezer(termo, callback) {
    if (!termo) return;
    const script = document.createElement('script');
    const callbackName = 'deezer_cb_' + Math.random().toString(36).substr(2, 9);
    
    window[callbackName] = function(data) {
        if (data && data.data && data.data.length > 0) {
            callback(data.data[0]);
        }
        delete window[callbackName];
        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }
    };

    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(termo)}&output=jsonp&callback=${callbackName}`;
    document.body.appendChild(script);
}

// Carrega as músicas do R2 e busca as capas no Deezer
async function carregarMusicas() {
    console.log("Buscando catálogo de músicas...");
    
    try {
        if (typeof CONFIG === 'undefined' || !CONFIG.API_URL) {
            throw new Error("CONFIG.API_URL não foi configurada.");
        }

        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error(`Erro na API: ${resposta.status}`);
        }

        const dadosBrutos = await resposta.json();

        if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
            const container = document.getElementById("lista-musicas");
            if (container) {
                container.innerHTML = `<div style="padding:30px;color:#e6c200">Nenhuma música encontrada.</div>`;
            }
            return;
        }

        // 1. Mapeia com dados locais primeiro
        musicas = dadosBrutos.map(item => ({
            ...item,
            titulo: item.titulo || item.nome || item.title || "Sem Título",
            artista: item.artista || item.artist || "Artista Desconhecido",
            capa: item.capa || item.cover || "assets/capa-default.jpg"[cite: 1]
        }));

        // Renderiza no HTML imediatamente
        mostrarMusicas(musicas);

        // 2. Atualiza capas via Deezer em background
        musicas.forEach((musica, index) => {
            const termo = `${musica.titulo} ${musica.artista}`.trim();
            buscarCapaDeezer(termo, (dadosDeezer) => {
                if (dadosDeezer && dadosDeezer.album && dadosDeezer.album.cover_medium) {
                    musicas[index].capa = dadosDeezer.album.cover_medium;
                    mostrarMusicas(musicas);
                }
            });
        });

    } catch (erro) {
        console.error("Erro ao carregar:", erro);
        const container = document.getElementById("lista-musicas");
        if (container) {
            container.innerHTML = `<div style="padding:30px;color:#ff4444"><strong>Erro:</strong> ${erro.message}</div>`;
        }
    }
}

// Renderiza a lista de cards na tela
function mostrarMusicas(lista) {
    const container = document.getElementById("lista-musicas");
    if (!container) return;

    container.innerHTML = "";

    lista.forEach((musica, index) => {
        const card = document.createElement("div");
        card.className = "card";

        const imagemCapa = musica.capa || "assets/capa-default.jpg";[cite: 1]

        card.innerHTML = `
            <img src="${imagemCapa}" alt="${musica.titulo}">
            <div class="card-info">
                <h3>${musica.titulo}</h3>
                <p>${musica.artista}</p>
            </div>
        `;

        card.onclick = function() {
            if (typeof tocarMusica === 'function') {
                tocarMusica(index);
            }
        };

        container.appendChild(card);
    });
}

// Inicializa no carregamento da página
window.onload = function() {
    carregarMusicas();
};
