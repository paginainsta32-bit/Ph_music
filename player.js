// ===============================
// ESTADO GLOBAL DO PLAYER
// ===============================
let indiceAtual = 0;

// Web Audio API
let audioCtx = null;
let filtroGrave = null;
let filtroMedio = null;
let filtroAgudo = null;
let fonteAudio = null;

// Elementos da Interface (UI)
let barra = null;
let tempoAtual = null;
let tempoTotal = null;

// ===============================
// CONTROLE DE NAVEGAÇÃO E MÚSICA
// ===============================

/**
 * Toca uma música com base no índice informado.
 * @param {number} index - Índice da música na lista `musicas`.
 */
function tocarMusica(index) {
  if (!window.musicas || musicas.length === 0) return;

  // Trata loop da playlist
  if (index >= musicas.length) index = 0;
  if (index < 0) index = musicas.length - 1;

  indiceAtual = index;
  const faixa = musicas[indiceAtual];

  // Captura de elementos da DOM
  const audioElement = document.getElementById("audio");
  const infoElement = document.getElementById("info");

  barra = document.getElementById("progresso");
  tempoAtual = document.getElementById("tempo-atual");
  tempoTotal = document.getElementById("tempo-total");

  if (!audioElement) return;

  // Configurações da tag de áudio
  audioElement.crossOrigin = "anonymous";
  audioElement.preload = "metadata";

  const urlAudio = faixa.url || faixa.src || faixa.urlAudio;
  audioElement.src = urlAudio;

  // Atualiza informações na tela
  if (infoElement) {
    infoElement.innerHTML = `<strong>${faixa.titulo}</strong><br>${faixa.artista}`;
  }

  // Inicializa eventos do player e do áudio
  configurarEventosPlayer(audioElement);
  inicializarEqualizador(audioElement);

  // Executa a reprodução
  audioElement.play().catch((err) => {
    console.warn("Erro ao tentar reproduzir o áudio:", err);
  });
}

function proximaMusica() {
  tocarMusica(indiceAtual + 1);
}

function musicaAnterior() {
  tocarMusica(indiceAtual - 1);
}

// ===============================
// EVENTOS DO AUDIO ELEMENT
// ===============================

function configurarEventosPlayer(audioElement) {
  // Evita adicionar múltiplos event listeners no mesmo elemento de áudio
  if (audioElement.dataset.playerConfigurado) return;
  audioElement.dataset.playerConfigurado = "true";

  // Carregamento dos metadados (Duração total)
  audioElement.addEventListener("loadedmetadata", () => {
    if (barra) {
      barra.max = audioElement.duration || 0;
    }
    if (tempoTotal) {
      tempoTotal.textContent = formatarTempo(audioElement.duration);
    }
  });

  // Atualização de tempo e barra de progresso
  audioElement.addEventListener("timeupdate", () => {
    if (barra) {
      barra.value = audioElement.currentTime;
    }
    if (tempoAtual) {
      tempoAtual.textContent = formatarTempo(audioElement.currentTime);
    }
  });

  // Fim da faixa -> Avança para a próxima
  audioElement.addEventListener("ended", () => {
    proximaMusica();
  });

  // Interação do usuário com a barra de progresso
  if (barra) {
    barra.oninput = () => {
      audioElement.currentTime = barra.value;
    };
  }
}

// ===============================
// EQUALIZADOR (WEB AUDIO API)
// ===============================

function inicializarEqualizador(audioElement) {
  if (!audioElement) return;

  try {
    // Garante que o AudioContext seja criado apenas UMA vez
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      // Fonte de áudio conectada ao elemento HTML <audio>
      fonteAudio = audioCtx.createMediaElementSource(audioElement);

      // Filtro GRAVE (Low Shelf)
      filtroGrave = audioCtx.createBiquadFilter();
      filtroGrave.type = "lowshelf";
      filtroGrave.frequency.value = 180;
      filtroGrave.gain.value = 0;

      // Filtro MÉDIO (Peaking)
      filtroMedio = audioCtx.createBiquadFilter();
      filtroMedio.type = "peaking";
      filtroMedio.frequency.value = 1200;
      filtroMedio.Q.value = 0.8;
      filtroMedio.gain.value = 0;

      // Filtro AGUDO (High Shelf)
      filtroAgudo = audioCtx.createBiquadFilter();
      filtroAgudo.type = "highshelf";
      filtroAgudo.frequency.value = 5500;
      filtroAgudo.gain.value = 0;

      // Encadeamento do áudio: Fonte -> Grave -> Médio -> Agudo -> Saída
      fonteAudio.connect(filtroGrave);
      filtroGrave.connect(filtroMedio);
      filtroMedio.connect(filtroAgudo);
      filtroAgudo.connect(audioCtx.destination);

      // Event listeners para os sliders do equalizador
      configurarControlesEqualizador();
    }

    // Se o contexto estiver suspenso (política dos navegadores), retoma a execução
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  } catch (err) {
    console.error("Erro ao inicializar o equalizador:", err);
  }
}

function configurarControlesEqualizador() {
  const grave = document.getElementById("eq-grave");
  const medio = document.getElementById("eq-medio");
  const agudo = document.getElementById("eq-agudo");

  if (grave) {
    grave.addEventListener("input", (e) => {
      filtroGrave.gain.value = parseFloat(e.target.value);
    });
  }

  if (medio) {
    medio.addEventListener("input", (e) => {
      filtroMedio.gain.value = parseFloat(e.target.value);
    });
  }

  if (agudo) {
    agudo.addEventListener("input", (e) => {
      filtroAgudo.gain.value = parseFloat(e.target.value);
    });
  }
}

// ===============================
// CONTROLES EXTRAS DO PLAYER
// ===============================

function playPause() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  if (audio.paused) {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    audio.play();
  } else {
    audio.pause();
  }
}

function pararMusica() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
}

function aumentarVolume() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.volume = Math.min(1, audio.volume + 0.1);
}

function diminuirVolume() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.volume = Math.max(0, audio.volume - 0.1);
}

function volumeMaximo() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.volume = 1;
}

function mutar() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.muted = !audio.muted;
}

// ===============================
// FUNÇÕES UTILITÁRIAS
// ===============================

function formatarTempo(segundos) {
  if (isNaN(segundos)) return "0:00";

  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

// ===============================
// ATALHOS DO TECLADO
// ===============================

document.addEventListener("keydown", (e) => {

  // Evita acionar atalhos caso o usuário esteja digitando em um campo de texto/busca
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    return;
  }

  switch (e.code) {
    case "Space":
      e.preventDefault();
      playPause();
      break;

    case "ArrowRight":
      proximaMusica();
      break;

    case "ArrowLeft":
      musicaAnterior();
      break;

    case "ArrowUp":
      e.preventDefault();
      aumentarVolume();
      break;

    case "ArrowDown":
      e.preventDefault();
      diminuirVolume();
      break;

    case "KeyM":
      mutar();
      break;

  }
});

// ===============================
// AUTOPLAY POLICY FIX
// ===============================

// Mantém o AudioContext ativo após a primeira interação do usuário na página
document.addEventListener("click", () => {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

console.log("PH MUSIC Player carregado com sucesso.");
