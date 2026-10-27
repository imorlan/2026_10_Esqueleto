
// ============================================================
//  Títulos de crédito · Terminal CRT clásico · Efecto muelle
// ------------------------------------------------------------
//  Autor:       Iñaki Morlán
//  Contacto:    i.morlan@ehu.eus
//  Licencia:    MIT License (Libre uso, modificación y distribución)
//  
//  Especificaciones Técnicas:
//  · Lienzo/canvas: 714 x 440 px [*] |  Fotogramas: 25 fps
//  · Exportación: MP4 (H.264) / WebM vía MediaRecorder API [**]
// ============================================================
//
//  IDEA GENERAL DEL PROGRAMA
//  --------------------
//  1. Primero troceamos el texto: lo dividimos por líneas y luego letra por letra (un string/array).
//  2. Renderizamos cada letra una a una en su coordenada del canvas.
//  3. Todo el grupo de líneas va haciendo un scroll vertical suave hacia arriba.
//  4. Añadimos un efecto muelle: la primera letra (a la izquierda) se queda casi congelada en el margen, 
//     pero según avanza hacia la derecha, las letras sufren un delay y una oscilación mucho mayor, 
//     haciendo que la línea se mueva de más a menos y parezca un chicle al estirarse.
//  5. Look CRT clásico: verde fósforo, efecto glow, scanlines (o líneas de barrido) y un toque de 
//     parpadeo retro.
//  6. Se graba/captura el canvas en tiempo real con MediaRecorder y se descarga el vídeo automáticamente 
//     (MP4/WebM) al finalizar.
//
//  [*]  Proporción condicionada por el formato original en película Super 8. 
//       Para cambiar las dimensiones, basta con modificar las constantes W y H.
//  [**] Con Chrome/Edge 126 o superior, la web creará un archivo .mp4 real directamente al descargar.
//       Con una versión anterior (u otro navegador sin ese soporte: Firefox, Safari), la exportación a MP4 
//       fallará o la página te obligará a descargar el vídeo en formato .webm.
//
//  Nota.- El texto de los créditos desplegado (scroll) en pantalla se puede editar directamente 
//         en la constante `TEXTO`.
// ============================================================



// ------------------------------------------------------------
//  VARIABLES DE ESTADO 
// ------------------------------------------------------------
let lineas = [], pos_x = [], fase = [];
   // lineas: lista con cada línea de texto
   // pos_x: pos_x[i][j] = posición x ORIGINAL (sin estirar) de la letra j de la línea i
   // fase: fase[i] = desfase propio de la línea i, para que no se muevan todas a la vez

let f = 0, fin_frames = 0, scan;
   // f: contador de fotogramas propio (no frameCount): permite reiniciar y reproducir igual
   // fin_frames: nº de fotogramas que dura una pasada completa
   // scan: capa gráfica con las líneas de barrido (scanlines), creada una sola vez

// ⚠️ NO declares aquí grabando, recorder, trozos ni mime_elegido:
//    ya están declaradas en grabar.js. Si las repites, el navegador
//    lanza "Identifier 'grabando' has already been declared" y
//    la página no carga.

// Referencia global al span de estado, para poder usarla desde draw().
// (En setup() se asigna; aquí solo se declara.)
let $estado = null;

// El texto de los créditos ya NO se define aquí: se carga desde
// "creditos.txt" mediante loadStrings() en el preload() de sketch.js.
// Aquí solo declaramos la variable global que lo contendrá.
// Cada elemento de `lineas_texto` será una línea del archivo.
let lineas_texto = [];

// ============================================================
//  setup(): p5 lo ejecuta sólo una vez al arrancar
// ============================================================
function setup() {

  pixelDensity(1);              // Fuerza escala 1:1 para evitar descuadres en pantallas de alta densidad
  const c = createCanvas(W, H);
  c.parent("lienzo");           // Inserta el canvas dentro de <div id="lienzo">
  frameRate(FPS);               // p5.js llamará a draw() 25 veces por segundo
  randomSeed(7);                // Semilla fija: el resultado es siempre idéntico y repetible

  /**
   * Enganchar los tres botones (protegido por si alguno no existe).
   * Los ids del HTML son btn_rec, btn_stop, btn_reset y estado.
   * El '$' delante del nombre es solo convención para indicar que es un elemento HTML.
   */
  const $btn_rec   = document.getElementById("btn_rec");
  const $btn_stop  = document.getElementById("btn_stop");
  const $btn_reset = document.getElementById("btn_reset");
  $estado          = document.getElementById("estado");   // ⚠️ sin const: es la global de arriba

  if ($btn_rec)   $btn_rec.onclick   = iniciar_grabacion;
  if ($btn_stop)  $btn_stop.onclick  = detener_grabacion;
  if ($btn_reset) $btn_reset.onclick = reiniciar_animacion;

  if ($estado) $estado.textContent = "Listo";

  // Tipografía
  textFont("monospace");
  textSize(TAM);
  textAlign(LEFT, BASELINE);
  noStroke();

   // 1) El texto ya viene troceado en líneas desde preload()
  lineas = lineas_texto;

  // 2) Calcula la posición X de cada letra y desfasa la fase del muelle
  for (let i = 0; i < lineas.length; i++) {
    let acum = 0, pos = [];
    for (const ch of lineas[i]) {
      pos.push(acum);
      acum += textWidth(ch);
    }
    pos_x.push(pos);
    fase[i] = i * 0.7 + random(-0.3, 0.3);
  }

  // 3) Textura de scanlines en un buffer secundario
  scan = createGraphics(W, H);
  scan.pixelDensity(1);
  scan.noStroke();
  scan.fill(0, 55);
  for (let y = 0; y < H; y += 3) scan.rect(0, y, W, 1);

  // 4) Duración de la animación en fotogramas
  const y_ultima0 = H + 30 + (lineas.length - 1) * INTERLINEA;
  fin_frames = VELOCIDAD > 0 ? Math.ceil((y_ultima0 + 40) / VELOCIDAD) : 1;
}

// ============================================================
//  draw(): Bucle principal de renderizado de p5.js.
//  Se le llama periódicamente a la frecuencia fijada por frameRate(25)
//  para calcular y dibujar un nuevo fotograma en cada iteración.
// ============================================================
function draw() {
  background(0);                // 1) Limpia el canvas en cada fotograma, lo pone a negro (fondo del terminal)

  const ctx = drawingContext;   // Accede al CanvasRenderingContext2D nativo de la Web API,
                                // necesario para aplicar propiedades de sombra/resplandor (shadowBlur)

  // Calcula la variable temporal 't' en segundos a partir del fotograma actual (f / FPS)
  // e introduce el factor de escala VELOCIDAD_MUELLE para ralentizar o acelerar la oscilación
  const t = (f / FPS) * VELOCIDAD_MUELLE;

  // Posición Y de la primera línea: inicia fuera de pantalla por abajo (H + 30)
  // y decrementa su valor según VELOCIDAD para generar el scroll ascendente
  const scroll_y = H + 30 - f * VELOCIDAD;

  // Simula el parpadeo de la pantalla (0.88 a 1.0) combinando dos ondas seno basadas en el contador de
  // fotogramas propio 'f' (sin usar azar) para que el resultado sea siempre idéntico
  const parpadeo = 0.94 + 0.06 * sin(f * 0.9) * sin(f * 0.23);

  // Configura el efecto de resplandor o brillo ("glow") aplicando una sombra difusa de color
  // verde alrededor de las letras
  ctx.shadowColor = "rgba(51,255,102,0.85)";
  ctx.shadowBlur = 8;

  // Se recorre cada línea de texto para renderizarla
  for (let i = 0; i < lineas.length; i++) {
    const y = scroll_y + i * INTERLINEA;               // Calcula la coordenada vertical Y de la línea actual

    // Si la línea está totalmente fuera de la pantalla (arriba o abajo), la ignora para mejorar el rendimiento
    if (y < -TAM || y > H + TAM) continue;

    const linea = lineas[i];
    if (linea.trim() === "") continue;                // Salta las líneas en blanco sin dibujar nada
                                                      // pero conservando su espacio (el "aire")

    // Transición suave (fade in/out): calcula el degradado del texto al entrar por abajo o salir por arriba.
    //  y / 70        → 0 en el borde superior, 1 a partir de 70 px
    //  (H - y) / 50  → 0 en el borde inferior, 1 a partir de 50 px
    // min() se queda con el más restrictivo; constrain() lo limita a 0..1.
    const borde = min(constrain(y / 70, 0, 1), constrain((H - y) / 50, 0, 1));

    // Color verde combinando la transparencia del borde con el parpadeo
    fill(COLOR_VERDE[0], COLOR_VERDE[1], COLOR_VERDE[2], 255 * borde * parpadeo);

    // Dibuja la línea letra a letra (j = índice de la letra)
    let j = 0;
    for (const ch of linea) {
      if (ch !== " ") {                               // Ignora espacios visibles (ya tienen su
                                                      // hueco reservado en pos_x)

        const k = muelle(t - j * RETARDO + fase[i]);  // Estiramiento de la letra. Combina el tiempo,
                                                      // un retardo por letra y el desfase de la línea

        // Estira la posición X según el factor de deformación 'k': cuanto más a la derecha está la letra,
        // más se desplaza (efecto muelle anclado a la izquierda)
        text(ch, MARGEN_IZQ + pos_x[i][j] * (1 + k), y);
      }
      j++;
    }
  }

  ctx.shadowBlur = 0;           // Apaga el brillo para no distorsionar las scanlines (o líneas de barrido)
  image(scan, 0, 0);            // Superpone la capa de scanlines sobre el texto

  // Mientras se graba muestra el progreso del tiempo transcurrido / total.
  // La condición `&& $estado` protege contra el caso de que el span no exista
  // (id mal escrito, HTML sin #estado, etc.) y evita un TypeError dentro de draw().
  if (grabando && $estado) {
    $estado.textContent = "● Grabando… " + Math.round(f / FPS) + " / " + Math.round(fin_frames / FPS) + " s";
  }

  // Control del ciclo de animación y fin de grabación
  if (f >= fin_frames) {
    if (grabando) detener_grabacion();   // Finaliza la captura al completar una pasada
    f = 0;                               // Reinicia el scroll para continuar en bucle
  } else {
    f++;                                 // siguiente fotograma
  }
}

