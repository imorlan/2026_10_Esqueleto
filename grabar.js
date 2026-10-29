// ============================================================
//  GRABACIÓN Y EXPORTACIÓN DE VÍDEO (Web API MediaRecorder)
// ============================================================
// Convierte el canvas de p5.js en un archivo de vídeo descargable.
//
// Flujo general:
//   1. elegir_mime()       → pregunta al navegador qué formato soporta.
//   2. iniciar_grabacion() → captura el canvas y empieza a grabar.
//   3. detener_grabacion() → para, une los trozos y descarga.
//
// Requisitos externos (definidos en otros archivos):
//   - FPS        → número de fotogramas por segundo (constantes.js).
//   - f          → contador global de fotogramas (sketch.js).
//   - $estado    → <span id="estado"> donde se informa al usuario (sketch.js).
//   - #lienzo canvas → el canvas que crea p5.js dentro de <div id="lienzo">.
//
// Ids del HTML que este archivo espera encontrar:
//   - btn_rec    → botón "● Grabar".
//   - btn_stop   → botón "■ Parar".
// ============================================================



// ------------------------------------------------------------
//  SELECCIÓN DEL FORMATO DE VÍDEO
// ------------------------------------------------------------

/**
 * Devuelve el MIME type de vídeo con mejor compatibilidad que
 * el navegador actual sepa grabar, o "" si no soporta ninguno.
 *
 * Estrategia: probar una lista ordenada de "mejor a peor" y
 * quedarse con la primera que MediaRecorder.isTypeSupported()
 * confirme. El orden prioriza MP4 (más compatible en móviles
 * y reproductores) y cae a WebM si el navegador no sabe MP4.
 *
 * @returns {string} MIME type soportado, o "" si ninguno lo es.
 */
function elegir_mime() {
  // Lista de candidatos, del más deseable al más básico.
  const candidatos = [
    "video/mp4;codecs=avc1.640028",   // MP4 + H.264 perfil alto (mejor calidad)
    "video/mp4;codecs=avc1.42E01E",   // MP4 + H.264 perfil baseline (más compatible)
    "video/mp4;codecs=avc1",          // MP4 + H.264 genérico
    "video/mp4",                      // MP4 sin especificar códec
    "video/webm;codecs=vp9",          // WebM + VP9 (buena compresión)
    "video/webm;codecs=vp8",          // WebM + VP8 (estándar)
    "video/webm"                      // WebM básico
  ];

  // .find() recorre la lista y devuelve el primer elemento para
  // el que la función devuelva true. MediaRecorder.isTypeSupported()
  // es la pregunta al navegador: "¿sabes grabar en este formato?".
  // Si ninguno responde true, devolvemos "" (cadena vacía).
  return candidatos.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
}


// ------------------------------------------------------------
//  INICIO DE LA GRABACIÓN
// ------------------------------------------------------------

/**
 * Inicia la captura de vídeo del canvas y arranca el MediaRecorder.
 *
 * Pasos:
 *   1. Comprobar que no haya ya una grabación en curso.
 *   2. Localizar el canvas de p5.js dentro de #lienzo.
 *   3. Crear un MediaStream a partir del canvas a FPS.
 *   4. Elegir MIME type y configurar el MediaRecorder.
 *   5. Enganchar ondataavailable (acumular trozos) y onstop (descargar).
 *   6. Resetear el contador de fotogramas y arrancar.
 */
function iniciar_grabacion() {
  // Salvaguarda: si ya estamos grabando, no hacemos nada.
  // Evita dobles clics y grabaciones solapadas.
  if (grabando) return;

  // Localizamos el canvas que p5.js ha insertado dentro de #lienzo.
  // Si no existe (por ejemplo, porque parent('lienzo') falló),
  // avisamos por consola y abortamos para no romper el sketch.
  const canvas = document.querySelector("#lienzo canvas");
  if (!canvas) {
    console.error("No se encontró #lienzo canvas");
    return;
  }

  // captureStream(FPS) crea un flujo de vídeo en vivo a partir del
  // canvas. FPS debe ser una constante global (p. ej. 25 o 30).
  // A mayor FPS, más fluidez pero archivo más grande.
  const stream = canvas.captureStream(FPS);

  // Decidimos el formato una sola vez por grabación.
  mime_elegido = elegir_mime();

  // Creamos el MediaRecorder con el formato elegido y 8 Mbps de bitrate.
  // Si no hay MIME soportado (""), pasamos solo el bitrate y dejamos
  // que el navegador elija su formato por defecto.
  recorder = new MediaRecorder(stream, mime_elegido
    ? { mimeType: mime_elegido, videoBitsPerSecond: 8000000 }
    : { videoBitsPerSecond: 8000000 });

  // Vaciamos el array de trozos para empezar una grabación limpia.
  trozos = [];

  // Evento que se dispara periódicamente mientras se graba:
  // el MediaRecorder entrega fragmentos (chunks) de vídeo y los
  // acumulamos en `trozos`. Solo guardamos si tienen datos.
  recorder.ondataavailable = e => {
    if (e.data.size > 0) trozos.push(e.data);
  };

  // Evento que se dispara al llamar a recorder.stop():
  // unimos todos los trozos en un Blob, decidimos la extensión
  // según el MIME elegido y forzamos la descarga con un <a> invisible.
  recorder.onstop = () => {
  
    // Extensión del archivo según el formato elegido:
    // si el MIME contiene "mp4" → .mp4, si no → .webm
    const ext = mime_elegido.includes("mp4") ? "mp4" : "webm";

    // Unir todos los trozos grabados en un único Blob binario
    // con el tipo MIME correspondiente
    const blob = new Blob(trozos, { type: mime_elegido || "video/webm" });

    // Crear un <a> invisible para forzar la descarga automática
    const a = document.createElement("a");

    // Apuntar el enlace al Blob en memoria
    a.href = URL.createObjectURL(blob);

    // Nombre del archivo descargado
    a.download = "creditos_terminal." + ext;

    // Simular el clic para que el navegador descargue
    a.click();

    // Restaurar el estado de los botones (Rec activo, Stop desactivado)
    actualizar_botones();

    // Mostrar mensaje al usuario debajo de los botones (#estado)
    if ($estado) {
      $estado.textContent = ext === "mp4"
        ? "✔ Descargado creditos_terminal.mp4"
        : "✔ Descargado .webm (conviértelo con HandBrake o ffmpeg)";
    }
};


  // Reseteamos el contador de fotogramas para que la animación
  // empiece desde el principio exacto al iniciar la grabación.
  activo = true;   // la grabación enciende la animación
  f = 0;

  // Arrancamos el MediaRecorder y actualizamos estado y botones.
  recorder.start();
  grabando = true;
  actualizar_botones();
  if ($estado) $estado.textContent = "● Grabando…";
}


// ------------------------------------------------------------
//  PARADA DE LA GRABACIÓN
// ------------------------------------------------------------

/**
 * Detiene la grabación en curso y dispara la descarga.
 *
 * Al llamar a recorder.stop(), el navegador emite el evento
 * `onstop` definido en iniciar_grabacion(), que se encarga de
 * unir los trozos, crear el Blob y descargar el archivo.
 */
function detener_grabacion() {
  // Solo actuamos si hay un recorder activo y estamos grabando.
  // Así evitamos dobles paradas o paradas sin grabación.
  if (recorder && grabando) {
    grabando = false;       // marcamos como no grabando ANTES de parar
    activo = false;         // apaga la animación al terminar la grabación
    f = 0;                  // vuelve al principio para la próxima vez
    recorder.stop();        // dispara recorder.onstop (descarga)
    if ($estado) $estado.textContent = "■ Terminado. Descargando…";
  }
}


// ------------------------------------------------------------
//  SINCRONIZACIÓN DE BOTONES
// ------------------------------------------------------------

/**
 * Sincroniza los botones con `grabando`:
 *   - Grabando: "btn_rec" desactivado, "btn_stop" activo.
 *   - En reposo: "btn_rec" activo, "btn_stop" desactivado.
 * Al final refresca también el botón On/Off.
 */
function actualizar_botones() {
  const btn_rec  = document.getElementById("btn_rec");
  const btn_stop = document.getElementById("btn_stop");
  if (btn_rec)  btn_rec.disabled  = grabando;
  if (btn_stop) btn_stop.disabled = !grabando;
  actualizar_boton_onoff();
}



// ------------------------------------------------------------
//  INTERRUPTOR ON/OFF DE LA ANIMACIÓN
// ------------------------------------------------------------

/**
 * Interruptor On/Off de la animación.
 * Invierte `activo`; al apagar, reinicia `f` a 0. No actúa mientras se graba.
 */
function alternar_animacion() {
  // No se permite apagar mientras se graba (cortaría el vídeo)
  if (grabando) return;

  activo = !activo;
  if (!activo) f = 0;          // Al apagar, vuelve al principio (fondo negro)
  actualizar_boton_onoff();
}

/**
 * Sincroniza el botón "btn_reset" con `activo`: texto, clase "activo"
 * y bloqueo mientras se graba.
 */
function actualizar_boton_onoff() {
  const btn = document.getElementById("btn_reset");
  if (!btn) return;
  btn.textContent = activo ? "■ Off" : "▶ On";
  btn.classList.toggle("activo", activo);
  btn.disabled = grabando;     // bloqueado mientras se graba
}
