// ------------------------------------------------------------
//  CONSTANTES BÁSICAS DEL VÍDEO
// ------------------------------------------------------------
const W = 714, H = 440; // W y H: tamaño del lienzo (y del vídeo) en píxeles.
const FPS = 25; // FPS: fotogramas por segundo


/*
// Texto de los créditos. 
   // Con comillas invertidas (``) se pueden escribir varias líneas.
   // Los espacios dobles y las líneas vacías se conservan: las líneas vacías son las
   //     pausas ("aire") del scroll.
const TEXTO = 
`"Volare (Nel blu dipinto di blu)"
(D. Modugno, F. Migliacci)
Interpretada por Domenico Modugno


"One"
(J. Hetfield, L. Ulrich)
Interpretada por Metallica


"Help!"
(J. Lennon, P. McCartney)
Interpretada por Dolly Parton






FATAL  ERROR:  OUT  OF  MEMORY


Iñaki  Morlán  Santa  Catalina
Arte  y  Tecnología  III · G01
20-X-2026


H264 - 25  fps - 714x440`;
*/

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

