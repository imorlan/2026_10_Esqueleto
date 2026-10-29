// ============================================================
//  sketch.js
//  Esqueleto base para animaciones p5.js.
//  · En setup() se prepara el selector de aspecto y los botones.
//  · En draw() se desarrolla la animación (aquí: círculo rojo).
//  · El sistema de grabación (grabar.js) es independiente y se
//    puede activar en cualquier momento con el botón Rec o la R.
// ============================================================

// ------------------------------------------------------------
//  Contador de fotogramas propio (permite reiniciar al grabar)
// ------------------------------------------------------------
let f = 0;

// ============================================================
//  setup()
// ============================================================
function setup() {
  pixelDensity(1);
  noCanvas();

  $estado = document.getElementById("estado");

  // Enganchar el teclado (p5 busca window.keyPressed)
  window.keyPressed = key_pressed;

  construir_selector_aspecto();
}

// ============================================================
//  iniciar_ejecucion(w, h)
//  Se llama al elegir la relación de aspecto. Crea el canvas,
//  engancha los botones y pasa a fase de ejecución.
// ============================================================
function iniciar_ejecucion(w, h) {
  W = w;
  H = h;

  document.getElementById("selector_aspecto").classList.add("oculto");
  document.getElementById("barra").classList.remove("oculto");

  canvas_principal = createCanvas(W, H);
  canvas_principal.parent("lienzo");

  frameRate(FPS);
  noStroke();

  // Botones
  const $btn_rec   = document.getElementById("btn_rec");
  const $btn_stop  = document.getElementById("btn_stop");
  const $btn_reset = document.getElementById("btn_reset");

  if ($btn_rec)   $btn_rec.onclick   = iniciar_grabacion;
  if ($btn_stop)  $btn_stop.onclick  = detener_grabacion;
  if ($btn_reset) $btn_reset.onclick = alternar_animacion;

  // Estado inicial
  activo = false;
  f = 0;
  posicion_x_circulo = radio_circulo;
  direccion_circulo  = 1;

console.log("Paso por aquí: setup() 1", { fase_programa, activo, f });

  actualizar_botones();
  if ($estado) $estado.textContent = "Listo";

  fase_programa = "ejecucion";

  console.log("Paso por aquí: setup() 2", { fase_programa, activo, f });

  // Quitar foco del botón para que la barra espaciadora
  // no active el botón en lugar de llegar a key_pressed.
  document.activeElement.blur();
}

// ============================================================
//  draw()
//  Aquí va la animación. De momento: círculo rojo que rebota
//  de izquierda a derecha por el centro del canvas.
// ============================================================
function draw() {
  console.log("###### ###### draw fase=", fase_programa, "activo=", activo, "W=", W, "H=", H);
  if (fase_programa !== "ejecucion") return;

  console.log("*********Paso por aquí: draw() 0", { fase_programa, activo, f }); 

  // background(color_fondo[0], color_fondo[1], color_fondo[2]);
  background(128);              // gris fijo, sin variables

  // Rectángulo rojo grande, imposible de no ver
  fill(255, 0, 0);
  noStroke();
  rect(0, 0, W, H);             // tapa todo el canvas de rojo

  // Traza visible en el canvas
  textAlign(LEFT, TOP);
  fill(0);   // negro
  textSize(16);
  text("Paso por aquí: draw()", 10, 20);
  text("activo=" + activo + "  f=" + f, 10, 40);

console.log("Paso por aquí: draw() 1", { fase_programa, activo, f }); 

  if (!activo) return;

  // --- ANIMACIÓN DE EJEMPLO ---------------------------------
  posicion_x_circulo += velocidad_circulo * direccion_circulo;

  // Rebote en los extremos (dejando el radio como margen)
  if (posicion_x_circulo > W - radio_circulo) {
    posicion_x_circulo = W - radio_circulo;
    direccion_circulo = -1;
  } else if (posicion_x_circulo < radio_circulo) {
    posicion_x_circulo = radio_circulo;
    direccion_circulo = 1;
  }
console.log("Paso por aquí: draw() 2", { fase_programa, activo, f });
  fill(color_circulo[0], color_circulo[1], color_circulo[2]);
  circle(posicion_x_circulo, H / 2, radio_circulo * 2);
  // ----------------------------------------------------------

  // Progreso de grabación en #estado
  if (grabando && $estado) {
    $estado.textContent = "● Grabando… " + Math.round(f / FPS) + " s";
  }
console.log("Paso por aquí: draw() 3", { fase_programa, activo, f });
  f++;
  console.log("Paso por aquí: draw() y 4", { fase_programa, activo, f });
}