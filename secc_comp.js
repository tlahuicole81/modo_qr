"use strict";

const detallesCompetencias = $("competenciasDetails");
const beliminarCompetencia = $("eliminarCompetencia");
const bsalvarCompetencia = $("salvarCompetencia");

const competenciasSelect = $("competenciasSelect");

let datosCompetencia = {};

function inicializarCompetencias() {
  generarCheckboxesRama();
  cargaDatosSelectEV(competencias, "competencias");
  validarArchivoImagen("fotoCompetenciaInput", "previewCompetencia");
  $("previewCompetencia").innerHTML = "";
  document.getElementById("fotoCompetenciaInput").value = "";
  //
  competenciasSelect.addEventListener("change", () => {
    const seleccionComp = competenciasSelect.value;
    console.log("Selección de competencia (value): ", seleccionComp);
    switch (seleccionComp) {
      case "":
        console.log("Ocultar la ficha de competencias...");
        detallesCompetencias.style.display = "none";
        break;
      case "Nueva competencia":
        console.log("Nueva competencia...");
        
        datosCompetencia = {};
        datosCompetencia = creaObjetoVacio(fieldMappingCompetencia);
        populateFormCompetencias(datosCompetencia);
        detallesCompetencias.style.display = "block";
        modoEdicion = false;
        beliminarCompetencia.style.display = "none";
        break;
      default:
        
        console.log("Acá se leerá y pondrá la información de los eventos ya registrados");
        
        datosCompetencia = {};
        datosCompetencia = competencias.find(competencia => competencia["Nombre competencia"] === competenciasSelect.value);
        populateFormCompetencias(datosCompetencia);
        nombreOriginal = datosCompetencia["Nombre competencia"];
        //
        detallesCompetencias.style.display = "block"; //
        modoEdicion = true;
        beliminarCompetencia.style.display = "block";
    }
    // Restauramos valores:
    objCambios = {};
  });


  function generarCheckboxesRama() {
    const container = $('competenciaRamaInput');
    container.innerHTML = ''; // Limpia si ya existen

    ramaArray.forEach(actividad => {
      const etiqueta = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'lasRamas';
      checkbox.value = actividad;

      etiqueta.appendChild(checkbox);
      etiqueta.appendChild(document.createTextNode(' ' + actividad));

      container.appendChild(etiqueta);
    });

    const containerCategoria = $('compCategoriaInput');
    containerCategoria.innerHTML = "";
    categoriaArray.forEach(categoria => {
      const etiqueta = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'lasCategorias';
      checkbox.value = categoria;

      etiqueta.appendChild(checkbox);
      etiqueta.appendChild(document.createTextNode(' ' + categoria));
      containerCategoria.appendChild(etiqueta);
    });

    const containerPlayera = $('tamPlayeraInput');
    containerPlayera.innerHTML = "";
    playeraArray.forEach(tamanio => {
      const etiqueta = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'playeraSz';
      checkbox.value = tamanio;
      etiqueta.appendChild(checkbox);
      etiqueta.appendChild(document.createTextNode(' ' + tamanio));
      containerPlayera.appendChild(etiqueta);
    })
  }

  
  document.querySelectorAll('.edit-field-competencias').forEach(field => {
    field.addEventListener('input', () => {
      const clave = field.id.toString().replace("Input", "");
      
      let esp = false;
      switch (field.id) {
        case "competenciaRamaInput":
          comparaArrayCompetencia("lasRamas", "Rama", "competenciaRamaInput");
          esp = true;
          break;
        case 'compCategoriaInput':
          comparaArrayCompetencia("lasCategorias", "Categoría", "compCategoriaInput");
          esp = true;
          break;
        case 'tamPlayeraInput':
          comparaArrayCompetencia("playeraSz", "Playeras", "tamPlayeraInput");
          esp = true;
          break;
        default:

      }
      if (esp) return;
      // 
      const valorAlmacenado = datosCompetencia[fieldMappingCompetencia[field.id]];
      const valorActual = field.value;
      
      objCambios[field.id] = valorAlmacenado === valorActual ? false : true;
    });
  });


  bsalvarCompetencia.addEventListener("click", async () => {
    if (!modoEdicion && !imagenProcesadaOK) {      
      mostrarToast("Por favor selecciona una imagen");
      return;
    }
    const chkReq = compruebaCamposCompetencias();
    if (!chkReq) return;

    // 
    const hayCambios = Object.values(objCambios).some(estado => estado);
    if (hayCambios || imagenProcesadaOK) {      
      if (confirm(`¿Enviar la información?`)) {
        deshabilitaBotonesPArteCompetencia();
        const datos = camposHtmlAObjeto(fieldMappingCompetencia);
        console.log("Datos sin...", datos);
        datos["Categoría"] = leeCheckBoxes("lasCategorias");
        datos["Rama"] = leeCheckBoxes("lasRamas");
        datos["Playeras"] = leeCheckBoxes("playeraSz");        
        datos["Imagen"] = imagenProcesadaOK ? base64Comprobante : "";

        let destino = "NuevaCompetencia"; // presuponemos
        if (modoEdicion) {
          
          destino = "EditarCompetencia";
          
          datos["nombreOriginal"] = nombreOriginal;
        }
        const val = JSON.stringify({ destino, datos });
        console.log(val);
        const resp = await enviarPOST(val);
        alert(resp.message);
        modificarArrComp(resp.nuevaURLImg);
        habilitaBotonesPArteCompet();
        return;
      }
    } else {
      mostrarToast("No hay nada para guardar.");
    }
  });

  beliminarCompetencia.addEventListener("click", async () => {
    if (confirm(`¿Eliminar la información de esta competencia?`)) {
      deshabilitaBotonesPArteCompetencia();
      console.log("Sí, se quiere eliminar");
      const destino = "EliminarCompetencia";
      const objetivo = nombreOriginal;
      const val = JSON.stringify({ destino, objetivo });
      console.log(val);
      const resp = await enviarPOST(val);
      alert(resp.message);
      if (resp.success) {
        // Se eliminará la información de la competencia en el array principal
        eliminarEventoCompe(competencias);
        cargaDatosSelectEV(competencias, "competencias");
      }
      habilitaBotonesPArteCompet();
    }
  });
}

function compruebaCamposCompetencias() {
  const prueba = $('divCompetencias');
  const requeridos = prueba.querySelectorAll("[required]");
  requeridos.forEach(campo => {
    if (campo.value === "") {
      console.log("Se tiene que completar un campo");
      const msg = "El campo para " + fieldMappingCompetencia[campo.id] + " está en blanco.";
      mostrarToast(msg);
      return false;
    }
  });
  // Ahora vamos a comprobar que los checkboxes no estén vacíos.  
  if (leeCheckBoxes("lasRamas") === "") {
    mostrarToast("Por favor selecciona una rama.");
    return false;
  }
  if (leeCheckBoxes("lasCategorias") === "") {
    mostrarToast("Por favor selecciona una categoría.");
    return false;
  }
  if (leeCheckBoxes("playeraSz") === "") {
    mostrarToast("Por favor selecciona las playeras disponibles.");
    return false;
  }
  return true;
}

function comparaArrayCompetencia(nombreCB, nombreCampo, entrada) {
  
  const lr = leeCheckBoxes(nombreCB);
  
  const actOrig = datosCompetencia[nombreCampo];
  
  objCambios[entrada] = comparaArrays(actOrig, lr) ? false : true;
}

function deshabilitaBotonesPArteCompetencia() {
  bsalvarCompetencia.innerText = "Espera un momento por favor";
  bsalvarCompetencia.disabled = true;
  beliminarCompetencia.disabled = true;
  //
  bAsociados.disabled = true;
  bClubes.disabled = true;
  bEventos.disabled = true;
  bCompetencias.disabled = true;
}

function modificarArrComp(nuevaImg) {
  // Buscar el objeto nombreOriginal en el array competen
  const competen = competencias.find(e => e["Nombre competencia"] === nombreOriginal);
  if (competen) {
    // competen[campo] = nuevoValor;
    Object.entries(fieldMappingCompetencia).forEach(([fieldId, config]) => {
      switch (fieldId) {
        case 'competenciaImg':
          if (nuevaImg !== "")
            competen["Imagen"] = nuevaImg;
          break;
        case 'competenciaRama':
          console.log("las ramas");
          competen["Rama"] = leeCheckBoxes("lasRamas");
          break;
        case 'competenciaCategoria':
          console.log("las cate");
          competen["Categoría"] = leeCheckBoxes("lasCategorias");
          break;
        case 'competenciaTamPlayera':
          console.log("las playe");
          competen["Playeras"] = leeCheckBoxes("playeraSz");
          break;
        default:
          const viewField = $(fieldId); // fieldId corresponde al nombre de los controles html
          
          competen[config] = viewField.value;
      }
    });
  } else {
    
    const datos = camposHtmlAObjeto(fieldMappingCompetencia);
    datos["Imagen"] = (nuevaImg !== "") ? nuevaImg : "";
    datos["Categoría"] = leeCheckBoxes("lasCategorias");
    datos["Rama"] = leeCheckBoxes("lasRamas");
    datos["Playeras"] = leeCheckBoxes("playeraSz");
    competencias.push(datos);
  }
  cargaDatosSelectEV(competencias, "competencias");
}


function habilitaBotonesPArteCompet() {
  bsalvarCompetencia.innerText = "Guardar";
  bsalvarCompetencia.disabled = false;
  beliminarCompetencia.disabled = false;

  bAsociados.disabled = false;
  bClubes.disabled = false;
  bEventos.disabled = false;
  bCompetencias.disabled = false;
  // Forzamos un cambio en el <select>
  competenciasSelect.value = "Nueva competencia";
  competenciasSelect.dispatchEvent(new Event('change'));
}


function populateFormCompetencias(selectedCompetencia) {  
  Object.entries(fieldMappingCompetencia).forEach(([fieldId, config]) => {
    const viewField = $(fieldId); // fieldId corresponde al nombre de los controles html
    
    switch (fieldId) {
      case "competenciaImg":    
        imagenContenedor('previewCompetencia', "fotoCompetenciaInput", selectedCompetencia[config]);
        break;
      case "eventDuration":
        viewField.value = selectedCompetencia[config];
        break;
      case "competenciaCategoria":
        seleccionarChkBoxes("lasCategorias", "Categoría");
        break;
      case "competenciaTamPlayera":
        
        seleccionarChkBoxes("playeraSz", "Playeras");
        break;
      case "competenciaRama":
        
        seleccionarChkBoxes("lasRamas", "Rama");
        break;
      default:
        
        viewField.value = selectedCompetencia[config] || '';
    }
    nombreOriginal = "";
  });
}

function seleccionarChkBoxes(elNombre, elCampo) {
  // Convertimos a array el campo seleccionado
  const seleccion = datosCompetencia[elCampo].split(',').map(d => d.trim());
  // 
  const checkboxes = document.querySelectorAll(`input[name="${elNombre}"]`);
  
  checkboxes.forEach(checkbox => {
    
    checkbox.checked = false; // Primero limpiamos todo
    if (seleccion.includes(checkbox.value)) {
      
      checkbox.checked = true;
    }
  });
}