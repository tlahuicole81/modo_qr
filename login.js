"use strict";

window.addEventListener('DOMContentLoaded', () => {
      // Eliminar un ítem específico
      sessionStorage.removeItem('asociados');
      sessionStorage.removeItem('relojVigencias');
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('listaClubes');
      sessionStorage.removeItem('losEventos');
      sessionStorage.removeItem('laAsociacion');
      sessionStorage.removeItem('elCorreo');
      sessionStorage.removeItem('elEstado');
      sessionStorage.removeItem('lasCompetencias');      

    });
    document.getElementById('loginBtn').addEventListener('click', async () => {
      const boton = document.getElementById('loginBtn');
      boton.textContent = "Espere unos segundos por favor...";
      boton.disabled = true; // Deshabilitar el botón
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const message = document.getElementById('message');
      const destino = "login";
      message.style.display = 'none';

      if (!email || !password) {
        message.textContent = 'Por favor completa los campos.';
        message.style.display = 'block';
        boton.disabled = false;
        boton.textContent = 'Ingresar';
        return;
      }
      //      
      try {
        const response = await fetch(URL_ACTIVA, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({ destino, email, password }) 
        });

        const result = await response.json();
        console.log("Resultado: ", result.success)
        if (result.success) {
          console.log('Login exitoso. ¡Bienvenido!');
          
          sessionStorage.setItem('asociados', JSON.stringify(result.data));
          if (typeof result.fechaServidor === 'string' && Number.isFinite(Date.parse(result.fechaServidor))) {
            sessionStorage.setItem('relojVigencias', JSON.stringify({fecha:result.fechaServidor, cliente:performance.timeOrigin + performance.now()}));
          }
          sessionStorage.setItem('sessionToken', JSON.stringify(result.token));
          sessionStorage.setItem('listaClubes', JSON.stringify(result.clubes));
          sessionStorage.setItem('losEventos', JSON.stringify(result.eventos));
          sessionStorage.setItem('laAsociacion', JSON.stringify(result.asociacion));
          sessionStorage.setItem('elCorreo', email);
          sessionStorage.setItem('elEstado', result.estadoRep);
          sessionStorage.setItem('lasCompetencias', JSON.stringify(result.competencias));          
          window.location.href = 'postlogin.html'; // Redirige a otra página.
        } else {          
          message.textContent = result.message || 'Credenciales incorrectas.';
          message.style.display = 'block';
        }
      } catch (error) {
        message.textContent = 'Error en la conexión al servidor.';
        message.style.display = 'block';
        console.error('Error:', error);
      } finally {
        boton.disabled = false;
        boton.textContent = 'Ingresar';
      }
    });
