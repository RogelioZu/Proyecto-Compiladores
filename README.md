# Conversor a Notación Polaca Prefija

Proyecto de la materia de Compiladores. Convierte una expresión en notación
infija (ej. `(a + b) * c`) a notación polaca prefija (ej. `* + a b c`).

## Cómo funciona

El programa sigue las mismas fases que un compilador:

1. **Análisis léxico** — la cadena se divide en tokens (números, variables,
   operadores y paréntesis).
2. **Análisis sintáctico** — un parser descendente recursivo organiza los
   tokens en un árbol de sintaxis abstracta (AST), respetando la precedencia
   de operadores.
3. **Generación** — el árbol se recorre en preorden (raíz, izquierda,
   derecha), lo que produce directamente la notación prefija.

Soporta: `+`, `-`, `*`, `/`, `^` (potencia, asociativa a la derecha),
paréntesis, menos unario, números decimales y variables.

## Cómo ejecutarlo

```bash
npm install     # instalar TypeScript (solo la primera vez)
npm run build   # compilar src/ → dist/
```

Después abre `index.html` en el navegador.

Durante el desarrollo puedes usar `npm run watch` para que se recompile
automáticamente al guardar.

## Estructura

```
src/analizador.ts   Léxico + parser + generación de la notación prefija
src/main.ts         Conexión con la interfaz (HTML)
index.html          Interfaz
styles.css          Estilos
dist/               JavaScript compilado (lo genera npm run build)
```
