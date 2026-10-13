# Formulario de Reconocimiento de Horas Extraordinarias de Labores — CSS

Réplica digital, imprimible y con cálculo automático del formulario oficial de la
**Caja de Seguro Social** (Coordinación Administrativa de Herrera, Panamá).
HTML5 + CSS3 + JavaScript vanilla: sin frameworks, sin CDN, sin internet, sin backend.

## Cómo abrirlo

1. Haz doble clic en `index.html` (Chrome o Edge sobre Windows). Funciona con `file://`,
   offline, y también en el teléfono (misma carpeta, o súbela a cualquier hosting/Drive).
2. **En línea (GitHub Pages):** <https://hazardvx.github.io/horas-extras/> — se abre desde
   cualquier dispositivo con internet. El archivo local sigue siendo el que garantiza uso offline.
3. Llena las 12 filas: hora inicial, hora final y fecha. El **total se calcula solo**
   (solo cuentan las horas antes de las 7:00 a. m. y después de las 3:00 p. m.).
4. Botón **Imprimir** (o Ctrl + P).

## Cómo imprimir (importante)

- Escala: **100 %** · Márgenes: **Ninguno** · Papel: **Carta vertical**.
- Desactiva "Encabezados y pies de página" del navegador.
- Debe salir **UNA sola hoja**, con el formulario ocupando toda la página.
- Solo se imprime el formulario: la barra de botones, las etiquetas de horas por fila,
  los avisos y los íconos de los campos **no se imprimen**.
- Las horas/fechas se imprimen formateadas ("6:30 a. m.", "13 de octubre de 2026"),
  sin íconos ni recortes. La firma del jefe inmediato se pone **a mano en papel**.

## Cambiar el logo

- Coloca tu archivo en `logo/logo.png` (también sirve `.jpg` o `.svg`).
- Si tiene otro nombre, cámbialo en **un solo lugar**: `js/app.js` → `CONFIG.logo`.
- Si el archivo no existe, el formulario sigue funcionando (no aparece imagen rota).

## Cambiar el tamaño de papel (Carta → A4)

En `css/estilos.css` cambia **los dos** valores, que deben coincidir:

```css
:root { --hoja-ancho: 210mm; --hoja-alto: 297mm; }   /* A4 (Carta: 215.9 / 279.4) */
@page  { size: A4 portrait; margin: 0; }             /* antes: Letter portrait   */
```

## Cambiar el horario ordinario

En `js/calculo.js`, arriba de todo:

```js
var HORA_INICIO_REGULAR = "07:00";   /* las horas antes de esta no cuentan */
var HORA_FIN_REGULAR    = "15:00";   /* las horas después de esta no cuentan */
```

## Cambiar textos, número de filas y avisos

Todo lo que se imprime está en `js/app.js` → objeto `CONFIG` (encabezado, título,
párrafo con sus 3 espacios, nota, firma, número de filas, mensajes).
Los textos del original se respetan letra por letra; solo se corrigió
"RECONOCIMEINTO" por "RECONOCIMIENTO".

## Teléfono / pantalla angosta

La vista previa se **escala** para caber en la pantalla (solo en pantalla, nunca al
imprimir). Al tocar un campo la hoja se amplía a 80 % para escribir cómodamente y,
al salir, vuelve a la vista completa. Modo oscuro incluido.

## Pruebas

Abre `tests.html`: ejecuta los casos del cálculo (07:00→15:00 = 0, 05:00→18:00 = 5 h,
22:00→02:00 = 4 h con cruce de medianoche, totales, formato "H h MM min", etc.) y
muestra **OK** o **FALLO** por caso. Debe decir `OK: 19 correctas, 0 con fallo`.

## Estructura

```
horas-extras/
  index.html        formulario (se construye desde js/app.js)
  css/estilos.css   pantalla + @media print + variables de papel
  js/calculo.js     función pura de cálculo (probada por tests.html)
  js/app.js         interfaz, eventos y textos configurables (CONFIG)
  logo/logo.png     sello de la CSS
  tests.html        pruebas del cálculo
  README.md         este archivo
```
