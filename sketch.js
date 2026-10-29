// ============================================================
//  2026_10_Esqueleto
// ------------------------------------------------------------
//  Autor:       Iñaki Morlán
//  Contacto:    i.morlan@ehu.eus
//  Licencia:    MIT License (Libre uso, modificación y distribución)
// ============================================================
//
//  IDEA GENERAL DEL PROGRAMA
//  -------------------------
//  1. Primero se elige la relación de aspecto del vídeo.
//  2. Después se trocea el texto: lo dividimos por líneas y luego
//     letra por letra (un string/array).
//  3. Renderizamos cada letra una a una en su coordenada del canvas.
//  4. Todo el grupo de líneas va haciendo un scroll vertical suave
//     hacia arriba.
//  5. Añadimos un efecto muelle: la primera letra (a la izquierda)
//     se queda casi congelada en el margen, pero según avanza hacia
//     la derecha, las letras sufren un delay y una oscilación mucho
//     mayor, haciendo que la línea se mueva de más a menos y parezca
//     un chicle al estirarse.
//  6. Look CRT clásico: verde fósforo, efecto glow, scanlines
//     (o líneas de barrido) y un toque de parpadeo retro.
//  7. Se graba/captura el canvas en tiempo real con MediaRecorder
//     y se descarga el vídeo automáticamente (MP4/WebM) al finalizar.
//
//  CONTROLES
//  --------------------
//  · Botón "● Rec"  → inicia la grabación del vídeo.
//  · Botón "■ Stop" → detiene la grabación y descarga el archivo.
//  · Botón "▶ On" / "■ Off" → enciende o apaga la animación.
//  · Tecla R → Rec.
//  · Tecla S → Stop.
//  · Tecla O o barra espaciadora → On/Off.
//
//  NOTAS
//  --------------------
//  [*]  Las dimensiones del canvas ya NO son fijas (antes 714 × 440,
//       proporción Super 8). Ahora las asigna el usuario desde la
//       pantalla de selección inicial entre las opciones de
//       `opciones_aspecto` (constantes.js): horizontal o vertical,
//       desde Super 8 hasta 4K UHD.
//  [**] Con Chrome/Edge 126 o superior, la web creará un archivo .mp4
//       real directamente al descargar. Con una versión anterior
//       (u otro navegador sin ese soporte: Firefox, Safari), la
//       exportación a MP4 fallará o la página te obligará a descargar
//       el vídeo en formato .webm.
//
//  Nota.- El texto de los créditos desplegado (scroll) en pantalla
//         se puede editar directamente en "creditos.txt".
// ============================================================




// ============================================================
//  setup(): solo prepara la pantalla de selección.
//  NO crea el canvas definitivo ni inicializa la animación.
// ============================================================
function setup() {
  pixelDensity(1);               // Fuerza escala 1:1 para evitar descuadres en pantallas de alta densidad
  noCanvas();                    // No creamos canvas todavía

  // Referencia al span de estado
  $estado = document.getElementById("estado");   // ⚠️ sin const: es la global de arriba

  // Construir la pantalla de selección de aspecto
  construir_selector_aspecto();
}


// ============================================================
//  draw(): Bucle principal de renderizado de p5.js.
//  Se le llama periódicamente a la frecuencia fijada por frameRate(25)
//  para calcular y dibujar un nuevo fotograma en cada iteración.
// ============================================================
function draw() {
  // Mientras no se elija aspecto, no dibujamos nada del vídeo.
  if (fase_programa !== "ejecucion") return;

  background(0);                // 1) Limpia el canvas en cada fotograma, lo pone a negro (fondo del terminal)

  if (!activo) {
    image(scan, 0, 0);   // opcional: mantiene las scanlines con la pantalla "apagada"
    return;              // no dibuja texto ni avanza f
  }

  const ctx = drawingContext;   // Accede al CanvasRenderingContext2D nativo de la Web API,
                                // necesario para aplicar propiedades de sombra/resplandor (shadowBlur)

  // Calcula la variable temporal 't' en segundos a partir del fotograma actual (f / FPS)
  // e introduce el factor de escala VELOCIDAD_MUELLE para ralentizar o acelerar la oscilación
  const t = (f / FPS) * VELOCIDAD_MUELLE;

  // Posición Y de la primera línea: inicia fuera de pantalla por abajo (H + 30)
  // y decrementa su valor según VELOCIDAD para generar el scroll ascendente
  const scroll_y = H + 30 - f * VELOCIDAD;

  // Simula el parpadeo de la pantalla (0.88 a 1.0) combinando dos ondas seno basadas en
  // el contador de fotogramas propio 'f' (sin usar azar) para que el resultado sea siempre idéntico
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