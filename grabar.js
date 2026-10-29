// ============================================================
//  grabar.js
//  Grabación del canvas con MediaRecorder.
//  Se mantiene el sistema intacto; solo se desacopla de la UI
//  (los botones y el On/Off viven ahora en funciones.js).
// ============================================================

let recorder     = null;
let trozos       = [];
let mime_elegido = "";
let grabando     = false;

// ------------------------------------------------------------
//  Elegir el mejor MIME disponible
// ------------------------------------------------------------
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

// ------------------------------------------------------------
//  Iniciar grabación
// ------------------------------------------------------------
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

// ------------------------------------------------------------
//  Detener grabación
// ------------------------------------------------------------
function detener_grabacion() {
  if (recorder && grabando) {
    grabando = false;
    activo = false;
    f = 0;
    recorder.stop();
    if ($estado) $estado.textContent = "■ Terminado. Descargando…";
  }
}

// ------------------------------------------------------------
//  Sincronizar botones
// ------------------------------------------------------------
function actualizar_botones() {
  const btn_rec  = document.getElementById("btn_rec");
  const btn_stop = document.getElementById("btn_stop");
  if (btn_rec)  btn_rec.disabled  = grabando;
  if (btn_stop) btn_stop.disabled = !grabando;
  actualizar_boton_onoff();
}