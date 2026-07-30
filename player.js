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
  // Sincroniza com o array global 'musicas' (gerado no app.js)
  const listaMusicas = window.musicas || [];

  if (!listaMusicas || listaMusicas.length === 0) {
    console.warn("Nenhuma playlist encontrada para reprodução.");
    return;
  }

  // Trata o loop da playlist
  if (index >= listaMusicas.length) index = 0;
  if (index < 0) index = listaMusicas.length - 1;

  indiceAtual = index;
  const faixa = listaMusicas[indiceAtual];

  // Captura dos elementos na DOM
  const audioElement = document.getElementById("audio");
  const infoElement = document.getElementById("info");

  barra = document.getElementById("progresso");
  tempoAtual = document.getElementById("tempo-atual");
  tempoTotal = document.getElementById("tempo-total");

  if (!audioElement) {
    console.error("Elemento <audio id='audio'> não foi encontrado no HTML.");
    return;
  }

  // Obtém a URL do áudio testando os fallbacks possíveis
  const urlAudio = faixa ? (faixa.url || faixa.src || faixa.urlAudio) : null;

  // Validação essencial: Evita o erro "NotSupportedError / No supported source found"
  if (!urlAudio || typeof urlAudio !== "string") {
    console.error("URL de áudio inválida ou inexistente para a faixa:", faixa);
    return;
  }

  // Reseta o player antes de carregar a nova fonte
  audioElement.pause();
  audioElement.removeAttribute("src");

  // Configurações do elemento de áudio
  audioElement.crossOrigin = "anonymous";
  audioElement.preload = "metadata";
  audioElement.src = urlAudio;

  // Atualiza as informações exibidas na interface
  if (infoElement) {
    infoElement.innerHTML = `<strong>${faixa.titulo || 'Sem Título'}</strong><br>${faixa.artista || 'Artista Desconhecido'}`;
  }

  // Configura listeners e equalizador
  configurarEventosPlayer(audioElement);
  inicializarEqualizador(audioElement);

  // Inicia a reprodução
  audioElement.play().catch((err) => {
    console.warn("Erro de autoplay ou fonte de mídia não suportada:", err);
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
  // Evita adicionar múltiplos listeners no mesmo elemento <audio>
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

  // Fim da faixa -> Avança para a próxima música
  audioElement.addEventListener("ended", () => {
    proximaMusica();
  });

  // Interação do usuário arrastando a barra de progresso
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
    // Inicializa o AudioContext uma única vez
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      // Cria a fonte ligada ao <audio>
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

      // Cadeia de conexão de áudio: Fonte -> Grave -> Médio -> Agudo -> Saída (Auto-falantes)
      fonteAudio.connect(filtroGrave);
      filtroGrave.connect(filtroMedio);
      filtroMedio.connect(filtroAgudo);
      filtroAgudo.connect(audioCtx.destination);

      // Vincula os controles deslizantes do HTML
      configurarControlesEqualizador();
    }

    // Se o navegador colocou o contexto em espera (suspend), reativa
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

function volumeMaximo() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.volume = 1;
}
<button onclick="playPause()" id="btn-play">▶ / ❚❚</button>
function mutar() {
  const audio = document.getElementById("audio");
  if (!audio) return;

  audio.muted = !audio.muted;
}

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
// ATALHOS DO TECLADO
// ===============================

document.addEventListener("keydown", (e) => {
  // Ignora os atalhos se o usuário estiver digitando na caixa de texto
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
