let musicas = [];
let emModoPastas = false;

window.onload = () => {
    carregarMusicas();
    configurarBotaoPasta();
};

// Busca as músicas na sua API/R2
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

        // Mapeia os dados da API garantindo os campos necessários
        musicas = dadosBrutos.map(item => ({
            ...item,
            titulo: item.titulo || item.nome || item.title || "Sem Título",
            artista: item.artista || item.artist || "Artista Desconhecido",
            // Define a pasta/categoria baseada na API (ou usa o nome do artista como fallback)
            pasta: item.pasta || item.categoria || item.genero || item.artista || "Outros",
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

// Renderiza a lista de músicas
function mostrarMusicas(lista) {
    emModoPastas = false;
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
                // Toca a música correspondente
                const indexOriginal = musicas.findIndex(m => m === musica);
                tocarMusica(indexOriginal !== -1 ? indexOriginal : index);
            }
        };

        container.appendChild(card);
    });
}

// Agrupa as músicas por pasta e mostra na tela
function mostrarPastas() {
    emModoPastas = true;
    const container = document.getElementById("lista-musicas");
    if (!container) return;

    container.innerHTML = "";

    // Agrupa as músicas pelos nomes das pastas
    const pastas = {};
    musicas.forEach(musica => {
        const nomePasta = musica.pasta || "Geral";
        if (!pastas[nomePasta]) {
            pastas[nomePasta] = [];
        }
        pastas[nomePasta].push(musica);
    });

    // Cria os cards visuais para cada pasta
    Object.keys(pastas).forEach(nomePasta => {
        const qtd = pastas[nomePasta].length;
        const card = document.createElement("div");
        card.className = "card card-pasta";

        card.innerHTML = `
            <div style="height:230px; background:#222; display:flex; align-items:center; justify-content:center; font-size:64px;">
                📁
            </div>
            <div class="card-info">
                <h3>${nomePasta}</h3>
                <p>${qtd} ${qtd === 1 ? 'música' : 'músicas'}</p>
            </div>
        `;

        // Ao clicar na pasta, exibe apenas as músicas pertencentes a ela
        card.onclick = () => {
            mostrarMusicas(pastas[nomePasta]);
        };

        container.appendChild(card);
    });
}

// Configuração do botão "Abrir Pasta"
function configurarBotaoPasta() {
    const btnPasta = document.getElementById("btn-pasta");
    if (!btnPasta) return;

    btnPasta.onclick = () => {
        if (emModoPastas) {
            // Se já estiver vendo pastas, clica para voltar a mostrar todas as músicas
            mostrarMusicas(musicas);
            btnPasta.innerHTML = "📁 Ver por Pastas";
        } else {
            // Alterna para o modo de exibição por pastas
            mostrarPastas();
            btnPasta.innerHTML = "🎵 Ver Todas";
        }
    };
}
