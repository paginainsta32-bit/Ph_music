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
// FUNÇÕES UTILITÁRIAS
// ===============================

function formatarTempo(segundos) {
  if (isNaN(segundos) || !isFinite(segundos)) return "0:00";

  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);

  return `${m}:${String(s).padStart(2, "0")}`;
}

// ===============================
// EVENTOS DO AUDIO ELEMENT
// ===============================

function configurarEventosPlayer(audioElement) {
  if (!audioElement) return;

  if (audioElement.dataset.playerConfigurado) return;
  audioElement.dataset.playerConfigurado = "true";

  audioElement.addEventListener("loadedmetadata", () => {
    if (barra) {
      barra.max = audioElement.duration || 0;
    }
    if (tempoTotal) {
      tempoTotal.textContent = formatarTempo(audioElement.duration);
    }
  });

  audioElement.addEventListener("timeupdate", () => {
    if (barra) {
      barra.value = audioElement.currentTime;
    }
    if (tempoAtual) {
      tempoAtual.textContent = formatarTempo(audioElement.currentTime);
    }
  });

  audioElement.addEventListener("ended", () => {
    proximaMusica();
  });

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
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      fonteAudio = audioCtx.createMediaElementSource(audioElement);

      filtroGrave = audioCtx.createBiquadFilter();
      filtroGrave.type = "lowshelf";
      filtroGrave.frequency.value = 180;
      filtroGrave.gain.value = 0;

      filtroMedio = audioCtx.createBiquadFilter();
      filtroMedio.type = "peaking";
      filtroMedio.frequency.value = 1200;
      filtroMedio.Q.value = 0.8;
      filtroMedio.gain.value = 0;

      filtroAgudo = audioCtx.createBiquadFilter();
      filtroAgudo.type = "highshelf";
      filtroAgudo.frequency.value = 5500;
      filtroAgudo.gain.value = 0;

      fonteAudio.connect(filtroGrave);
      filtroGrave.connect(filtroMedio);
      filtroMedio.connect(filtroAgudo);
      filtroAgudo.connect(audioCtx.destination);

      configurarControlesEqualizador();
    }

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
      if (filtroGrave) filtroGrave.gain.value = parseFloat(e.target.value);
    });
  }

  if (medio) {
    medio.addEventListener("input", (e) => {
      if (filtroMedio) filtroMedio.gain.value = parseFloat(e.target.value);
    });
  }

  if (agudo) {
    agudo.addEventListener("input", (e) => {
      if (filtroAgudo) filtroAgudo.gain.value = parseFloat(e.target.value);
    });
  }
}

// ===============================
// CONTROLE DE NAVEGAÇÃO E MÚSICA
// ===============================

function tocarMusica(index) {
  const listaMusicas = window.musicas || [];

  if (!listaMusicas || listaMusicas.length === 0) return;

  if (index >= listaMusicas.length) index = 0;
  if (index < 0) index = listaMusicas.length - 1;

  indiceAtual = index;
  const faixa = listaMusicas[indiceAtual];
  const audioElement = document.getElementById("audio");
  const infoElement = document.getElementById("info");

  barra = document.getElementById("progresso");
  tempoAtual = document.getElementById("tempo-atual");
  tempoTotal = document.getElementById("tempo-total");

  if (!audioElement) {
    console.error("Elemento <audio id='audio'> não foi encontrado.");
    return;
  }

  const urlAudio = faixa ? (faixa.url || faixa.src || faixa.urlAudio) : null;

  console.log("Tentando tocar URL:", urlAudio);

  if (!urlAudio) {
    console.error("URL de áudio nula/inválida para a faixa:", faixa);
    return;
  }

  // Prepara o elemento de áudio limpo
  audioElement.pause();
  audioElement.removeAttribute("src");
  audioElement.crossOrigin = "anonymous";
  audioElement.src = urlAudio;
  audioElement.load(); // Força o navegador a carregar a nova fonte de mídia

  if (infoElement) {
    infoElement.innerHTML = `<strong>${faixa.titulo}</strong><br>${faixa.artista}`;
  }

  configurarEventosPlayer(audioElement);
  inicializarEqualizador(audioElement);

  // Inicia a reprodução garantindo a resolução da Promise
  const playPromise = audioElement.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("Aguardando interação ou erro ao reproduzir áudio:", err);
    });
  }
}

function proximaMusica() {
  tocarMusica(indiceAtual + 1);
}

function musicaAnterior() {
  tocarMusica(indiceAtual - 1);
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
    audio.play().catch(err => console.warn(err));
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

function mutar() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.muted = !audio.muted;
}

// ===============================
// ATALHOS DO TECLADO
// ===============================

document.addEventListener("keydown", (e) => {
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
// ATIVAÇÃO DO CONTEXTO DE ÁUDIO
// ===============================

document.addEventListener("click", () => {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

console.log("PH MUSIC Player carregado com sucesso.");
