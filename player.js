let indiceAtual = 0;

// Toca uma música específica pelo índice
function tocarMusica(index) {
    if (!musicas || musicas.length === 0) return;

    // Garante que o índice fique dentro dos limites da playlist
    if (index >= musicas.length) index = 0;
    if (index < 0) index = musicas.length - 1;
    
    indiceAtual = index;
    const faixa = musicas[indiceAtual];
    const audioElement = document.getElementById("audio");
    const infoElement = document.getElementById("info");

    if (!audioElement) return;

    // Remove qualquer restrição de CORS no elemento HTML
    audioElement.removeAttribute("crossOrigin");

    // Configura o evento para avançar automaticamente ao fim da faixa
    if (!audioElement.dataset.hasEndedListener) {
        audioElement.addEventListener("ended", () => {
            console.log("Música finalizada! Tocando a próxima...");
            proximaMusica();
        });
        audioElement.dataset.hasEndedListener = "true";
    }

    // Define o link do áudio vindo do R2
    const urlAudio = faixa.url || faixa.src || faixa.urlAudio;
    audioElement.src = urlAudio;
    
    if (infoElement) {
        infoElement.innerText = `${faixa.titulo} - ${faixa.artista}`;
    }

    // Inicia a reprodução
    audioElement.play().catch(e => console.warn("Aguardando ação do usuário:", e));
}

// Passa para a próxima música da lista
function proximaMusica() {
    if (!musicas || musicas.length === 0) return;
    tocarMusica(indiceAtual + 1);
}

// Volta para a música anterior
function musicaAnterior() {
    if (!musicas || musicas.length === 0) return;
    tocarMusica(indiceAtual - 1);
}
