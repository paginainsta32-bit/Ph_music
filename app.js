window.onload = () => {
    carregarMusicas();
    configurarLeitorDePasta();
};

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
        
        // Filtra os arquivos para aceitar apenas formatos de áudio
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

        // Converte os arquivos locais para a lista de reprodução
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
