window.onload = () => {

    carregarMusicas();

};

function mostrarMusicas(lista){

    const container = document.getElementById("lista-musicas");

    container.innerHTML = "";

    lista.forEach((musica,index)=>{

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <img src="assets/capa-default.jpg">

            <div class="card-info">

                <h3>${musica.titulo}</h3>

                <p>${musica.artista}</p>

            </div>

        `;

        card.onclick = ()=>{

            tocarMusica(index);

        };

        container.appendChild(card);

    });

}
