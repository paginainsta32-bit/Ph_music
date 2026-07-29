let musicas = [];

async function carregarMusicas() {
    console.log("Carregando músicas...");
    
    try {
        if (typeof CONFIG === 'undefined' || !CONFIG.API_URL) {
            throw new Error("CONFIG.API_URL não definida em config.js!");
        }

        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error(`Erro na API (${resposta.status}): ${resposta.statusText}`);
        }

        const dadosBrutos = await resposta.json();

        // Garante que os campos venham corretos
        musicas = dadosBrutos.map(item => ({
            ...item,
            titulo: item.titulo || item.nome || item.title || "Sem Título",
            artista: item.artista || item.artist || "Artista Desconhecido",
            capa: item.capa || item.cover || "assets/capa-default.jpg"[cite: 1]
        }));

        if (typeof mostrarMusicas === 'function') {
            mostrarMusicas(musicas);
        }

    } catch (erro) {
        console.error("Erro ao carregar:", erro);
        const container = document.getElementById("lista-musicas");
        if (container) {
            container.innerHTML = `
                <div style="padding:30px;color:#ff4444">
                    Não foi possível carregar as músicas online.
                </div>
            `;
        }
    }
}
