
// ============================================================
//  construir_selector_aspecto(): genera los botones HTML
//  a partir de la constante opciones_aspecto.
// ============================================================
function construir_selector_aspecto() {
  const cont_h = document.getElementById("opciones_horizontal");
  const cont_v = document.getElementById("opciones_vertical");

  // Por cada opción se crea un <button> con su descripción
  // (nombre; ratio; ancho × alto) y se engancha a iniciar_ejecucion.
  for (const op of opciones_aspecto) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${op.nombre}; ${op.ratio}; ${op.w} × ${op.h}`;
    btn.addEventListener("click", () => iniciar_ejecucion(op.w, op.h));

    if (op.grupo === "Horizontal") cont_h.appendChild(btn);
    else                            cont_v.appendChild(btn);
  }
}


// ============================================================
//  iniciar_ejecucion(w, h): llamada al pulsar una opción.
//  Asigna W y H, crea el canvas, inicializa la animación,
//  engancha los botones y pasa a fase de ejecución.
// ============================================================
function iniciar_ejecucion(w, h) {
  // Asignar dimensiones globales
  W = w;
  H = h;

  // Ocultar el selector y mostrar la barra de controles
  document.getElementById("selector_aspecto").classList.add("oculto");
  document.getElementById("barra").classList.remove("oculto");

  // Crear el canvas con las dimensiones elegidas
  canvas_principal = createCanvas(W, H);
  canvas_principal.parent("lienzo");   // Inserta el canvas dentro de <div id="lienzo">

  // Ajustes de p5
  frameRate(FPS);               // p5.js llamará a draw() 25 veces por segundo
  randomSeed(7);                // Semilla fija: el resultado es siempre idéntico y repetible
  textFont("monospace");
  textSize(TAM);
  textAlign(LEFT, BASELINE);
  noStroke();

  // Trocear el texto y calcular posiciones X
  lineas = lineas_texto;
  pos_x = [];
  fase  = [];

  //  Calcula la posición X de cada letra y desfasa la fase del muelle
  for (let i = 0; i < lineas.length; i++) {
    let acum = 0, pos = [];
    for (const ch of lineas[i]) {
      pos.push(acum);
      acum += textWidth(ch);
    }
    pos_x.push(pos);
    fase[i] = i * 0.7 + random(-0.3, 0.3);
  }

  // Scanlines dependientes de W y H
  // (textura de scanlines en un buffer secundario)
  scan = createGraphics(W, H);
  scan.pixelDensity(1);
  scan.noStroke();
  scan.fill(0, 55);
  for (let y = 0; y < H; y += 3) scan.rect(0, y, W, 1);

  // Duración de la animación en fotogramas
  const y_ultima0 = H + 30 + (lineas.length - 1) * INTERLINEA;
  fin_frames = VELOCIDAD > 0 ? Math.ceil((y_ultima0 + 40) / VELOCIDAD) : 1;

  // Enganchar los tres botones (protegido por si alguno no existe).
  // Los ids del HTML son btn_rec, btn_stop, btn_reset y estado.
  // El '$' delante del nombre es solo convención para indicar que es
  // un elemento HTML.
  const $btn_rec   = document.getElementById("btn_rec");
  const $btn_stop  = document.getElementById("btn_stop");
  const $btn_reset = document.getElementById("btn_reset");

  if ($btn_rec)   $btn_rec.onclick   = iniciar_grabacion;
  if ($btn_stop)  $btn_stop.onclick  = detener_grabacion;
  if ($btn_reset) $btn_reset.onclick = alternar_animacion;

  // Estado inicial
  activo = false;
  f = 0;
  actualizar_botones();
  if ($estado) $estado.textContent = "Listo";

  // 10) Cambiar de fase
  fase_programa = "ejecucion";
}


// ============================================================
//  preload(): p5 lo ejecuta ANTES de setup().
//  Se usa para cargar archivos externos (imágenes, sonidos,
//  textos...) de forma que setup() los encuentre ya listos.
// ============================================================
function preload() {
  // loadStrings() descarga el archivo y devuelve un array
  // en el que cada elemento es una línea del texto.
  // Si el archivo no existe o falla la descarga, p5 muestra
  // un error en consola y `lineas_texto` queda vacío.
  lineas_texto = loadStrings("creditos.txt");
}

// ============================================================
//  muelle(t): Calcula el movimiento elástico
//  Recibe el tiempo 't' y devuelve el estiramiento en píxeles (de 0 a ESTIRO).
// ============================================================
// 1. Mezcla de ondas (Efecto orgánico): Se superponen tres funciones senoidales 
//    aperiódicas. Se suman tres ondas seno a distintas frecuencias (2.1, 3.7 y 6.3). 
//    Al no ser múltiples entre sí, la oscilación casi no se repite y parece más 
//   natural, más orgánico y no repetitivo.
//
// 2. Control de valores (Escala de -1 a 1): Los pesos (0.60 + 0.28 + 0.12 = 1.0) 
//    aseguran que el resultado 'a' nunca supere los límites entre -1 y 1. Dicho de
//    otro modo, se normalización de amplitudes a la unidad.
//
// 3. Ajuste al rango final (Solo hacia la derecha): La fórmula (0.5 + 0.5 * a) convierte 
//    el rango [-1, 1] en [0, 1]. Al multiplicarlo por ESTIRO, el valor final siempre es 
//    positivo (de 0 a ESTIRO). El valor devuelto es siempre mayor o igual a cero 
//    (no negativo). Esto asegura que los caracteres solo se desplacen hacia la derecha 
//    o retornen a su origen horizontal, impidiendo que sobrepasen el margen izquierdo.
function muelle(t) {
  const a = 0.60 * sin(t * 2.1) + 0.28 * sin(t * 3.7 + 1.3) + 0.12 * sin(t * 6.3 + 0.4);
  return ESTIRO * (0.5 + 0.5 * a);
}

// ============================================================
//  TECLADO
// ============================================================
//  · Tecla 'R' / 'r': Inicia la grabación del vídeo (Rec).
//  · Tecla 'S' / 's': Detiene la grabación y descarga el vídeo (Stop).
//  · Tecla 'O' / 'o': Enciende o apaga la animación (On/Off).
//  · Barra espaciadora (' '): También hace On/Off.
// Al devolver false se evita que el espacio haga scroll en la página.
// Como los botones están fuera del lienzo, aquí no hace falta hacer clic antes en él.
function keyPressed() {
  if (key === "r" || key === "R") iniciar_grabacion();
  if (key === "s" || key === "S") detener_grabacion();
  if (key === "o" || key === "O") alternar_animacion();
  if (key === " ") { alternar_animacion(); return false; }
}
