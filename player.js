let indiceAtual = 0;
let audioCtx = null;
let filtroGrave = null;
let filtroMedio = null;
let filtroAgudo = null;
let fonteAudio = null;

// Toca uma música específica pelo índice
function tocarMusica(index) {
    if (!musicas || musicas.length === 0) return;

    // Atualiza índice garantindo limites do array
    if (index >= musicas.length) index = 0;
    if (index < 0) index = musicas.length - 1;
    
    indiceAtual = index;
    const faixa = musicas[indiceAtual];
    const audioElement = document.getElementById("audio");
    const infoElement = document.getElementById("info");

    if (!audioElement) return;

    // Inicializa Web Audio API no primeiro toque (restrição dos navegadores)
    inicializarEqualizador(audioElement);

    // Atualiza a fonte de áudio (suporta R2 e Blob URLs)
    audioElement.src = faixa.src || faixa.url || faixa.urlAudio;
    
    if (infoElement) {
        infoElement.innerText = `${faixa.titulo} - ${faixa.artista}`;
    }

    audioElement.play().catch(e => console.warn("Aguardando interação do usuário:", e));
}

// Passa para a próxima música
function proximaMusica() {
    if (!musicas || musicas.length === 0) return;
    tocarMusica(indiceAtual + 1);
}

// Volta para a música anterior
function musicaAnterior() {
    if (!musicas || musicas.length === 0) return;
    tocarMusica(indiceAtual - 1);
}

// Configura a Web Audio API e o avanço automático
function inicializarEqualizador(audioElement) {
    if (!audioElement) return;

    // 1. Configura avanço automático quando a música termina
    if (!audioElement.dataset.hasEndedListener) {
        audioElement.addEventListener("ended", () => {
            console.log("Música finalizada. Tocando a próxima...");
            proximaMusica();
        });
        audioElement.dataset.hasEndedListener = "true";
    }

    // 2. Cria nós de áudio do equalizador caso ainda não tenham sido criados
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        // Filtro Grave (BASS) - Lowshelf @ 250Hz
        filtroGrave = audioCtx.createBiquadFilter();
        filtroGrave.type = "lowshelf";
        filtroGrave.frequency.value = 250;

        // Filtro Médio (MID) - Peaking @ 1500Hz
        filtroMedio = audioCtx.createBiquadFilter();
        filtroMedio.type = "peaking";
        filtroMedio.frequency.value = 1500;
        filtroMedio.Q.value = 1;

        // Filtro Agudo (TREBLE) - Highshelf @ 4000Hz
        filtroAgudo = audioCtx.createBiquadFilter();
        filtroAgudo.type = "highshelf";
        filtroAgudo.frequency.value = 4000;

        // Conecta os nós em cadeia: Audio -> Grave -> Médio -> Agudo -> Alto-falante
        fonteAudio = audioCtx.createMediaElementSource(audioElement);
        fonteAudio.connect(filtroGrave);
        filtroGrave.connect(filtroMedio);
        filtroMedio.connect(filtroAgudo);
        filtroAgudo.connect(audioCtx.destination);

        // Conecta os controles sliders do HTML aos ganhos dos filtros
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

    // Garante que o contexto de áudio retome o estado ativo
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}
