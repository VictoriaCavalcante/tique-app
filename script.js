// Inicialização automática ao carregar qualquer tela
document.addEventListener("DOMContentLoaded", () => {
    atualizarDashboardCobrancas();
    renderizarClientes();
    atualizarSaudacao();
    carregarDadosPerfil()
});

// =========================================
// 1. GERENCIAMENTO DE USUÁRIOS E AUTENTICAÇÃO
// =========================================

// "Tabela" de Usuários
function obterUsuarios() {
    const usuarios = localStorage.getItem('tique_usuarios');
    if (usuarios) {
        return JSON.parse(usuarios);
    } else {
        // Novo usuário padrão
        const defaultUser = [{ nome: "Flávio Miranda de Farias", email: "admin@email.com", senha: "123" }];
        localStorage.setItem('tique_usuarios', JSON.stringify(defaultUser));
        return defaultUser;
    }
}

// Função executada na tela cadastro.html (Corrigida com os IDs certos)
function cadastrarUsuario(event) {
    event.preventDefault();
    
    try {
        const inputNome = document.getElementById("cadNome");
        const inputEmail = document.getElementById("cadEmail");
        const inputSenha = document.getElementById("cadSenha");

        // Validação de segurança
        if (!inputNome || !inputEmail || !inputSenha) {
            alert("Erro interno: Campos do formulário não encontrados.");
            return;
        }

        const nome = inputNome.value.trim();
        const email = inputEmail.value.trim().toLowerCase();
        const senha = inputSenha.value;

        // Busca a lista atual de usuários do navegador
        let usuarios = obterUsuarios();
        
        if (!Array.isArray(usuarios)) {
            usuarios = [];
        }

        // Valida se o e-mail já existe para evitar duplicatas
        if (usuarios.some(u => u.email === email)) {
            alert("Este e-mail já está cadastrado!");
            return;
        }

        // Adiciona o novo usuário à lista
        usuarios.push({ nome, email, senha });
        
        // Salva a lista completa de volta no localStorage
        localStorage.setItem('tique_usuarios', JSON.stringify(usuarios));

        alert("Conta criada com sucesso! Faça login.");
        window.location.href = "index.html";
        
    } catch (erro) {
        console.error("Erro ao cadastrar usuário:", erro);
        alert("Ocorreu um erro ao processar o cadastro.");
    }
}

// Função executada na tela index.html
function fazerLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.toLowerCase();
    const senha = document.getElementById("senha").value;

    const usuarios = obterUsuarios();
    
    // Busca dinamicamente se as credenciais batem com ALGUM usuário cadastrado
    const usuarioValido = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuarioValido) {
        // Sessão: Guarda o email e o nome do usuário que logou
        localStorage.setItem("tique_usuario_logado", usuarioValido.email);
        localStorage.setItem("tique_nome_logado", usuarioValido.nome);
        window.location.href = "dashboard.html";
    } else {
        alert("E-mail ou senha inválidos.");
    }
}

function togglePassword() {
    const senhaInput = document.getElementById('senha');
    senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
}

// =========================================
// 2. BANCO DE DADOS (LOCALSTORAGE ISOLADO)
// =========================================

function getChaveDoBanco() {
    // Pega o e-mail dinâmico do usuário atual ou um fallback
    const usuarioAtivo = localStorage.getItem("tique_usuario_logado") || "padrao";
    return `tique_clientes_${usuarioAtivo}`;
}

function obterClientes() {
    const chaveBanco = getChaveDoBanco();
    const dadosSalvos = localStorage.getItem(chaveBanco);
    
    // Se a gaveta dele existir, retorna. Se não, retorna vazio. Sem mocks fixos!
    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
}


// =========================================
// RECUPERAÇÃO DE SENHA (APENAS PARA O MVP)
// =========================================
function simularRecuperacao(event) {
    event.preventDefault();
    const emailInformado = document.getElementById("recuperarEmail").value.toLowerCase();
    
    const usuarios = obterUsuarios();
    // Usamos findIndex para saber exatamente qual a posição do usuário na nossa "tabela"
    const indexUsuario = usuarios.findIndex(u => u.email === emailInformado);

    if (indexUsuario !== -1) {
        // Redefine a senha do usuário encontrado para "123"
        usuarios[indexUsuario].senha = "123";
        
        // Salva a alteração de volta no banco do navegador
        localStorage.setItem('tique_usuarios', JSON.stringify(usuarios));

        // Esconde o formulário
        document.getElementById("recuperarForm").style.display = "none";
        // Mostra a mensagem de sucesso
        document.getElementById("mensagemSucesso").style.display = "block";
    } else {
        alert("Ops! Não encontramos nenhuma conta com este e-mail.");
    }
}


// Função para o botão de revelar a senha padrão na tela recuperar.html
function alternarVisibilidadeSenha() {
    const senhaElemento = document.getElementById('senhaPadrao');
    const iconeElemento = document.getElementById('iconeOlhoPadrao');
    
    // Verifica se está embaçado
    if (senhaElemento.style.filter === 'blur(4px)') {
        // Remove o blur
        senhaElemento.style.filter = 'none';
        
        // Troca para o ícone de olho cortado (esconder)
        iconeElemento.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        // Coloca o blur novamente
        senhaElemento.style.filter = 'blur(4px)';
        
        // Troca para o ícone de olho normal (revelar)
        iconeElemento.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}



// =========================================
// 3. TELA DE COBRANÇAS
// =========================================

// FUNÇÃO NOVA: Puxa apenas as cobranças do usuário que está logado
function obterClientesDoUsuario() {
    const emailLogado = localStorage.getItem("tique_usuario_logado");
    if (!emailLogado) return [];
    
    const todosClientes = obterClientes();
    return todosClientes.filter(c => c.donoDaCobranca === emailLogado);
}

// FUNÇÃO NOVA: Roda no onload do body para atualizar saudações e checar atrasos
function inicializarCobrancas() {
    // 1. Atualiza Saudação
    const nomeLogado = localStorage.getItem("tique_nome_logado") || "";
    const saudacaoEl = document.getElementById("textoSaudacao");
    if (saudacaoEl && nomeLogado) {
        const hora = new Date().getHours();
        let cumprimento = "Bom dia";
        if (hora >= 12 && hora < 18) cumprimento = "Boa tarde";
        else if (hora >= 18) cumprimento = "Boa noite";
        saudacaoEl.innerText = `${cumprimento}, ${nomeLogado.split(" ")[0]}`;
    }

    // 2. Verifica se alguma data passou para mudar para "ATRASADO" automaticamente
    let todosClientes = obterClientes();
    let houveAlteracao = false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    todosClientes.forEach(c => {
        const partes = c.data.split('/');
        const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
        if (dataVenc < hoje && c.status === "A Vencer") {
            c.status = "ATRASADO";
            houveAlteracao = true;
        }
    });

    if (houveAlteracao) {
        localStorage.setItem('tique_clientes', JSON.stringify(todosClientes));
    }

    // 3. Renderiza a tela
    atualizarDashboardCobrancas();
    renderizarClientes();
}

function atualizarDashboardCobrancas() {
    const elTotalAberto = document.getElementById("totalAberto");
    const elTotalAtrasados = document.getElementById("totalAtrasados");

    if (elTotalAberto && elTotalAtrasados) {
        let somaAberto = 0;
        let contAtrasados = 0;
        
        // Puxa apenas os clientes de quem está logado
        const clientes = obterClientesDoUsuario();

        clientes.forEach(c => {
            somaAberto += c.valorNum;
            if (c.status === "ATRASADO") contAtrasados++;
        });

        elTotalAberto.innerText = `R$ ${somaAberto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        elTotalAtrasados.innerText = contAtrasados;
    }
}

function renderizarClientes(clientesParam) {
    const lista = document.getElementById("listaClientes");
    if (!lista) return; 

    // Se não passar parâmetro, puxa os clientes do usuário logado
    const clientes = clientesParam || obterClientesDoUsuario();
    lista.innerHTML = ""; 
    
    // Busca a mensagem personalizada salva pelo usuário na tela de Ajustes
    const emailLogado = localStorage.getItem("tique_usuario_logado");
    const usuarios = obterUsuarios();
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);
    const msgPadrao = "Olá, {{nome_cliente}}! Passando para lembrar do vencimento da sua fatura no valor de R$ {{valor}} no dia {{vencimento}}.";
    const textoTemplate = (usuarioAtual && usuarioAtual.mensagemPersonalizada) ? usuarioAtual.mensagemPersonalizada : msgPadrao;

    if (clientes.length === 0) {
        lista.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 40px 20px; font-size: 14px;">Nenhuma cobrança encontrada.</div>`;
        return;
    }

    clientes.forEach(cliente => {
        // Substitui as variáveis da mensagem dinâmica
        let textoWhats = textoTemplate.replace(/{{nome_cliente}}/g, cliente.nome.split(" ")[0]);
        textoWhats = textoWhats.replace(/{{valor}}/g, cliente.valor);
        textoWhats = textoWhats.replace(/{{vencimento}}/g, cliente.data);
        
        const linkWhats = `https://wa.me/${cliente.tel}?text=${encodeURIComponent(textoWhats)}`;

        // Lógica de UI que já estava no seu código
        const badgeHtml = cliente.status === "ATRASADO" 
            ? `<span class="status-badge status-atrasado">${cliente.status}</span>` 
            : ``;
            
        const textoData = cliente.status === "ATRASADO" ? `Venceu em ${cliente.data}` : `Vence em ${cliente.data}`;

        const card = `
            <div class="cliente-card-compact">
                <div class="cliente-avatar ${cliente.cor}">
                    ${cliente.avatar}
                </div>
                <div class="cliente-info-compact">
                    <h4 class="cliente-nome-compact">${cliente.nome}</h4>
                    ${badgeHtml}
                    <span class="cliente-data">${textoData}</span>
                </div>
                <div class="cliente-acao-compact">
                    <h4 class="cliente-valor-compact">R$ ${cliente.valor}</h4>
                    <a href="${linkWhats}" target="_blank" class="btn-cobrar-light">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        Cobrar
                    </a>
                </div>
            </div>
        `;
        lista.innerHTML += card;
    });
}

function filtrarCobrancas(status, botaoClicado) {
    document.querySelectorAll('.cobrancas-filters .filter-pill').forEach(btn => btn.classList.remove('active'));
    botaoClicado.classList.add('active');

    const todosClientesUsuario = obterClientesDoUsuario();
    if (status === 'Todos') {
        renderizarClientes(todosClientesUsuario);
    } else {
        const filtrados = todosClientesUsuario.filter(c => c.status === status);
        renderizarClientes(filtrados);
    }
}

// =========================================
// 4. TELA DE NOVO CADASTRO
// =========================================
function salvarNovaCobranca(event) {
    event.preventDefault();

    try {
        // 1. Verifica quem está logado para atrelar o cliente a este usuário
        const emailLogado = localStorage.getItem("tique_usuario_logado");
        if (!emailLogado) {
            alert("Você precisa estar logado para salvar uma cobrança.");
            window.location.href = "index.html";
            return;
        }

        const inputNome = document.getElementById("novoNome");
        const inputValor = document.getElementById("novoValor");
        const inputData = document.getElementById("novoData");
        const inputWhats = document.getElementById("novoWhats");

        if (!inputNome || !inputValor || !inputData || !inputWhats) {
            alert("Erro: Campos do formulário não encontrados.");
            return;
        }

        const nome = inputNome.value.trim();
        const valor = parseFloat(inputValor.value);
        const dataRaw = inputData.value;
        let whats = inputWhats.value;

        // Limpa o WhatsApp (deixa só números) e garante o 55 do Brasil
        whats = whats.replace(/\D/g, ''); 
        if(!whats.startsWith('55') && whats.length > 0) whats = '55' + whats;

        // Converte a data de AAAA-MM-DD para DD/MM/AAAA
        const partesData = dataRaw.split("-");
        const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

        // Formata o valor com vírgula (ex: 1500.5 -> 1.500,50)
        const valorFormatado = valor.toLocaleString('pt-BR', {minimumFractionDigits: 2});

        // Pega as iniciais para o Avatar (Primeira e última)
        const partesNome = nome.split(" ").filter(p => p.trim() !== "");
        let iniciais = partesNome[0].charAt(0).toUpperCase();
        if (partesNome.length > 1) {
            iniciais += partesNome[partesNome.length - 1].charAt(0).toUpperCase();
        }

        // Sorteia uma cor de fundo para o Avatar
        const cores = ["bg-yellow", "bg-red", "bg-blue", "bg-green-av", "bg-purple-av", "bg-gray-av"];
        const corSorteada = cores[Math.floor(Math.random() * cores.length)];

        // Objeto do cliente com a sua lógica + a identificação do dono
        const novoCliente = {
            id: Date.now(),
            donoDaCobranca: emailLogado, // <-- ISSO GARANTE QUE O CLIENTE É DE QUEM CADASTROU
            nome: nome,
            valor: valorFormatado,
            valorNum: valor,
            status: "A Vencer",
            data: dataFormatada,
            avatar: iniciais,
            cor: corSorteada,
            tel: whats
        };

        // Puxa a lista salva, adiciona o novo e salva de novo
        // (Certifique-se de que a função obterClientes() retorne um array vazio [] caso não exista nada salvo)
        const clientes = obterClientes();
        clientes.push(novoCliente);
        localStorage.setItem('tique_clientes', JSON.stringify(clientes));

        // Redireciona de volta para a lista
        window.location.href = "cobrancas.html";

    } catch (erro) {
        console.error("Erro ao salvar nova cobrança:", erro);
        alert("Ocorreu um erro ao processar os dados. Verifique o console.");
    }
}


// =========================================
// 5. TELA DE AJUSTES
// =========================================
function sairDoApp() {
    // Limpa a sessão do usuário atual da memória
    localStorage.removeItem("tique_usuario_logado");
    localStorage.removeItem("tique_nome_logado");
    
    // Redireciona de volta para a tela de login
    window.location.href = "index.html";
}



// =========================================
// 6. PERSONALIZAÇÃO DA SAUDAÇÃO DINÂMICA
// =========================================
function atualizarSaudacao() {
    const elementoSaudacao = document.getElementById("textoSaudacao");
    const nomeLogado = localStorage.getItem("tique_nome_logado");

    if (elementoSaudacao) {
        // Pega a hora atual do dispositivo (0 a 23)
        const horaAtual = new Date().getHours();
        let saudacaoTexto = "Bom dia";

        // Define a saudação baseada no horário
        if (horaAtual >= 12 && horaAtual < 18) {
            saudacaoTexto = "Boa tarde";
        } else if (horaAtual >= 18 || horaAtual < 5) {
            saudacaoTexto = "Boa noite";
        }

        // Se houver usuário logado, personaliza com o primeiro nome
        if (nomeLogado) {
            const primeiroNome = nomeLogado.split(" ")[0];
            const temEmoji = elementoSaudacao.innerText.includes("👋");
            elementoSaudacao.innerText = `${saudacaoTexto}, ${primeiroNome}${temEmoji ? ' 👋' : ''}`;
        } else {
            // Fallback caso não encontre o nome
            elementoSaudacao.innerText = `${saudacaoTexto} 👋`;
        }
    }
}





// =========================================
// 7. CARREGAR DADOS DO PERFIL (AJUSTES)
// =========================================
function carregarDadosPerfil() {
    const nomeSalvo = localStorage.getItem("tique_nome_logado");
    const emailSalvo = localStorage.getItem("tique_usuario_logado");

    const elementoNome = document.getElementById("perfilNome");
    const elementoEmail = document.getElementById("perfilEmail");
    const elementoAvatar = document.getElementById("perfilAvatar");

    if (elementoNome && nomeSalvo) {
        elementoNome.innerText = nomeSalvo;
    }

    if (elementoEmail && emailSalvo) {
        elementoEmail.innerText = emailSalvo;
    }

    if (elementoAvatar && nomeSalvo) {
        // Pega a primeira letra do nome e transforma em maiúscula (ex: "P" de Professor)
        elementoAvatar.innerText = nomeSalvo.charAt(0).toUpperCase();
    }
}



// =========================================
// 8. EDIÇÃO DE CONTA (MINHA CONTA)
// =========================================

// Preenche o formulário com os dados do usuário logado atualmente
function carregarDadosEdicao() {
    const emailLogado = localStorage.getItem("tique_usuario_logado");
    const usuarios = obterUsuarios();
    
    // Acha o usuário correspondente no "banco"
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);

    if (usuarioAtual) {
        document.getElementById("editNome").value = usuarioAtual.nome;
        document.getElementById("editEmail").value = usuarioAtual.email;
        document.getElementById("editSenha").value = usuarioAtual.senha;
    }
}

// Salva as alterações e obriga o usuário a logar novamente
function salvarAlteracoesConta(event) {
    event.preventDefault();
    
    const emailAntigo = localStorage.getItem("tique_usuario_logado");
    const novoNome = document.getElementById("editNome").value;
    const novoEmail = document.getElementById("editEmail").value.toLowerCase();
    const novaSenha = document.getElementById("editSenha").value;

    let usuarios = obterUsuarios();

    // Valida se o novo e-mail já está em uso por OUTRO usuário
    const emailJaExiste = usuarios.some(u => u.email === novoEmail && u.email !== emailAntigo);
    if (emailJaExiste) {
        alert("Este e-mail já está sendo usado por outra conta!");
        return;
    }
    
    // Encontra a posição exata do usuário atual na lista
    const index = usuarios.findIndex(u => u.email === emailAntigo);

    if (index !== -1) {
        // Atualiza os dados apenas deste usuário, mantendo todos os outros intactos
        usuarios[index].nome = novoNome;
        usuarios[index].email = novoEmail;
        usuarios[index].senha = novaSenha;

        // Salva a lista atualizada
        localStorage.setItem('tique_usuarios', JSON.stringify(usuarios));

        alert("Dados alterados com sucesso! Por segurança, faça login novamente.");
        
        // Limpa a sessão
        localStorage.removeItem("tique_usuario_logado");
        localStorage.removeItem("tique_nome_logado");

        window.location.href = "index.html";
    } else {
        alert("Erro ao localizar o usuário para atualização.");
    }
}



// =========================================
// 9. CONFIGURAÇÃO DE MENSAGEM (WHATSAPP)
// =========================================

// Carrega a mensagem salva ou exibe uma padrão
function carregarMensagem() {
    const emailLogado = localStorage.getItem("tique_usuario_logado");
    const usuarios = obterUsuarios();
    const usuarioAtual = usuarios.find(u => u.email === emailLogado);

    const textArea = document.getElementById("textoMensagem");

    if (usuarioAtual && textArea) {
        // Se o usuário não tiver uma mensagem personalizada salva ainda, sugerimos um template padrão
        const mensagemPadrao = "Olá, {{nome_cliente}}! Passando para lembrar do vencimento da sua fatura no valor de R$ {{valor}} no dia {{vencimento}}. Qualquer dúvida, estou à disposição!";
        
        textArea.value = usuarioAtual.mensagemPersonalizada || mensagemPadrao;
    }
}

// Salva a mensagem no perfil do usuário logado
function salvarMensagem(event) {
    event.preventDefault();
    
    const emailLogado = localStorage.getItem("tique_usuario_logado");
    const novaMensagem = document.getElementById("textoMensagem").value;
    
    let usuarios = obterUsuarios();
    const index = usuarios.findIndex(u => u.email === emailLogado);

    if (index !== -1) {
        // Cria ou atualiza a propriedade mensagemPersonalizada
        usuarios[index].mensagemPersonalizada = novaMensagem;
        
        localStorage.setItem('tique_usuarios', JSON.stringify(usuarios));
        
        alert("Mensagem de cobrança salva com sucesso!");
        window.location.href = "ajustes.html"; // Volta para a tela de ajustes
    } else {
        alert("Erro ao salvar mensagem. Usuário não encontrado.");
    }
}

// Insere a variável no local exato onde o cursor do mouse está piscando
function inserirVariavel(variavel) {
    const textArea = document.getElementById("textoMensagem");
    
    // Captura a posição inicial e final da seleção/cursor
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd;
    
    // Divide o texto atual em "antes" e "depois" do cursor
    const textoAntes = textArea.value.substring(0, startPos);
    const textoDepois = textArea.value.substring(endPos, textArea.value.length);
    
    // Injeta a variável no meio
    textArea.value = textoAntes + variavel + textoDepois;
    
    // Devolve o foco para o campo de texto e posiciona o cursor logo após a variável recém inserida
    textArea.focus();
    textArea.selectionStart = startPos + variavel.length;
    textArea.selectionEnd = startPos + variavel.length;
}