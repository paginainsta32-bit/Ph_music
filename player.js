const audio = document.getElementById("audio");
let musicaAtual = 0;

/* ==========================================================================
   WEB AUDIO API - EQUALIZADOR DE 3 BANDAS (GRAVE, MÉDIO, AGUDO)
   ========================================================================== */
let audioCtx;
let source;
let lowFilter, midFilter, highFilter;

function inicializarAudioContext() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  source = audioCtx.createMediaElementSource(audio);

  // Filtro de Graves (Low Shelf 60Hz)
  lowFilter = audioCtx.createBiquadFilter();
  lowFilter.type = "lowshelf";
  lowFilter.frequency.value = 60;

  // Filtro de Médios (Peaking 1000Hz)
  midFilter = audioCtx.createBiquadFilter();
  midFilter.type = "peaking";
  midFilter.frequency.value = 1000;
  midFilter.Q.value = 1;

  // Filtro de Agudos (High Shelf 14000Hz)
  highFilter = audioCtx.createBiquadFilter();
  highFilter.type = "highshelf";
  highFilter.frequency.value = 14000;

  // Encadeamento dos Nós
  source.connect(lowFilter);
  lowFilter.connect(midFilter);
  midFilter.connect(highFilter);
  highFilter.connect(audioCtx.destination);
}

// Ouvintes de evento dos Sliders do Equalizador
document.getElementById("eq-grave").addEventListener("input", (e) => {
  inicializarAudioContext();
  if (lowFilter) lowFilter.gain.value = parseFloat(e.target.value);
});

document.getElementById("eq-medio").addEventListener("input", (e) => {
  inicializarAudioContext();
  if (midFilter) midFilter.gain.value = parseFloat(e.target.value);
});

document.getElementById("eq-agudo").addEventListener("input", (e) => {
  inicializarAudioContext();
  if (highFilter) highFilter.gain.value = parseFloat(e.target.value);
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
      album: 'PH MUSIC Player',
      artwork: [
        { src: capa, sizes: '96x96', type: 'image/jpeg' },
        { src: capa, sizes: '128x128', type: 'image/jpeg' },
        { src: capa, sizes: '192x192', type: 'image/jpeg' },
        { src: capa, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    // Registra comandos na central de notificações e tela de bloqueio
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', musicaAnterior);
    navigator.mediaSession.setActionHandler('nexttrack', proximaMusica);
  }
}

/* ==========================================================================
   CONTROLE DE REPRODUÇÃO & SEQUÊNCIA AUTOMÁTICA
   ========================================================================== */
function tocarMusica(indice) {
  if (!musicas || musicas.length === 0) return;

  inicializarAudioContext();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  musicaAtual = indice;
  const musica = musicas[indice];
  audio.src = musica.url;
  
  // Tenta iniciar a reprodução e registrar a Media Session
  audio.play().then(() => {
    atualizarMediaSession(musica);
  }).catch((err) => {
    console.error("Erro ao iniciar áudio:", err);
  });

  document.getElementById("info").innerHTML = `
        🎵 <strong>${musica.titulo}</strong><br>
        <small style="opacity:0.8">${musica.artista || "PH Music"}</small>
    `;
}

// Pular para a Próxima Música
function proximaMusica() {
  if (!musicas || musicas.length === 0) return;
  let proximoIndice = musicaAtual + 1;
  if (proximoIndice >= musicas.length) {
    proximoIndice = 0; // Loop de volta ao início
  }
  tocarMusica(proximoIndice);
}

// Voltar para a Música Anterior
function musicaAnterior() {
  if (!musicas || musicas.length === 0) return;
  let indiceAnterior = musicaAtual - 1;
  if (indiceAnterior < 0) {
    indiceAnterior = musicas.length - 1; // Vai para a última
  }
  tocarMusica(indiceAnterior);
}

// Botões DOM de Anterior / Próximo
document.getElementById("btn-next").addEventListener("click", proximaMusica);
document.getElementById("btn-prev").addEventListener("click", musicaAnterior);

// Tocar a próxima música AUTOMATICAMENTE ao finalizar a faixa atual
audio.addEventListener("ended", proximaMusica);
