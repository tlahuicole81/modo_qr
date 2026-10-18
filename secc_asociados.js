"use strict";

const $aso = id => document.getElementById(id);
let asociadoActual = null;
let pestañaAsociado = 'general';
let editaGeneral = false;
let editaCapacitaciones = false;
let generalInicial = '';
let capInicial = '';
let capDatos = { version: 1, cursos: [] };
let capError = '';
let operacionAsociado = false;
let modalPendiente = null;
let clubAnterior = '';
let usuarioAnterior = '';
let ultimoTerminoBusqueda = '';
let fotoProcesando = false;
let fotoRevision = 0;

function normalizarNombre(v) {
  return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function nombreCompletoAsociado(a) {
  return [a.Nombre, a['Apellido Paterno'], a['Apellido Materno']].filter(Boolean).join(' ');
}
function filtrarAsociados(lista, club, texto) {
  const palabras = normalizarNombre(texto).split(/\s+/).filter(Boolean);
  return lista.filter(a => (!club || club === 'Todos los asociados' || a.Club === club) &&
    palabras.every(p => normalizarNombre(nombreCompletoAsociado(a)).includes(p)));
}
function actualizarListaAsociados() {
  const club = $aso('clubSelect').value;
  const texto = $aso('buscarAsociado').value;
  const lista = filtrarAsociados(asociados, club, texto);
  const total = filtrarAsociados(asociados, club, '').length;
  const select = $aso('userSelect');
  select.replaceChildren(new Option(lista.length ? 'Selecciona un asociado' : 'No hay coincidencias', ''));
  for (const a of lista) select.add(new Option(nombreCompletoAsociado(a), String(a.ID)));
  select.value = asociadoActual && lista.includes(asociadoActual) ? String(asociadoActual.ID) : '';
  $aso('indicadorAsociados').textContent = normalizarNombre(texto) ? `Asociados (${lista.length} de ${total}):` : `Asociados (${total}):`;
  $aso('estadoBusquedaAsociados').textContent = lista.length ? (texto ? `${lista.length} coincidencia(s).` : '') : 'No hay coincidencias. Prueba otro nombre o cambia el club.';
  $aso('limpiarBusquedaAsociado').disabled = !texto || operacionAsociado;
  pintarResumenVigencias(lista);
  if (vistaVigencias) pintarVigencias();
}
function valorVigencia(v) {
  if (v === true || v === 1 || String(v).toLowerCase() === 'true') return 'true';
  if (v === false || v === 0 || String(v).toLowerCase() === 'false') return 'false';
  return '';
}
function leerGeneral() {
  const datos = { ID: asociadoActual?.ID };
  for (const [id, config] of Object.entries(fieldMapping)) {
    if (config.jsonKey === 'ID') continue;
    if (id === 'disciplinas') datos[config.jsonKey] = Array.from(document.querySelectorAll('#disciplinasInput input:checked'), e => e.value).join(', ');
    else if ($aso(id + 'Input')) datos[config.jsonKey] = $aso(id + 'Input').value;
  }
  return datos;
}
function hayCambiosAsociados() {
  return cambiosVigencia.size > 0 || Boolean(asociadoActual && ((editaGeneral && (JSON.stringify(leerGeneral()) !== generalInicial || $aso('fotoInput').files.length > 0)) ||
    (editaCapacitaciones && JSON.stringify(leerCapacitaciones()) !== capInicial)));
}
function confirmarDescarte() {
  if (modalPendiente) return modalPendiente;
  const dialog = $aso('modalCambios');
  $aso('modalDescripcion').textContent = `Si sales, perderás los cambios realizados en ${vistaVigencias ? 'Gestión de vigencias' : pestañaAsociado === 'general' ? 'Información general' : 'Capacitaciones'}.`;
  modalPendiente = new Promise(resolve => {
    const cerrar = valor => { dialog.close(); modalPendiente = null; resolve(valor); };
    $aso('seguirEditando').onclick = () => cerrar(false);
    $aso('descartarCambios').onclick = () => cerrar(true);
    dialog.oncancel = e => { e.preventDefault(); cerrar(false); };
    dialog.showModal();
    $aso('seguirEditando').focus();
  });
  return modalPendiente;
}
async function permitirSalidaAsociados() {
  if (operacionAsociado) { mostrarToast('Espera a que termine la operación.'); return false; }
  if (hayCambiosAsociados() && !await confirmarDescarte()) return false;
  cambiosVigencia.clear();
  if (vistaVigencias) pintarVigencias();
  if (asociadoActual) restaurarFichaAsociado();
  return true;
}
async function cambiarFiltroAsociados(control, anterior) {
  const siguiente = control.value;
  const club = $aso('clubSelect').value;
  const texto = $aso('buscarAsociado').value;
  if (!vistaVigencias && asociadoActual && !filtrarAsociados(asociados, club, texto).includes(asociadoActual)) {
    control.value = anterior;
    if (!await permitirSalidaAsociados()) return;
    control.value = siguiente;
    ocultarFichaAsociados();
  }
  clubAnterior = $aso('clubSelect').value;
  ultimoTerminoBusqueda = $aso('buscarAsociado').value;
  actualizarListaAsociados();
}
function ocultarFichaAsociados() {
  fotoRevision++;
  fotoProcesando = false;
  asociadoActual = null;
  idUsuario = '';
  usuarioAnterior = '';
  editaGeneral = editaCapacitaciones = false;
  initialData = {}; objCambios = {};
  imagenProcesadaOK = false; base64Comprobante = null;
  $aso('userDetails').style.display = 'none';
}
function mostrarFotoAsociado() {
  const cont = $aso('previewImgAsociado'); cont.replaceChildren();
  const foto = String(asociadoActual?.Foto || '');
  const match = foto.match(/\/d\/([\w-]+)/) || foto.match(/[?&]id=([\w-]+)/);
  if (match) {
    const frame = document.createElement('iframe');
    frame.src = `https://drive.google.com/file/d/${match[1]}/preview`;
    frame.width = '112'; frame.height = '112'; frame.title = 'Fotografía del asociado';
    cont.append(frame);
  } else { const span = document.createElement('span'); span.textContent = 'Sin fotografía'; cont.append(span); }
}
function revisaSubfuncion(valor, previo = '') {
  const opciones = valor === 'Personal técnico' ? funcion_personalTec : valor === 'Consejo directivo' ? funcion_consejo : valor === 'Servicio médico' ? funcion_serMed : [];
  generarOpcionesSelect('subfuncionInput', opciones);
  $aso('subfuncionInput').disabled = !opciones.length;
  asignarValorSelect($aso('subfuncionInput'), previo);
}
function asignarValorSelect(el, valor) {
  const texto = String(valor ?? '');
  if (el.tagName === 'SELECT' && texto && !Array.from(el.options).some(o => o.value === texto)) el.add(new Option(texto, texto));
  el.value = texto;
}

function restaurarFichaAsociado() {
  if (!asociadoActual) return;
  fotoRevision++; fotoProcesando = false;
  initialData = JSON.parse(JSON.stringify(asociadoActual)); objCambios = {};
  imagenProcesadaOK = false; base64Comprobante = null; $aso('fotoInput').value = '';
  for (const [id, config] of Object.entries(fieldMapping)) {
    if (config.jsonKey === 'ID') continue;
    const valor = asociadoActual[config.jsonKey] ?? '';
    if ($aso(id)) $aso(id).textContent = valor || '—';
    if (id === 'disciplinas') {
      const seleccion = String(valor).split(',').map(s => s.trim()).filter(Boolean);
      for (const nombre of seleccion) {
        if (!Array.from($aso('disciplinasInput').querySelectorAll('input')).some(e => e.value === nombre)) {
          const label = document.createElement('label'), input = document.createElement('input');
          input.type = 'checkbox'; input.name = 'actividad'; input.value = nombre;
          label.append(input, document.createTextNode(nombre)); $aso('disciplinasInput').append(label);
        }
      }
      document.querySelectorAll('#disciplinasInput input').forEach(e => { e.checked = seleccion.includes(e.value); });
    } else if ($aso(id + 'Input')) asignarValorSelect($aso(id + 'Input'), valor);
  }
  revisaSubfuncion(asociadoActual['Función'], asociadoActual['Subfunción']);
  actualizarVigenciaFicha();
  $aso('fichaID').textContent = `Asociado · ${asociadoActual.ID}`;
  $aso('asociadoNombre').textContent = nombreCompletoAsociado(asociadoActual);
  mostrarFotoAsociado();
  generalInicial = JSON.stringify(leerGeneral());
  cargarCapacitaciones();
  editaGeneral = editaCapacitaciones = false;
  actualizarModosAsociado();
}
function actualizarModosAsociado() {
  $aso('panelGeneral').classList.toggle('editando', editaGeneral);
  $aso('editButton').hidden = editaGeneral;
  $aso('btnGuardarAsociados').hidden = !editaGeneral;
  $aso('restaurarValAsociadosBtn').hidden = !editaGeneral;
  $aso('credencialButton').hidden = editaGeneral;
  $aso('eliminarAsociadoBtn').hidden = editaGeneral;
  $aso('capConsulta').hidden = editaCapacitaciones;
  $aso('formCapacitaciones').hidden = !editaCapacitaciones;
  $aso('editarCapacitaciones').hidden = editaCapacitaciones;
  $aso('editarCapacitaciones').disabled = Boolean(capError);
  $aso('guardarCapacitaciones').hidden = !editaCapacitaciones;
  $aso('cancelarCapacitaciones').hidden = !editaCapacitaciones;
}
function mostrarPestañaAsociado(nombre) {
  pestañaAsociado = nombre;
  for (const [n, sufijo] of [['general', 'General'], ['capacitaciones', 'Capacitaciones']]) {
    const activo = n === nombre;
    $aso('tab' + sufijo).setAttribute('aria-selected', String(activo));
    $aso('tab' + sufijo).tabIndex = activo ? 0 : -1;
    $aso('panel' + sufijo).hidden = !activo;
  }
}
function persistirAsociadosSesion() {
  try { sessionStorage.setItem('asociados', JSON.stringify(asociados)); }
  catch { mostrarToast('Datos guardados en GAS. No se pudo actualizar la copia de sesión.'); }
}
async function operacionFicha(estadoId, trabajo) {
  if (operacionAsociado) return;
  operacionAsociado = true;
  const controles = Array.from(document.querySelectorAll('#usuarios button, #usuarios input, #usuarios select'));
  const previos = controles.map(e => e.disabled);
  controles.forEach(e => { e.disabled = true; });
  $aso(estadoId).textContent = 'Espera un momento…';
  try { await trabajo(); }
  catch (e) { $aso(estadoId).textContent = e.message || 'No se pudo completar la operación. Intenta nuevamente.'; }
  finally {
    controles.forEach((e, i) => { e.disabled = previos[i]; });
    operacionAsociado = false;
    actualizarModosAsociado();
    actualizarListaAsociados();
  }
}
async function solicitarAsociados(payload) {
  const respuesta = await enviarPOST(JSON.stringify(payload));
  if (!respuesta || respuesta.success !== true) throw new Error(respuesta?.message || 'No se confirmó el guardado. Tus cambios siguen en pantalla; revisa la conexión o la respuesta de GAS.');
  return respuesta;
}
async function guardarGeneralAsociado(e) {
  e.preventDefault();
  if (!asociadoActual || !editaGeneral) return;
  if (!$aso('formGeneral').reportValidity()) return;
  if (fotoProcesando || ($aso('fotoInput').files.length && !imagenProcesadaOK)) {
    $aso('estadoGeneral').textContent = fotoProcesando ? 'Espera a que termine de procesarse la fotografía.' : 'La fotografía no se pudo procesar. Selecciona otra imagen.';
    return;
  }
  const datos = leerGeneral();
  if (imagenProcesadaOK) datos.fotoModificada = base64Comprobante;
  await operacionFicha('estadoGeneral', async () => {
    const r = await solicitarAsociados({ destino: 'EditarAsociado', elToken, elEstado, datos });
    delete datos.fotoModificada;
    Object.assign(asociadoActual, datos);
    if (r.nuevaURL) asociadoActual.Foto = r.nuevaURL;
    persistirAsociadosSesion();
    restaurarFichaAsociado();
    $aso('estadoGeneral').textContent = 'Información general guardada.';
    if (!filtrarAsociados(asociados, $aso('clubSelect').value, $aso('buscarAsociado').value).includes(asociadoActual)) {
      $aso('clubSelect').value = 'Todos los asociados'; $aso('buscarAsociado').value = '';
      clubAnterior = 'Todos los asociados'; ultimoTerminoBusqueda = '';
    }
  });
}
async function eliminarAsociadoActual() {
  if (!asociadoActual || !await permitirSalidaAsociados()) return;
  if (!confirm(`¿Eliminar definitivamente a ${nombreCompletoAsociado(asociadoActual)}? Esta acción elimina la ficha completa.`)) return;
  await operacionFicha('estadoGeneral', async () => {
    await solicitarAsociados({ destino: 'EliminarAsociado', elToken, elEstado, idUsuario: asociadoActual.ID });
    const indice = asociados.indexOf(asociadoActual); if (indice >= 0) asociados.splice(indice, 1);
    persistirAsociadosSesion(); ocultarFichaAsociados(); mostrarToast('Asociado eliminado.');
  });
}
async function generarCredencialAsociado() {
  if (!asociadoActual) return;
  if (!confirm(`¿Generar credencial para ${nombreCompletoAsociado(asociadoActual)}?`)) return;
  await operacionFicha('estadoGeneral', async () => {
    const datos = {};
    for (const clave of ['ID', 'CURP', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Alergias', 'Enfermedades', 'Tipo de sangre', 'Foto', 'Club']) datos[clave] = asociadoActual[clave];
    Object.assign(datos, { EstadoAsociacion: elEstado, correo: elCorreo });
    const r = await solicitarAsociados({ destino: 'Credencial', datos });
    $aso('estadoGeneral').textContent = r.message || 'Credencial solicitada.';
  });
}

const ANIO_CAPACITACION_PREDETERMINADO = 2020;

function interpretarCapacitaciones(valor) {
  if (valor === undefined || valor === null || valor === '')
    return { version: 1, cursos: [] };
  console.log("Capacitaciones recibidas: " + JSON.stringify(valor));

  const dato = typeof valor === 'string' ? JSON.parse(valor) : valor;
  //if (dato.version !== 1 || !Array.isArray(dato.cursos)) 
  if (!Array.isArray(dato.cursos))
    throw new Error('Formato de capacitaciones no reconocido. Revisa la integración con GAS antes de editar.');
  const claves = new Set();
  for (const c of dato.cursos) {
    const disciplina = CATALOGO_CAPACITACIONES.find(d => d.id === c.disciplina);
    const clave = c.disciplina + '/' + c.nivel;
    if (!disciplina?.opciones.some(o => o.id === c.nivel) || claves.has(clave) ||
      !Number.isInteger(c.anio) || c.anio < 1900 || c.anio > new Date().getFullYear())
      throw new Error('Hay capacitaciones con opciones o años no válidos. Revisa los datos de GAS antes de editar.');
    claves.add(clave);
  }
  return JSON.parse(JSON.stringify(dato));
}

function leerCapacitaciones() {
  const cursos = [];
  for (const d of CATALOGO_CAPACITACIONES) for (const o of d.opciones) {
    const id = `cap_${d.id}_${o.id}`;
    if ($aso(id)?.checked) cursos.push({ disciplina: d.id, nivel: o.id, anio: Number($aso(id + '_anio').value) });
  }
  return { version: 1, cursos };
}
function sincronizarAniosCapacitaciones() {
  for (const d of CATALOGO_CAPACITACIONES) for (const o of d.opciones) {
    const id = `cap_${d.id}_${o.id}`, check = $aso(id), anio = $aso(id + '_anio');
    anio.disabled = !check.checked; anio.required = check.checked;
    anio.closest('.cap-anio').hidden = !check.checked;
  }
}

function construirEditorCapacitaciones() {
  const cont = $aso('capEditor'); cont.replaceChildren();
  for (const grupo of ['General','UNAM']) {
    const h = document.createElement('h4'); h.textContent = grupo === 'UNAM' ? 'Formación UNAM' : 'Disciplinas generales'; cont.append(h);
    for (const d of CATALOGO_CAPACITACIONES.filter(d => d.grupo === grupo)) {
      const bloque = document.createElement('section'); bloque.className = 'cap-disciplina';
      const principal = document.createElement('button'); principal.type = 'button'; principal.className = 'cap-principal';
      principal.style.cssText = 'width:100%;border:0;border-radius:0;color:#172c40;text-align:left;cursor:pointer;justify-content:space-between';
      const activar = principal; activar.id = `activar_${d.id}`;
      const indicador = document.createElement('span'); indicador.setAttribute('aria-hidden','true');
      activar.setAttribute('aria-controls',`opciones_${d.id}`);
      principal.append(document.createTextNode(d.nombre),indicador);
      const opciones = document.createElement('div'); opciones.id = `opciones_${d.id}`; opciones.className = 'cap-opciones';
      const aviso = document.createElement('p'); aviso.className = 'ayuda-busqueda'; aviso.textContent = 'Plegar esta disciplina no elimina cursos. Desmarca un curso para quitarlo.'; opciones.append(aviso);
      for (const o of d.opciones) {
        const fila = document.createElement('div'); fila.className = 'cap-curso';
        const id = `cap_${d.id}_${o.id}`, lab = document.createElement('label');
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.name = id; check.id = id;
        const registro = capDatos.cursos.find(c => c.disciplina === d.id && c.nivel === o.id);
        check.checked = Boolean(registro); lab.append(check,document.createTextNode(o.nombre));
        const yearLab = document.createElement('label'); yearLab.className = 'cap-anio'; yearLab.textContent = 'Año del curso';
        const year = document.createElement('input'); year.type = 'number'; year.id = id + '_anio'; year.min = '1900'; year.max = String(new Date().getFullYear()); year.step = '1'; year.inputMode = 'numeric'; year.value = registro?.anio ?? ANIO_CAPACITACION_PREDETERMINADO;
        year.setAttribute('aria-label',`Año de ${d.nombre}, ${o.nombre}`);
        yearLab.append(year); fila.append(lab,yearLab); opciones.append(fila);
        check.addEventListener('change',sincronizarAniosCapacitaciones);
      }
      const expandir = abierto => { opciones.hidden = !abierto; activar.setAttribute('aria-expanded',String(abierto)); indicador.textContent = abierto ? '▾' : '▸'; };
      activar.addEventListener('click', () => expandir(opciones.hidden));
      expandir(capDatos.cursos.some(c => c.disciplina === d.id));
      if (d.independiente) {
        // Una capacitación directa, sin checkbox adicional de despliegue.
        opciones.hidden = false; aviso.remove(); bloque.append(opciones);
      } else bloque.append(principal,opciones);
      cont.append(bloque);
    }
  }
  sincronizarAniosCapacitaciones(); capInicial = JSON.stringify(leerCapacitaciones());
}


function cargarCapacitaciones() {
  capError = '';
  try { capDatos = interpretarCapacitaciones(asociadoActual.Capacitaciones); }
  catch (e) { capError = e.message; capDatos = { version: 1, cursos: [] }; }
  //catch (e) { capError = e.message; capDatos = { cursos: [] }; }
  const cont = $aso('capConsulta'); cont.replaceChildren();
  if (capError || !capDatos.cursos.length) {
    const p = document.createElement('p'); p.className = 'cap-vacio'; p.textContent = capError || 'Este asociado aún no tiene capacitaciones registradas.'; cont.append(p);
  } else {
    for (const grupo of ['General', 'UNAM']) {
      const disciplinas = CATALOGO_CAPACITACIONES.filter(d => d.grupo === grupo && capDatos.cursos.some(c => c.disciplina === d.id));
      if (!disciplinas.length) continue;
      const h = document.createElement('h4');
      h.textContent = grupo === 'UNAM' ? 'Formación UNAM' : 'Disciplinas generales'; cont.append(h);
      for (const d of disciplinas) {
        const bloque = document.createElement('section'); bloque.className = 'cap-resumen';
        const title = document.createElement('h5'); title.textContent = d.nombre; bloque.append(title);
        const lista = document.createElement('ul');
        for (const c of capDatos.cursos.filter(c => c.disciplina === d.id)) {
          const li = document.createElement('li'); li.textContent = `${d.opciones.find(o => o.id === c.nivel).nombre} — ${c.anio}`; lista.append(li);
        }
        bloque.append(lista); cont.append(bloque);
      }
    }
  }
  $aso('editarCapacitaciones').textContent = capDatos.cursos.length ? 'Editar capacitaciones' : 'Agregar capacitaciones';
  construirEditorCapacitaciones();
}

function firmaCursosCapacitaciones(datos) {
  // El orden de llegada desde GAS no constituye una modificación.
  return JSON.stringify(datos.cursos.map(c => [c.disciplina, c.nivel, Number(c.anio)])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
}

async function guardarCapacitacionesAsociado(e) {
  e.preventDefault();
  if (!asociadoActual || !editaCapacitaciones || capError || operacionAsociado) return;
  // Abrir cualquier disciplina plegada con un año pendiente antes de enfocar el error.
  for (const input of $aso('capEditor').querySelectorAll('input[type=number]:enabled')) {
    if (!input.checkValidity()) {
      const panel = input.closest('.cap-opciones'); panel.hidden = false;
      const toggle = panel.parentElement.querySelector('button.cap-principal');
      if (toggle) { toggle.setAttribute('aria-expanded','true'); toggle.querySelector('span').textContent = '▾'; }
      input.reportValidity(); return;
    }
  }
  const Capacitaciones = leerCapacitaciones();
  if (firmaCursosCapacitaciones(Capacitaciones) === firmaCursosCapacitaciones(capDatos)) {
    $aso('estadoCapacitaciones').textContent = 'No hay cambios en las capacitaciones para guardar.';
    return;
  }
  const asociadoGuardado = asociadoActual;
  if (capDatos.cursos.length > 0 && Capacitaciones.cursos.length === 0 &&
      !confirm(`¿Quitar todas las capacitaciones de ${nombreCompletoAsociado(asociadoGuardado)} (ID: ${asociadoGuardado.ID})? La información general se conservará.`)) return;
  await operacionFicha('estadoCapacitaciones', async () => {
    const cerrarEspera = mostrarEsperaCapacitaciones();
    try {
      const respuesta = await enviarCapacitacionesConfirmadas({
        destino: 'EditarCapacitaciones', token: elToken, estadoRep: elEstado,
        datos: {ID: asociadoGuardado.ID, Capacitaciones}
      });
      if (respuesta.ID != null && String(respuesta.ID) !== String(asociadoGuardado.ID))
        throw new Error('La confirmación corresponde a otro asociado. No se actualizaron los datos locales.');
      // asociadoGuardado pertenece al array recibido al iniciar sesión.
      // Solo cambiar sus cursos DESPUÉS de que GAS confirme success:true.
      asociadoGuardado.Capacitaciones = JSON.parse(JSON.stringify(Capacitaciones));
      persistirAsociadosSesion();
      initialData = JSON.parse(JSON.stringify(asociadoGuardado));
      cargarCapacitaciones(); editaCapacitaciones = false;
      $aso('estadoCapacitaciones').textContent = respuesta.message ||
        `Capacitación del usuario ${asociadoGuardado.ID} correctamente almacenada`;
    } finally { cerrarEspera(); }
  });
}

function mostrarEsperaCapacitaciones() {
  const dialog = document.createElement('dialog');
  dialog.id = 'esperaCapacitaciones';
  dialog.setAttribute('aria-label', 'Guardando capacitaciones');
  dialog.setAttribute('aria-busy', 'true');
  dialog.style.cssText = 'border:0;border-radius:16px;padding:28px;max-width:calc(100% - 32px);color:#172c40;box-shadow:0 20px 80px #0003';
  const texto = document.createElement('p');
  texto.textContent = 'Guardando capacitaciones… Espera la confirmación.';
  texto.setAttribute('role', 'status'); texto.tabIndex = -1;
  dialog.append(texto); document.body.append(dialog);
  dialog.addEventListener('cancel', e => e.preventDefault());
  try { dialog.showModal(); texto.focus(); }
  catch (e) { dialog.remove(); throw e; }
  return () => { dialog.close(); dialog.remove(); };
}

async function enviarCapacitacionesConfirmadas(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(URL_ACTIVA, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload), signal: controller.signal
    });
    if (!response.ok) throw new Error('No se pudo confirmar el guardado. Tus cambios siguen en pantalla.');
    const resultado = await response.json();
    if (resultado.success !== true) throw new Error(resultado.message || 'GAS no confirmó el guardado. Tus cambios siguen en pantalla.');
    return resultado;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Se agotó el tiempo de espera. No se pudo confirmar el guardado; GAS podría haberlo completado. Tus cambios se conservan para reintentar.');
    if (error instanceof SyntaxError || error instanceof TypeError) throw new Error('No se pudo confirmar el guardado por un problema de conexión o respuesta. Tus cambios siguen en pantalla.');
    throw error;
  } finally { clearTimeout(timer); }
}

function inicializarValoresAsociados() {
  iniciarGestionVigencias();
  for (const [id, opciones] of [['generoInput', elGenero], ['escolaridadInput', la_Escolaridad], ['estadoInput', estados], ['tipoSangreInput', tipoSangre], ['funcionInput', funcion], ['clubInput', losClubes]]) generarOpcionesSelect(id, opciones);
  const container = $aso('disciplinasInput'); container.replaceChildren();
  for (const actividad of (typeof disciplinasArray !== 'undefined' ? disciplinasArray : disciplinas)) {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type = 'checkbox'; input.name = 'actividad'; input.value = actividad; label.append(input, document.createTextNode(actividad)); container.append(label);
  }
  const club = $aso('clubSelect'); club.replaceChildren(new Option('Todos los asociados', 'Todos los asociados'));
  losClubes.forEach(c => club.add(new Option(c, c))); clubAnterior = club.value;
  club.addEventListener('change', () => cambiarFiltroAsociados(club, clubAnterior));
  $aso('buscarAsociado').addEventListener('input', e => cambiarFiltroAsociados(e.target, ultimoTerminoBusqueda));
  $aso('limpiarBusquedaAsociado').onclick = () => { $aso('buscarAsociado').value = ''; cambiarFiltroAsociados($aso('buscarAsociado'), ultimoTerminoBusqueda); $aso('buscarAsociado').focus(); };
  $aso('userSelect').addEventListener('change', async e => {
    const siguiente = e.target.value; e.target.value = usuarioAnterior;
    if (!await permitirSalidaAsociados()) return;
    asociadoActual = asociados.find(a => String(a.ID) === siguiente) || null;
    if (!asociadoActual) { ocultarFichaAsociados(); actualizarListaAsociados(); return; }
    idUsuario = asociadoActual.ID; usuarioAnterior = siguiente; e.target.value = siguiente;
    $aso('estadoGeneral').textContent = ''; $aso('estadoCapacitaciones').textContent = '';
    restaurarFichaAsociado(); mostrarPestañaAsociado('general'); $aso('userDetails').style.display = 'block';
  });
  for (const [nombre, sufijo] of [['general', 'General'], ['capacitaciones', 'Capacitaciones']]) {
    $aso('tab' + sufijo).onclick = async () => {
      if (pestañaAsociado === nombre || !await permitirSalidaAsociados()) return;
      mostrarPestañaAsociado(nombre); $aso('tab' + sufijo).focus();
    };
    $aso('tab' + sufijo).addEventListener('keydown', e => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const destino = e.key === 'Home' ? 'General' : e.key === 'End' ? 'Capacitaciones' : sufijo === 'General' ? 'Capacitaciones' : 'General';
        $aso('tab' + destino).click();
      }
    });
  }
  $aso('funcionInput').onchange = () => revisaSubfuncion($aso('funcionInput').value);
  $aso('editButton').onclick = () => { editaGeneral = true; actualizarModosAsociado(); $aso('nombreInput').focus(); };
  $aso('restaurarValAsociadosBtn').onclick = () => permitirSalidaAsociados();
  $aso('formGeneral').onsubmit = guardarGeneralAsociado;
  $aso('editarCapacitaciones').onclick = () => { editaCapacitaciones = true; actualizarModosAsociado(); $aso('capEditor').querySelector('input')?.focus(); };
  $aso('cancelarCapacitaciones').onclick = () => permitirSalidaAsociados();
  $aso('formCapacitaciones').onsubmit = guardarCapacitacionesAsociado;
  $aso('eliminarAsociadoBtn').onclick = eliminarAsociadoActual;
  $aso('credencialButton').onclick = generarCredencialAsociado;
  window.addEventListener('beforeunload', e => {
    if (hayCambiosAsociados() || operacionAsociado) { e.preventDefault(); e.returnValue = ''; }
  });
  actualizarListaAsociados();
}

// Vigencias anuales. GAS debe validar fecha, permisos y años; ver LEEME.
// Vigencia determinada exclusivamente por el campo Vigencia recibido de GAS.
let vistaVigencias = false;
const cambiosVigencia = new Map(); // ID -> { asociado, cambios: Map(año -> { anterior, validado }) }
let periodoEdicionVigencias = '';
let relojServidorVigencias = null;
let observerFotosVigencias = null;
function fechaVigencias() {
  return relojServidorVigencias
    ? new Date(relojServidorVigencias.epoch + performance.now() - relojServidorVigencias.inicio)
    : new Date();
}

// Puede llamarse desde el login con la fecha ISO que devuelva GAS.
function sincronizarRelojVigencias(iso) {
  if (typeof iso !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(iso)) return false;
  const epoch = Date.parse(iso);
  if (!Number.isFinite(epoch)) return false;
  relojServidorVigencias = { epoch, inicio: performance.now() };
  return true;
}

function calendarioVigencias(fecha = fechaVigencias()) {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: 'numeric' }).formatToParts(fecha);
  const anio = Number(partes.find(p => p.type === 'year').value);
  const mes = Number(partes.find(p => p.type === 'month').value);
  return { anio, mes, clave: String(anio) };
}

function esVigente(asociado) {
  const valor = asociado?.Vigencia;
  return valor === true || (typeof valor === 'string' && valor.trim().toUpperCase() === 'TRUE');
}

function actualizarVigenciaFicha() {
  if (!asociadoActual) return;
  const vigente = esVigente(asociadoActual);
  const texto = vigente ? 'Vigente' : 'No vigente';
  $aso('afiliadoVigente').textContent = texto;
  $aso('afiliadoResumen').textContent = texto;
  $aso('afiliadoResumen').dataset.valor = String(vigente);
}

function pintarResumenVigencias(lista) {
  const vigentes = lista.filter(esVigente).length;
  const cont = $aso('resumenVigencias'); cont.replaceChildren();
  for (const [titulo, valor] of [['Total', lista.length],
  ['Vigentes', vigentes],
  ['No vigentes', lista.length - vigentes]]) {
    const tarjeta = document.createElement('div'),
      etiqueta = document.createElement('span'),
      numero = document.createElement('strong');
    etiqueta.textContent = titulo;
    numero.textContent = valor;
    tarjeta.append(etiqueta, numero);
    cont.append(tarjeta);
  }
}

function pendientesVigencias() {
  $aso('pendientesVigencias').textContent = `${cambiosVigencia.size} asociado(s) con cambios pendientes, incluidos los ocultos por el filtro.`;
  $aso('guardarVigencias').disabled = operacionAsociado || cambiosVigencia.size === 0 || periodoEdicionVigencias !== calendarioVigencias().clave;
}

function fotoMiniatura(a) {
  const caja = document.createElement('div'); 
  caja.className = 'miniatura-vigencia';
  const iniciales = document.createElement('span'); 
  iniciales.textContent = nombreCompletoAsociado(a).split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  caja.append(iniciales);
  let url;
  try {
    const origen = new URL(a.Foto);
    if (origen.protocol !== 'https:') return caja;
    if (origen.hostname === 'drive.google.com') {
      const id = origen.pathname.match(/\/d\/([\w-]+)/)?.[1] || origen.searchParams.get('id');
      if (!id || !/^[\w-]+$/.test(id)) return caja;
      // Mejor esfuerzo: requiere un archivo accesible al navegador, no GAS.
      url = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w96`;
    } else url = origen.href;
  } catch { 
    return caja; 
  }
  const img = document.createElement('img'); img.alt = ''; img.width = 48; img.height = 48; img.loading = 'lazy'; img.decoding = 'async'; img.hidden = true;
  img.onload = () => { img.hidden = false; iniciales.hidden = true; };
  img.onerror = () => { img.remove(); iniciales.hidden = false; };
  caja.append(img);
  if (observerFotosVigencias) { img.dataset.src = url; observerFotosVigencias.observe(caja); }
  else img.src = url;
  return caja;
}

function pintarVigencias() {
  const cal=calendarioVigencias();
  const cambioPeriodo=periodoEdicionVigencias && periodoEdicionVigencias!==cal.clave;
  // Mantener los años originales de los borradores hasta que se cancelen.
  const anioEdicion=Number(periodoEdicionVigencias || cal.clave);
  $aso('periodoVigencias').textContent='Verde: vigente confirmado. Ámbar: cambio pendiente de guardar.';
  $aso('notaCalendario').textContent=cambioPeriodo ? 'Cambió el año. Cancela esta edición y vuelve a abrir la lista para trabajar con el nuevo periodo.' : '';
  const lista=filtrarAsociados(asociados,$aso('clubSelect').value,$aso('buscarAsociado').value);
  observerFotosVigencias?.disconnect();
  const cont=$aso('listaVigencias');cont.replaceChildren();
  const ids=new Map();for(const a of asociados) ids.set(String(a.ID),(ids.get(String(a.ID))||0)+1);
  if (!lista.length) { const p=document.createElement('p');p.textContent='No hay asociados con estos filtros.';cont.append(p); }
  for(const a of lista) {
    let error='';
    if (a.ID==null || String(a.ID)==='' || ids.get(String(a.ID))!==1) error='ID ausente o duplicado: no se puede editar.';
    const fila=document.createElement('article');fila.className='fila-vigencia';
    const persona=document.createElement('div');persona.className='persona-vigencia';
    const datos=document.createElement('div'),nombre=document.createElement('strong'),club=document.createElement('small');
    nombre.textContent=nombreCompletoAsociado(a);club.textContent=`${a.Club || 'Sin club'} · ID ${a.ID ?? '—'}`;
    datos.append(nombre,club);persona.append(fotoMiniatura(a),datos);fila.append(persona);
    const opciones=document.createElement('div');opciones.className='opciones-vigencia';
    for(const anio of [anioEdicion]) {
      const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';
      const cambio=cambiosVigencia.get(String(a.ID))?.cambios.get(anio);
      check.checked=cambio ? cambio.validado : esVigente(a);
      check.disabled=Boolean(error)||operacionAsociado||cambioPeriodo;
      check.setAttribute('aria-label',`${nombreCompletoAsociado(a)}: vigente`);
      check.dataset.id=String(a.ID);check.dataset.anio=String(anio);
      const estado=document.createElement('span');estado.className='estado-vigencia';
      estado.id=`estado_vigencia_${cont.children.length}`;
      estado.setAttribute('role','status');
      check.setAttribute('aria-describedby',estado.id);
      const actualizarEstado=()=>{
        const pendiente=cambiosVigencia.get(String(a.ID))?.cambios.get(anio);
        const tipo=pendiente ? 'pendiente' : esVigente(a) ? 'confirmada' : 'inactiva';
        fila.dataset.estadoVigencia=tipo;
        estado.textContent=pendiente
          ? (pendiente.validado ? 'Activación pendiente' : 'Desactivación pendiente')
          : (esVigente(a) ? 'Vigente confirmado' : 'No vigente');
      };
      actualizarEstado();
      check.onchange=()=>{
        if(calendarioVigencias().clave!==periodoEdicionVigencias){pintarVigencias();return;}
        const clave=String(a.ID);
        let item=cambiosVigencia.get(clave);
        if(!item){item={asociado:a,cambios:new Map()};cambiosVigencia.set(clave,item);}
        const anterior=esVigente(a);
        if(check.checked===anterior)item.cambios.delete(anio);
        else item.cambios.set(anio,{anterior,validado:check.checked});
        if(!item.cambios.size)cambiosVigencia.delete(clave);
        actualizarEstado();
        pendientesVigencias();
      };
      label.append(check,document.createTextNode('Vigente'));opciones.append(label,estado);
    }
    fila.append(opciones);
    if(error){const p=document.createElement('p');p.className='vigencia-error';p.textContent=error;fila.append(p);}
    cont.append(fila);
  }
  pendientesVigencias();
}

async function abrirGestionVigencias() {
  if (!await permitirSalidaAsociados()) 
    return;
  ocultarFichaAsociados();
  vistaVigencias = true; 
  periodoEdicionVigencias = calendarioVigencias().clave;
  $aso('seleccionIndividual').hidden = true; 
  $aso('gestionVigencias').hidden = false; 
  $aso('gestionarVigencias').hidden = true;
  $aso('estadoVigencias').textContent = ''; 
  pintarVigencias(); $aso('tituloVigencias').focus();
}

async function cerrarGestionVigencias() {
  if (!await permitirSalidaAsociados()) return;
  vistaVigencias = false; 
  $aso('gestionVigencias').hidden = true; 
  $aso('seleccionIndividual').hidden = false; 
  $aso('gestionarVigencias').hidden = false;
  actualizarListaAsociados(); 
  $aso('gestionarVigencias').focus();
}

async function guardarLoteVigencias() {
  if (!cambiosVigencia.size || operacionAsociado) return;
  const cal = calendarioVigencias();
  if (cal.clave !== periodoEdicionVigencias) 
    { pintarVigencias(); 
      return; 
    }
  const pendientes = [...cambiosVigencia.values()];
  const cambios = pendientes.map(item => ({ ID: item.asociado.ID, anios: [...item.cambios].map(([anio, v]) => ({ anio, ...v })) }));
  console.log("Guardar nuevos vigentes: ", JSON.stringify(cambios));
  await operacionFicha('estadoVigencias', async () => {
    const r = await solicitarAsociados({ 
      destino: 'ActivarVigencias', 
      elToken, 
      elEstado, 
      cambios });
    // success confirma todo el lote; ante un error no modificar la copia local.
    if (r?.success !== true) throw new Error(r?.message || 'GAS no confirmó el guardado. Conservamos los cambios.');
    for (const item of pendientes) {
      const [anio, cambio] = [...item.cambios][0];
      item.asociado.Vigencia = cambio.validado ? 'TRUE' : 'FALSE';
      item.asociado['Año validado'] = anio;
    }
    cambiosVigencia.clear(); persistirAsociadosSesion();
    if (r.fechaServidor) sincronizarRelojVigencias(r.fechaServidor);
    periodoEdicionVigencias = calendarioVigencias().clave;
    actualizarVigenciaFicha();
    $aso('estadoVigencias').textContent = r.message || `Vigencias guardadas: ${pendientes.length} asociado(s).`;
  });
}
function iniciarGestionVigencias() {
  try {
    const reloj = JSON.parse(sessionStorage.getItem('relojVigencias') || 'null');
    if (reloj && Number.isFinite(reloj.cliente)) {
      const transcurrido = performance.timeOrigin + performance.now() - reloj.cliente;
      if (transcurrido >= 0) sincronizarRelojVigencias(new Date(Date.parse(reloj.fecha) + transcurrido).toISOString());
    }
  } catch { /* GAS antiguo: fecha local provisional, validación final en servidor. */ }
  $aso('gestionarVigencias').onclick = abrirGestionVigencias;
  $aso('cancelarVigencias').onclick = cerrarGestionVigencias;
  $aso('guardarVigencias').onclick = guardarLoteVigencias;
  if ('IntersectionObserver' in window) observerFotosVigencias = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { const img = e.target.querySelector('img[data-src]'); if (img) { img.src = img.dataset.src; delete img.dataset.src; } observerFotosVigencias.unobserve(e.target); }
  }, { rootMargin: '150px' });
  let previo = calendarioVigencias().clave;
  const revisar = () => {
    const ahora = calendarioVigencias().clave;
    if (ahora === previo || operacionAsociado) return;
    previo = ahora;
    if (vistaVigencias && !cambiosVigencia.size) periodoEdicionVigencias = ahora;
    actualizarListaAsociados(); actualizarVigenciaFicha();
  };
  window.setInterval(revisar, 30000);
  window.addEventListener('focus', revisar);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) revisar(); });
}
