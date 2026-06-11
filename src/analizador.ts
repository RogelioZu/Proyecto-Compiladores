/*
 * analizador.ts
 * Convierte una expresión en notación infija (la de toda la vida)
 * a notación polaca prefija.
 *
 * El proceso tiene 3 fases, igual que un compilador real:
 *   1. Análisis léxico:    la cadena se parte en tokens.
 *   2. Análisis sintáctico: los tokens se organizan en un árbol (AST).
 *   3. Generación:          se recorre el árbol en preorden → notación prefija.
 */

// ---------------------------------------------------------------------------
// 1. ANÁLISIS LÉXICO
// ---------------------------------------------------------------------------

type TipoToken = "NUMERO" | "VARIABLE" | "OPERADOR" | "PAREN_IZQ" | "PAREN_DER";

interface Token {
  tipo: TipoToken;
  valor: string;
  posicion: number; // posición en la cadena original, para mensajes de error
}

/** Parte la cadena de entrada en una lista de tokens. */
function analizarLexico(entrada: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < entrada.length) {
    const caracter = entrada[i];

    // Los espacios se ignoran
    if (caracter === " " || caracter === "\t") {
      i++;
      continue;
    }

    // Números (enteros o con punto decimal, ej. 3.14)
    if (esDigito(caracter)) {
      let numero = "";
      const inicio = i;
      while (i < entrada.length && (esDigito(entrada[i]) || entrada[i] === ".")) {
        numero += entrada[i];
        i++;
      }
      tokens.push({ tipo: "NUMERO", valor: numero, posicion: inicio });
      continue;
    }

    // Variables (letras, ej. x, total)
    if (esLetra(caracter)) {
      let nombre = "";
      const inicio = i;
      while (i < entrada.length && (esLetra(entrada[i]) || esDigito(entrada[i]))) {
        nombre += entrada[i];
        i++;
      }
      tokens.push({ tipo: "VARIABLE", valor: nombre, posicion: inicio });
      continue;
    }

    // Operadores y paréntesis
    if ("+-*/^".includes(caracter)) {
      tokens.push({ tipo: "OPERADOR", valor: caracter, posicion: i });
      i++;
      continue;
    }
    if (caracter === "(") {
      tokens.push({ tipo: "PAREN_IZQ", valor: caracter, posicion: i });
      i++;
      continue;
    }
    if (caracter === ")") {
      tokens.push({ tipo: "PAREN_DER", valor: caracter, posicion: i });
      i++;
      continue;
    }

    throw new Error(`Carácter no válido '${caracter}' en la posición ${i + 1}`);
  }

  return tokens;
}

function esDigito(c: string): boolean {
  return c >= "0" && c <= "9";
}

function esLetra(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

// ---------------------------------------------------------------------------
// 2. ANÁLISIS SINTÁCTICO (parser descendente recursivo)
//
// Gramática que reconoce el parser (de menor a mayor precedencia):
//
//   expresion → termino  (('+' | '-') termino)*
//   termino   → potencia (('*' | '/') potencia)*
//   potencia  → unario   ('^' potencia)?          ← asociativa a la derecha
//   unario    → '-' unario | primario
//   primario  → NUMERO | VARIABLE | '(' expresion ')'
// ---------------------------------------------------------------------------

/** Nodo del árbol de sintaxis abstracta (AST). */
interface Nodo {
  valor: string;       // el operador, número o variable
  hijos: Nodo[];       // vacío para hojas, [izq, der] para operadores binarios
}

class Parser {
  private tokens: Token[];
  private actual = 0; // índice del token que estamos viendo

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /** Punto de entrada: analiza toda la expresión y devuelve el árbol. */
  analizar(): Nodo {
    if (this.tokens.length === 0) {
      throw new Error("La expresión está vacía");
    }
    const arbol = this.expresion();
    // Si sobraron tokens, la expresión está mal formada (ej. "2 3")
    if (this.actual < this.tokens.length) {
      const sobrante = this.tokens[this.actual];
      throw new Error(
        `Token inesperado '${sobrante.valor}' en la posición ${sobrante.posicion + 1}`
      );
    }
    return arbol;
  }

  // expresion → termino (('+' | '-') termino)*
  private expresion(): Nodo {
    let nodo = this.termino();
    while (this.coincideOperador("+", "-")) {
      const operador = this.avanzar().valor;
      const derecho = this.termino();
      nodo = { valor: operador, hijos: [nodo, derecho] };
    }
    return nodo;
  }

  // termino → potencia (('*' | '/') potencia)*
  private termino(): Nodo {
    let nodo = this.potencia();
    while (this.coincideOperador("*", "/")) {
      const operador = this.avanzar().valor;
      const derecho = this.potencia();
      nodo = { valor: operador, hijos: [nodo, derecho] };
    }
    return nodo;
  }

  // potencia → unario ('^' potencia)?   (2^3^2 se agrupa como 2^(3^2))
  private potencia(): Nodo {
    const base = this.unario();
    if (this.coincideOperador("^")) {
      const operador = this.avanzar().valor;
      const exponente = this.potencia(); // recursivo: asociativa a la derecha
      return { valor: operador, hijos: [base, exponente] };
    }
    return base;
  }

  // unario → '-' unario | primario   (para el menos de signo, ej. -5)
  private unario(): Nodo {
    if (this.coincideOperador("-")) {
      this.avanzar();
      const operando = this.unario();
      // Lo representamos como (0 - operando) para mantener todo binario
      return { valor: "-", hijos: [{ valor: "0", hijos: [] }, operando] };
    }
    return this.primario();
  }

  // primario → NUMERO | VARIABLE | '(' expresion ')'
  private primario(): Nodo {
    const token = this.verActual();

    if (token === null) {
      throw new Error("La expresión termina de forma inesperada, falta un operando");
    }

    if (token.tipo === "NUMERO" || token.tipo === "VARIABLE") {
      this.avanzar();
      return { valor: token.valor, hijos: [] };
    }

    if (token.tipo === "PAREN_IZQ") {
      this.avanzar(); // consumir '('
      const nodo = this.expresion();
      const cierre = this.verActual();
      if (cierre === null || cierre.tipo !== "PAREN_DER") {
        throw new Error(`Falta cerrar el paréntesis abierto en la posición ${token.posicion + 1}`);
      }
      this.avanzar(); // consumir ')'
      return nodo;
    }

    throw new Error(
      `Se esperaba un número, variable o '(' pero se encontró '${token.valor}' en la posición ${token.posicion + 1}`
    );
  }

  // ---- Métodos auxiliares del parser ----

  /** Devuelve el token actual sin consumirlo (o null si ya no hay). */
  private verActual(): Token | null {
    return this.actual < this.tokens.length ? this.tokens[this.actual] : null;
  }

  /** Consume el token actual y lo devuelve. */
  private avanzar(): Token {
    return this.tokens[this.actual++];
  }

  /** ¿El token actual es alguno de estos operadores? */
  private coincideOperador(...operadores: string[]): boolean {
    const token = this.verActual();
    return token !== null && token.tipo === "OPERADOR" && operadores.includes(token.valor);
  }
}

// ---------------------------------------------------------------------------
// 3. GENERACIÓN: recorrido en preorden del árbol
// ---------------------------------------------------------------------------

/** Recorre el árbol en preorden (raíz, izquierda, derecha) → notación prefija. */
function recorrerPreorden(nodo: Nodo): string {
  if (nodo.hijos.length === 0) {
    return nodo.valor; // hoja: número o variable
  }
  const partes = nodo.hijos.map(recorrerPreorden);
  return nodo.valor + "(" + partes.join(",") + ")";
}

/** Recorre el árbol en postorden (raíz, derecha, izquierda) → notación sufija. */
function recorrerPostorden(nodo: Nodo): string {
  if (nodo.hijos.length === 0) {
    return nodo.valor; 
  }
  const partes = nodo.hijos.map(recorrerPostorden);
  return "(" + partes.join(",") + ")" + nodo.valor;
}

// ---------------------------------------------------------------------------
// Función principal que usa la interfaz
// ---------------------------------------------------------------------------

interface Resultado {
  tokens: Token[];
  prefija: string;
  sufija: string;
}

/** Convierte una expresión infija a notación polaca prefija. */
function convertirExpresion(entrada: string): Resultado {
  const tokens = analizarLexico(entrada);
  const arbol = new Parser(tokens).analizar();
  return { tokens, prefija: recorrerPreorden(arbol), sufija: recorrerPostorden(arbol) };
}
