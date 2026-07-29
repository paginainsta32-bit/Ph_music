let musicas = [];

/**
 * Busca metadados de uma faixa no Deezer de forma segura
 * @param {string} query - Nome da música e/ou artista
 */
async function buscarMetadadosDeezer(query) {
    if (!query) return null;
    try {
        // Deezer API através de proxy AllOrigins (mais estável para CORS)
        const targetUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) return null;
        
        const wrapper = await response.json();
        const data = JSON.parse(wrapper.contents);
        
        if (data && data.data && data.data.length > 0) {
            const faixa = data.data[0];
            return {
                titulo: faixa.title,
                artista: faixa.artist.name,
                album: faixa.album.title,
                capa: faixa.album.cover_medium,
                capaGrande: faixa.album.cover_xl
            };
        }
        return null;
    } catch (error) {
        console.warn("Falha ao buscar no Deezer para:", query);
        return null; // Retorna null para usar os dados locais/padrão sem quebrar a lista
    }
}

async function carregarMusicas() {
    try {
        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error("Erro ao acessar a API principal");
        }

        const dadosBrutos = await resposta.json();

        // Processa as músicas garantindo que uma falha no Deezer NÃO quebre o carregamento
        musicas = await Promise.all(
            dadosBrutos.map(async (item) => {
                try {
                    const termoBusca = `${item.titulo || ''} ${item.artista || ''}`.trim();
                    const metaDeezer = await buscarMetadadosDeezer(termoBusca);

                    return {
                        ...item,
                        titulo: metaDeezer?.titulo || item.titulo || "Sem Título",
                        artista: metaDeezer?.artista || item.artista || "Artista Desconhecido",
                        album: metaDeezer?.album || item.album || "",
                        capa: metaDeezer?.capa || item.capa || "assets/capa-default.jpg"[cite: 1]
                    };
                } catch (e) {
                    // Fallback de segurança se o item der erro
                    return {
                        ...item,
                        titulo: item.titulo || "Sem Título",
                        artista: item.artista || "Artista Desconhecido",
                        capa: item.capa || "assets/capa-default.jpg"[cite: 1]
                    };
                }
            })
        );

        console.log("Músicas carregadas com sucesso:", musicas);

        // Renderiza as músicas na tela
        mostrarMusicas(musicas);

    } catch (erro) {
        console.error("Erro crítico:", erro);

        document.getElementById("lista-musicas").innerHTML = `
            <div style="padding:30px;color:#ff4444">
                Não foi possível carregar as músicas.
            </div>
        `;
    }
}
