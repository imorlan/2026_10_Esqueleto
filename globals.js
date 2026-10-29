// ============================================================
//  GRABACIÓN Y EXPORTACIÓN DE VÍDEO (Web API MediaRecorder)
// ============================================================

// ------------------------------------------------------------
//  CONSTANTES BÁSICAS DEL VÍDEO
// ------------------------------------------------------------
let W = 714, H = 440;
const W_DEFECTO = 714;
const H_DEFECTO = 440;
const FPS = 25;

// 
//  OPCIONES DE RELACIÓN DE ASPECTO
// 
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
//  AJUSTES
// ------------------------------------------------------------
const TAM = 16;            // tamaño de la letra en px
const INTERLINEA = 28;     // distancia vertical entre líneas (px). Menos = más compacto
const MARGEN_IZQ = 48;     // margen izquierdo: el texto queda justificado a la izquierda
const VELOCIDAD = 0.95;    // px que sube el texto por fotograma (0.95 × 25 ≈ 24 px/s)
const ESTIRO = 0.9;        // estiramiento máximo: 0.9 = la línea llega a +90 % de ancho
const RETARDO = 0.05;      // desfase (s) entre una letra y la siguiente → crea la "onda"
const VELOCIDAD_MUELLE = 0.8;       // ritmo del muelle: 1 = normal, menor = más pausado
const COLOR_VERDE = [51, 255, 102]; // RGB del verde fósforo (#33FF66)

// ============================================================
//  VARIABLES
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

// Fase actual del programa:
//   "seleccion"  → mostrando el selector de aspecto
//   "ejecucion"  → canvas creado, animación disponible
let fase_programa = "seleccion";

// ⚠️ NO declares aquí grabando, recorder, trozos ni mime_elegido:
//    ya están declaradas en grabar.js. Si las repites, el navegador
//    lanza "Identifier 'grabando' has already been declared" y
//    la página no carga.

// Referencia global al span de estado, para poder usarla desde draw().
// (En setup() se asigna; aquí solo se declara.)
let $estado = null;

// El texto de los créditos ya NO se define aquí: se carga desde
// "creditos.txt" mediante loadStrings() en el preload().
// Aquí solo declaramos la variable global que lo contendrá.
// Cada elemento de `lineas_texto` será una línea del archivo.
let lineas_texto = [];

// Canvas de p5 (se crea al elegir la relación de aspecto, no en setup).
let canvas_principal = null;


// ------------------------------------------------------------
//  VARIABLES GLOBALES DEL MÓDULO DE GRABACIÓN
// ------------------------------------------------------------
// Se declaran con `let` (no `const`) porque cambian durante la
// grabación. Son globales para que sketch.js pueda consultarlas
// (por ejemplo, `grabando` para saber si reiniciar la animación).
// ------------------------------------------------------------

let recorder     = null;  // Instancia activa de MediaRecorder (null si no se graba)
let trozos       = [];    // Fragmentos de vídeo acumulados en cada ondataavailable
let mime_elegido = "";    // MIME type elegido al iniciar (p. ej. "video/mp4" o "video/webm")
let grabando     = false; // Bandera de estado: true mientras dura la grabación
let activo       = false; // true = el scroll está en marcha
