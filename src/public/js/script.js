$(function() {
    let working = false;

    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        if (working) return;
        
        working = true;
        const $form = $(this);
        const $button = $form.find('button');
        const $state = $button.find('.state');
        
        const username = $form.find('input[type="text"]').val();
        const password = $form.find('input[type="password"]').val();

        $button.addClass('loading');
        $state.html('Autenticando...');
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                $button.removeClass('loading').addClass('ok');
                $state.html('¡Bienvenido!');
                $form.addClass('ok'); 
                
                // REDIRECCIÓN INTELIGENTE POR ROLES
                if (data.user.rol_id === 1) {
                    // Si es Admin (Rol 1), va al Dashboard
                    window.location.href = "/dashboard.html";
                } else {
                    // Si es Cajero/Empleado (Rol 2 o 3), va directo a cobrar
                    window.location.href = "/caja.html";
                }

            } else {
                $button.removeClass('loading');
                $state.html(data.message);
                $button.css('background-color', '#e74c3c');
                
                setTimeout(() => {
                    $button.css('background-color', '#2196F3');
                    $state.html('Ingresar');
                    working = false;
                }, 2000);
            }

        } catch (error) {
            console.error("Error de red:", error);
            $button.removeClass('loading');
            $state.html('Error de conexión');
            working = false;
        }
    });
});