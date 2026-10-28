
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
