window.onload = () => {
    carregarMusicas();
};

function mostrarMusicas(lista) {
    const container = document.getElementById("lista-musicas");
    if (!container) return;

    container.innerHTML = "";

    lista.forEach((musica, index) => {
        const card = document.createElement("div");
        card.className = "card";

        // Exibe a capa do Deezer ou a imagem padrão
        const imagemCapa = musica.capa || "assets/capa-default.jpg";[cite: 1]

        card.innerHTML = `
            <img src="${imagemCapa}" alt="${musica.titulo}">
            <div class="card-info">
                <h3>${musica.titulo}</h3>
                <p>${musica.artista}</p>
            </div>
        `;

        card.onclick = () => {
            if (typeof tocarMusica === 'function') {
                tocarMusica(index);
            }
        };

        container.appendChild(card);
    });
}
