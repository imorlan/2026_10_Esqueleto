// ============================================================
//  GRABACIÓN Y EXPORTACIÓN DE VÍDEO (WebAPI MediaRecorder)
// ============================================================
// Este bloque convierte las imágenes creados en la pantalla (canvas)
// en un archivo de vídeo que el usuario puede guardar en su ordenador.
// Funciona en tres pasos:
//  1. Elige el formato que mejor entienda el navegador (MP4 o WebM).
//  2. Captura el canvas 25 veces por segundo y guarda los datos.
//  3. Une todas las partes y fuerza una descarga automática.
// ============================================================

/**
 * Selecciona el formato de vídeo (MIME type) con mejor compatibilidad soportado por el navegador.
 * ¿Por qué es necesario? 
 * No todos los navegadores (Chrome, Firefox, Safari) saben grabar el mismo tipo de vídeo.
 * Por eso probamos una lista ordenada de mejor a peor: primero intentamos MP4 (el estándar más
 * compatible en móviles y reproductores) y, si el navegador no sabe crearlo, usamos WebM.
 * 
 * Devuelve el formato de vídeo soportado (string) o "" (cadena vacía) si no hay ninguno.
 */
function elegir_mime() {
  const candidatos = [
    "video/mp4;codecs=avc1.640028",   // MP4 con códec H.264 (Calidad alta: funciona en casi cualquier sitio)
    "video/mp4;codecs=avc1.42E01E",   // MP4 con códec H.264 (Compatibilidad amplia para dispositivos antiguos)
    "video/mp4;codecs=avc1",          // MP4 genérico
    "video/mp4",                      // Formato MP4 básico
    "video/webm;codecs=vp9",          // WebM con códec VP9 (Compresión moderna, ideal para web)
    "video/webm;codecs=vp8",          // WebM con códec VP8 (Formato WebM estándar)
    "video/webm"                      // Formato WebM básico
  ];

  // MediaRecorder.isTypeSupported() le pregunta al navegador: "¿Sabes grabar en este formato?"
  // .find() recorre la lista y se queda con la primera opción que el navegador responda que SÍ.
  return candidatos.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
}

/**
 * Prepara e inicia el proceso de captura de vídeo desde el canvas de p5.js.
 *  * ¿Cómo funciona la captura?
 * - captureStream(FPS): Toma fotogramas en vivo del canvas al ritmo fijado por FPS (25 imágenes/segundo).
 * - MediaRecorder: Es la cámara virtual que empaqueta esas imágenes en un archivo de vídeo.
 */
function iniciar_grabacion() {
  if (grabando) return;      // Si ya hay una grabación en marcha, interrumpe la función para evitar 
                             // grabar dos veces al mismo tiempo

  // Conecta la cámara virtual específicamente con el canvas del proyecto ("#lienzo canvas")
  const stream = document.querySelector("#lienzo canvas").captureStream(FPS);

  mime_elegido = elegir_mime();

  // Configura la grabadora con el formato elegido y una tasa de bits (bitrate) de 8 Mbps (8.000.000 bps).
  // La tasa de bits determina la calidad: 8 Mbps garantiza que el vídeo no pierda nitidez ni se vea pixelado.
  recorder = new MediaRecorder(stream, mime_elegido 
    ? { mimeType: mime_elegido, videoBitsPerSecond: 8000000 }
    : { videoBitsPerSecond: 8000000 });

  trozos = []; // Vector (array) temporal donde se van guardando los fragmentos de vídeo a medida que se procesan

  // Evento que se ejecuta periódicamente mientras se graba:
  // Conforme la grabadora genera pequeños paquetes de vídeo ("chunks"), los guardamos en el vector 'trozos'.
  recorder.ondataavailable = e => { 
    if (e.data.size > 0) trozos.push(e.data); 
  };

  // Evento que se ejecuta cuando la grabación se detiene (al llamar a recorder.stop()):
  // Junta todos los pedazos de vídeo, crea un archivo final en memoria e inicia la descarga en la carpeta del usuario.
  recorder.onstop = () => {
    const ext = mime_elegido.includes("mp4") ? "mp4" : "webm";
    
    // Un Blob (Binary Large Object) es una estructura que junta todos los trozos en un único "bloque" de datos
    const blob = new Blob(trozos, { type: mime_elegido || "video/webm" });

    // Truco de descarga automática: simulación del clic de descarga
    // Crea un enlace invisible apuntando al vídeo generado en memoria (ObjectURL)
    // y simula un clic (.click()) para que la descarga comience sin intervención del usuario.
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "creditos_terminal." + ext; // Nombre predeterminado del archivo que recibirá el usuario
    a.click();

    // Reestablece los botones y avisa al usuario en pantalla de lo que ha sucedido
    $btnRec.disabled = false;
    $estado.textContent = ext === "mp4"
      ? "✔ Descargado creditos_terminal.mp4"
      : "Se descargó .webm (tu navegador no graba MP4). Conviértelo con HandBrake o ffmpeg.";
  };

  f = 0;                  // Resetea el contador de fotogramas a 0 para que la animación empiece desde el inicio exacto
  recorder.start();       // Pone a funcionar la grabadora
  grabando = true;
  $btnRec.disabled = true; // Desactiva el botón de grabar durante la captura para evitar interferencias
}

/**
 * Detiene la grabación actual y activa la descarga del vídeo final.
 */
function detener_grabacion() {
  if (recorder && grabando) {
    grabando = false;
    recorder.stop();      // Ordena a la grabadora parar, lo que desencadena la función 'recorder.onstop' definida arriba
    $estado.textContent = "■ Terminado. Descargando…";
  }
}

// ============================================================
// Reinicia la animación desde el principio, pero sólo si no se está grabando, 
// para no estropear el vídeo
// ============================================================
function reiniciar_animacion() {
  if (!grabando) f = 0;
}
