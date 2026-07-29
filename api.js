let musicas = [];

// Função simplificada e direta para o Deezer (usando JSONP para evitar bloqueios de CORS/HTTPS)
function buscarCapaDeezer(termo, callback) {
    if (!termo) return;
    const script = document.createElement('script');
    const callbackName = 'deezer_cb_' + Math.random().toString(36).substr(2, 9);
    
    window[callbackName] = function(data) {
        if (data && data.data && data.data.length > 0) {
            callback(data.data[0]);
        }
        delete window[callbackName];
        document.body.removeChild(script);
    };

    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(termo)}&output=jsonp&callback=${callbackName}`;
    document.body.appendChild(script);
}

async function carregarMusicas() {
    console.log("Iniciando busca de músicas...");
    
    try {
        if (typeof CONFIG === 'undefined' || !CONFIG.API_URL) {
            throw new Error("CONFIG.API_URL não está definida no arquivo config.js!");
        }

        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error(`Erro na API (${resposta.status}): ${resposta.statusText}`);
        }

        const dadosBrutos = await resposta.json();
        console.log("Dados brutos recebidos da API:", dadosBrutos);

        if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
            document.getElementById("lista-musicas").innerHTML = `
                <div style="padding:30px;color:#e6c200">
                    A API respondeu, mas a lista de músicas está vazia.
                </div>
            `;
            return;
        }

        // Mapeia e garante valores padrão
        musicas = dadosBrutos.map(item => ({
            ...item,
            titulo: item.titulo || item.nome || item.title || "Sem Título",
            artista: item.artista || item.artist || "Artista Desconhecido",
            capa: item.capa || item.cover || "assets/capa-default.jpg"[cite: 1]
        }));

        // Renderiza a lista original IMEDIATAMENTE
        mostrarMusicas(musicas);

        // Atualiza as capas pelo Deezer via JSONP (sem bloqueio de CORS)
        musicas.forEach((musica, index) => {
            const termo = `${musica.titulo} ${musica.artista}`.trim();
            buscarCapaDeezer(termo, (dadosDeezer) => {
                if (dadosDeezer && dadosDeezer.album && dadosDeezer.album.cover_medium) {
                    musicas[index].capa = dadosDeezer.album.cover_medium;
                    musicas[index].titulo = dadosDeezer.title;
                    musicas[index].artista = dadosDeezer.artist.name;
                    // Re-renderiza a lista atualizada
                    mostrarMusicas(musicas);
                }
            });
        });

    } catch (erro) {
        console.error("Erro em carregarMusicas:", erro);

        const container = document.getElementById("lista-musicas");
        if (container) {
            container.innerHTML = `
                <div style="padding:30px;color:#ff4444">
                    <strong>Erro ao carregar:</strong> ${erro.message}
                </div>
            `;
        }
    }
}
