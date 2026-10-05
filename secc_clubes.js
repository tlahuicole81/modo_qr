"use strict";


const selectClubes = $("clubesSelect");
const inputClub = $("clubNombreInput");
const form = $("clubForm");
const btagregarClubBtn0 = $("agregarClubBtn");
const bteliminarClubBtn = $("eliminarClubBtn");
const btEditarNombreClub = $("guardarClubBtn");
const inpNuevoClub = $('nuevoClubInput');

function inicializarClubes() {
  ClubSelect();
  // Mostrar datos al seleccionar
  selectClubes.addEventListener("change", () => {
    if (selectClubes.value) {
      inputClub.value = selectClubes.value;
      form.style.display = "block";
    } else {
      form.style.display = "none";
    }
  });

  // Guardar cambios
  btEditarNombreClub.addEventListener("click", async () => {
    const original = selectClubes.value;
    const nuevo = inputClub.value.trim();

    if (!nuevo) return mostrarToast("Ingresa nombre válido.");
    if (nuevo === original) {
      mostrarToast("Nada que modificar;");
      return;
    }

    if (confirm(`¿Renombrar "${original}" por "${nuevo}"?`)) {
      // 
      btEditarNombreClub.innerHTML = "Espera un momento por favor.";
      const val = enviarDatosClub("Editar", original, nuevo);
      console.log(val);
      const resp = await enviarPOST(val);
      if (resp.success) {
        const i = losClubes.indexOf(original);
        if (i !== -1) losClubes[i] = nuevo;
        mostrarToast(`Club actualizado: ${original} → ${nuevo}`);
        btEditarNombreClub.innerHTML = "Guardar cambios";
        inputClub.value = "";
      }
      alert(resp.message);
      ClubSelect(); // recargar lista  
    }
  });

  // Eliminar club
  bteliminarClubBtn.addEventListener("click", async () => {
    const aEliminar = selectClubes.value;
    if (confirm(`¿Eliminar el club "${aEliminar}"?`)) {
      bteliminarClubBtn.innerHTML = "Espera un momento por favor.";
      const val = enviarDatosClub("Eliminar", aEliminar, "");
      console.log(val);
      const resp = await enviarPOST(val);
      if (resp.success) {
        losClubes = losClubes.filter(c => c !== aEliminar);
        inputClub.value = "";
      }
      alert(resp.message);
      bteliminarClubBtn.innerHTML = "Eliminar club";
      ClubSelect();
    }
  });

  // Agregar nuevo club
  btagregarClubBtn0.addEventListener("click", async () => {
    const nuevo = inpNuevoClub.value.trim();
    if (!nuevo) {
      mostrarToast("Ingresa un nombre.");
      return;
    }
    if (losClubes.includes(nuevo)) {
      mostrarToast("Ese club ya existe.");
      return;
    }

    console.log("Pasados los filtros con éxito. Nombre del nuevo club: ", nuevo);
    if (confirm(`¿Agregar el club "${nuevo}"?`)) {
      console.log(" Entrar SOLO UNA VEZ");
      btagregarClubBtn0.innerHTML = "Espera un momento por favor.";
      const val = enviarDatosClub("Agregar", nuevo, "");
      console.log(val);
      const resp = await enviarPOST(val);
      if (resp.success) {
        losClubes.push(nuevo);
        // Limpiamos campo de entrada
        inpNuevoClub.value = "";
      }
      alert(resp.message);
      btagregarClubBtn0.innerHTML = "Agregar club";
      ClubSelect();
    }
  });
}

function enviarDatosClub(subDestino, clubTarget, nuevoNombre) {
  // Al enviar los datos deshabilitamos los botones
  btagregarClubBtn0.disabled = true;
  bteliminarClubBtn.disabled = true;
  btEditarNombreClub.disabled = true;

  let destino = "Clubes";
  const datos = {};
  datos["subDestino"] = subDestino;
  datos["clubTarget"] = clubTarget;
  datos["estado"] = elEstado;
  if (nuevoNombre !== "")
    datos["nuevoNombre"] = nuevoNombre;
  const val = JSON.stringify({ destino, datos });
  return val;
}

function ClubSelect() {
  btagregarClubBtn0.disabled = false;
  bteliminarClubBtn.disabled = false;
  btEditarNombreClub.disabled = false;
  // Llenar selector
  selectClubes.innerHTML = "";
  selectClubes.innerHTML = '<option value="">Selecciona un club</option>';
  losClubes.forEach(club => {
    const op = document.createElement("option");
    op.value = club;
    op.textContent = club;
    selectClubes.appendChild(op);
  });
}