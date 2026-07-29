let musicas = [];

/**
 * Busca metadados de uma faixa no Deezer
 * @param {string} query - Nome da música e/ou artista
 */
async function buscarMetadadosDeezer(query) {
    try {
        const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}`;
        // Uso de proxy CORS para evitar bloqueios de requisição no navegador
        const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        
        if (!response.ok) throw new Error('Erro ao buscar no Deezer');
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const faixa = data.data[0]; // Pega o primeiro resultado mais relevante
            return {
                titulo: faixa.title,
                artista: faixa.artist.name,
                album: faixa.album.title,
                capa: faixa.album.cover_medium,      // ~250x250px
                capaGrande: faixa.album.cover_xl,  // ~1000x1000px
                fotoArtista: faixa.artist.picture_medium
            };
        }
        return null;
    } catch (error) {
        console.error("Erro ao integrar com Deezer para query:", query, error);
        return null;
    }
}

async function carregarMusicas() {
    try {
        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error("Erro ao acessar a API");
        }

        const dadosBrutos = await resposta.json();

        // Processa todas as faixas trazendo as capas/metadados do Deezer em paralelo
        musicas = await Promise.all(
            dadosBrutos.map(async (item) => {
                // Monta o termo de busca combinando o título e artista vindo do R2/API
                const termoBusca = `${item.titulo || ''} ${item.artista || ''}`.trim();
                
                const metaDeezer = termoBusca ? await buscarMetadadosDeezer(termoBusca) : null;

                return {
                    ...item, // Mantém a URL do seu R2 e demais propriedades originais
                    titulo: metaDeezer?.titulo || item.titulo || "Sem Título",
                    artista: metaDeezer?.artista || item.artista || "Artista Desconhecido",
                    album: metaDeezer?.album || item.album || "",
                    capa: metaDeezer?.capa || item.capa || "assets/capa-default.jpg"[cite: 1]
                };
            })
        );

        console.log("Músicas carregadas com metadados do Deezer:", musicas);

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
