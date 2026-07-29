let musicas = [];

// Função que busca capas no Deezer via JSONP (sem bloqueio de CORS/Proxy)
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

async function carregarMusicas() {
    console.log("Iniciando busca de músicas...");
    
    try {
        if (typeof CONFIG === 'undefined' || !CONFIG.API_URL) {
            throw new Error("CONFIG.API_URL não definida em config.js!");
        }

        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error(`Erro na API (${resposta.status}): ${resposta.statusText}`);
        }

        const dadosBrutos = await resposta.json();
        console.log("Músicas recebidas da API:", dadosBrutos);

        if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
            const listaEl = document.getElementById("lista-musicas");
            if (listaEl) {
                listaEl.innerHTML = `
                    <div style="padding:30px;color:#e6c200">
                        Nenhuma música encontrada no catálogo.
                    </div>
                `;
            }
            return;
        }

        // 1. Prepara a lista com os dados do R2 imediatamente
        musicas = dadosBrutos.map(item => ({
            ...item,
            titulo: item.titulo || item.nome || item.title || "Sem Título",
            artista: item.artista || item.artist || "Artista Desconhecido",
            capa: item.capa || item.cover || "assets/capa-default.jpg"[cite: 1]
        }));

        // Renderiza no HTML instantaneamente
        if (typeof mostrarMusicas === 'function') {
            mostrarMusicas(musicas);
        }

        // 2. Busca as capas reais no Deezer em background
        musicas.forEach((musica, index) => {
            const termo = `${musica.titulo} ${musica.artista}`.trim();
            buscarCapaDeezer(termo, (dadosDeezer) => {
                if (dadosDeezer && dadosDeezer.album && dadosDeezer.album.cover_medium) {
                    musicas[index].capa = dadosDeezer.album.cover_medium;
                    if (typeof mostrarMusicas === 'function') {
                        mostrarMusicas(musicas);
                    }
                }
            });
        });

    } catch (erro) {
        console.error("Erro em carregarMusicas:", erro);

        const container = document.getElementById("lista-musicas");
        if (container) {
            container.innerHTML = `
                <div style="padding:30px;color:#ff4444">
                    <strong>Erro ao carregar músicas:</strong> ${erro.message}
                </div>
            `;
        }
    }
}
