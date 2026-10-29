// ============================================================
//  sketch.js
//  Esqueleto base para animaciones p5.js.
//  · setup(): canvas mínimo oculto + selector de aspecto.
//  · draw():  la animación.
//
//  🔒 NO TOCAR  → infraestructura (arranque, grabación)
// ============================================================

/********************************************************************
 * 🔒🔒🔒 NO TOCAR · Contador de fotogramas (permite reiniciar al grabar)
 *******************************************************************/
let f = 0;

// ============================================================
// ============================================================
//  setup()
// ============================================================
// ============================================================
function setup() {

  /********************************************************************
   * 🔒🔒🔒 NO TOCAR · Arranque del sistema · Starup
   *******************************************************************/
  pixelDensity(1);
  // Canvas mínimo dentro de #lienzo, oculto hasta elegir aspecto.
  // (No usamos noCanvas(): dejaba el canvas por defecto de p5
  //  fuera del DOM y con visibility:hidden.)
  canvas_principal = createCanvas(1, 1);
  canvas_principal.parent("lienzo");
  canvas_principal.hide();
  $estado = document.getElementById("estado");
  window.keyPressed = key_pressed;   // p5 busca window.keyPressed
  construir_selector_aspecto();

  /********************************************************************
   * ZONA LIBRE · Inicializar la animación
   * · Valores iniciales, arrays, objetos…
   * · El canvas aún mide 1×1: no uses W ni H (van en draw()).
   * · No dibujer/animar aquí.
   *******************************************************************/


}

// ============================================================
// ============================================================
//  draw()
// ============================================================
// ============================================================
function draw() {

  /********************************************************************
   * 🔒🔒🔒 NO TOCAR · Guarda de fase
   *******************************************************************/
  if (fase_programa !== "ejecucion") return;

  /********************************************************************
   * ZONA LIBRE · Aquí empieza la animación
   *
   * · Disponibles: W, H y `activo` (false = en pausa).
   * · Actualizar el estado solo si `activo`; dibuja siempre
   *   para que la pausa se vea.
   * · No usar return: saltaría la grabación y f++.
   *******************************************************************/
  background(color_fondo[0], color_fondo[1], color_fondo[2]);
  noStroke();

  if (activo) {
    // --- ANIMACIÓN DE EJEMPLO ---
    posicion_x_circulo += velocidad_circulo * direccion_circulo;

    // Rebote en los extremos (el radio actúa de margen)
    if (posicion_x_circulo > W - radio_circulo) {
      posicion_x_circulo = W - radio_circulo;
      direccion_circulo = -1;
    } else if (posicion_x_circulo < radio_circulo) {
      posicion_x_circulo = radio_circulo;
      direccion_circulo = 1;
    }
  }

  fill(color_circulo[0], color_circulo[1], color_circulo[2]);
  circle(posicion_x_circulo, H / 2, radio_circulo * 2);

  /********************************************************************
   * FIN DE LA ZONA LIBRE . Aquí acaba laanimación del  draw()
   *******************************************************************/

  /********************************************************************
   * 🔒🔒🔒 NO TOCAR · Grabación y contador de fotogramas
   *******************************************************************/
  if (!activo) return;   // En pausa no avanza el contador

  if (grabando && $estado) {
    $estado.textContent = "● Grabando… " + Math.round(f / FPS) + " s";
  }
  f++;
}