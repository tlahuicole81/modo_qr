const URL_ACTIVA = "https://script.google.com/macros/s/AKfycbx0s2A12QDieNBwrfIgY1yiM8mXJmOINvHPCEhD4Glzm6_O7UPIqwJLHPL2Yy7nVb4XMw/exec"; //accesoVer09h

const URL_ACTIVA0 = 'https://script.google.com/macros/s/AKfycbxxVM3QWye47UB2Hfrzh_Hu0M8yfJMulHxqxJnHgu_eI9-lS6xtWkQ9plQdiajbgPWrdQ/exec'; // form01n

//
function $(id) {
  return document.getElementById(id);
}

function GV(id) {
  const x = document.getElementById(id);
  return x.value;
}

function CLi(id) {
  const x = $(id);
  x.value = '';
}

function VL(id) {
  const x = $(id).value;
  return x;
}

const estados = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México (Edo.)",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const disciplinasArray = [
  "Alta Montaña",
  "Barranquismo",
  "Escalada Deportiva",
  "Escalada en roca",
  "Espeleología",
  "Senderismo",
  "Vía Ferrata",
  "Escalada en hielo"
];

const ramaArray = [
  "Varonil",
  "Femenil",
  "Mixto"
];

const categoriaArray = [
  "Master",
  "Absoluta",
  "U21: Junior",
  "U19: Youth A (YA) Juvenil A",
  "U17: Youth B (YB) Juvenil B",
  "U15: Youth C (YC) Juvenil C",
  "U13: Youth D (YD) Juvenil D",
  "Infantil A",
  "Infantil B",
  "Infantil C"
];

const playeraArray = [
  "Chica",
  "Mediana",
  "Grande",
  "Extragrande"
];

const tipoSangre = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

const elGenero = ["Masculino", "Femenino"];

const la_Escolaridad = [
  "Primaria", "Secundaria", "Media superior", "Superior"
];

const funcion = [
  "Deportista", "Entrenador", "Fisiatra", "Juez/Árbitro", "Personal administrativo", "Prensa",
  "Voluntariado", "Personal técnico", "Consejo directivo", "Servicio médico"
];

const funcion_personalTec = [
  "Equipador de rutas", "Equipador de barrancos", "Registro de senderos", "Medio ambiente", "Acceso", "Seguridad", "Armador de bloques"
];
const funcion_consejo = [
  "Presidente club", "Vicepresidente club", "Secretario club", "Presidente asociación", "Vicepresidente asociación",
  "Tesorero asociación", "Secretario asociación", "Vocal directivo asociación", "Vocal deportivo asociacón", "Comisario asociación", "Representante jurídico asociación"
];

const funcion_serMed = [
  "Médico", "Psicólogo", "Nutriólogo"
];


const fieldMapping = {
  'fichaID': {
    jsonKey: 'ID',
    editType: 'text'
  },
  'nombre': {
    jsonKey: 'Nombre',
    editType: 'text'
  },
  'apellidoPaterno': {
    jsonKey: 'Apellido Paterno',
    editType: 'text'
  },
  'apellidoMaterno': {
    jsonKey: 'Apellido Materno',
    editType: 'text'
  },
  'fechaNacimiento': {
    jsonKey: 'Fecha de nacimiento',
    editType: 'date'
  },
  'telefono': {
    jsonKey: 'Teléfono',
    editType: 'text'
  },
  'email': {
    jsonKey: 'Correo',
    editType: 'email'
  },
  'curp': {
    jsonKey: 'CURP',
    editType: 'text'
  },
  'genero': {
    jsonKey: 'Género',
    editType: 'select'
  },
  'escolaridad': {
    jsonKey: 'Escolaridad',
    editType: 'select'
  },
  'estado': {
    jsonKey: 'Estado',
    editType: 'select'
  },
  'municipio': {
    jsonKey: 'Municipio',
    editType: 'text'
  },
  'colonia': {
    jsonKey: 'Colonia',
    editType: 'text'
  },
  'calleNum': {
    jsonKey: 'Calle y número',
    editType: 'text'
  },
  'zip': {
    jsonKey: 'C.P.',
    editType: 'text'
  },
  'contEmergencia': {
    jsonKey: 'Contacto emergencia',
    editType: 'text'
  },
  'telEmergencia': {
    jsonKey: 'Teléfono emergencia',
    editType: 'text'
  },
  'enfermedades': {
    jsonKey: 'Enfermedades',
    editType: 'text'
  },
  'alergias': {
    jsonKey: 'Alergias',
    editType: 'text'
  },
  'tipoSangre': {
    jsonKey: 'Tipo de sangre',
    editType: 'select'
  },
  'club': {
    jsonKey: 'Club',
    editType: 'select'
  },
  'disciplinas': {
    jsonKey: 'Disciplinas',
    editType: 'text'
  },
  'funcion': {
    jsonKey: 'Función',
    editType: 'select'
  },
  'subfuncion': {
    jsonKey: 'Subfunción',
    editType: 'select'
  }
};

const fieldMappingEventos = {
  'eventName': 'Nombre del evento',
  'eventStart': 'Fecha Inicial',
  'eventEnd': 'Fecha Final',
  'eventDuration': 'Duración',
  'eventLocation': 'Lugar del evento',
  'eventFee': 'Cuota de recuperación',
  'registrationDeadline': 'Fecha límite inscripción',
  'depositInfo': 'Datos depósito',
  'eventPoster': 'Imagen',
  'contactPhone': 'Informes Teléfono',
  'contactEmail': 'Informes correo',
  'contactLink': 'Informes link página',
};

const fieldMappingCompetencia = {
  "competenciaName": "Nombre competencia",
  "competenciStart": "Fecha Competencia",
  "competenciaLugar": "Lugar",
  "competenciaRama": "Rama",
  "competenciaCategoria": "Categoría",
  "competenciaTamPlayera": "Playeras",
  "competenciaCosto": "Costo",
  "competenciaDDeposito": "Datos depósito",
  "competenciaImg":"Imagen",
  "competenciaCelular": "Celular",
  "competenciaCorreo": "Correo",
  "competenciaWeb": "Página web",  
};


const HEADER_ORDER = [  
  "CURP",
  "Nombre",
  "Apellido Paterno",
  "Apellido Materno",
  "Género",
  "Función",
  "Subfunción",
  "Escolaridad",
  "Estado",
  "Municipio",
  "Colonia",
  "Calle y número",
  "C.P.",
  "Correo", 
  "Teléfono",
  "Fecha de nacimiento",
  "Disciplinas",
  "Tipo de sangre",
  "Enfermedades",
  "Alergias",  
  "ID",
  "Club",
  "Asociación",           
  "Contacto emergencia",
  "Teléfono emergencia",          
  "Foto"  
];

const HEADER_DEFAULTS = {
  "CURP": true,
  "Nombre": true,
  "Apellido Paterno": true,
  "Apellido Materno": true,
  "Género": true,
  "Función": true,
  "Subfunción": true,
  "Escolaridad": true,
  "Estado": true,
  "Municipio": true,
  "Colonia,": true,
  "Calle y número": true,
  "C.P.": true,
  "Correo": true, 
  "Teléfono": true,
  "Fecha de nacimiento": true,
  "Disciplinas": true,
  "Tipo de sangre": true,
  "Enfermedades": true,
  "Alergias": true,  
  "ID": true,
  "Club": true,
  "Asociación": true,           
  "Contacto emergencia": false,
  "Teléfono emergencia": false,
  "Foto": false
};


function validarArchivoImagen(inputID, previewID) {
  const input = document.getElementById(inputID);
  const preview = document.getElementById(previewID);

  input.addEventListener("change", async e => {
    console.log("Procesando imagen....");
    const archivo = e.target.files[0];
    preview.innerHTML = "";
    // Variables globales
    base64Comprobante = null;
    imagenProcesadaOK = false;

    if (!archivo) return;

    if (archivo.type === "image/bmp") {
      mostrarToast("Formato .bmp no permitido. Usa JPG o PNG");
      input.value = ""; // limpia el campo
      return;
    }    
    try {

      const { base64, kb } = await convertirArchivoABase64(archivo, true);
      console.log(` Conversión final (${archivo.name}): ${kb} KB`);
      base64Comprobante = base64;
      imagenProcesadaOK = true;

      const img = document.createElement('img');
      img.src = URL.createObjectURL(archivo);
      img.style.maxWidth = '100%';
      img.style.marginTop = '10px';
      preview.appendChild(img);

    } catch (err) {
      mostrarToast(err);
      console.warn(err);
      input.value = '';
    }
  });
}


function convertirArchivoABase64(archivo, debug) {
  const LIMITE_KB = 250;            // cambia a tu gusto
  return new Promise((resolve, reject) => {
    const intentar = (calidad) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          /* Creamos canvas y redimensionamos */
          const MAX_W = 800;
          const esc = Math.min(1, MAX_W / img.width);
          const w = img.width * esc;
          const h = img.height * esc;

          const cv = document.createElement('canvas');
          cv.width = w;
          cv.height = h;
          const ctx = cv.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

        
          const mimeSalida = 'image/jpeg';
          const base64 = cv.toDataURL(mimeSalida, calidad);   // calidad 0.4–0.9
          const kb = Math.round((base64.length * 3) / 4 / 1024);

          if (kb > LIMITE_KB && calidad > 0.4) {
            // nuevo intento con calidad más baja
            console.log("Intento último");
            return intentar(0.4);
          }
          if (kb > LIMITE_KB) {
            console.log("Imagen muy grande");
            return reject(`Imagen demasiado grande (${kb} KB)`);
          }
          // Éxito
          if (debug) {
            console.log("Éxito dice...");
            return resolve({ base64, kb });
          }
          resolve(base64);
        };
        img.onerror = () => reject('Error al cargar imagen');
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    };

    if (!/^image\/(jpeg|png)$/i.test(archivo.type)) {
      return reject('Formato no soportado (solo JPG / PNG)');
    }
    intentar(0.7);    // primer intento con calidad 0.7
  });
}


function _convertirArchivoABase64(archivo) {
  console.log("Convirtiendo archivo");
  return new Promise((resolve, reject) => {
    const intentarCompresion = (calidad) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = e => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxAncho = 800;
          const escala = maxAncho / img.width;
          canvas.width = Math.min(maxAncho, img.width);
          canvas.height = img.height * escala;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const base64 = canvas.toDataURL('image/jpeg', calidad);
          const tamañoKB = Math.round((base64.length * 3) / 4 / 1024);

          if (tamañoKB > 500 && calidad > 0.4) {
            mostrarToast(`La imagen es grande (${tamañoKB} KB). Intentando más compresión...`);
            return intentarCompresion(0.4); // intento final
          }

          if (tamañoKB > 500) {
            mostrarToast(`La imagen sigue siendo muy pesada (${tamañoKB} KB). Usa otra más ligera.`);
            return reject("Imagen demasiado grande después de dos intentos");
          }

          resolve(base64);
        };

        img.onerror = () => reject("Error al cargar imagen");
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    };

    if (archivo.type === "image/bmp") {
      mostrarToast("Formato .bmp no permitido. Usa JPG o PNG");
      return reject("Formato no soportado");
    }

    if (archivo.size <= 220 * 1024) {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    } else {
      intentarCompresion(0.6);
    }
  });
}

function mostrarToast(mensaje, duracion = 3000) {
  const toast = $("toast");
  toast.textContent = mensaje;
  toast.className = "toast show";
  setTimeout(() => {
    toast.className = "toast"; // quita la clase .show
  }, duracion);
}
