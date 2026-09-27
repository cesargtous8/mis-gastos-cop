# App móvil Mis gastos COP

Esta app está hecha como PWA: se instala desde el navegador, funciona sin instalar Python y guarda sus registros en el almacenamiento local del celular. Crea un archivo Excel `.xlsx` al pulsar **Descargar Excel**. No envía los gastos al sitio web ni requiere que el computador quede encendido.

## Publicarla una vez con GitHub Pages

La instalación tipo app requiere una página segura HTTPS. Una manera gratuita es publicar **solo los cuatro archivos de esta carpeta** con GitHub Pages. No subas el archivo `gastos.xlsx` del computador ni información personal.

1. Inicia sesión o crea una cuenta en GitHub.
2. Crea un repositorio nuevo, por ejemplo `mis-gastos-cop`. Puedes hacerlo público; el repositorio contiene el programa, no los gastos que anotes en tu celular.
3. En el repositorio, usa **Add file > Upload files** y carga `index.html`, `manifest.webmanifest`, `sw.js` e `icon.svg` desde esta carpeta. Pulsa **Commit changes**.
4. En el repositorio abre **Settings > Pages**. En **Build and deployment**, selecciona **Deploy from a branch**; como branch elige `main` y carpeta `/ (root)`, y guarda.
5. Espera a que Pages publique el sitio. La URL tendrá una forma parecida a `https://TU-USUARIO.github.io/mis-gastos-cop/`. En Settings > Pages aparecerá el enlace. GitHub Pages sirve páginas estáticas y permite HTTPS. Instrucciones oficiales: [Quickstart de GitHub Pages](https://docs.github.com/en/pages/quickstart) y [configurar la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Instalar en el celular

### Android

1. Abre el enlace publicado en Chrome.
2. Abre el menú ⋮ y elige **Instalar app** o **Añadir a pantalla principal**.
3. Confirma. Se agrega el icono **Mis gastos** a la pantalla de inicio.

### iPhone

1. Abre el enlace publicado en Safari.
2. Pulsa **Compartir** y elige **Añadir a pantalla de inicio**.
3. Pulsa **Añadir**. Abre luego el icono creado.

## Uso

1. Escribe algo como `Gasté 10.000 en un shampoo` y pulsa **Agregar gasto**.
2. El registro se guarda en el teléfono y aparece en la lista. La descripción conserva las palabras y excluye el monto; el valor queda numérico en COP.
3. Pulsa **Descargar Excel (.xlsx)**. Abre la app Archivos/Descargas del teléfono para encontrar `gastos_AAAA-MM-DD.xlsx`; desde ahí puedes abrirlo con Excel o compartirlo.

## Importante sobre los datos

- Cada teléfono y cada navegador mantienen su propia lista; no se sincroniza con otros dispositivos.
- Exporta el Excel periódicamente y guarda una copia en un lugar seguro. Borrar los datos del navegador puede borrar el historial local.
- Si ya tenías gastos en el archivo Excel del computador, este PWA no los copia automáticamente al celular. Conserva el libro anterior y agrega al nuevo Excel los datos que quieras trasladar.
- Al reinstalar o cambiar de teléfono, la lista local no se transfiere automáticamente. Guarda las descargas de Excel como respaldo.
- Al publicar en un repositorio, sube solo los cuatro archivos de esta carpeta. No agregues el Excel personal.
