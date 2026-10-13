/* =========================================================================
   calculo.js — Lógica pura del cálculo de horas extraordinarias.
   No toca el DOM. Funciona en navegador (file://) y en Node (tests).
   ========================================================================= */

/* ---- HORARIO ORDINARIO (configurable en un solo lugar) ---------------- */
/* El horario regular es de 7:00 a. m. a 3:00 p. m. Las horas dentro de
   ese rango NO se cuentan. Solo se cuentan ANTES de las 7:00 a. m. y
   DESPUÉS de las 3:00 p. m.                                         */
var HORA_INICIO_REGULAR = "07:00";
var HORA_FIN_REGULAR = "15:00";
/* ---------------------------------------------------------------------- */

var MINUTOS_POR_DIA = 1440;

/* Convierte "HH:MM" (24 h) en minutos desde las 00:00. Vacío o inválido → null */
function convertirAMinutos(hhmm) {
  if (hhmm === null || hhmm === undefined) return null;
  var s = String(hhmm).trim();
  if (s === "") return null;
  var p = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!p) return null;
  var h = parseInt(p[1], 10);
  var m = parseInt(p[2], 10);
  if (isNaN(h) || isNaN(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/* Solape de dos rangos [a1,a2) y [b1,b2) en minutos */
function solapeRangos(a1, a2, b1, b2) {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

/* Devuelve { minutos, aviso, cruzaMedianoche, incompleta, completa }
   - inicio/fin: strings "HH:MM" (formato de <input type="time">)
   - regIni/regFin: horario ordinario opcional (default HORA_INICIO_REGULAR / HORA_FIN_REGULAR)
   - Si fin < inicio el rango cruza la medianoche y se suman 1440 al fin.
   - Horas extra = duración − solape con [regIni,regFin] del día 1
                                    − solape con [regIni+1440,regFin+1440] del día 2  */
function calcularMinutosExtra(inicio, fin, regIni, regFin) {
  var res = {
    minutos: 0,
    aviso: null,            // null | "incompleta" | "iguales"
    cruzaMedianoche: false,
    incompleta: false,
    completa: false
  };

  var i = convertirAMinutos(inicio);
  var f = convertirAMinutos(fin);

  if (i === null && f === null) {
    return res; // fila vacía: 0 minutos, sin aviso
  }
  if (i === null || f === null) {
    res.aviso = "incompleta";
    res.incompleta = true;
    return res;
  }

  var r1 = convertirAMinutos(regIni === undefined || regIni === null || regIni === "" ? HORA_INICIO_REGULAR : regIni);
  var r2 = convertirAMinutos(regFin === undefined || regFin === null || regFin === "" ? HORA_FIN_REGULAR : regFin);
  if (r1 === null) r1 = convertirAMinutos(HORA_INICIO_REGULAR);
  if (r2 === null) r2 = convertirAMinutos(HORA_FIN_REGULAR);

  if (i === f) {
    res.aviso = "iguales";
    return res;
  }

  var finCalculado = f;
  if (f < i) {
    finCalculado = f + MINUTOS_POR_DIA;   // el rango cruza la medianoche
    res.cruzaMedianoche = true;
  }

  var duracion = finCalculado - i;
  var solapeDia1 = solapeRangos(i, finCalculado, r1, r2);
  var solapeDia2 = solapeRangos(i, finCalculado, r1 + MINUTOS_POR_DIA, r2 + MINUTOS_POR_DIA);
  var extra = duracion - solapeDia1 - solapeDia2;

  res.minutos = Math.max(0, extra);
  res.completa = true;
  return res;
}

/* Suma exacta (en minutos) de una lista de resultados de calcularMinutosExtra */
function sumarMinutosExtra(resultados) {
  var total = 0;
  for (var k = 0; k < resultados.length; k++) {
    total += resultados[k].minutos || 0;
  }
  return total;
}

/* 310 → "5 h 10 min"   |   0 → "0 h 00 min" */
function formatearDuracion(minutos) {
  var m = Math.max(0, Math.round(minutos || 0));
  var h = Math.floor(m / 60);
  var r = m % 60;
  return h + " h " + (r < 10 ? "0" + r : r) + " min";
}

/* 310 → "5.17"  (sin redondeos de horas: se usa para la vista en pantalla) */
function horasDecimales(minutos) {
  var m = Math.max(0, Math.round(minutos || 0));
  var dec = m / 60;
  return dec.toFixed(2);
}

/* Objeto único expuesto: globals en navegador, exports en Node (pruebas) */
var CalculoHoras = {
  HORA_INICIO_REGULAR: HORA_INICIO_REGULAR,
  HORA_FIN_REGULAR: HORA_FIN_REGULAR,
  MINUTOS_POR_DIA: MINUTOS_POR_DIA,
  convertirAMinutos: convertirAMinutos,
  solapeRangos: solapeRangos,
  calcularMinutosExtra: calcularMinutosExtra,
  sumarMinutosExtra: sumarMinutosExtra,
  formatearDuracion: formatearDuracion,
  horasDecimales: horasDecimales
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CalculoHoras;
}
