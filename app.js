window.onload = function() {
    if (typeof carregarMusicas === 'function') {
        carregarMusicas();
    }
};

function mostrarMusicas(lista) {
    const container = document.getElementById("lista-musicas");
    if (!container) return;

    container.innerHTML = "";

    lista.forEach((musica, index) => {
        const card = document.createElement("div");
        card.className = "card";

        const imagemCapa = musica.capa || "assets/capa-default.jpg";[cite: 1]

        card.innerHTML = `
            <img src="${imagemCapa}" alt="${musica.titulo}">
            <div class="card-info">
                <h3>${musica.titulo}</h3>
                <p>${musica.artista}</p>
            </div>
        `;

        card.onclick = function() {
            if (typeof tocarMusica === 'function') {
                tocarMusica(index);
            }
        };

        container.appendChild(card);
    });
}
