/* =========================================================================
   app.js — Interfaz, eventos y textos configurables.
   La lógica de cálculo vive en js/calculo.js (función pura, sin DOM).
   ========================================================================= */

(function () {
  "use strict";

  /* =====================================================================
     1. TEXTOS Y AJUSTES CONFIGURABLES (edita aquí)
     ===================================================================== */
  var CONFIG = {
    encabezado: [
      "CAJA DE SEGURO SOCIAL.",
      "COORDINACIÓN ADMINISTRATIVA DE HERRERA."
    ],
    titulo: [
      "FORMULARIO DE RECONOCIMIENTO DE HORAS",
      "EXTRAORDINARIAS DE LABORES."
    ],
    etiquetaPrimera: "RECONOCER: DE",
    etiquetaRestantes: "DE",
    textoTotal: "Total de horas:",
    textoFavor: "A favor del funcionario (a):",
    /* Los {0} {1} {2} son los tres espacios en blanco editables */
    parrafo:
      "En concepto de horas extraordinarias de trabajo, laboradas fuera del " +
      "horario ordinario de trabajo, ya sea en pago de horas extras {0}, " +
      "y/o en tiempo compensatorio, {1}, también pago de viático {2}, a razón de:",
    textoFirma: "Firma de autorización del jefe inmediato:",
    nota:
      "Nota: éste formulario se usará exclusivamente en las ocasiones en donde " +
      "no existan controles de reloj, tarjetas, lista u otros controles, porque " +
      "el funcionario se encontraba realizando trabajos fuera de las instalaciones.",
    numFilas: 12,
    logo: "logo/logo.png",
    logoAlt: "Logo Caja de Seguro Social de Panamá",
    meses: ["enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    mensajes: {
      limpiar: "¿Limpiar el formulario? Se borrarán todas las horas, fechas y textos.",
      desborde: "El texto no cabe en 5 líneas: se desbordará al imprimir."
    },
    escalaLlenado: 0.8   /* escala mínima al escribir en pantallas angostas */
  };

  /* =====================================================================
     2. UTILIDADES DE FORMATO PARA LA IMPRESIÓN
     ===================================================================== */

  function escapar(txt) {
    return String(txt).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* "07:30" -> "7:30 a. m."   |   "18:05" -> "6:05 p. m." */
  function formatoHora(valor) {
    var m = window.CalculoHoras.convertirAMinutos(valor);
    if (m === null) return "";
    var h = Math.floor(m / 60);
    var min = m % 60;
    var sufijo = h < 12 ? "a. m." : "p. m.";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ":" + (min < 10 ? "0" + min : min) + " " + sufijo;
  }

  /* "2026-10-13" -> "13 de octubre de 2026" */
  function formatoFecha(valor) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor || ""));
    if (!p) return "";
    var dia = parseInt(p[3], 10);
    var mes = CONFIG.meses[parseInt(p[2], 10) - 1];
    if (!mes) return "";
    return dia + " de " + mes + " de " + p[1];
  }

  /* =====================================================================
     3. CONSTRUCCIÓN DEL FORMULARIO
     ===================================================================== */

  var hoja, riel, encuadre, escena, zona, totalInput, espejoTotal,
      pildora, avisoMotivo, textareaMotivo, tags = [], pares = [];

  function htmlCampo(tipo, atributos, aria) {
    return '<span class="campo">' +
             '<input type="' + tipo + '" ' + atributos + ' aria-label="' + escapar(aria) + '">' +
             '<span class="espejo"></span>' +
           '</span>';
  }

  function htmlFila(n) {
    var etiqueta = (n === 1) ? CONFIG.etiquetaPrimera : CONFIG.etiquetaRestantes;
    return '<div class="fila" role="group" aria-label="Fila ' + n + '">' +
             '<div class="c-etiqueta">' + escapar(etiqueta) + '</div>' +
             htmlCampo("time", 'data-par="inicio"', "Fila " + n + ", hora inicial") +
             '<div class="c-a">a</div>' +
             htmlCampo("time", 'data-par="fin"', "Fila " + n + ", hora final") +
             '<div class="c-deldia">, del día</div>' +
             htmlCampo("date", 'data-par="fecha"', "Fila " + n + ", fecha") +
             '<div class="c-punto">.</div>' +
           '</div>';
  }

  function htmlParrafo() {
    var partes = CONFIG.parrafo.split(/\{(\d+)\}/);
    var out = '<div class="b-parrafo"><p class="parrafo">';
    for (var i = 0; i < partes.length; i++) {
      if (i % 2 === 0) {
        out += escapar(partes[i]);
      } else {
        var k = partes[i];
        out += '<span class="campo-inline">' +
                 '<input type="text" data-par="p' + k + '" ' +
                   'aria-label="Espacio ' + (parseInt(k, 10) + 1) + ' del párrafo">' +
                 '<span class="espejo"></span>' +
               '</span>';
      }
    }
    out += "</p></div>";
    return out;
  }

  function construir() {
    var filas = "";
    for (var n = 1; n <= CONFIG.numFilas; n++) filas += htmlFila(n);

    var rielHtml = '<div class="riel" id="riel" aria-hidden="true">';
    for (var t = 1; t <= CONFIG.numFilas; t++) rielHtml += '<div class="tag"></div>';
    rielHtml += "</div>";

    var html =
      '<div class="impresion">' +

        '<div class="b-encabezado">' +
          '<img class="logo" id="logo" src="' + CONFIG.logo + '" alt="' + escapar(CONFIG.logoAlt) + '" ' +
               'onerror="this.classList.add(\'logo-ausente\')">' +
          '<div class="centrado">' +
            '<p class="org">' + escapar(CONFIG.encabezado[0]) + "</p>" +
            '<p class="org sub">' + escapar(CONFIG.encabezado[1]) + "</p>" +
            '<h1 class="titulo"><span>' + escapar(CONFIG.titulo[0]) + "</span>" +
              "<span>" + escapar(CONFIG.titulo[1]) + "</span></h1>" +
          "</div>" +
        "</div>" +

        '<div class="b-filas" id="filas">' + filas + "</div>" +

        '<div class="b-total">' +
          '<span class="etiqueta-campo">' + escapar(CONFIG.textoTotal) + "</span>" +
          '<span class="campo campo-total">' +
            '<input type="text" id="total-horas" readonly tabindex="-1" ' +
              'aria-label="Total de horas, calculado automáticamente">' +
            '<span class="espejo" id="espejo-total"></span>' +
          "</span>" +
          '<span class="c-punto">.</span>' +
        "</div>" +

        '<div class="b-favor">' +
          '<span class="etiqueta-campo">' + escapar(CONFIG.textoFavor) + "</span>" +
          '<span class="campo campo-largo">' +
            '<input type="text" data-par="favor" aria-label="A favor del funcionario">' +
            '<span class="espejo"></span>' +
          "</span>" +
          '<span class="c-punto">.</span>' +
        "</div>" +

        htmlParrafo() +

        '<div class="b-motivo">' +
          '<textarea class="lineas" rows="5" spellcheck="false" ' +
            'aria-label="Motivo, a razón de: cinco líneas"></textarea>' +
          '<div class="espejo-lineas lineas" id="espejo-motivo" aria-hidden="true"></div>' +
          '<p class="aviso" id="aviso-motivo" hidden></p>' +
        "</div>" +

        '<div class="b-firma">' +
          '<span class="etiqueta-campo">' + escapar(CONFIG.textoFirma) + "</span>" +
          '<span class="campo campo-firma"></span>' +
          '<span class="c-punto">.</span>' +
        "</div>" +

        '<div class="b-nota"><p class="nota">' + escapar(CONFIG.nota) + "</p></div>" +

        '<div class="b-hueco"></div>' +
      "</div>" + rielHtml;

    hoja.innerHTML = html;

    riel = hoja.querySelector("#riel");
    tags = Array.prototype.slice.call(riel.querySelectorAll(".tag"));
    pares = Array.prototype.slice.call(hoja.querySelectorAll(".campo, .campo-inline"));
    totalInput = hoja.querySelector("#total-horas");
    espejoTotal = hoja.querySelector("#espejo-total");
    textareaMotivo = hoja.querySelector("textarea.lineas");
    avisoMotivo = hoja.querySelector("#aviso-motivo");
  }

  /* =====================================================================
     4. CÁLCULO EN VIVO + ESPEJOS DE IMPRESIÓN
     ===================================================================== */

  function actualizarEspejo(input) {
    if (!input || input.id === "total-horas") return;
    var contenedor = input.parentNode;
    var espejo = contenedor.querySelector(".espejo");
    if (!espejo) return;
    if (input.type === "time") espejo.textContent = formatoHora(input.value);
    else if (input.type === "date") espejo.textContent = formatoFecha(input.value);
    else espejo.textContent = input.value;
  }

  function textoEtiqueta(res) {
    if (res.aviso === "incompleta" || res.aviso === "iguales") {
      return { texto: "Revisar", clase: "tag tag--aviso" };
    }
    if (res.cruzaMedianoche) {
      return { texto: window.CalculoHoras.formatearDuracion(res.minutos) + " · cruza", clase: "tag tag--cruza" };
    }
    if (res.minutos > 0) {
      return { texto: window.CalculoHoras.formatearDuracion(res.minutos), clase: "tag tag--extra" };
    }
    return { texto: "0 (horario regular)", clase: "tag" };
  }

  function recalcular() {
    var C = window.CalculoHoras;
    var total = 0;
    var filas = hoja.querySelectorAll(".fila");

    for (var i = 0; i < filas.length; i++) {
      var fila = filas[i];
      var ini = fila.querySelector('input[data-par="inicio"]');
      var fin = fila.querySelector('input[data-par="fin"]');
      var fecha = fila.querySelector('input[data-par="fecha"]');

      var res = C.calcularMinutosExtra(ini.value, fin.value);
      total += res.minutos;

      actualizarEspejo(ini);
      actualizarEspejo(fin);
      actualizarEspejo(fecha);

      if (tags[i]) {
        if (!ini.value && !fin.value) {
          tags[i].textContent = "";
          tags[i].className = "tag";
        } else {
          var et = textoEtiqueta(res);
          tags[i].textContent = et.texto;
          tags[i].className = et.clase;
        }
      }
    }

    /* total: en pantalla con decimal, en el papel solo "H h MM min" */
    var txtTotal = C.formatearDuracion(total);
    if (totalInput) totalInput.value = txtTotal + " (" + C.horasDecimales(total) + " h)";
    if (espejoTotal) espejoTotal.textContent = txtTotal;
    if (pildora) pildora.textContent = txtTotal;

    /* espejos de los campos de texto */
    for (var k = 0; k < pares.length; k++) {
      var campo = pares[k];
      var inp = campo.querySelector("input");
      if (inp) actualizarEspejo(inp);
    }

    /* motivo: aviso si el texto no cabe en 5 líneas (no se imprime) */
    if (textareaMotivo && avisoMotivo) {
      var desborda = textareaMotivo.scrollHeight > textareaMotivo.clientHeight + 1;
      avisoMotivo.hidden = !desborda;
      avisoMotivo.textContent = desborda ? CONFIG.mensajes.desborde : "";
      var espejoMotivo = hoja.querySelector("#espejo-motivo");
      if (espejoMotivo) espejoMotivo.textContent = textareaMotivo.value;
    }
  }

  /* =====================================================================
     5. ESCALA DE LA VISTA PREVIA (solo pantalla, nunca al imprimir)
     ===================================================================== */

  var escalaBase = 1;
  var enModoLlenado = false;

  function ubicarRiel() {
    if (!riel) return;
    var filas = hoja.querySelector("#filas");
    if (!filas) return;
    riel.style.top = filas.offsetTop + "px";
    riel.style.height = filas.offsetHeight + "px";
  }

  function dimensionesEscena() {
    var ancho = hoja.offsetWidth;
    var rielVisible = riel && riel.offsetWidth > 0 &&
      window.getComputedStyle(riel).display !== "none";
    if (rielVisible) {
      ancho += (riel.offsetLeft - hoja.offsetWidth) + riel.offsetWidth;
    }
    return { ancho: ancho, alto: hoja.offsetHeight };
  }

  function ajustarEscala() {
    var cs = window.getComputedStyle(zona);
    var disponible = zona.clientWidth -
      (parseFloat(cs.paddingLeft) || 0) -
      (parseFloat(cs.paddingRight) || 0);
    if (disponible <= 0) return;

    var d = dimensionesEscena();
    escalaBase = Math.min(1, disponible / d.ancho);

    var escala = escalaBase;
    if (enModoLlenado && escalaBase < CONFIG.escalaLlenado) {
      escala = Math.min(1, CONFIG.escalaLlenado);
    }

    escena.style.width = d.ancho + "px";
    escena.style.transform = "scale(" + escala + ")";
    encuadre.style.width = (d.ancho * escala) + "px";
    encuadre.style.height = (d.alto * escala) + "px";
  }

  function refrescar() {
    ubicarRiel();
    ajustarEscala();
  }

  var pendiente = false;
  function refrescarEnFrame() {
    if (pendiente) return;
    pendiente = true;
    window.requestAnimationFrame(function () {
      pendiente = false;
      refrescar();
    });
  }

  /* =====================================================================
     6. EVENTOS
     ===================================================================== */

  function conectarEventos() {
    hoja.addEventListener("input", recalcular);
    hoja.addEventListener("change", recalcular);

    /* En pantallas angostas: al tocar un campo se amplía la hoja para poder
       escribir cómodamente; al salir del formulario vuelve a la vista completa. */
    hoja.addEventListener("focusin", function (e) {
      if (!e.target || (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA")) return;
      if (escalaBase < CONFIG.escalaLlenado && !enModoLlenado) {
        enModoLlenado = true;
        ajustarEscala();
      }
      var objetivo = e.target;
      window.setTimeout(function () {
        if (objetivo.scrollIntoView) {
          objetivo.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        }
      }, 80);
    });

    hoja.addEventListener("focusout", function () {
      window.setTimeout(function () {
        var activo = document.activeElement;
        if (enModoLlenado && (!activo || !hoja.contains(activo))) {
          enModoLlenado = false;
          ajustarEscala();
        }
      }, 0);
    });

    document.getElementById("btn-imprimir").addEventListener("click", function () {
      window.print();
    });

    document.getElementById("btn-limpiar").addEventListener("click", function () {
      if (!window.confirm(CONFIG.mensajes.limpiar)) return;
      var campos = hoja.querySelectorAll("input, textarea");
      for (var i = 0; i < campos.length; i++) campos[i].value = "";
      enModoLlenado = false;
      recalcular();
      refrescar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("resize", refrescarEnFrame);
    window.addEventListener("orientationchange", refrescarEnFrame);
    window.addEventListener("load", refrescar);

    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(refrescar);
    }
  }

  /* =====================================================================
     7. INICIO
     ===================================================================== */

  function iniciar() {
    hoja = document.getElementById("hoja");
    encuadre = document.getElementById("encuadre");
    escena = document.getElementById("escena");
    zona = document.getElementById("zona-hoja");
    pildora = document.getElementById("pildora-total");

    construir();
    conectarEventos();
    recalcular();
    refrescar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
