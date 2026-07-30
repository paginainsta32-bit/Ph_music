window.onload = () => {
  carregarMusicas();
  configurarEventosModal();
};

function mostrarMusicas(lista) {
  const container = document.getElementById("lista-musicas");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p style='padding:20px;'>Nenhuma música encontrada.</p>";
    return;
  }

  lista.forEach((musica, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
            <img src="assets/capa-default.jpg" alt="Capa">
            <div class="card-info">
                <h3>${musica.titulo}</h3>
                <p>${musica.artista || "Desconhecido"}</p>
            </div>
        `;
    card.onclick = () => {
      tocarMusica(index);
    };
    container.appendChild(card);
  });
}

function configurarEventosModal() {
  const modal = document.getElementById("modal-pastas");
  const btnAbrir = document.getElementById("btn-pastas");
  const btnFechar = document.getElementById("btn-fechar-modal");

  btnAbrir.onclick = () => {
    modal.classList.remove("hidden");
    buscarConteudoPasta("");
  };

  btnFechar.onclick = () => {
    modal.classList.add("hidden");
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  };
}
