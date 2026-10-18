"use strict";

let nombreOriginal = "";
let modoEdicion = false;
let opcEventos = [];

const beliminarEvento = $("eliminarEvento");
const bsalvarEvento = $("salvarEvento");

const eventosSelect = $("eventosSelect");
const detallesEventos = $("eventosDetails");

function inicializarEventos() {
  cargaDatosSelectEV(eventos, "eventos");
  document.getElementById("fotoEventoInput").value = "";
  validarArchivoImagen("fotoEventoInput", "previewCompEvento");
  $('previewCompEvento').innerHTML = "";
  // ComboBox para la selección del evento
  eventosSelect.addEventListener("change", () => {
    const seleccionEvento = eventosSelect.value;
    console.log("Selección de evento (value): ", seleccionEvento);
    switch (seleccionEvento) {
      case "":
        console.log("A ocultar la ficha de eventos...");
        detallesEventos.style.display = "none";
        break;
      case "Nuevo evento":
        console.log("Nuevo evento...");
        //const eventoSinDatos = creaEventoVacIo();
        const eventoSinDatos = creaObjetoVacio(fieldMappingEventos);
        populateFormEventos(eventoSinDatos);
        detallesEventos.style.display = "block";
        modoEdicion = false;
        beliminarEvento.style.display = "none";
        break;
      default:
        // Si estamos acá se editará la información de los eventos.         
        console.log("Acá se leerá y pondrá la información de los eventos ya registrados");
        //const selectedEvento = eventos.find(evento => evento[fieldMappingEventos.eventName] === eventosSelect.value);
        const selectedEvento = eventos.find(evento => evento["Nombre del evento"] === eventosSelect.value);
        populateFormEventos(selectedEvento);
        nombreOriginal = selectedEvento["Nombre del evento"];
        detallesEventos.style.display = "block"; //
        modoEdicion = true;
        beliminarEvento.style.display = "block";
    }
    // Restauramos valores:
    objCambios = {};
  });

  bsalvarEvento.addEventListener("click", async () => {
    if (!modoEdicion && !imagenProcesadaOK) {
      //console.log("Si estamos en modo Nuevo evento y no hay imagen disponible");
      mostrarToast("Por favor selecciona una imagen");
      return;
    }

    // Primero revisar si hay algo para enviar    
    if (confirm(`¿Enviar la información?`)) {
      deshabilitaBotonesPArteEvento();
      const datos = camposHtmlAObjeto(fieldMappingEventos);
      //                condición ? expresiónSiVerdadero : expresiónSiFalso     
      datos["Imagen"] = imagenProcesadaOK ? base64Comprobante : "";

      let destino = "NuevoEvento"; // presuponemos
      if (modoEdicion) {
        
        destino = "EditarEvento";
        datos["nombreOriginal"] = nombreOriginal;
      }
      const val = JSON.stringify({ destino, datos });
      console.log(val);
      const resp = await enviarPOST(val);
      alert(resp.message);
      modificarArr(resp.nuevaURLImg);
      habilitaBotonesPArteEvento();
      return;
    }
  });

  beliminarEvento.addEventListener("click", async () => {
    if (confirm(`¿Eliminar la información de este evento?`)) {
      deshabilitaBotonesPArteEvento();
      console.log("Sí, se quiere eliminar");
      const destino = "EliminarEvento";
      const objetivo = nombreOriginal;
      const val = JSON.stringify({ destino, objetivo });
      console.log(val);
      const resp = await enviarPOST(val);
      alert(resp.message);
      if (resp.success) {
        // Se eliminará la información del evento del array principal        
        eliminarEventoCompe(eventos);
        cargaDatosSelectEV(eventos, "eventos");
      }
      habilitaBotonesPArteEvento();
    }
  });


  document.querySelectorAll('.edit-field-evento').forEach(field => {
    field.addEventListener('input', () => {
      
      console.log("Selección hecha por el usuario: ", eventosSelect.value);
      if (eventosSelect.value === "Nuevo evento") {
        if (field.value === "") {

        } else {

        }


      } else {
        // Comparamos los valores ingresados        
      }
      
    });
  });
}

function modificarArr(nuevaImg) {
  // Buscar el objeto evento en el array
  const evento = eventos.find(e => e["Nombre del evento"] === nombreOriginal);
  if (evento) {
    // Como sí se encontró el objeto entonces vamos a modificar los valores.
    Object.entries(fieldMappingEventos).forEach(([fieldId, config]) => {
      if (fieldId === "eventPoster") {
        if (nuevaImg !== "")
          evento["Imagen"] = nuevaImg;
      } else {
        const viewField = $(fieldId); // fieldId corresponde al nombre de los controles html
        
        evento[config] = viewField.value;
      }
    });
    //     
  } else {
    // Se agregará un nuevo evento
    const datos = camposHtmlAObjeto(fieldMappingEventos);
    datos["Imagen"] = (nuevaImg !== "") ? nuevaImg : "";
    eventos.push(datos);
  }
  cargaDatosSelectEV(eventos, "eventos");
}


function revisaCamposEventos() {
  const fichaActiva = document.querySelector(".content.active");
  const requeridos = fichaActiva.querySelectorAll("[required]");
}

function deshabilitaBotonesPArteEvento() {
  bsalvarEvento.innerText = "Espera un momento por favor";
  bsalvarEvento.disabled = true;
  beliminarEvento.disabled = true;
  //
  bAsociados.disabled = true;
  bClubes.disabled = true;
  bEventos.disabled = true;
  bCompetencias.disabled = true;
}

function habilitaBotonesPArteEvento() {
  bsalvarEvento.innerText = "Guardar";
  bsalvarEvento.disabled = false;
  beliminarEvento.disabled = false;

  bAsociados.disabled = false;
  bClubes.disabled = false;
  bEventos.disabled = false;
  bCompetencias.disabled = false;
  // Forzamos un cambio en el <select>
  eventosSelect.value = "Nuevo evento";
  eventosSelect.dispatchEvent(new Event('change'));
}

function populateFormEventos(selectedEvento) {  
  Object.entries(fieldMappingEventos).forEach(([fieldId, config]) => {
    const viewField = $(fieldId); // fieldId corresponde al nombre de los controles html    
    switch (fieldId) {
      case "eventPoster":        
        imagenContenedor('previewCompEvento', "fotoEventoInput", selectedEvento[config]);
        break;
      case "eventDuration":
        viewField.value = selectedEvento[config];
        break;
      default:
        viewField.value = selectedEvento[config] || '';
    }
    nombreOriginal = "";
  });
}

function imagenContenedor(elContenedor, elInput, urlImg) {
  const contenedor = $(elContenedor);
  const laInput = $(elInput);
  if (urlImg !== "") {
    const match = urlImg.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    if (match && match[1]) {
      const fileId = match[1];
      const iframe = document.createElement('iframe');
      iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
      iframe.style.border = "none";

      // Eliminar iframe anterior si ya existe
      const anterior = contenedor.querySelector("iframe");
      if (anterior) contenedor.removeChild(anterior);
      // Eliminar img anterior si ya existe
      const otraAnterior = contenedor.querySelector("img");
      if (otraAnterior) contenedor.removeChild(otraAnterior);
      contenedor.appendChild(iframe);
    }
  }
  else {
    // Se tiene que limpiar la posible imagen previa
    contenedor.innerHTML = "";
    laInput.value = "";
  }
  base64Comprobante = null;
  imagenProcesadaOK = false;
}

function revisaModificaciones(fieldMapping) {
  //objCambios
}