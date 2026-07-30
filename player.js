let indiceAtual = 0;
let audioCtx = null;
let filtroGrave = null;
let filtroMedio = null;
let filtroAgudo = null;
let fonteAudio = null;

// Toca uma música específica pelo índice
function tocarMusica(index) {
    if (!musicas || musicas.length === 0) return;

    if (index >= musicas.length) index = 0;
    if (index < 0) index = musicas.length - 1;
    
    indiceAtual = index;
    const faixa = musicas[indiceAtual];
    const audioElement = document.getElementById("audio");
    const infoElement = document.getElementById("info");

    if (!audioElement) return;

    // Configura o ouvinte para trocar de música automaticamente ao terminar
    if (!audioElement.dataset.hasEndedListener) {
        audioElement.addEventListener("ended", () => {
            console.log("Música encerrada. Avançando para a próxima...");
            proximaMusica();
        });
        audioElement.dataset.hasEndedListener = "true";
    }

    // Define a fonte do áudio (pega a propriedade url vinda do Worker)
    const urlAudio = faixa.url || faixa.src || faixa.urlAudio;
    audioElement.src = urlAudio;
    
    if (infoElement) {
        infoElement.innerText = `${faixa.titulo} - ${faixa.artista}`;
    }

    // Tenta inicializar o equalizador se o áudio permitir CORS
    tentarInicializarEqualizador(audioElement);

    // Inicia a reprodução
    audioElement.play().catch(e => console.warn("Aguardando ação do usuário para reproduzir:", e));
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

// Inicializa a Web Audio API de forma segura sem silenciar o áudio
function tentarInicializarEqualizador(audioElement) {
    if (!audioElement) return;

    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            // Filtro Grave - Lowshelf @ 250Hz
            filtroGrave = audioCtx.createBiquadFilter();
            filtroGrave.type = "lowshelf";
            filtroGrave.frequency.value = 250;

            // Filtro Médio - Peaking @ 1500Hz
            filtroMedio = audioCtx.createBiquadFilter();
            filtroMedio.type = "peaking";
            filtroMedio.frequency.value = 1500;
            filtroMedio.Q.value = 1;

            // Filtro Agudo - Highshelf @ 4000Hz
            filtroAgudo = audioCtx.createBiquadFilter();
            filtroAgudo.type = "highshelf";
            filtroAgudo.frequency.value = 4000;

            // Conecta o elemento aos filtros
            fonteAudio = audioCtx.createMediaElementSource(audioElement);
            fonteAudio.connect(filtroGrave);
            filtroGrave.connect(filtroMedio);
            filtroMedio.connect(filtroAgudo);
            filtroAgudo.connect(audioCtx.destination);

            // Conecta aos controles de alcance (sliders)
            const sliderGrave = document.getElementById("eq-grave");
            const sliderMedio = document.getElementById("eq-medio");
            const sliderAgudo = document.getElementById("eq-agudo");

            if (sliderGrave) {
                sliderGrave.oninput = (e) => {
                    if (filtroGrave) filtroGrave.gain.value = parseFloat(e.target.value);
                };
            }
            if (sliderMedio) {
                sliderMedio.oninput = (e) => {
                    if (filtroMedio) filtroMedio.gain.value = parseFloat(e.target.value);
                };
            }
            if (sliderAgudo) {
                sliderAgudo.oninput = (e) => {
                    if (filtroAgudo) filtroAgudo.gain.value = parseFloat(e.target.value);
                };
            }
        }

        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
    } catch (e) {
        console.warn("Equalizador desativado para evitar bloqueio de reprodução do R2:", e);
    }
}
