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
