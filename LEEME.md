# Mis gastos COP · versión con cortes

La aplicación es una PWA: se instala desde el navegador, funciona sin Python en el celular y guarda los registros localmente en ese dispositivo. Los datos no se envían a un servidor.

## Qué cambió

- Los gastos se organizan en cortes del **día 15 al día 14 del mes siguiente**, incluidos ambos días.
- Cada corte se identifica como **Mes 1, Mes 2, Mes 3…**, tomando como Mes 1 el corte más antiguo que tenga un gasto. Si importas registros históricos más antiguos, la numeración se ajusta cronológicamente.
- Los controles **Anterior** y **Siguiente** permiten consultar cada corte y su total.
- **Importar gastos del Excel anterior** agrega registros al historial actual sin borrar los datos del teléfono. Los archivos que se vuelvan a importar no crean filas duplicadas.
- El Excel descargado incluye la fecha y el número del corte.
- Los registros ya guardados por la versión anterior de esta PWA permanecen en el mismo almacenamiento del navegador.

## Importar el Excel de la versión de PC

1. En el computador, conserva una copia intacta de `gastos.xlsx`.
2. Transfiere ese Excel al celular, por ejemplo mediante cable USB, Drive, OneDrive o correo.
3. Abre la PWA instalada en el teléfono y entra a **Importar gastos del Excel anterior**.
4. Selecciona el archivo `.xlsx` que transferiste.
5. Revisa el número de filas que se van a importar. La aplicación usa `ID`, `Valor (COP)` y `Descripción`; también entiende una columna `Fecha` si el libro la tiene.
6. El Excel de escritorio original no guardaba fechas. Para esas filas, elige una fecha representativa del corte al que pertenecen y pulsa **Importar gastos**. Esa fecha se asigna a cada fila antigua que no tenga fecha. Si necesitas repartir los datos en varios cortes, agrega una columna `Fecha` al Excel antes de importarlo y asigna la fecha de cada gasto.
7. Confirma que aparecen en el corte esperado y que los totales coinciden. La importación añade datos y no reemplaza el historial existente.

Si repites la importación del mismo libro, los registros identificados con el mismo ID, valor y descripción se omiten. Los ID nuevos en la aplicación se generan automáticamente para evitar choques con registros que ya existían en el teléfono.

## Publicar la actualización en GitHub Pages

La carpeta publicada debe incluir estos cinco archivos: `index.html`, `app.js`, `manifest.webmanifest`, `sw.js` e `icon.svg`. No subas `gastos.xlsx` ni ningún Excel con información personal.

1. Entra al repositorio de GitHub y abre la carpeta que se publica con GitHub Pages.
2. Reemplaza `index.html` y `sw.js` por los de esta versión. Añade `app.js`; conserva `manifest.webmanifest` e `icon.svg` si son los mismos.
3. Pulsa **Commit changes** para guardar la actualización en la rama configurada para Pages.
4. Espera a que termine la publicación. GitHub Pages debe servir el sitio por HTTPS.
5. En el celular, cierra la app y vuelve a abrirla con internet para que el service worker descargue `app.js` y la versión nueva. Si aún aparece la interfaz anterior, cierra la PWA, vuelve a abrirla después de unos segundos y recarga la página en el navegador.
6. Revisa un gasto de prueba, navega entre cortes y descarga un Excel antes de importar tu libro real.

La app mantiene la misma clave de almacenamiento local (`gastos-cop-v1`) para conservar los gastos existentes. No borres los datos del navegador ni desinstales la PWA antes de confirmar que el historial sigue disponible y de guardar un respaldo.

## Instalar en el celular

### Android

1. Abre el enlace HTTPS de GitHub Pages en Chrome.
2. Abre el menú ⋮ y elige **Instalar app** o **Añadir a pantalla principal**.
3. Confirma y abre el icono **Mis gastos**.

### iPhone

1. Abre el enlace HTTPS de GitHub Pages en Safari.
2. Pulsa **Compartir** y luego **Añadir a pantalla de inicio**.
3. Pulsa **Añadir** y abre el icono creado.

## Datos y respaldos

- Cada teléfono/navegador tiene su propia lista; no hay sincronización automática entre dispositivos.
- Descarga periódicamente el Excel y guarda una copia segura. Borrar los datos del navegador puede borrar los gastos locales.
- El selector de Excel requiere abrir el sitio publicado por HTTPS para su funcionamiento normal como PWA.
