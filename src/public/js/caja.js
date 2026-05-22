let ticket = [];
let granTotal = 0.00;

$(document).ready(function() {
    const $buscarInput = $('#buscar');
    const $resultados = $('#resultados-busqueda');
    let timeoutBusqueda;

    $buscarInput.focus();

    // Si el usuario hace clic fuera de un input, devolver el focus a la pistola
    $(document).on('click', function(e) {
        // EXCEPCIÓN: Si el modal de cobro está abierto, NO robamos el foco
        if ($('#modal-cobro').attr('open')) {
            return; 
        }

        if (!$(e.target).closest('.search-container').length && e.target.tagName !== 'BUTTON') {
            $resultados.hide();
            $buscarInput.focus();
        }
    });

    $buscarInput.on('input', function() {
        clearTimeout(timeoutBusqueda);
        const termino = $(this).val().trim();

        if (termino.length < 3) {
            $resultados.hide().empty();
            return;
        }

        timeoutBusqueda = setTimeout(() => {
            buscarSugerencias(termino);
        }, 300);
    });

    $buscarInput.on('keypress', async function(e) {
        if (e.which === 13) { 
            e.preventDefault();
            clearTimeout(timeoutBusqueda);
            $resultados.hide(); 

            const codigo = $(this).val().trim();
            if (codigo) {
                await buscarYAgregarProducto(codigo);
                $(this).val('').focus();
            }
        }
    });
});

// --- Lógica del Backend ---

async function buscarYAgregarProducto(codigo) {
    try {
        const response = await fetch(`/api/productos/buscar/${codigo}`);
        
        if (!response.ok) {
            mostrarToast("Producto no encontrado.", "error");
            return;
        }

        const producto = await response.json();
        agregarFilaTicket(producto);

    } catch (error) {
        console.error("Error buscando producto:", error);
        mostrarToast("Error de conexión con el servidor.", "error");
    }
}

async function buscarSugerencias(termino) {
    try {
        const response = await fetch(`/api/productos/buscar-nombre/${termino}`);
        if (!response.ok) return;

        const productos = await response.json();
        const $resultados = $('#resultados-busqueda');
        $resultados.empty();

        if (productos.length === 0) {
            $resultados.append('<div class="dropdown-item"><em>No se encontraron productos</em></div>');
        } else {
            productos.forEach(prod => {
                $resultados.append(`
                    <div class="dropdown-item" onclick="seleccionarSugerencia('${prod.codigo_barras}')">
                        <span>${prod.nombre_presentacion}</span>
                        <span class="precio-badge">S/ ${parseFloat(prod.precio_venta).toFixed(2)}</span>
                    </div>
                `);
            });
        }
        $resultados.show();

    } catch (error) {
        console.error("Error buscando sugerencias:", error);
    }
}

// --- Funciones de la Interfaz y Carrito ---

window.seleccionarSugerencia = function(codigo_barras) {
    $('#resultados-busqueda').hide();
    $('#buscar').val('');
    buscarYAgregarProducto(codigo_barras); 
}

function agregarFilaTicket(producto) {
    // 1. Verificamos si el producto ya está en el ticket
    const itemExistente = ticket.find(item => item.presentacion_id === producto.presentacion_id);

    if (itemExistente) {
        // Si existe, solo aumentamos la cantidad
        itemExistente.cantidad += 1;
    } else {
        // Si no existe, lo agregamos como fila nueva
        ticket.push({
            presentacion_id: producto.presentacion_id,
            nombre: producto.nombre_presentacion,
            precio: parseFloat(producto.precio_venta),
            cantidad: 1
        });
    }

    // 2. Recalculamos todo y pintamos
    actualizarTotalYRenderizar();
}

// Nueva función para modificar cantidades desde los botones +/-
window.cambiarCantidad = function(id, cambio) {
    const index = ticket.findIndex(item => item.presentacion_id === id);
    
    if (index !== -1) {
        ticket[index].cantidad += cambio;
        
        // Si la cantidad llega a 0, eliminamos el producto del arreglo
        if (ticket[index].cantidad <= 0) {
            ticket.splice(index, 1);
        }
        
        actualizarTotalYRenderizar();
    }
    $('#buscar').focus(); // Devolver el foco a la pistola para no perder ritmo
}

// Nueva función centralizada para evitar errores matemáticos
function actualizarTotalYRenderizar() {
    // Usamos reduce para sumar (cantidad * precio) de cada elemento en el arreglo
    granTotal = ticket.reduce((suma, item) => suma + (item.cantidad * item.precio), 0);
    renderizarTicket();
}

function renderizarTicket() {
    const $tbody = $('#lista-ticket');
    $tbody.empty();

    if (ticket.length === 0) {
        $tbody.append('<tr><td colspan="4" class="text-center"><small><em>Escanea un producto para comenzar</em></small></td></tr>');
        $('#gran-total').text('0.00');
        return;
    }

    ticket.forEach((item) => {
        $tbody.append(`
            <tr>
                <td>
                    <div class="control-cantidad">
                        <button class="outline secondary btn-cantidad" onclick="cambiarCantidad(${item.presentacion_id}, -1)">-</button>
                        <span class="cant-numero">${item.cantidad}</span>
                        <button class="outline secondary btn-cantidad" onclick="cambiarCantidad(${item.presentacion_id}, 1)">+</button>
                    </div>
                </td>
                <td>${item.nombre}</td>
                <td>S/ ${item.precio.toFixed(2)}</td>
                <td class="text-right">S/ ${(item.cantidad * item.precio).toFixed(2)}</td>
            </tr>
        `);
    });

    $('#gran-total').text(granTotal.toFixed(2));
}

window.agregarAlTicket = function(nombre, precio) {
    // Creamos un ID ficticio basado en el nombre para que los botones +/- funcionen también con los favoritos
    const idFicticio = nombre.length; 
    
    agregarFilaTicket({
        presentacion_id: idFicticio, 
        nombre_presentacion: nombre,
        precio_venta: precio
    });
    $('#buscar').focus();
}
// ==========================================
// MÓDULO DE COBRO Y MODAL
// ==========================================

$(document).ready(function() {
    // Al hacer clic en el botón grandote de COBRAR
    $('#btn-cobrar').on('click', function() {
        if (ticket.length === 0) {
            mostrarToast("El ticket está vacío. Escanea productos primero.", "aviso");
            $('#buscar').focus();
            return;
        }
        
        // Preparamos el modal
        $('#modal-total').text(granTotal.toFixed(2));
        $('#monto-efectivo').val('');
        $('#monto-yape').val('');
        $('#alerta-combinado').text('');
        $('#seccion-pago-combinado').hide();
        $('#opciones-pago-rapido').show();
        
        // Abrimos el modal de Pico CSS
        $('#modal-cobro').attr('open', true);
    });

    // Detectar F12 para abrir el modal rápido (Atajo de teclado)
    $(document).on('keydown', function(e) {
        if (e.key === 'F12') {
            e.preventDefault();
            $('#btn-cobrar').click();
        }
    });
});

window.cerrarModalCobro = function() {
    $('#modal-cobro').removeAttr('open');
    $('#buscar').focus(); // Devolvemos el foco a la pistola
};

window.mostrarPagoCombinado = function() {
    $('#seccion-pago-combinado').slideDown();
    $('#monto-efectivo').focus();
};

window.calcularVueltoCombinado = function() {
    const efect = parseFloat($('#monto-efectivo').val()) || 0;
    const yape = parseFloat($('#monto-yape').val()) || 0;
    const suma = efect + yape;

    const $alerta = $('#alerta-combinado');

    if (suma < granTotal) {
        $alerta.text(`Falta cobrar: S/ ${(granTotal - suma).toFixed(2)}`);
        $alerta.css('color', '#e74c3c'); // Rojo
    } else if (suma > granTotal) {
        // El vuelto SOLO se da del efectivo, Yape siempre debe ser exacto
        $alerta.text(`Vuelto a entregar: S/ ${(suma - granTotal).toFixed(2)}`);
        $alerta.css('color', '#2ecc71'); // Verde
    } else {
        $alerta.text('Pago exacto.');
        $alerta.css('color', '#2ecc71'); // Verde
    }
};
window.procesarPago = function(metodo) {
    let pagadoEfectivo = 0;
    let pagadoYape = 0;

    if (metodo === 'Efectivo') {
        pagadoEfectivo = granTotal;
    } else if (metodo === 'Yape') {
        pagadoYape = granTotal;
    } else if (metodo === 'Combinado') {
        pagadoEfectivo = parseFloat($('#monto-efectivo').val()) || 0;
        pagadoYape = parseFloat($('#monto-yape').val()) || 0;

        if ((pagadoEfectivo + pagadoYape) < granTotal) {
            // Reemplazo del alert() feo por nuestro Toast de error
            mostrarToast("El monto ingresado no cubre el total.", "error");
            return;
        }
    }

    // ¡Aquí simularemos que guardamos en la base de datos!
    console.log("Enviando al backend:", {
        ticket: ticket,
        total: granTotal,
        metodo: metodo,
        pago_efectivo: pagadoEfectivo,
        pago_yape: pagadoYape
    });

    // 1. Limpiar toda la interfaz para el siguiente cliente
    ticket = [];
    granTotal = 0;
    actualizarTotalYRenderizar();
    cerrarModalCobro(); // Esto cierra el modal y devuelve el cursor a la pistola

    // 2. Mostrar nuestra alerta universal de éxito (Toast)
    mostrarToast("¡Venta Registrada con Éxito!", "exito");
};
window.mostrarToast = function(mensaje, tipo = 'exito') {
    const $toast = $('#toast-notification');
    const $icono = $('#toast-icon');
    const $texto = $('#toast-mensaje');

    // 1. Limpiamos clases y animaciones previas
    $toast.removeClass('toast-exito toast-error toast-aviso mostrar');
    $icono.removeClass('fa-check-circle fa-times-circle fa-exclamation-triangle');

    // 2. Pintamos según el tipo de alerta
    if (tipo === 'exito') {
        $toast.addClass('toast-exito');
        $icono.addClass('fa-check-circle');
    } else if (tipo === 'error') {
        $toast.addClass('toast-error');
        $icono.addClass('fa-times-circle');
    } else if (tipo === 'aviso') {
        $toast.addClass('toast-aviso');
        $icono.addClass('fa-exclamation-triangle');
    }

    $texto.text(mensaje);

    // 3. Pequeño delay para forzar el redibujado y disparar la animación
    setTimeout(() => {
        $toast.addClass('mostrar');
    }, 50);

    // 4. Ocultar a los 3 segundos
    setTimeout(() => {
        $toast.removeClass('mostrar');
    }, 3000);
};