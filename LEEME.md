# Mis gastos COP · versión con cortes

La aplicación es una PWA: se instala desde el navegador, funciona sin Python en el celular y guarda los registros localmente en ese dispositivo. Los datos no se envían a un servidor.

## Qué cambió

- Los gastos se organizan en cortes del **día 15 al día 14 del mes siguiente**, incluidos ambos días.
- Cada corte se identifica como **Mes 1, Mes 2, Mes 3…**, tomando como Mes 1 el corte más antiguo que tenga un gasto. Si importas registros históricos más antiguos, la numeración se ajusta cronológicamente.
- El selector permite saltar directamente a **Mes 1**, **Mes 2**, etc. Los botones anterior/siguiente también recorren los cortes.
- La pantalla destaca el total del corte seleccionado y muestra aparte el total general y el número de movimientos.
- **Importar gastos del Excel anterior** agrega registros al historial actual sin borrar los datos del teléfono. Los archivos que se vuelvan a importar no crean filas duplicadas.
- **Excel de este corte** descarga solo el mes seleccionado e incluye su resumen y total.
- **Todo + resumen** descarga todos los gastos y una hoja aparte con el total de cada corte y el total histórico.
- Al actualizar la app no se importa ningún archivo: los gastos de la PWA se conservan automáticamente en el almacenamiento local del mismo teléfono/navegador y se clasifican por la fecha ya guardada.

## Importar el Excel de la versión de PC

La importación es solo para trasladar los datos del programa de PC por primera vez. No se necesita para actualizar la PWA ni para consultar los gastos que ya estaban registrados en ese mismo teléfono.

1. En el computador, conserva una copia intacta de `gastos.xlsx`.
2. Transfiere ese Excel al celular, por ejemplo mediante cable USB, Drive, OneDrive o correo.
3. Abre la PWA instalada en el teléfono y entra a **Importar gastos del Excel anterior**.
4. Selecciona el archivo `.xlsx` que transferiste.
5. Revisa el número de filas que se van a importar. La aplicación usa `ID`, `Valor (COP)` y `Descripción`; también entiende una columna `Fecha` si el libro la tiene.
6. Si el Excel tiene una columna `Fecha`, cada gasto se asignará automáticamente a su corte. El Excel de escritorio original no guardaba fechas: las filas sin fecha usan hoy como valor sugerido. Si necesitas repartir esos gastos históricos entre varios cortes, agrega una columna `Fecha` con la fecha de cada compra antes de importar.
7. Confirma que aparecen en el corte esperado y que los totales coinciden. La importación añade datos y no reemplaza el historial existente.

Si repites la importación del mismo libro, los registros identificados con el mismo ID, valor y descripción se omiten. Los ID nuevos en la aplicación se generan automáticamente para evitar choques con registros que ya existían en el teléfono.

## Publicar la actualización en GitHub Pages

La carpeta publicada debe incluir estos cinco archivos: `index.html`, `app.js`, `manifest.webmanifest`, `sw.js` e `icon.svg`. No subas `gastos.xlsx` ni ningún Excel con información personal.

1. Sube `index.html`, `app.js`, `sw.js` y `LEEME.md` actualizados a la rama publicada. Conserva `manifest.webmanifest` e `icon.svg`.
2. Espera a que termine el despliegue de GitHub Pages.
3. En el celular, conecta internet, cierra la app y vuelve a abrirla para que el service worker cargue los archivos nuevos.
4. Si aún aparece la interfaz anterior, abre el sitio en el navegador y recarga. No borres los datos del navegador.

La app mantiene la misma clave de almacenamiento local (`gastos-cop-v1`) y el mismo origen web, por eso las actualizaciones normales no requieren importación. No borres los datos del navegador ni desinstales la PWA antes de confirmar que el historial sigue disponible y de guardar un respaldo.

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
