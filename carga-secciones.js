"use strict";

// Carga local de fragmentos y scripts. No consulta GAS.
(async function cargarPortal() {
  const secciones = [
    { nombre: 'Asociados', slot: 'slot-asociados', html: 'secciones/asociados.html', boton: 'btnAsociados', scripts: ['secc_asociados.js'], iniciar: 'inicializarValoresAsociados' },
    { nombre: 'Clubes', slot: 'slot-clubes', html: 'secciones/clubes.html', boton: 'btnClubes', scripts: ['secc_clubes.js'], iniciar: 'inicializarClubes' },
    { nombre: 'Eventos', slot: 'slot-eventos', html: 'secciones/eventos.html', boton: 'btnEventos', scripts: [], iniciar: null, pendiente: true },
    { nombre: 'Competencias', slot: 'slot-competencias', html: 'secciones/competencias.html', boton: 'btnCompetencia', scripts: ['secc_comp.js'], iniciar: 'inicializarCompetencias' },
    { nombre: 'RUD', slot: 'slot-rud', html: 'secciones/rud.html', boton: 'btnRUD', scripts: ['secc_rud.js'], iniciar: 'generarCheckboxesRUD' }
  ];
  const guia = document.querySelector('.portal-guide');
  const avisos = document.getElementById('portalAvisos');
  const scriptsCargados = new Map();
  let disponibles = 0;

  function avisar(mensaje) {
    const p = document.createElement('p');
    p.textContent = mensaje;
    avisos.appendChild(p);
    avisos.hidden = false;
  }

  function cargarScript(ruta) {
    if (!scriptsCargados.has(ruta)) {
      scriptsCargados.set(ruta, new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = ruta;
        script.async = false;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`No se pudo cargar ${ruta}`));
        document.body.appendChild(script);
      }));
    }
    return scriptsCargados.get(ruta);
  }

  for (const seccion of secciones) document.getElementById(seccion.boton).disabled = true;
  document.body.setAttribute('aria-busy', 'true');
  // Las claves y el token son los mismos que usa el login existente.
  if (!sessionStorage.getItem('sessionToken')) {
    window.location.replace('login.html');
    return;
  }

  try {
    const resultados = await Promise.allSettled(secciones.map(async seccion => {
      const respuesta = await fetch(seccion.html, { cache: 'no-cache' });
      if (!respuesta.ok) throw new Error(`No se pudo cargar ${seccion.html}: ${respuesta.status}`);
      const html = await respuesta.text();
      document.getElementById(seccion.slot).innerHTML = html;
    }));
    // Ningún módulo con referencias a controles se ejecuta antes de este punto.
    await cargarScript('postlogin.js');
    inicializarSesionPortal();
    if (!elToken) {
      window.location.replace('login.html');
      return;
    }

    // Respetar el orden de scripts clásicos y aislar los módulos ausentes.
    for (let i = 0; i < secciones.length; i++) {
      const seccion = secciones[i];
      if (seccion.pendiente) {
        document.getElementById(seccion.boton).title = 'Sección pendiente de integrar';
        continue;
      }
      try {
        if (resultados[i].status === 'rejected') throw resultados[i].reason;
        for (const ruta of seccion.scripts) await cargarScript(ruta);
        const inicializador = window[seccion.iniciar];
        if (typeof inicializador !== 'function') throw new Error(`Falta ${seccion.iniciar}`);
        inicializador();
        if (seccion.nombre === 'Asociados') {
          document.getElementById('fotoInput').value = '';
          _validarArchivoImagen('fotoInput', 'previewImgAsociado');
        }
        document.getElementById(seccion.boton).disabled = false;
        disponibles++;
      } catch (error) {
        console.error(`Error al inicializar ${seccion.nombre}:`, error);
        document.getElementById(seccion.boton).title = 'Sección no disponible';
        avisar(`${seccion.nombre} no está disponible. <en revisión Paco>.`);
      }
    }
    guia.textContent = disponibles ? 'Selecciona una sección para comenzar.' : 'No se pudieron cargar las secciones. Actualiza la página o inicia sesión nuevamente.';
  } catch (error) {
    console.error('No se pudo iniciar el portal:', error);
    guia.textContent = 'No se pudo iniciar el portal. Inicia sesión nuevamente.';
    avisar('No se pudo recuperar la información de tu sesión.');
  } finally {
    document.body.setAttribute('aria-busy', 'false');
  }
})();
