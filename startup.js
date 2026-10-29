// ============================================================
//  startup.js
//  Arranque del programa: selector de aspecto, inicio de la
//  ejecución y sistema de grabación del canvas.
//
//  ORDEN LÓGICO DEL ARCHIVO
//  ------------------------
//   1. construir_selector_aspecto()   → se llama desde setup()
//   2. iniciar_ejecucion(w, h)        → se llama al pulsar una opción
//   3. elegir_mime()                  → auxiliar de grabación
//   4. iniciar_grabacion()            → botón Rec / tecla R
//   5. detener_grabacion()            → botón Stop / tecla S
//   6. alternar_animacion()           → botón On/Off / tecla O / espacio
//   7. actualizar_boton_onoff()       → auxiliar de UI
//   8. actualizar_botones()           → auxiliar de UI (Rec + Stop + On/Off)
//
//  Variables de grabación (recorder, trozos, mime_elegido,
//  grabando) se declaran al principio para que estén disponibles
//  en todas las funciones.
// ============================================================


// ============================================================
//  VARIABLES DE GRABACIÓN
// ============================================================
let recorder     = null;   // instancia activa de MediaRecorder
let trozos       = [];     // fragmentos de vídeo acumulados
let mime_elegido = "";     // MIME elegido al iniciar la grabación
let grabando     = false;  // true mientras dura la grabación


// ============================================================
//  1. construir_selector_aspecto()
//  Genera dinámicamente los botones del selector de relación
//  de aspecto a partir de la constante `opciones_aspecto`
//  (definida en globals.js).
//
//  · Lee los dos contenedores donde irán los botones:
//      - #opciones_horizontal  → opciones de grupo "Horizontal"
//      - #opciones_vertical    → opciones de grupo "Vertical"
//  · Recorre `opciones_aspecto` y, por cada opción, crea un
//    <button> con el texto "nombre; ratio; w × h".
//  · Al pulsar cada botón se llama a iniciar_ejecucion(w, h),
//    que redimensiona el canvas y pasa a la fase de ejecución.
//  · Cada botón se añade al contenedor que le corresponde
//    según su propiedad `grupo`.
//
//  No devuelve nada. Solo construye el DOM del selector.
// ============================================================
function construir_selector_aspecto() {

  // Referencias a los contenedores del HTML donde se insertarán
  // los botones. Si alguno no existe, appendChild lanzará error.
  const cont_h = document.getElementById("opciones_horizontal");
  const cont_v = document.getElementById("opciones_vertical");

  // Recorremos todas las opciones de aspecto definidas en globals.js
  for (const op of opciones_aspecto) {

    // Crear el botón
    const btn = document.createElement("button");
    btn.type = "button";

    // Texto visible del botón:
    //    "Nombre; ratio; ancho × alto"
    //    Ejemplo: "Full HD 16:9; 16:9; 1920 × 1080"
    btn.textContent = `${op.nombre}; ${op.ratio}; ${op.w} × ${op.h}`;

    // Al hacer clic, arrancar la ejecución con esas dimensiones.
    //    Se usa una arrow function para "capturar" los valores
    //    op.w y op.h de esta iteración concreta (closure).
    btn.addEventListener("click", () => iniciar_ejecucion(op.w, op.h));

    // Insertar el botón en el contenedor correcto según el grupo.
    //    "Horizontal" → columna izquierda/arriba
    //    "Vertical"   → columna derecha/abajo
    if (op.grupo === "Horizontal") cont_h.appendChild(btn);
    else                            cont_v.appendChild(btn);
  }
}


// ============================================================
//  2. iniciar_ejecucion(w, h)
//  Se llama al elegir la relación de aspecto. Redimensiona el
//  canvas, lo muestra, engancha los botones y pasa a ejecución.
// ============================================================
function iniciar_ejecucion(w, h) {
  W = w;
  H = h;

  document.getElementById("selector_aspecto").classList.add("oculto");
  document.getElementById("barra").classList.remove("oculto");

  resizeCanvas(W, H);
  canvas_principal.show();

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

  actualizar_botones();
  if ($estado) $estado.textContent = "Listo";

  fase_programa = "ejecucion";

  // Quitar foco del botón para que la barra espaciadora
  // no active el botón en lugar de llegar a key_pressed.
  document.activeElement.blur();
}


// ============================================================
//  3. elegir_mime()
//  Devuelve el MIME de vídeo con mejor compatibilidad que el
//  navegador sepa grabar, o "" si no soporta ninguno.
//  Prioriza MP4 (más compatible) y cae a WebM.
// ============================================================
function elegir_mime() {
  const candidatos = [
    "video/mp4;codecs=avc1.640028",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];
  return candidatos.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
}


// ============================================================
//  4. iniciar_grabacion()
//  Captura el canvas, arranca el MediaRecorder y, al parar,
//  descarga el vídeo. Engancha ondataavailable y onstop.
// ============================================================
function iniciar_grabacion() {
  if (grabando) return;

  const canvas = document.querySelector("#lienzo canvas");
  if (!canvas) {
    console.error("No se encontró #lienzo canvas");
    return;
  }

  const stream = canvas.captureStream(FPS);
  mime_elegido = elegir_mime();

  recorder = new MediaRecorder(stream, mime_elegido
    ? { mimeType: mime_elegido, videoBitsPerSecond: 8000000 }
    : { videoBitsPerSecond: 8000000 });

  trozos = [];

  recorder.ondataavailable = e => {
    if (e.data.size > 0) trozos.push(e.data);
  };

  recorder.onstop = () => {
    const ext  = mime_elegido.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(trozos, { type: mime_elegido || "video/webm" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "animacion." + ext;
    a.click();

    actualizar_botones();
    if ($estado) {
      $estado.textContent = ext === "mp4"
        ? "✔ Descargado animacion.mp4"
        : "✔ Descargado .webm (conviértelo con HandBrake o ffmpeg)";
    }
  };

  activo = true;
  f = 0;

  recorder.start();
  grabando = true;
  actualizar_botones();
  if ($estado) $estado.textContent = "● Grabando…";
}


// ============================================================
//  5. detener_grabacion()
//  Para el MediaRecorder; su onstop se encarga de descargar.
// ============================================================
function detener_grabacion() {
  if (recorder && grabando) {
    grabando = false;
    activo = false;
    f = 0;
    recorder.stop();
    if ($estado) $estado.textContent = "■ Terminado. Descargando…";
  }
}


// ============================================================
//  6. alternar_animacion()
//  Interruptor On/Off de la animación. Invierte `activo`.
//  No actúa mientras se graba.
// ============================================================
function alternar_animacion() {
  if (grabando) return;
  activo = !activo;
  actualizar_boton_onoff();
}


// ============================================================
//  7. actualizar_boton_onoff()
//  Sincroniza el botón #btn_reset con `activo`: texto, clase
//  "activo" y bloqueo mientras se graba.
// ============================================================
function actualizar_boton_onoff() {
  const btn = document.getElementById("btn_reset");
  if (!btn) return;
  btn.textContent = activo ? "■ Off" : "▶ On";
  btn.classList.toggle("activo", activo);
  btn.disabled = grabando;
}


// ============================================================
//  8. actualizar_botones()
//  Sincroniza los botones Rec y Stop con `grabando`.
//  Al final refresca también el botón On/Off.
// ============================================================
function actualizar_botones() {
  const btn_rec  = document.getElementById("btn_rec");
  const btn_stop = document.getElementById("btn_stop");
  if (btn_rec)  btn_rec.disabled  = grabando;
  if (btn_stop) btn_stop.disabled = !grabando;
  actualizar_boton_onoff();
}