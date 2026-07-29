let musicas = [];

async function carregarMusicas() {

    try {

        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error("Erro ao acessar a API");
        }

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
// api.js

/**
 * Busca metadados de uma faixa no Deezer
 * @param {string} query - Nome da música e/ou artista (ex: "Legião Urbana Tempo Perdido")
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
                // Capas em diferentes resoluções disponibilizadas pelo Deezer:
                capa: faixa.album.cover_medium,      // ~250x250px
                capaGrande: faixa.album.cover_xl,  // ~1000x1000px
                fotoArtista: faixa.artist.picture_medium
            };
        }
        return null;
    } catch (error) {
        console.error("Erro ao integrar com Deezer:", error);
        return null;
    }
}
