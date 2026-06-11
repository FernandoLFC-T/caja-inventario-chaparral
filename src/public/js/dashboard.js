let ventasChart;

$(document).ready(async function() {
    // Inicialización
    cargarResumen();
    cargarGraficoVentas();

    try {
        const res = await fetch('/api/admin/dias-con-ventas');
        if (res.ok) {
            const diasConVentas = await res.json();
            
            flatpickr("#filtro-fecha", {
                locale: "es",
                dateFormat: "Y-m-d",
                enable: diasConVentas.length > 0 ? diasConVentas : [new Date()],
                defaultDate: new Date(),
                onChange: function(selectedDates, dateStr, instance) {
                    cargarResumen(dateStr);
                }
            });
        }
    } catch(e) {
        console.error("Error al cargar dias con ventas", e);
    }

    // Navegación SPA
    $('.nav-link').on('click', function(e) {
        e.preventDefault();
        
        // Manejar clases activas en el menú
        $('.nav-link').removeClass('primary').addClass('secondary');
        $(this).removeClass('secondary').addClass('primary');

        // Mostrar sección correspondiente
        const target = $(this).data('target');
        $('.admin-seccion').hide();
        $(`#seccion-${target}`).fadeIn(200);

        // Cargar datos según la sección
        if (target === 'resumen') cargarResumen();
        else if (target === 'inventario') cargarInventario();
        else if (target === 'usuarios') cargarUsuarios();
        else if (target === 'kardex') cargarKardex();
    });
});

// --- Funciones de Carga de Datos ---

async function cargarResumen(fecha = null) {
    try {
        const url = fecha ? `/api/admin/resumen?fecha=${fecha}` : '/api/admin/resumen';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al cargar resumen');
        const data = await res.json();

        $('#resumen-ventas').text(`S/ ${parseFloat(data.ventas_hoy).toFixed(2)}`);
        $('#resumen-utilidad').text(`S/ ${parseFloat(data.utilidad_estimada).toFixed(2)}`);
        $('#resumen-ticket').text(`S/ ${parseFloat(data.ticket_promedio).toFixed(2)}`);

        const $tbody = $('#tabla-ultimas-ventas');
        $tbody.empty();

        if (data.ultimas_ventas.length === 0) {
            $tbody.append('<tr><td colspan="4" class="text-center">No hay ventas registradas en esta fecha.</td></tr>');
        } else {
            data.ultimas_ventas.forEach(v => {
                const fechaVenta = new Date(v.fecha).toLocaleTimeString();
                $tbody.append(`
                    <tr>
                        <td>#${v.id}</td>
                        <td>${v.cajero}</td>
                        <td>${fechaVenta}</td>
                        <td><strong>S/ ${parseFloat(v.total).toFixed(2)}</strong></td>
                    </tr>
                `);
            });
        }
    } catch (error) {
        console.error(error);
        $('#tabla-ultimas-ventas').html('<tr><td colspan="4" class="text-center" style="color:red;">Error de conexión</td></tr>');
    }
}

async function cargarGraficoVentas() {
    try {
        const res = await fetch('/api/admin/ventas-chart');
        if (!res.ok) throw new Error('Error al cargar grafico');
        const data = await res.json();
        
        const labels = data.map(d => d.fecha);
        const valores = data.map(d => d.total);

        const ctx = document.getElementById('grafico-ventas').getContext('2d');
        if (ventasChart) {
            ventasChart.destroy();
        }

        ventasChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas (S/)',
                    data: valores,
                    backgroundColor: 'rgba(33, 150, 243, 0.5)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
}

async function cargarInventario() {
    try {
        const res = await fetch('/api/admin/inventario');
        if (!res.ok) throw new Error('Error al cargar inventario');
        const data = await res.json();

        const $tbody = $('#tabla-inventario');
        $tbody.empty();

        if (data.length === 0) {
            $tbody.append('<tr><td colspan="5" class="text-center">No hay productos en el inventario.</td></tr>');
        } else {
            data.forEach(p => {
                const badgeStyle = p.stock_actual <= p.stock_minimo ? 'background-color: #ff5252; color: white; padding: 2px 6px; border-radius: 4px;' : 'color: inherit;';
                $tbody.append(`
                    <tr>
                        <td><strong>${p.nombre}</strong></td>
                        <td><span style="${badgeStyle}">${p.stock_actual}</span></td>
                        <td>${p.nombre_presentacion || '-'}</td>
                        <td><small>${p.codigo_barras || '-'}</small></td>
                        <td>${p.precio_venta ? 'S/ ' + parseFloat(p.precio_venta).toFixed(2) : '-'}</td>
                    </tr>
                `);
            });
        }
    } catch (error) {
        console.error(error);
        $('#tabla-inventario').html('<tr><td colspan="5" class="text-center" style="color:red;">Error de conexión</td></tr>');
    }
}

async function cargarUsuarios() {
    try {
        const res = await fetch('/api/admin/usuarios');
        if (!res.ok) throw new Error('Error al cargar usuarios');
        const data = await res.json();

        const $tbody = $('#tabla-usuarios');
        $tbody.empty();

        if (data.length === 0) {
            $tbody.append('<tr><td colspan="5" class="text-center">No hay usuarios.</td></tr>');
        } else {
            data.forEach(u => {
                const fecha = new Date(u.creado_en).toLocaleDateString();
                const estadoText = u.estado == 1 ? '<span style="color: #4caf50;">Activo</span>' : '<span style="color: #ff5252;">Inactivo</span>';
                $tbody.append(`
                    <tr>
                        <td>${u.id}</td>
                        <td><strong>${u.username}</strong></td>
                        <td>${u.rol}</td>
                        <td>${estadoText}</td>
                        <td>${fecha}</td>
                    </tr>
                `);
            });
        }
    } catch (error) {
        console.error(error);
        $('#tabla-usuarios').html('<tr><td colspan="5" class="text-center" style="color:red;">Error de conexión</td></tr>');
    }
}

async function cargarKardex() {
    try {
        const res = await fetch('/api/admin/kardex');
        if (!res.ok) throw new Error('Error al cargar kardex');
        const data = await res.json();

        const $tbody = $('#tabla-kardex');
        $tbody.empty();

        if (data.length === 0) {
            $tbody.append('<tr><td colspan="6" class="text-center">No hay movimientos registrados.</td></tr>');
        } else {
            data.forEach(k => {
                const fecha = new Date(k.fecha).toLocaleString();
                const movColor = k.tipo_movimiento === 'ENTRADA' ? '#4caf50' : '#ff5252';
                $tbody.append(`
                    <tr>
                        <td><small>${fecha}</small></td>
                        <td>${k.producto}</td>
                        <td><strong style="color: ${movColor};">${k.tipo_movimiento}</strong></td>
                        <td>${k.motivo}</td>
                        <td>${k.cantidad}</td>
                        <td>${k.username}</td>
                    </tr>
                `);
            });
        }
    } catch (error) {
        console.error(error);
        $('#tabla-kardex').html('<tr><td colspan="6" class="text-center" style="color:red;">Error de conexión</td></tr>');
    }
}

// --- Lógica de Modales ---

function abrirModalProducto() {
    document.getElementById('modal-nuevo-producto').setAttribute('open', true);
}

function cerrarModalProducto() {
    document.getElementById('modal-nuevo-producto').removeAttribute('open');
    document.getElementById('form-nuevo-producto').reset();
}

function abrirModalUsuario() {
    document.getElementById('modal-nuevo-usuario').setAttribute('open', true);
}

function cerrarModalUsuario() {
    document.getElementById('modal-nuevo-usuario').removeAttribute('open');
    document.getElementById('form-nuevo-usuario').reset();
}

window.mostrarToast = function(mensaje, tipo = 'exito') {
    const $toast = $('#toast-notification');
    const $icono = $('#toast-icon');
    const $texto = $('#toast-mensaje');

    $toast.removeClass('toast-exito toast-error toast-aviso mostrar');
    $icono.removeClass('fa-check-circle fa-times-circle fa-exclamation-triangle');

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

    setTimeout(() => {
        $toast.addClass('mostrar');
    }, 50);

    setTimeout(() => {
        $toast.removeClass('mostrar');
    }, 3000);
};

// --- Envíos de Formularios ---

$(document).ready(function() {
    $('#form-nuevo-producto').on('submit', async function(e) {
        e.preventDefault();
        const data = {
            nombre_base: $('#nombre_base').val(),
            descripcion: $('#descripcion').val(),
            stock_inicial: parseInt($('#stock_inicial').val()) || 0,
            stock_minimo: parseInt($('#stock_minimo').val()) || 5,
            nombre_presentacion: $('#nombre_presentacion').val(),
            codigo_barras: $('#codigo_barras').val(),
            costo: parseFloat($('#costo').val()),
            precio_venta: parseFloat($('#precio_venta').val())
        };

        const $btn = $('#btn-guardar-producto');
        $btn.attr('aria-busy', 'true');

        try {
            const res = await fetch('/api/admin/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (res.ok) {
                mostrarToast('Producto creado exitosamente', 'exito');
                cerrarModalProducto();
                cargarInventario();
            } else {
                mostrarToast('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            mostrarToast('Error de conexión', 'error');
        } finally {
            $btn.attr('aria-busy', 'false');
        }
    });

    $('#form-nuevo-usuario').on('submit', async function(e) {
        e.preventDefault();
        const data = {
            username: $('#username').val(),
            password: $('#password').val(),
            rol_id: $('#rol_id').val()
        };

        const $btn = $('#btn-guardar-usuario');
        $btn.attr('aria-busy', 'true');

        try {
            const res = await fetch('/api/admin/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (res.ok) {
                mostrarToast('Usuario creado exitosamente', 'exito');
                cerrarModalUsuario();
                cargarUsuarios();
            } else {
                mostrarToast('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            mostrarToast('Error de conexión', 'error');
        } finally {
            $btn.attr('aria-busy', 'false');
        }
    });
});

// ==========================================
// MÓDULO DE INGRESO DE STOCK
// ==========================================

let listaIngreso = [];
let timeoutBusquedaIngreso;

window.abrirModalIngresoStock = function() {
    $('#modal-ingreso-stock').attr('open', true);
    listaIngreso = [];
    renderizarListaIngreso();
    $('#buscar-ingreso').val('').focus();
};

window.cerrarModalIngresoStock = function() {
    $('#modal-ingreso-stock').removeAttr('open');
    $('#resultados-ingreso').hide();
};

// Buscador
$(document).ready(function() {
    const $buscar = $('#buscar-ingreso');
    const $resultados = $('#resultados-ingreso');

    $buscar.on('input', function() {
        clearTimeout(timeoutBusquedaIngreso);
        const termino = $(this).val().trim();

        if (termino.length < 3) {
            $resultados.hide().empty();
            return;
        }

        timeoutBusquedaIngreso = setTimeout(() => {
            fetch(`/api/productos/buscar-nombre/${termino}`)
                .then(res => res.json())
                .then(productos => {
                    $resultados.empty();
                    if (productos.length === 0) {
                        $resultados.append('<div style="padding: 0.5rem;"><em>No se encontraron productos</em></div>');
                    } else {
                        productos.forEach(prod => {
                            $resultados.append(`
                                <div style="padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee;" 
                                     onclick="agregarProductoIngreso(${prod.base_id}, '${prod.nombre_base}', ${prod.stock_actual})"
                                     onmouseover="this.style.backgroundColor='#f1f8ff'"
                                     onmouseout="this.style.backgroundColor='transparent'">
                                    <strong>${prod.nombre_base}</strong> <br>
                                    <small>Stock actual: ${prod.stock_actual} | Ref: ${prod.nombre_presentacion}</small>
                                </div>
                            `);
                        });
                    }
                    $resultados.show();
                });
        }, 300);
    });

    // Detectar pistola (Enter)
    $buscar.on('keypress', async function(e) {
        if (e.which === 13) {
            e.preventDefault();
            clearTimeout(timeoutBusquedaIngreso);
            $resultados.hide();
            
            const codigo = $(this).val().trim();
            if (codigo) {
                try {
                    const res = await fetch(`/api/productos/buscar/${codigo}`);
                    if (res.ok) {
                        const prod = await res.json();
                        // Nota: El endpoint de código de barras debería devolver stock_actual y base_id.
                        // Asumiendo que buscarYAgregarProducto de caja usa los mismos datos:
                        // Si no lo tiene, haremos una consulta general a los productos
                        agregarProductoIngreso(prod.base_id, prod.nombre_presentacion, prod.stock_actual || 0);
                    } else {
                        mostrarToast("Producto no encontrado", "error");
                    }
                } catch (e) {
                    console.error(e);
                }
                $(this).val('').focus();
            }
        }
    });

    // Ocultar resultados al hacer click fuera
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#buscar-ingreso, #resultados-ingreso').length) {
            $('#resultados-ingreso').hide();
        }
    });
});

window.agregarProductoIngreso = function(base_id, nombre, stock_actual) {
    $('#resultados-ingreso').hide();
    $('#buscar-ingreso').val('').focus();

    // Si no se pasaron bien los datos por el endpoint, los evitamos
    if (!base_id) return mostrarToast("Falta el ID base del producto", "error");

    const existente = listaIngreso.find(p => p.base_id === base_id);
    if (existente) {
        existente.cantidad += 1;
    } else {
        listaIngreso.push({
            base_id: base_id,
            nombre: nombre,
            stock_actual: stock_actual,
            cantidad: 1
        });
    }
    renderizarListaIngreso();
};

window.removerProductoIngreso = function(base_id) {
    listaIngreso = listaIngreso.filter(p => p.base_id !== base_id);
    renderizarListaIngreso();
};

window.cambiarCantidadIngreso = function(base_id, nueva_cantidad) {
    const prod = listaIngreso.find(p => p.base_id === base_id);
    if (prod) {
        prod.cantidad = parseInt(nueva_cantidad) || 0;
    }
};

function renderizarListaIngreso() {
    const $tbody = $('#lista-ingreso');
    $tbody.empty();

    if (listaIngreso.length === 0) {
        $tbody.append('<tr><td colspan="4" class="text-center"><small>Busca productos para agregar a la lista de ingreso</small></td></tr>');
        return;
    }

    listaIngreso.forEach(p => {
        $tbody.append(`
            <tr>
                <td><strong>${p.nombre}</strong></td>
                <td><span style="color: #666;">${p.stock_actual}</span></td>
                <td>
                    <input type="number" min="1" value="${p.cantidad}" style="margin-bottom: 0; width: 100px;" 
                           oninput="cambiarCantidadIngreso(${p.base_id}, this.value)">
                </td>
                <td>
                    <button class="outline secondary" style="padding: 0.25rem 0.5rem; border-color: #ff5252; color: #ff5252;" 
                            onclick="removerProductoIngreso(${p.base_id})">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

window.guardarIngresoStock = async function() {
    if (listaIngreso.length === 0) {
        return mostrarToast("Agrega al menos un producto a la lista.", "aviso");
    }

    const btn = document.getElementById('btn-guardar-ingreso');
    btn.setAttribute('aria-busy', 'true');

    try {
        const payload = { productos: listaIngreso };
        
        const res = await fetch('/api/admin/inventario/ingreso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok) {
            mostrarToast('¡Ingreso de stock guardado exitosamente!', 'exito');
            cerrarModalIngresoStock();
            cargarInventario();
            cargarKardex(); // Refrescar kardex
        } else {
            mostrarToast('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de red al guardar.', 'error');
    } finally {
        btn.setAttribute('aria-busy', 'false');
    }
};

