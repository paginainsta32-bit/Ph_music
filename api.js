let musicas = [];

/**
 * Busca metadados de uma faixa no Deezer
 * @param {string} query - Nome da música e/ou artista
 */
async function buscarMetadadosDeezer(query) {
    if (!query) return null;
    try {
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
        return null;
    }
}

/**
 * Atualiza as capas/metadados no Deezer em segundo plano sem travar a tela
 */
async function enriquecerMusicasComDeezer() {
    for (let i = 0; i < musicas.length; i++) {
        const item = musicas[i];
        const termoBusca = `${item.titulo || ''} ${item.artista || ''}`.trim();
        
        if (termoBusca) {
            const metaDeezer = await buscarMetadadosDeezer(termoBusca);
            if (metaDeezer) {
                // Atualiza o objeto no array
                musicas[i] = {
                    ...item,
                    titulo: metaDeezer.titulo || item.titulo,
                    artista: metaDeezer.artista || item.artista,
                    album: metaDeezer.album || item.album,
                    capa: metaDeezer.capa || item.capa
                };
                
                // Re-renderiza a lista à medida que as capas vão chegando
                mostrarMusicas(musicas);
            }
        }
    }
}

async function carregarMusicas() {
    try {
        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error("Erro ao acessar a API principal");
        }

        const dadosBrutos = await resposta.json();

        // 1. Prepara as músicas usando os dados originais (R2) primeiro
        musicas = dadosBrutos.map(item => ({
            ...item,
            titulo: item.titulo || "Sem Título",
            artista: item.artista || "Artista Desconhecido",
            capa: item.capa || "assets/capa-default.jpg"[cite: 1]
        }));

        console.log("Músicas originais carregadas:", musicas);

        // 2. Renderiza a lista IMEDIATAMENTE na tela (as músicas já vão aparecer!)
        mostrarMusicas(musicas);

        // 3. Busca capas e dados no Deezer sem travar a interface
        enriquecerMusicasComDeezer();

    } catch (erro) {
        console.error("Erro ao carregar músicas:", erro);

        document.getElementById("lista-musicas").innerHTML = `
            <div style="padding:30px;color:#ff4444">
                Não foi possível carregar as músicas. Verifique a URL em CONFIG.API_URL.
            </div>
        `;
    }
}
