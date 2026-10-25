# Mis gastos COP · cortes y edición

La aplicación es una PWA: se instala desde el navegador y guarda los registros localmente en el dispositivo. Los datos no se envían a un servidor.

## Cortes, edición y exportación

- Los cortes comprenden del **15 al 14 del mes siguiente**, incluidos ambos días. Cada periodo aparece como **Mes 1, Mes 2…**, en orden cronológico desde el primer corte con gastos.
- El resumen muestra el total del corte seleccionado, el total histórico y el número de movimientos.
- En el corte actual se pueden editar el valor y la descripción. La fecha original permanece para que el gasto no cambie de corte.
- En cortes anteriores se puede corregir la descripción; el valor queda bloqueado para proteger los periodos cerrados.
- **Excel de este corte** descarga los movimientos y el resumen del corte seleccionado.
- **Todo + resumen** descarga el historial completo, el total de cada corte y el total general.
- La función de importar archivos se quitó. Las actualizaciones de esta PWA conservan los datos existentes en el almacenamiento local del mismo navegador y dispositivo; no hay que importar un archivo al actualizar.

## Cómo actualizar la aplicación

1. Publica los archivos actualizados (`index.html`, `app.js` y `sw.js`) en la rama de GitHub Pages.
2. Espera a que GitHub Pages termine el despliegue.
3. En el teléfono, con internet, cierra la aplicación y vuelve a abrirla. Si sigue apareciendo la versión anterior, abre el sitio en el navegador y recárgalo.
4. Comprueba que aparecen los gastos y descarga un Excel como respaldo.

La aplicación conserva la clave local `gastos-cop-v1` y el mismo origen web. No borres los datos del navegador ni desinstales la PWA para actualizarla. Así los registros que ya están en ese teléfono aparecen automáticamente con la nueva versión. Los datos de la versión antigua de escritorio no se transfieren automáticamente: esta versión ya no incluye importación, así que conserva/exporta cualquier historial del PC que todavía necesites antes de dejar de usarlo.

## Instalar en el celular

### Android

1. Abre el sitio publicado por HTTPS en Chrome.
2. Abre el menú ⋮, elige **Instalar app** o **Añadir a pantalla principal** y confirma.

### iPhone

1. Abre el sitio publicado por HTTPS en Safari.
2. Pulsa **Compartir**, elige **Añadir a pantalla de inicio** y confirma.

Cada navegador/dispositivo conserva su propia lista; no hay sincronización entre dispositivos. Descarga respaldos periódicos con cualquiera de los dos botones de exportación.
