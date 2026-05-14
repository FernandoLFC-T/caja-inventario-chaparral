$(function() {
    let working = false;

    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        if (working) return;
        
        working = true;
        const $form = $(this);
        const $button = $form.find('button');
        const $state = $button.find('.state');

        // 1. Iniciar animación de carga en el botón
        $button.addClass('loading');
        $state.html('Autenticando...');
        
        // --- Simulación de conexión al servidor (2 segundos) ---
        // Pronto lo conectaremos a la Base de Datos real
        setTimeout(function() {
            
            // 2. Transición al estado de ÉXITO
            
            // El botón se vuelve verde con un 'pop' (transform: scale) en CSS
            $button.removeClass('loading').addClass('ok');
            $state.html('¡Bienvenido! El Chaparral');
            
            // El formulario se expande suavemente (gracias a transition: all en .login)
            $form.addClass('ok'); 

            // 3. Simular Redirección (tras ver la animación de bienvenida)
            console.log("Credenciales validadas correctamente. Redirigiendo...");
            setTimeout(() => {
                // window.location.href = "/dashboard"; 

        }, 2000); // 2 segundos de carga simulada
    });
});})