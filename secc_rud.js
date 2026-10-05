"use strict";

const btDescargar = $('descargarCSV');
const containerRUD = $('chkDivRUD');
let ordenCamposRUD = [];

function obtenerOrdenRUD() {
  if (typeof HEADER_ORDER !== 'undefined') return [...HEADER_ORDER];
  // Si no se adjuntó el catálogo RUD, usar las columnas realmente recibidas.
  return [...new Set(asociados.flatMap(asociado => Object.keys(asociado)))];
}

function generarCheckboxesRUD() {

  containerRUD.innerHTML = ''; // Limpia si ya existen

  ordenCamposRUD = obtenerOrdenRUD();
  ordenCamposRUD.forEach(hdr => {
    const etiqueta = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'headersRUD';
    checkbox.value = hdr;
    checkbox.checked = typeof HEADER_DEFAULTS !== 'undefined' && Object.prototype.hasOwnProperty.call(HEADER_DEFAULTS, hdr)
      ? HEADER_DEFAULTS[hdr]
      : true;
    etiqueta.appendChild(checkbox);
    etiqueta.appendChild(document.createTextNode(' ' + hdr));

    containerRUD.appendChild(etiqueta);
  });
}

btDescargar.addEventListener("click", () => {
  console.log("Visualizar descargas");
  // asociados
  const checkboxes = document.querySelectorAll('input[name="headersRUD"]:checked');
  //
  const headersRequeridos = [];
  checkboxes.forEach(checkbox => {        
    headersRequeridos.push(checkbox.value);
  });  
  if (!headersRequeridos.length) return mostrarToast('Selecciona al menos un campo.');
  const nombreArchivo = "asociados_" + elEstado + '.csv';
  exportarCSV(headersRequeridos, nombreArchivo);
});


function exportarCSV(headersRequeridos, nombreArchivo) {  
  const headers = ordenCamposRUD.filter(h => headersRequeridos.includes(h));
  const filas = [headers];
  asociados.forEach(obj => {    
    const fila = headers.map(key => {      
      const val = obj[key] != null ? obj[key] : '';      
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    filas.push(fila);
  });
  
  const csvTexto = filas.map(f => f.join(',')).join('\r\n');
  
  const bom = '\uFEFF'; // para acentos en Excel
  const blob = new Blob([bom + csvTexto], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}