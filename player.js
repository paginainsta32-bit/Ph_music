let indiceAtual = 0;
let audioCtx = null;
let filtroGrave = null;
let filtroMedio = null;
let filtroAgudo = null;
let fonteAudio = null;

function tocarMusica(index) {
    if (!musicas || musicas.length === 0) return;

    if (index >= musicas.length) index = 0;
    if (index < 0) index = musicas.length - 1;
    
    indiceAtual = index;
    const faixa = musicas[indiceAtual];
    const audioElement = document.getElementById("audio");
    const infoElement = document.getElementById("info");

    if (!audioElement) return;

    // Habilita a leitura de dados/metadados e equalização do áudio
    audioElement.crossOrigin = "anonymous";

    // Configura o evento para avançar automaticamente ao fim da música
    if (!audioElement.dataset.hasEndedListener) {
        audioElement.addEventListener("ended", () => {
            console.log("Música finalizada! Tocando a próxima...");
            proximaMusica();
        });
        audioElement.dataset.hasEndedListener = "true";
    }

    // Define a fonte do áudio vinda do Proxy do Worker
    const urlAudio = faixa.url || faixa.src || faixa.urlAudio;
    audioElement.src = urlAudio;
    
    if (infoElement) {
        infoElement.innerText = `${faixa.titulo} - ${faixa.artista}`;
    }

    // Inicializa a Web Audio API (Equalizador)
    inicializarEqualizador(audioElement);

    // Inicia a reprodução
    audioElement.play().catch(e => console.warn("Aguardando ação do usuário:", e));
}

function proximaMusica() {
    if (!musicas || musicas.length === 0) return;
    tocarMusica(indiceAtual + 1);
}

function musicaAnterior() {
    if (!musicas || musicas.length === 0) return;
    tocarMusica(indiceAtual - 1);
}

function inicializarEqualizador(audioElement) {
    if (!audioElement) return;

    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            // Grave (BASS) - Lowshelf @ 250Hz
            filtroGrave = audioCtx.createBiquadFilter();
            filtroGrave.type = "lowshelf";
            filtroGrave.frequency.value = 250;

            // Médio (MID) - Peaking @ 1500Hz
            filtroMedio = audioCtx.createBiquadFilter();
            filtroMedio.type = "peaking";
            filtroMedio.frequency.value = 1500;
            filtroMedio.Q.value = 1;

            // Agudo (TREBLE) - Highshelf @ 4000Hz
            filtroAgudo = audioCtx.createBiquadFilter();
            filtroAgudo.type = "highshelf";
            filtroAgudo.frequency.value = 4000;

            // Conecta a cadeia de áudio
            fonteAudio = audioCtx.createMediaElementSource(audioElement);
            fonteAudio.connect(filtroGrave);
            filtroGrave.connect(filtroMedio);
            filtroMedio.connect(filtroAgudo);
            filtroAgudo.connect(audioCtx.destination);

            // Conecta os sliders do HTML
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
        console.warn("Erro ao iniciar equalizador:", e);
    }
}
