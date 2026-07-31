const audio = document.getElementById("audio");
let musicaAtual = 0;

/* ==========================================================================
   WEB AUDIO API - EQUALIZADOR (Apenas Desktop para evitar bloqueio no Safari)
   ========================================================================== */
let audioCtx;
let source;
let lowFilter, midFilter, highFilter;
let eqAtivo = false;

// Detecta se é dispositivo móvel (iOS/Android)
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function inicializarAudioContext() {
  // Se for celular, pulamos a Web Audio API para o Safari não matar o som em segundo plano
  if (isMobile || audioCtx) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    source = audioCtx.createMediaElementSource(audio);

    lowFilter = audioCtx.createBiquadFilter();
    lowFilter.type = "lowshelf";
    lowFilter.frequency.value = 60;

    midFilter = audioCtx.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;

    highFilter = audioCtx.createBiquadFilter();
    highFilter.type = "highshelf";
    highFilter.frequency.value = 14000;

    source.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(audioCtx.destination);
    eqAtivo = true;
  } catch (e) {
    console.warn("Equalizador desativado para garantir segundo plano:", e);
  }
}

// Ouvintes do Equalizador (Só funcionam se o AudioContext estiver ativo)
document.getElementById("eq-grave").addEventListener("input", (e) => {
  if (!isMobile) inicializarAudioContext();
  if (eqAtivo && lowFilter) lowFilter.gain.value = parseFloat(e.target.value);
});

document.getElementById("eq-medio").addEventListener("input", (e) => {
  if (!isMobile) inicializarAudioContext();
  if (eqAtivo && midFilter) midFilter.gain.value = parseFloat(e.target.value);
});

document.getElementById("eq-agudo").addEventListener("input", (e) => {
  if (!isMobile) inicializarAudioContext();
  if (eqAtivo && highFilter) highFilter.gain.value = parseFloat(e.target.value);
});

/* ==========================================================================
   SUPORTE A REPRODUÇÃO EM SEGUNDO PLANO (MEDIA SESSION API)
   ========================================================================== */
function atualizarMediaSession(musica) {
  if ('mediaSession' in navigator) {
    const capa = (typeof CONFIG !== 'undefined' && CONFIG.DEFAULT_COVER) ? CONFIG.DEFAULT_COVER : 'assets/capa-default.jpg';
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: musica.titulo || 'Música',
      artist: musica.artista || 'PH MUSIC',
      album: 'PH MUSIC',
      artwork: [
        { src: capa, sizes: '96x96', type: 'image/jpeg' },
        { src: capa, sizes: '128x128', type: 'image/jpeg' },
        { src: capa, sizes: '192x192', type: 'image/jpeg' },
        { src: capa, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.playbackState = "playing";

    navigator.mediaSession.setActionHandler('play', () => {
      audio.play();
      navigator.mediaSession.playbackState = "playing";
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
      navigator.mediaSession.playbackState = "paused";
    });

    navigator.mediaSession.setActionHandler('previoustrack', musicaAnterior);
    navigator.mediaSession.setActionHandler('nexttrack', proximaMusica);
  }
}

/* ==========================================================================
   CONTROLE DE REPRODUÇÃO
   ========================================================================== */
function tocarMusica(indice) {
  if (!musicas || musicas.length === 0) return;

  if (!isMobile) {
    inicializarAudioContext();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  musicaAtual = indice;
  const musica = musicas[indice];
  audio.src = musica.url;

  audio.play().then(() => {
    atualizarMediaSession(musica);
  }).catch((err) => {
    console.error("Erro ao reproduzir no Safari:", err);
  });

  const info = document.getElementById("info");
  if (info) {
    info.innerHTML = `
      🎵 <strong>${musica.titulo}</strong><br>
      <small style="opacity:0.8">${musica.artista || "PH Music"}</small>
    `;
  }
}

function proximaMusica() {
  if (!musicas || musicas.length === 0) return;
  let proximoIndice = musicaAtual + 1;
  if (proximoIndice >= musicas.length) {
    proximoIndice = 0;
  }
  tocarMusica(proximoIndice);
}

function musicaAnterior() {
  if (!musicas || musicas.length === 0) return;
  let indiceAnterior = musicaAtual - 1;
  if (indiceAnterior < 0) {
    indiceAnterior = musicas.length - 1;
  }
  tocarMusica(indiceAnterior);
}

document.getElementById("btn-next").addEventListener("click", proximaMusica);
document.getElementById("btn-prev").addEventListener("click", musicaAnterior);

audio.addEventListener("ended", proximaMusica);
