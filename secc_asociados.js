"use strict";
// Contrato de capacitaciones y vigencia: ver LEEME.md del paquete.
const $aso = id => document.getElementById(id);
let asociadoActual = null;
let pestañaAsociado = 'general';
let editaGeneral = false;
let editaCapacitaciones = false;
let generalInicial = '';
let capInicial = '';
let capDatos = {version: 1, cursos: []};
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
}
function valorVigencia(v) {
  if (v === true || v === 1 || String(v).toLowerCase() === 'true') return 'true';
  if (v === false || v === 0 || String(v).toLowerCase() === 'false') return 'false';
  return '';
}
function leerGeneral() {
  const datos = {ID: asociadoActual?.ID};
  for (const [id, config] of Object.entries(fieldMapping)) {
    if (config.jsonKey === 'ID') continue;
    if (id === 'disciplinas') datos[config.jsonKey] = Array.from(document.querySelectorAll('#disciplinasInput input:checked'), e => e.value).join(', ');
    else if ($aso(id + 'Input')) datos[config.jsonKey] = $aso(id + 'Input').value;
  }
  const vigente = $aso('afiliadoVigenteInput').value;
  // No convertir un dato ausente en false ni borrar la columna aún no enviada por GAS.
  if (vigente !== '' || Object.prototype.hasOwnProperty.call(asociadoActual || {}, 'Afiliado vigente'))
    datos['Afiliado vigente'] = vigente === '' ? null : vigente === 'true';
  return datos;
}
function hayCambiosAsociados() {
  return Boolean(asociadoActual && ((editaGeneral && (JSON.stringify(leerGeneral()) !== generalInicial || $aso('fotoInput').files.length > 0)) ||
    (editaCapacitaciones && JSON.stringify(leerCapacitaciones()) !== capInicial)));
}
function confirmarDescarte() {
  if (modalPendiente) return modalPendiente;
  const dialog = $aso('modalCambios');
  $aso('modalDescripcion').textContent = `Si sales, perderás los cambios realizados en ${pestañaAsociado === 'general' ? 'Información general' : 'Capacitaciones'}.`;
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
  if (asociadoActual) restaurarFichaAsociado();
  return true;
}
async function cambiarFiltroAsociados(control, anterior) {
  const siguiente = control.value;
  const club = $aso('clubSelect').value;
  const texto = $aso('buscarAsociado').value;
  if (asociadoActual && !filtrarAsociados(asociados, club, texto).includes(asociadoActual)) {
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
          label.append(input,document.createTextNode(nombre)); $aso('disciplinasInput').append(label);
        }
      }
      document.querySelectorAll('#disciplinasInput input').forEach(e => { e.checked = seleccion.includes(e.value); });
    } else if ($aso(id + 'Input')) asignarValorSelect($aso(id + 'Input'), valor);
  }
  revisaSubfuncion(asociadoActual['Función'], asociadoActual['Subfunción']);
  const vigencia = valorVigencia(asociadoActual['Afiliado vigente']);
  const texto = vigencia === 'true' ? 'Vigente' : vigencia === 'false' ? 'No vigente' : 'Sin información';
  $aso('afiliadoVigenteInput').value = vigencia;
  $aso('afiliadoVigente').textContent = texto;
  $aso('afiliadoResumen').textContent = 'Afiliado vigente: ' + texto;
  $aso('afiliadoResumen').dataset.valor = vigencia;
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
  for (const [n, sufijo] of [['general','General'],['capacitaciones','Capacitaciones']]) {
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
    controles.forEach((e,i) => { e.disabled = previos[i]; });
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
    const r = await solicitarAsociados({destino:'EditarAsociado',elToken,elEstado,datos});
    delete datos.fotoModificada;
    Object.assign(asociadoActual, datos);
    if (r.nuevaURL) asociadoActual.Foto = r.nuevaURL;
    persistirAsociadosSesion();
    restaurarFichaAsociado();
    $aso('estadoGeneral').textContent = 'Información general guardada.';
    if (!filtrarAsociados(asociados,$aso('clubSelect').value,$aso('buscarAsociado').value).includes(asociadoActual)) {
      $aso('clubSelect').value = 'Todos los asociados'; $aso('buscarAsociado').value = '';
      clubAnterior = 'Todos los asociados'; ultimoTerminoBusqueda = '';
    }
  });
}
async function eliminarAsociadoActual() {
  if (!asociadoActual || !await permitirSalidaAsociados()) return;
  if (!confirm(`¿Eliminar definitivamente a ${nombreCompletoAsociado(asociadoActual)}? Esta acción elimina la ficha completa.`)) return;
  await operacionFicha('estadoGeneral', async () => {
    await solicitarAsociados({destino:'EliminarAsociado',elToken,elEstado,idUsuario:asociadoActual.ID});
    const indice = asociados.indexOf(asociadoActual); if (indice >= 0) asociados.splice(indice,1);
    persistirAsociadosSesion(); ocultarFichaAsociados(); mostrarToast('Asociado eliminado.');
  });
}
async function generarCredencialAsociado() {
  if (!asociadoActual) return;
  if (!confirm(`¿Generar credencial para ${nombreCompletoAsociado(asociadoActual)}?`)) return;
  await operacionFicha('estadoGeneral', async () => {
    const datos = {};
    for (const clave of ['ID','CURP','Nombre','Apellido Paterno','Apellido Materno','Alergias','Enfermedades','Tipo de sangre','Foto','Club']) datos[clave] = asociadoActual[clave];
    Object.assign(datos,{EstadoAsociacion:elEstado,correo:elCorreo});
    const r = await solicitarAsociados({destino:'Credencial',datos});
    $aso('estadoGeneral').textContent = r.message || 'Credencial solicitada.';
  });
}

const ANIO_CAPACITACION_PREDETERMINADO = 2020;
const CATALOGO_CAPACITACIONES = [{"id": "senderismo", "nombre": "Senderismo", "grupo": "General", "opciones": [{"id": "basico", "nombre": "Básico"}, {"id": "intermedio", "nombre": "Intermedio"}, {"id": "avanzado", "nombre": "Avanzado"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor_de_asociacion", "nombre": "Instructor de Asociación"}, {"id": "instructor_certificado_uiaa", "nombre": "Instructor Certificado UIAA"}, {"id": "lider_internacional_de_montana_iml_uimla", "nombre": "Líder Internacional de Montaña \"IML\" UIMLA"}]}, {"id": "orientacion", "nombre": "Orientación", "grupo": "General", "opciones": [{"id": "basico", "nombre": "Básico"}, {"id": "intermedio", "nombre": "Intermedio"}, {"id": "avanzado", "nombre": "Avanzado"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor_de_asociacion", "nombre": "Instructor de Asociación"}]}, {"id": "escalada", "nombre": "Escalada", "grupo": "General", "opciones": [{"id": "nivel_i", "nombre": "Nivel I"}, {"id": "nivel_ii", "nombre": "Nivel II"}, {"id": "nivel_iii", "nombre": "Nivel III"}, {"id": "nivel_iv", "nombre": "Nivel IV"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor_de_asociacion", "nombre": "Instructor de Asociación"}, {"id": "instructor_certificado_uiaa", "nombre": "Instructor Certificado UIAA"}]}, {"id": "alta_montana", "nombre": "Alta Montaña", "grupo": "General", "opciones": [{"id": "nivel_i", "nombre": "Nivel I"}, {"id": "nivel_ii", "nombre": "Nivel II"}, {"id": "nivel_iii", "nombre": "Nivel III"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor_de_asociacion", "nombre": "Instructor de Asociación"}, {"id": "instructor_certificado_uiaa", "nombre": "Instructor Certificado UIAA"}]}, {"id": "barranquismo", "nombre": "Barranquismo", "grupo": "General", "opciones": [{"id": "basico", "nombre": "Básico"}, {"id": "intermedio", "nombre": "Intermedio"}, {"id": "avanzado", "nombre": "Avanzado"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor_de_asociacion", "nombre": "Instructor de Asociación"}, {"id": "instructor_certificado_uiaa", "nombre": "Instructor Certificado UIAA"}]}, {"id": "escalada_en_hielo", "nombre": "Escalada en Hielo", "grupo": "General", "opciones": [{"id": "basico", "nombre": "Básico"}, {"id": "intermedio", "nombre": "Intermedio"}, {"id": "avanzado", "nombre": "Avanzado"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor_de_asociacion", "nombre": "Instructor de Asociación"}]}, {"id": "primeros_auxilios", "nombre": "Primeros Auxilios", "grupo": "General", "opciones": [{"id": "basico", "nombre": "Básico"}, {"id": "wfa", "nombre": "WFA"}, {"id": "wfr", "nombre": "WFR"}, {"id": "autorescate", "nombre": "Autorescate"}]}, {"id": "curso_basico_unam", "nombre": "Curso básico UNAM", "grupo": "UNAM", "independiente": true, "opciones": [{"id": "curso", "nombre": "Curso básico UNAM"}]}, {"id": "exploracion_unam", "nombre": "Exploración UNAM", "grupo": "UNAM", "opciones": [{"id": "alumno", "nombre": "Alumno"}, {"id": "ayudante", "nombre": "Ayudante"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor", "nombre": "Instructor"}]}, {"id": "escalada_unam", "nombre": "Escalada UNAM", "grupo": "UNAM", "opciones": [{"id": "alumno", "nombre": "Alumno"}, {"id": "ayudante", "nombre": "Ayudante"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor", "nombre": "Instructor"}]}, {"id": "canonismo_unam", "nombre": "Cañonismo UNAM", "grupo": "UNAM", "opciones": [{"id": "alumno", "nombre": "Alumno"}, {"id": "ayudante", "nombre": "Ayudante"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor", "nombre": "Instructor"}]}, {"id": "espeleologia_unam", "nombre": "Espeleología UNAM", "grupo": "UNAM", "opciones": [{"id": "alumno", "nombre": "Alumno"}, {"id": "ayudante", "nombre": "Ayudante"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor", "nombre": "Instructor"}]}, {"id": "alta_montana_unam", "nombre": "Alta Montaña UNAM", "grupo": "UNAM", "opciones": [{"id": "alumno", "nombre": "Alumno"}, {"id": "ayudante", "nombre": "Ayudante"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor", "nombre": "Instructor"}]}, {"id": "cicloexploracion_unam", "nombre": "Cicloexploración UNAM", "grupo": "UNAM", "opciones": [{"id": "alumno", "nombre": "Alumno"}, {"id": "ayudante", "nombre": "Ayudante"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor", "nombre": "Instructor"}]}, {"id": "kayac_de_mar_unam", "nombre": "Kayac de mar UNAM", "grupo": "UNAM", "opciones": [{"id": "alumno", "nombre": "Alumno"}, {"id": "ayudante", "nombre": "Ayudante"}, {"id": "monitor", "nombre": "Monitor"}, {"id": "instructor", "nombre": "Instructor"}]}];
function interpretarCapacitaciones(valor) {
  if (valor === undefined || valor === null || valor === '') return {version:1,cursos:[]};
  const dato = typeof valor === 'string' ? JSON.parse(valor) : valor;
  if (dato.version !== 1 || !Array.isArray(dato.cursos)) throw new Error('Formato de capacitaciones no reconocido. Revisa la integración con GAS antes de editar.');
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
    if ($aso(id)?.checked) cursos.push({disciplina:d.id,nivel:o.id,anio:Number($aso(id + '_anio').value)});
  }
  return {version:1,cursos};
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
      const principal = document.createElement('label'); principal.className = 'cap-principal';
      const activar = document.createElement('input'); activar.type = 'checkbox'; activar.id = `activar_${d.id}`;
      activar.setAttribute('aria-controls',`opciones_${d.id}`);
      principal.append(activar,document.createTextNode(d.nombre));
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
      const expandir = () => { opciones.hidden = !activar.checked; activar.setAttribute('aria-expanded',String(activar.checked)); };
      activar.checked = capDatos.cursos.some(c => c.disciplina === d.id); activar.addEventListener('change',expandir); expandir();
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
  catch (e) { capError = e.message; capDatos = {version:1,cursos:[]}; }
  const cont = $aso('capConsulta'); cont.replaceChildren();
  if (capError || !capDatos.cursos.length) {
    const p = document.createElement('p'); p.className = 'cap-vacio'; p.textContent = capError || 'Este asociado aún no tiene capacitaciones registradas.'; cont.append(p);
  } else {
    for (const grupo of ['General','UNAM']) {
      const disciplinas = CATALOGO_CAPACITACIONES.filter(d => d.grupo === grupo && capDatos.cursos.some(c => c.disciplina === d.id));
      if (!disciplinas.length) continue;
      const h = document.createElement('h4'); h.textContent = grupo === 'UNAM' ? 'Formación UNAM' : 'Disciplinas generales'; cont.append(h);
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
async function guardarCapacitacionesAsociado(e) {
  e.preventDefault();
  if (!asociadoActual || !editaCapacitaciones || capError) return;
  // Abrir cualquier disciplina plegada con un año pendiente antes de enfocar el error.
  for (const input of $aso('capEditor').querySelectorAll('input[type=number]:enabled')) {
    if (!input.checkValidity()) {
      const panel = input.closest('.cap-opciones'); panel.hidden = false;
      const toggle = panel.parentElement.querySelector('.cap-principal input'); if (toggle) { toggle.checked = true; toggle.setAttribute('aria-expanded','true'); }
      input.reportValidity(); return;
    }
  }
  const Capacitaciones = leerCapacitaciones();
  await operacionFicha('estadoCapacitaciones', async () => {
    await solicitarAsociados({destino:'EditarCapacitaciones',elToken,elEstado,datos:{ID:asociadoActual.ID,Capacitaciones}});
    asociadoActual.Capacitaciones = Capacitaciones;
    persistirAsociadosSesion(); cargarCapacitaciones(); editaCapacitaciones = false;
    $aso('estadoCapacitaciones').textContent = 'Capacitaciones guardadas.';
  });
}
function inicializarValoresAsociados() {
  for (const [id, opciones] of [['generoInput',elGenero],['escolaridadInput',la_Escolaridad],['estadoInput',estados],['tipoSangreInput',tipoSangre],['funcionInput',funcion],['clubInput',losClubes]]) generarOpcionesSelect(id,opciones);
  const container = $aso('disciplinasInput'); container.replaceChildren();
  for (const actividad of (typeof disciplinasArray !== 'undefined' ? disciplinasArray : disciplinas)) {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type='checkbox'; input.name='actividad'; input.value=actividad; label.append(input,document.createTextNode(actividad)); container.append(label);
  }
  const club = $aso('clubSelect'); club.replaceChildren(new Option('Todos los asociados','Todos los asociados'));
  losClubes.forEach(c => club.add(new Option(c,c))); clubAnterior=club.value;
  club.addEventListener('change',() => cambiarFiltroAsociados(club,clubAnterior));
  $aso('buscarAsociado').addEventListener('input',e => cambiarFiltroAsociados(e.target,ultimoTerminoBusqueda));
  $aso('limpiarBusquedaAsociado').onclick = () => { $aso('buscarAsociado').value=''; cambiarFiltroAsociados($aso('buscarAsociado'),ultimoTerminoBusqueda); $aso('buscarAsociado').focus(); };
  $aso('userSelect').addEventListener('change', async e => {
    const siguiente=e.target.value; e.target.value=usuarioAnterior;
    if (!await permitirSalidaAsociados()) return;
    asociadoActual=asociados.find(a => String(a.ID)===siguiente) || null;
    if (!asociadoActual) { ocultarFichaAsociados(); actualizarListaAsociados(); return; }
    idUsuario=asociadoActual.ID; usuarioAnterior=siguiente; e.target.value=siguiente;
    $aso('estadoGeneral').textContent=''; $aso('estadoCapacitaciones').textContent='';
    restaurarFichaAsociado(); mostrarPestañaAsociado('general'); $aso('userDetails').style.display='block';
  });
  for (const [nombre,sufijo] of [['general','General'],['capacitaciones','Capacitaciones']]) {
    $aso('tab'+sufijo).onclick = async () => {
      if (pestañaAsociado===nombre || !await permitirSalidaAsociados()) return;
      mostrarPestañaAsociado(nombre); $aso('tab'+sufijo).focus();
    };
    $aso('tab'+sufijo).addEventListener('keydown',e => {
      if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) {
        e.preventDefault();
        const destino=e.key==='Home' ? 'General' : e.key==='End' ? 'Capacitaciones' : sufijo==='General' ? 'Capacitaciones' : 'General';
        $aso('tab'+destino).click();
      }
    });
  }
  $aso('funcionInput').onchange=()=>revisaSubfuncion($aso('funcionInput').value);
  $aso('editButton').onclick=()=>{editaGeneral=true; actualizarModosAsociado(); $aso('nombreInput').focus();};
  $aso('restaurarValAsociadosBtn').onclick=()=>permitirSalidaAsociados();
  $aso('formGeneral').onsubmit=guardarGeneralAsociado;
  $aso('editarCapacitaciones').onclick=()=>{editaCapacitaciones=true; actualizarModosAsociado(); $aso('capEditor').querySelector('input')?.focus();};
  $aso('cancelarCapacitaciones').onclick=()=>permitirSalidaAsociados();
  $aso('formCapacitaciones').onsubmit=guardarCapacitacionesAsociado;
  $aso('eliminarAsociadoBtn').onclick=eliminarAsociadoActual;
  $aso('credencialButton').onclick=generarCredencialAsociado;
  window.addEventListener('beforeunload',e=>{
    if (hayCambiosAsociados() || operacionAsociado) {e.preventDefault(); e.returnValue='';}
  });
  actualizarListaAsociados();
}
