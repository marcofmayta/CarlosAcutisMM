# Idiomas

La página incluye español, inglés, portugués de Brasil, francés, italiano,
alemán, japonés y coreano. Los diccionarios están incluidos en `translations.js`;
el navegador no envía textos a servicios de traducción.

- `es.json` contiene los textos originales y fija el orden de las claves.
- Los archivos `.txt` contienen las traducciones escritas para cada idioma.
  Cada línea tiene el formato `índice=traducción`; el índice corresponde al
  orden de las claves de `es.json`.
- `tools/build_translations.py` comprueba la cobertura y las variables de cada
  traducción, genera los JSON y reconstruye `translations.js` sin acceder a la red.
- Para compartir un idioma: `index.html?lang=en`, `?lang=pt`, etc.
- `i18n.js` conserva la estructura de la página y cambia textos, metadatos y
  etiquetas de accesibilidad. `script.js` actualiza los textos animados y los
  controles generados cuando recibe `languagechange`.

Los nombres propios, autores y direcciones de sitios se conservan. El selector
traduce los títulos de los videos, pero el audio, los subtítulos disponibles y
las páginas enlazadas dependen de sus proveedores.

Prueba de navegador: abrir `tools/check_i18n.html` desde un servidor local.
Comprueba los ocho idiomas, las etiquetas dinámicas, los controles, la
persistencia, los tamaños de pantalla y la conservación de fotos y videos.
