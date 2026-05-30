# Notas

Sistema de notas local inspirado en Evernote para Windows 11.

## Ejecutar en modo app

```powershell
npm install
npm start
```

## Crear instalador para Windows 11

```powershell
npm install
npm run dist
```

El instalador queda en `dist`.

## Publicar una actualizacion

Esta app esta preparada con `electron-updater` para revisar releases de GitHub.

1. Sube el numero de version en `package.json`, por ejemplo de `1.0.1` a `1.0.2`.
2. Crea un commit y subelo a GitHub.
3. Genera y publica el release:

```powershell
$env:GH_TOKEN="TU_TOKEN_DE_GITHUB"
npm run release
```

Para equipos externos, el release debe estar disponible para esos usuarios. Si el repositorio sigue privado, solo podran actualizar quienes tengan permiso para descargar los assets del release.

## Usar como app web instalable

```powershell
npm install
npm run web
```

Abre `http://localhost:4173` en Edge o Chrome y usa la opcion de instalar app del navegador.

## Funciones

- Libretas, notas favoritas y papelera.
- Busqueda por titulo, contenido, libreta y etiquetas.
- Editor enriquecido con negrita, cursiva, listas y citas.
- Guardado automatico en este equipo.
- Exportacion e importacion de respaldo JSON.
