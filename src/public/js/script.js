// src/public/js/script.js
$(function() {
    let working = false;

    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        if (working) return;
        
        working = true;
        const $form = $(this);
        const $button = $form.find('button');
        const $state = $button.find('.state');
        
        // Obtenemos las credenciales
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
                // EXITO TOTAL
                $button.removeClass('loading').addClass('ok');
                $state.html('¡Bienvenido!');
                $form.addClass('ok'); 
                
                // Redirección inmediata a la caja
                window.location.href = "/caja.html";

            } else {
                // ERROR (Usuario no encontrado o clave incorrecta)
                $button.removeClass('loading');
                $state.html(data.message); // Muestra "Contraseña incorrecta"
                $button.css('background-color', '#e74c3c'); // Botón rojo
                
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