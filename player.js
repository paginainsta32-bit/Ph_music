const audio = document.getElementById("audio");

let musicaAtual = 0;

function tocarMusica(indice){

    musicaAtual = indice;

    const musica = musicas[indice];

    audio.src = musica.url;

    audio.play();

    document.getElementById("info").innerHTML = `
        🎵 ${musica.titulo}
    `;

}