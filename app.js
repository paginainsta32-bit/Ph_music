window.onload = () => {
  carregarMusicas();
  configurarEventosModal();
  configurarMenuMobile();
};

function mostrarMusicas(lista) {
  const container = document.getElementById("lista-musicas");
  container.innerHTML = "";

  if (!lista || lista.length === 0) {
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
        <p>${musica.artista || "PH MUSIC"}</p>
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

  if (btnAbrir) {
    btnAbrir.onclick = () => {
      if (modal) modal.classList.remove("hidden");
      buscarConteudoPasta(""); // Carrega diretórios da raiz do R2
      fecharSidebar();
    };
  }

  if (btnFechar) {
    btnFechar.onclick = () => {
      if (modal) modal.classList.add("hidden");
    };
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  };
}

function configurarMenuMobile() {
  const btnToggle = document.getElementById("btn-menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const btnEqToggle = document.getElementById("btn-toggle-eq");
  const eqBox = document.getElementById("equalizador-box");

  if (btnToggle) {
    btnToggle.onclick = () => {
      if (sidebar) sidebar.classList.toggle("open");
      if (overlay) overlay.classList.toggle("active");
    };
  }

  if (overlay) overlay.onclick = fecharSidebar;

  if (btnEqToggle && eqBox) {
    btnEqToggle.onclick = () => {
      eqBox.classList.toggle("hidden-mobile");
    };
  }
}

function fecharSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("active");
}
