// ===============================
// ESTADO GLOBAL DO PLAYER
// ===============================
window.indiceAtual = 0;

// Web Audio API
let audioCtx = null;
let filtroGrave = null;
let filtroMedio = null;
let filtroAgudo = null;
let fonteAudio = null;

let barra = null;
let tempoAtual = null;
let tempoTotal = null;

function formatarTempo(segundos) {
  if (isNaN(segundos) || !isFinite(segundos)) return "0:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function configurarEventosPlayer(audioElement) {
  if (!audioElement || audioElement.dataset.playerConfigurado) return;
  audioElement.dataset.playerConfigurado = "true";

  audioElement.addEventListener("loadedmetadata", () => {
    if (barra) barra.max = audioElement.duration || 0;
    if (tempoTotal) tempoTotal.textContent = formatarTempo(audioElement.duration);
  });

  audioElement.addEventListener("timeupdate", () => {
    if (barra) barra.value = audioElement.currentTime;
    if (tempoAtual) tempoAtual.textContent = formatarTempo(audioElement.currentTime);
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
    console.warn("Equalizador desativado por política de segurança CORS.");
  }
}

function configurarControlesEqualizador() {
  const grave = document.getElementById("eq-grave");
  const medio = document.getElementById("eq-medio");
  const agudo = document.getElementById("eq-agudo");

  if (grave) grave.oninput = (e) => { if (filtroGrave) filtroGrave.gain.value = parseFloat(e.target.value); };
  if (medio) medio.oninput = (e) => { if (filtroMedio) filtroMedio.gain.value = parseFloat(e.target.value); };
  if (agudo) agudo.oninput = (e) => { if (filtroAgudo) filtroAgudo.gain.value = parseFloat(e.target.value); };
}

// FUNÇÃO GLOBAL DE REPRODUÇÃO
window.tocarMusica = function(index) {
  const lista = window.musicas || [];

  if (!lista || lista.length === 0) {
    console.error("Nenhuma música carregada no player.");
    return;
  }

  if (index >= lista.length) index = 0;
  if (index < 0) index = lista.length - 1;

  window.indiceAtual = index;
  const faixa = lista[window.indiceAtual];
  const audioElement = document.getElementById("audio");
  const infoElement = document.getElementById("info");

  barra = document.getElementById("progresso");
  tempoAtual = document.getElementById("tempo-atual");
  tempoTotal = document.getElementById("tempo-total");

  if (!audioElement) {
    console.error("Elemento <audio id='audio'> não foi encontrado no HTML.");
    return;
  }

  const urlAudio = faixa ? (faixa.url || faixa.src || faixa.urlAudio) : null;
  console.log("-> Tentando carregar o áudio na URL:", urlAudio);

  if (!urlAudio) {
    console.error("Faixa sem URL válida:", faixa);
    return;
  }

  // ATRIBUIÇÃO DA URL E REPRODUÇÃO
  audioElement.pause();
  audioElement.src = urlAudio;
  audioElement.load();

  if (infoElement) {
    infoElement.innerHTML = `<strong>${faixa.titulo}</strong><br>${faixa.artista}`;
  }

  configurarEventosPlayer(audioElement);

  try {
    inicializarEqualizador(audioElement);
  } catch(e) {}

  const playPromise = audioElement.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("Aguardando ação do usuário para liberar áudio:", err);
    });
  }
};

window.proximaMusica = function() { window.tocarMusica(window.indiceAtual + 1); };
window.musicaAnterior = function() { window.tocarMusica(window.indiceAtual - 1); };

window.playPause = function() {
  const audio = document.getElementById("audio");
  if (!audio) return;
  if (audio.paused) {
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    audio.play().catch(err => console.warn(err));
  } else {
    audio.pause();
  }
};

document.addEventListener("click", () => {
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
});

console.log("PH MUSIC Player v2.0 montado com sucesso.");
