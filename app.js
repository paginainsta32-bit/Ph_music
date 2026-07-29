let musicas = [];

window.onload = () => {
    carregarMusicas();
    configurarLeitorDePasta();
};

// Função para buscar as músicas da sua API/R2
async function carregarMusicas() {
    console.log("Iniciando busca de músicas...");
    
    try {
        if (typeof CONFIG === 'undefined' || !CONFIG.API_URL) {
            throw new Error("CONFIG.API_URL não está definida em config.js");
        }

        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error(`Erro na API (${resposta.status}): ${resposta.statusText}`);
        }

        const dadosBrutos = await resposta.json();

        if (!Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
            const container = document.getElementById("lista-musicas");
            if (container) {
                container.innerHTML = `<div style="padding:30px;color:#e6c200">Nenhuma música encontrada no catálogo.</div>`;
            }
            return;
        }

        // Mapeia garantindo a capa padrão
        musicas = dadosBrutos.map(item => ({
            ...item,
            titulo: item.titulo || item.nome || item.title || "Sem Título",
            artista: item.artista || item.artist || "Artista Desconhecido",
            capa: item.capa || item.cover || "assets/capa-default.jpg"
        }));

        mostrarMusicas(musicas);

    } catch (erro) {
        console.error("Erro em carregarMusicas:", erro);
        const container = document.getElementById("lista-musicas");
        if (container) {
            container.innerHTML = `<div style="padding:30px;color:#ff4444">Não foi possível carregar as músicas online.</div>`;
        }
    }
}

// Renderiza os cards na tela
function mostrarMusicas(lista) {
    const container = document.getElementById("lista-musicas");
    if (!container) return;

    container.innerHTML = "";

    lista.forEach((musica, index) => {
        const card = document.createElement("div");
        card.className = "card";

        const imagemCapa = musica.capa || "assets/capa-default.jpg";

        card.innerHTML = `
            <img src="${imagemCapa}" alt="${musica.titulo}">
            <div class="card-info">
                <h3>${musica.titulo}</h3>
                <p>${musica.artista}</p>
            </div>
        `;

        card.onclick = () => {
            if (typeof tocarMusica === 'function') {
                tocarMusica(index);
            }
        };

        container.appendChild(card);
    });
}

// Configuração do botão "Abrir Pasta"
function configurarLeitorDePasta() {
    const btnPasta = document.getElementById("btn-pasta");
    const inputPasta = document.getElementById("input-pasta");

    if (!btnPasta || !inputPasta) return;

    btnPasta.onclick = () => {
        inputPasta.click();
    };

    inputPasta.onchange = (evento) => {
        const arquivos = Array.from(evento.target.files);
        
        const arquivosAudio = arquivos.filter(arquivo => 
            arquivo.type.startsWith("audio/") || 
            arquivo.name.endsWith(".mp3") || 
            arquivo.name.endsWith(".wav") || 
            arquivo.name.endsWith(".m4a")
        );

        if (arquivosAudio.length === 0) {
            alert("Nenhum arquivo de áudio encontrado na pasta selecionada.");
            return;
        }

        const musicasLocais = arquivosAudio.map((arquivo) => {
            const nomeSemExtensao = arquivo.name.replace(/\.[^/.]+$/, "");
            const partes = nomeSemExtensao.split("-");
            
            let titulo = nomeSemExtensao;
            let artista = "Arquivo Local";

            if (partes.length > 1) {
                artista = partes[0].trim();
                titulo = partes.slice(1).join("-").trim();
            }

            return {
                titulo: titulo,
                artista: artista,
                capa: "assets/capa-default.jpg",
                src: URL.createObjectURL(arquivo)
            };
        });

        musicas = musicasLocais;
        mostrarMusicas(musicas);
    };
}
