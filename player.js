function tocarMusica(index) {
  const listaMusicas = window.musicas || [];

  if (!listaMusicas || listaMusicas.length === 0) return;

  if (index >= listaMusicas.length) index = 0;
  if (index < 0) index = listaMusicas.length - 1;

  indiceAtual = index;
  const faixa = listaMusicas[indiceAtual];
  const audioElement = document.getElementById("audio");
  const infoElement = document.getElementById("info");

  if (!audioElement) return;

  const urlAudio = faixa ? (faixa.url || faixa.src || faixa.urlAudio) : null;

  // PRINT DE VERIFICAÇÃO NO CONSOLE
  console.log("Tentando tocar URL:", urlAudio);

  if (!urlAudio) {
    console.error("URL de áudio nula/inválida para a faixa:", faixa);
    return;
  }

  audioElement.pause();
  audioElement.src = urlAudio;

  if (infoElement) {
    infoElement.innerHTML = `<strong>${faixa.titulo}</strong><br>${faixa.artista}`;
  }

  configurarEventosPlayer(audioElement);
  inicializarEqualizador(audioElement);

  audioElement.play().catch((err) => {
    console.warn("Erro ao tentar reproduzir o áudio:", err);
  });
}
