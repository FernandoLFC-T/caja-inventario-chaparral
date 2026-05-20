$(function() {
    let working = false;

    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        if (working) return;
        
        working = true;
        const $form = $(this);
        const $button = $form.find('button');
        const $state = $button.find('.state');
        
        $button.addClass('loading');
        $state.html('Autenticando...');

        setTimeout(function() {
            
            // 2. Transición al estado de ÉXITO
            $button.removeClass('loading').addClass('ok');
            $state.html('¡Bienvenido! El Chaparral');
            
            $form.addClass('ok'); 

            // 3. Simular Redirección (tras ver la animación de bienvenida)
            console.log("Credenciales validadas correctamente. Redirigiendo...");
                window.location.href = "/caja.html";
    });
});})