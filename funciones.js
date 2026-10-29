

// ------------------------------------------------------------
//  Teclado: R = Rec, S = Stop, O / espacio = On/Off
// ------------------------------------------------------------
function key_pressed() {
  if (key === "r" || key === "R") iniciar_grabacion();
  if (key === "s" || key === "S") detener_grabacion();
  if (key === "o" || key === "O") alternar_animacion();
  if (key === " ") { alternar_animacion(); return false; }
}
