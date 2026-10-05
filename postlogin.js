
"use strict";

let initialData = {};
let objCambios = {};

var idUsuario = "";
let idUsuarioEliminado = "";

let token = "";
let base64Comprobante = null;
let imagenProcesadaOK = false;

const bAsociados = $("btnAsociados");
const bClubes = $("btnClubes");
const bEventos = $("btnEventos");
const bCompetencias = $("btnCompetencia");

const lbAsociados = $('indicadorAsociados');

let asociados;
let eventos;
let losClubes;
let laAsociacion = [];
let elToken = "";
let elCorreo = "";
let elEstado = "";
let nombreAsociacion;
let competencias;

let laSecci0nPrevia = "";

function leerDatoSesion(clave, valorInicial) {
  const texto = sessionStorage.getItem(clave);
  if (texto === null || texto === "") return valorInicial;
  try { return JSON.parse(texto); } catch { return valorInicial; }
}

function inicializarSesionPortal() {
  asociados = leerDatoSesion('asociados', []);
  eventos = leerDatoSesion('losEventos', []);
  competencias = leerDatoSesion('lasCompetencias', []);
  losClubes = leerDatoSesion('listaClubes', []);
  elToken = leerDatoSesion('sessionToken', '');
  elCorreo = sessionStorage.getItem('elCorreo') || '';
  elEstado = sessionStorage.getItem('elEstado') || '';
  nombreAsociacion = leerDatoSesion('laAsociacion', '');
  laAsociacion[0] = losClubes;
  for (const lista of [asociados, eventos, competencias, losClubes]) {
    if (!Array.isArray(lista)) throw new Error('La información de sesión no tiene el formato esperado. Inicia sesión nuevamente.');
  }
  elEstado = elEstado.replace(/^"|"$/g, '');
  elCorreo = elCorreo.replace(/^"|"$/g, '');
}


function _validarArchivoImagen(inputID, previewID) {
  const input = document.getElementById(inputID);
  input.addEventListener('change', async e => {
    const archivo = e.target.files[0];
    const revision = ++fotoRevision;
    imagenProcesadaOK = false; base64Comprobante = null; fotoProcesando = false;
    if (!archivo) { mostrarFotoAsociado(); return; }
    if (!['image/jpeg','image/png'].includes(archivo.type)) {
      input.value = ''; mostrarFotoAsociado(); mostrarToast('Usa una imagen JPG o PNG.'); return;
    }
    fotoProcesando = true;
    try {
      const resultado = await convertirArchivoABase64(archivo, false);
      if (revision !== fotoRevision) return;
      if (!resultado) throw new Error('No se pudo procesar la imagen.');
      base64Comprobante = resultado; imagenProcesadaOK = true;
      const img = document.createElement('img');
      const url = URL.createObjectURL(archivo);
      img.onload = img.onerror = () => URL.revokeObjectURL(url);
      img.src = url; img.width = 112; img.height = 112; img.alt = 'Nueva fotografía del asociado';
      document.getElementById(previewID).replaceChildren(img);
    } catch (error) {
      if (revision === fotoRevision) mostrarToast('No se pudo procesar la fotografía. Selecciona otra imagen.');
    } finally { if (revision === fotoRevision) fotoProcesando = false; }
  });
}

// Preparado para un futuro botón de cierre de sesión; el portal recibido no lo incluye.
async function cerrarSesionPortal() {
  if (typeof permitirSalidaAsociados === 'function' && !await permitirSalidaAsociados()) return;
  for (const clave of ['asociados','losEventos','lasCompetencias','listaClubes','sessionToken','elCorreo','elEstado','laAsociacion']) sessionStorage.removeItem(clave);
  window.location.assign('login.html');
}

function generarOpcionesSelect(selectId, opciones) {
  const selectElement = $(selectId);
  selectElement.innerHTML = "";

  const opcionVacia = document.createElement("option");
  opcionVacia.value = "";
  opcionVacia.textContent = "Selecciona una opción";
  selectElement.appendChild(opcionVacia);


  if (opciones.length !== 0) {

    opciones.forEach(opcion => {
      const optionElement = document.createElement("option");
      optionElement.value = opcion;
      optionElement.textContent = opcion;
      selectElement.appendChild(optionElement);
    });
  }
}

let navegacionPortalPendiente = false;
async function showContent(sectionId) {
  if (navegacionPortalPendiente) return;
  const clk = $(sectionId);
  
  if (!clk) return;
  if (!clk.matches('.active')) {
    
    if (laSecci0nPrevia === 'usuarios' && typeof permitirSalidaAsociados === 'function') {
      navegacionPortalPendiente = true;
      try { if (!await permitirSalidaAsociados()) return; }
      finally { navegacionPortalPendiente = false; }
    }
    console.log("Cambiar de sección, se activará: ", sectionId);    
    laSecci0nPrevia = sectionId;
    
    document.querySelectorAll(".content").forEach(section => {
      section.classList.remove("active");
    });
    
    document.getElementById(sectionId).classList.add("active");
  } else {
    // El usuario presionó el botón de la sección actual.
    console.log("El usuario presionó el botón de la sección actual.");
  }
}

function enviarDatos(jsonData) {

  fetch(URL_ACTIVA,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: jsonData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      return response.json(); // Convertir la respuesta a JSON
    })
    .then(data => {
      console.log("Datos recibidos: ", data);
    })
    .catch(error => {
      console.error('Error al enviar el correo:', error);
      alert("Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.");
    });
}

async function enviarPOST(jsonData) {
  try {
    const response = await fetch(URL_ACTIVA, {
      method: 'POST',
      body: jsonData,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });
    const result = await response.json();
    console.log(JSON.stringify(result));
    if (!result.success) {
      console.log("Respuesta de error recibida del servidor: ", result.message);
      alert(result.message);
    }
    // 
    return result;
  } catch (error) {
    console.log("Error en la conexión al servidor...");
    console.error('Error:', error);
  }
}


function leeCheckBoxes(nombreGrupo) {
  return Array.from(document.querySelectorAll(`input[name="${nombreGrupo}"]:checked`))
    .map(checkbox => checkbox.value)
    .join(', ');
}

/* Comparamos arrays de los checkboxes con la información original*/
function comparaArrays(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  // Ordenamos y comparamos
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((val, index) => val === sorted2[index]);
}


/* Función compartida
*/
function creaObjetoVacio(fieldMapping) {
  let objVacio = {};
  Object.entries(fieldMapping).forEach(([fieldId, config]) => {
    objVacio[config] = "";
  });
  return objVacio;
}


function camposHtmlAObjeto(fieldMapping) {
  const datos = {};
  
  Object.entries(fieldMapping).forEach(([idCampo, nombreHeader]) => {
  
    const valor = document.getElementById(idCampo)?.value || "";
    datos[nombreHeader] = valor;
  });
  
  datos["Usuario Organizador"] = elCorreo;
  datos["Asociación Organizador"] = nombreAsociacion;

  return datos;
}

function eliminarEventoCompe(arrayTarget) {
  const keys = Object.keys(arrayTarget[0]);
  
  let claveNombre = null;

  if (keys.includes("Nombre del evento")) {
    claveNombre = "Nombre del evento";
  } else if (keys.includes("Nombre competencia")) {
    claveNombre = "Nombre competencia";
  } else {
    console.log("No se encontró una clave válida");
    return;
  }

  const arrayActualizado = arrayTarget.filter(loBuscado => loBuscado[claveNombre] !== nombreOriginal);
  arrayTarget.length = 0;  // Se vacía el array original
  arrayTarget.push(...arrayActualizado); // Se rellena con el nuevo contenido
  console.log("Se ha eliminado el array satisfactoriamente.");
}

function cargaDatosSelectEV(arrayTarget, tipo) {
  let valSelect = [];
  // presuponemos competencias
  let claveNombre = "Nombre competencia";
  let idControl = "competenciasSelect";
  valSelect[0] = "Nueva competencia";
  if (tipo === "eventos") {
    claveNombre = "Nombre del evento";
    valSelect[0] = "Nuevo evento";
    idControl = "eventosSelect";
  }
  
  arrayTarget.forEach(nombre => {
    valSelect.push(nombre[claveNombre]);
  });
  generarOpcionesSelect(idControl, valSelect);
}