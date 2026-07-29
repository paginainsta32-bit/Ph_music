let musicas = [];

async function carregarMusicas() {

    try {

        const resposta = await fetch(CONFIG.API_URL);

        if (!resposta.ok) {
            throw new Error("Erro ao acessar a API");
        }

        musicas = await resposta.json();

        console.log("Músicas carregadas:", musicas);

        mostrarMusicas(musicas);

    } catch (erro) {

        console.error(erro);

        document.getElementById("lista-musicas").innerHTML = `
            <div style="padding:30px;color:#ff4444">
                Não foi possível carregar as músicas.
            </div>
        `;

    }

}