// ===== FORMULARIO DE CONTACTO CON BACKEND =====
$(document).on('submit', '.contact-form', function(e) {
    e.preventDefault();
    
    const submitBtn = $(this).find('button[type="submit"]');
    const originalText = submitBtn.html();
    
    // Obtener valores
    const name = $('#contact_name').val().trim();
    const email = $('#contact_email').val().trim();
    const subject = $('#contact_subject').val().trim();
    const message = $('#contact_message').val().trim();
    
    // Validación
    if (!name || !email || !subject || !message) {
        alert('⚠️ Por favor completa todos los campos');
        return;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Por favor ingresa un email válido');
        return;
    }
    
    // Deshabilitar botón y mostrar loading
    submitBtn.prop('disabled', true).html('📤 Enviando...');
    
    // Enviar datos al servidor
    $.ajax({
        url: 'api/contacto.php',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json', // Forzar interpretación como JSON
        data: JSON.stringify({
            name: name,
            email: email,
            subject: subject,
            message: message
        }),
        success: function(response) {
            console.log('✅ Respuesta del servidor:', response);
            
            if (response.success) {
                // Éxito
                alert('✅ ' + response.message);
                $('#contactForm')[0].reset();
                
                // Mostrar mensaje de éxito en la página
                $('.contact-form').before(`
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>✅ ¡Mensaje enviado!</strong> ${response.message}
                        <button type="button" class="close" data-dismiss="alert">
                            <span>&times;</span>
                        </button>
                    </div>
                `);
                
                // Auto-ocultar después de 5 segundos
                setTimeout(function() {
                    $('.alert-success').fadeOut();
                }, 5000);
                
            } else {
                // Error
                alert('❌ ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ Error completo:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error
            });
            
            let errorMsg = 'Error al enviar el mensaje.';
            
            // Intentar parsear la respuesta
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {
                // Si no es JSON, mostrar el error crudo
                if (xhr.responseText) {
                    console.error('Respuesta no JSON:', xhr.responseText.substring(0, 500));
                    errorMsg += ' El servidor retornó HTML en lugar de JSON. Revisa el archivo contacto.php.';
                }
            }
            
            alert('❌ ' + errorMsg + '\n\nRevisa la consola para más detalles (F12).');
        },
        complete: function() {
            // Restaurar botón
            submitBtn.prop('disabled', false).html(originalText);
        }
    });
});

// ===== VALIDACIÓN EN TIEMPO REAL =====
$(document).ready(function() {
    // Validar email mientras escribe
    $('#contact_email').on('blur', function() {
        const email = $(this).val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            $(this).addClass('is-invalid');
            if (!$(this).next('.invalid-feedback').length) {
                $(this).after('<div class="invalid-feedback">Email inválido</div>');
            }
        } else {
            $(this).removeClass('is-invalid');
            $(this).next('.invalid-feedback').remove();
        }
    });
    
    // Limpiar validación al escribir
    $('#contact_email').on('input', function() {
        $(this).removeClass('is-invalid');
        $(this).next('.invalid-feedback').remove();
    });
    
    // Contador de caracteres para mensaje
    $('#contact_message').on('input', function() {
        const length = $(this).val().length;
        const maxLength = 500;
        
        if (!$('#message-counter').length) {
            $(this).after(`<small id="message-counter" class="form-text text-muted"></small>`);
        }
        
        $('#message-counter').text(`${length}/${maxLength} caracteres`);
        
        if (length > maxLength) {
            $(this).val($(this).val().substring(0, maxLength));
        }
    });
});

// ===== CONTADOR DE VISITAS =====
async function updateVisitCounter() {
    try {
        console.log('🔄 Actualizando contador...');
        
        const response = await fetch('api/contador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'increment' })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Respuesta del servidor:', data);
        
        if (data.success) {
            const counterElement = document.getElementById('visitCount');
            if (counterElement) {
                counterElement.textContent = data.count;
                counterElement.style.display = 'block';
                counterElement.style.visibility = 'visible';
                counterElement.style.opacity = '1';
                console.log('✅ Contador actualizado a:', data.count);
            }
        } else {
            throw new Error(data.message || 'Error al obtener visitas');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        // Fallback a contador simple
        let visitCount = localStorage.getItem('visitCount') || 0;
        visitCount = parseInt(visitCount) + 1;
        localStorage.setItem('visitCount', visitCount);
        
        const counterElement = document.getElementById('visitCount');
        if (counterElement) {
            counterElement.textContent = visitCount;
        }
        console.log('📦 Usando localStorage como respaldo:', visitCount);
    }
}

// ===== RESETEAR CONTADOR =====
async function resetCounter() {
    if (confirm('¿Estás seguro de que quieres reiniciar el contador?')) {
        try {
            const response = await fetch('api/contador.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'reset' })
            });

            const data = await response.json();
            
            if (data.success) {
                const counterElement = document.getElementById('visitCount');
                if (counterElement) {
                    counterElement.textContent = '0';
                }
                alert('✅ Contador reiniciado correctamente');
            }
        } catch (error) {
            console.error('❌ Error al resetear:', error);
            localStorage.setItem('visitCount', '0');
            const counterElement = document.getElementById('visitCount');
            if (counterElement) {
                counterElement.textContent = '0';
            }
            alert('Contador reiniciado (modo local)');
        }
    }
}

// ===== CONTADOR REGRESIVO =====
function updateCountdown() {
    const targetDate = new Date('December 31, 2025 23:59:59').getTime();
    
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(interval);
            document.getElementById('days').textContent = '0';
            document.getElementById('hours').textContent = '0';
            document.getElementById('minutes').textContent = '0';
            document.getElementById('seconds').textContent = '0';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days;
        document.getElementById('hours').textContent = hours;
        document.getElementById('minutes').textContent = minutes;
        document.getElementById('seconds').textContent = seconds;
    }, 1000);
}

// ===== SLIDER =====
let currentSlide = 0;

function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (!slides.length) return;
    
    if (n >= slides.length) currentSlide = 0;
    if (n < 0) currentSlide = slides.length - 1;

    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
    }
}

function changeSlide(n) {
    currentSlide += n;
    showSlide(currentSlide);
}

function setSlide(n) {
    currentSlide = n;
    showSlide(currentSlide);
}

// Auto-avance del slider cada 5 segundos
setInterval(() => {
    currentSlide++;
    showSlide(currentSlide);
}, 5000);

// ===== GOOGLE MAPS - UMSA LA PAZ (Con manejo de errores) =====
function initMap() {
    console.log('🗺️ Inicializando Google Maps...');
    
    const mapContainer = document.getElementById('google-map');
    if (!mapContainer) {
        console.error('❌ Contenedor #google-map no encontrado');
        return;
    }
    
    if (typeof google === 'undefined' || !google.maps) {
        console.error('❌ Google Maps no está cargado');
        showMapFallback();
        return;
    }
    
    try {
        const umsaLocation = { lat: -16.5207, lng: -68.0789 };
        
        const map = new google.maps.Map(mapContainer, {
            center: umsaLocation,
            zoom: 16,
            mapId: 'DEMO_MAP_ID', // Necesario para AdvancedMarkerElement
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true
        });
        
        // Usar el nuevo AdvancedMarkerElement si está disponible
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: umsaLocation,
                title: 'UMSA - Facultad de Ingeniería'
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: getInfoWindowContent(umsaLocation)
            });
            
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
            
            // Abrir automáticamente
            setTimeout(() => infoWindow.open(map, marker), 500);
            
        } else {
            // Fallback al Marker antiguo
            const marker = new google.maps.Marker({
                position: umsaLocation,
                map: map,
                title: 'UMSA - Facultad de Ingeniería',
                animation: google.maps.Animation.DROP
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: getInfoWindowContent(umsaLocation)
            });
            
            marker.addListener('click', function() {
                infoWindow.open(map, marker);
            });
            
            setTimeout(() => infoWindow.open(map, marker), 500);
        }
        
        console.log('✅ Google Maps cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error al cargar Google Maps:', error);
        showMapFallback();
    }
}

// Función auxiliar para el contenido del InfoWindow
function getInfoWindowContent(location) {
    return `
        <div style="padding: 15px; font-family: 'Open Sans', sans-serif; max-width: 300px;">
            <h3 style="margin: 0 0 12px 0; color: #667eea; font-weight: bold; font-size: 18px;">
                🎓 Universidad Mayor de San Andrés
            </h3>
            <p style="margin: 0 0 8px 0; color: #333; line-height: 1.6; font-size: 14px;">
                <strong>Facultad de Ingeniería</strong>
            </p>
            <p style="margin: 0 0 8px 0; color: #666; line-height: 1.5; font-size: 13px;">
                📚 Carrera de Ingeniería Electrónica
            </p>
            <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                📍 Zona Obelisco, La Paz, Bolivia
            </p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}" 
               target="_blank" 
               style="display: inline-block; background: #667eea; color: white; padding: 8px 16px; border-radius: 5px; text-decoration: none; font-size: 13px; font-weight: 600;">
                📍 Cómo llegar
            </a>
        </div>
    `;
}

// Fallback cuando Google Maps no funciona
function showMapFallback() {
    const mapContainer = document.getElementById('google-map');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🗺️</div>
            <h3 style="margin: 0 0 15px 0; font-size: 24px;">📍 UMSA - Facultad de Ingeniería</h3>
            <p style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Zona Obelisco, La Paz, Bolivia</p>
            <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.8;">Calle Colombia esquina Plaza del Obelisco</p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=-16.5207,-68.0789" 
               target="_blank" 
               style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.3s;"
               onmouseover="this.style.transform='scale(1.05)'"
               onmouseout="this.style.transform='scale(1)'">
                🧭 Ver en Google Maps
            </a>
            <p style="margin: 20px 0 0 0; font-size: 12px; opacity: 0.6;">
                Coordenadas: -16.5207, -68.0789
            </p>
        </div>
    `;
    console.log('ℹ️ Mostrando mapa alternativo (fallback)');
}

function loadGoogleMap() {
    if (typeof google !== 'undefined' && google.maps) {
        initMap();
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    
    const visitCountElement = document.getElementById('visitCount');
    if (visitCountElement) {
        updateVisitCounter();
    }
    
    const daysElement = document.getElementById('days');
    if (daysElement) {
        updateCountdown();
    }
    
    showSlide(currentSlide);
});

// ===== JQUERY READY =====
$(document).ready(function() {
    // Navegación smooth scroll
    $('.navbar-nav a').on('click', function(e) {
        if (this.hash !== '') {
            e.preventDefault();
            const hash = this.hash;
            
            $('html, body').animate({
                scrollTop: $(hash).offset().top - 70
            }, 800);
        }
    });

    // Cerrar menú móvil
    $('.navbar-nav a').on('click', function() {
        $('.navbar-collapse').collapse('hide');
    });

    // Animaciones al hacer scroll
    $(window).on('scroll', function() {
        $('.developer-card').each(function() {
            const elementTop = $(this).offset().top;
            const windowBottom = $(window).scrollTop() + $(window).height();
            
            if (elementTop < windowBottom - 100) {
                $(this).css({
                    'opacity': '1',
                    'transform': 'translateY(0)'
                });
            }
        });
    });

    // Año actual en footer
    $('.tm-current-year').text(new Date().getFullYear());
});