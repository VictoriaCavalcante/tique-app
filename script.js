// script.js - Lógica do aplicativo Tique

// Função para mostrar/esconder a senha ao clicar no olho
function togglePassword() {
    const senhaInput = document.getElementById('senha');
    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
    } else {
        senhaInput.type = 'password';
    }
}

// Função de Login
function fazerLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    // Validação rápida para a entrega
    if (email === "admin@email.com" && senha === "123") {
        window.location.href = "dashboard.html";
    } else {
        alert("Use o e-mail 'admin@email.com' e a senha '123' para entrar.");
    }
}