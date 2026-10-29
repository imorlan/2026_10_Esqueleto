// ============================================================
//  globals.js
//  Variables y constantes globales del proyecto.
//  Centralizadas aquí para facilitar el mantenimiento.
// ============================================================

// ------------------------------------------------------------
//  DIMENSIONES DEL VÍDEO
//  W y H se asignan al elegir la relación de aspecto.
//  Los valores de _DEFECTO son solo respaldo.
// ------------------------------------------------------------
let W = 714, H = 440;
const W_DEFECTO = 714;
const H_DEFECTO = 440;

const FPS = 25;

// ------------------------------------------------------------
//  OPCIONES DE RELACIÓN DE ASPECTO
// ------------------------------------------------------------
const opciones_aspecto = [
  // Horizontal
  { grupo: "Horizontal", nombre: "Super 8 Digital",          ratio: "~1.62:1", w: 714,  h: 440  },
  { grupo: "Horizontal", nombre: "HD 4:3 (Super VGA / XGA)", ratio: "4:3",     w: 1024, h: 768  },
  { grupo: "Horizontal", nombre: "Full HD Equivalent (4:3)", ratio: "4:3",     w: 1440, h: 1080 },
  { grupo: "Horizontal", nombre: "Full HD 16:9",             ratio: "16:9",    w: 1920, h: 1080 },
  { grupo: "Horizontal", nombre: "4K UHD",                   ratio: "16:9",    w: 3840, h: 2160 },
  // Vertical
  { grupo: "Vertical",   nombre: "Super 8 Digital",          ratio: "~1:1.62", w: 440,  h: 714  },
  { grupo: "Vertical",   nombre: "HD 3:4 (Super VGA / XGA)", ratio: "3:4",     w: 768,  h: 1024 },
  { grupo: "Vertical",   nombre: "Full HD Equivalent (3:4)", ratio: "3:4",     w: 1080, h: 1440 },
  { grupo: "Vertical",   nombre: "Full HD 9:16",             ratio: "9:16",    w: 1080, h: 1920 },
  { grupo: "Vertical",   nombre: "4K UHD",                   ratio: "9:16",    w: 2160, h: 3840 },
];

// ------------------------------------------------------------
//  ESTADO DEL PROGRAMA
// ------------------------------------------------------------
let fase_programa = "seleccion";   // "seleccion" | "ejecucion"
let canvas_principal = null;
let $estado = null;

// Estado de la animación On/Off (la usa grabar.js y sketch.js)
let activo = false;

// ------------------------------------------------------------
//  PARÁMETROS DE LA ANIMACIÓN DE EJEMPLO
//  (círculo rojo que rebota de izquierda a derecha)
// ------------------------------------------------------------
const color_circulo      = [200, 60, 60];   // rojo apagado
const radio_circulo      = 40;
const velocidad_circulo  = 4;               // px por fotograma
let   posicion_x_circulo = 0;               // se reinicia al arrancar
let   direccion_circulo  = 1;               // 1 → derecha, -1 → izquierda

// ------------------------------------------------------------
//  COLOR DE FONDO DEL CANVAS (gris neutro)
// ------------------------------------------------------------
const color_fondo = [128, 128, 128];


// ------------------------------------------------------------
//  Trazas de depuración en el canvas
// ------------------------------------------------------------
// Pon DEBUG = true para ver trazas en el canvas
const DEBUG = false;

/**
 * Ejemplo
 * 
 *   if (DEBUG) {
 *     textAlign(LEFT, TOP);
 *     textSize(16);
 *     text("draw()  activo=" + activo + "  f=" + f, 10, 10);
 *   }
 */