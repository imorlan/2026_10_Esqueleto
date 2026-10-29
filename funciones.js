// ============================================================
//  funciones.js
//  UI: selector de aspecto, teclado y utilidades.
// ============================================================

// ------------------------------------------------------------
//  Construir el selector de relación de aspecto
// ------------------------------------------------------------
function construir_selector_aspecto() {
  const cont_h = document.getElementById("opciones_horizontal");
  const cont_v = document.getElementById("opciones_vertical");

  for (const op of opciones_aspecto) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${op.nombre}; ${op.ratio}; ${op.w} × ${op.h}`;
    btn.addEventListener("click", () => iniciar_ejecucion(op.w, op.h));

    if (op.grupo === "Horizontal") cont_h.appendChild(btn);
    else                            cont_v.appendChild(btn);
  }
}

// ------------------------------------------------------------
//  Teclado: R = Rec, S = Stop, O / espacio = On/Off
// ------------------------------------------------------------
function key_pressed() {
  if (key === "r" || key === "R") iniciar_grabacion();
  if (key === "s" || key === "S") detener_grabacion();
  if (key === "o" || key === "O") alternar_animacion();
  if (key === " ") { alternar_animacion(); return false; }
}

// ------------------------------------------------------------
//  On/Off de la animación (la usa el botón y la tecla O)
//  No actúa mientras se graba.
// ------------------------------------------------------------
function alternar_animacion() {
  if (grabando) return;
  activo = !activo;
  actualizar_boton_onoff();
}

function actualizar_boton_onoff() {
  const btn = document.getElementById("btn_reset");
  if (!btn) return;
  btn.textContent = activo ? "■ Off" : "▶ On";
  btn.classList.toggle("activo", activo);
  btn.disabled = grabando;
}