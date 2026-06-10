/*
 * main.ts
 * Conecta el analizador con la interfaz (HTML).
 */

const campoEntrada = document.getElementById("entrada") as HTMLInputElement;
const botonConvertir = document.getElementById("convertir") as HTMLButtonElement;
const panelResultado = document.getElementById("resultado") as HTMLDivElement;
const salidaPrefija = document.getElementById("salida-prefija") as HTMLParagraphElement;
const listaTokens = document.getElementById("lista-tokens") as HTMLDivElement;
const mensajeError = document.getElementById("error") as HTMLParagraphElement;

function convertir(): void {
  const expresion = campoEntrada.value.trim();

  // Limpiar resultados anteriores
  mensajeError.hidden = true;
  panelResultado.hidden = true;
  listaTokens.innerHTML = "";

  if (expresion === "") {
    mostrarError("Escribe una expresión primero");
    return;
  }

  try {
    const resultado = convertirAPrefija(expresion);

    salidaPrefija.textContent = resultado.prefija;

    // Mostrar los tokens que encontró el análisis léxico
    for (const token of resultado.tokens) {
      const etiqueta = document.createElement("span");
      etiqueta.className = "token token-" + token.tipo.toLowerCase();
      etiqueta.textContent = token.valor;
      etiqueta.title = token.tipo;
      listaTokens.appendChild(etiqueta);
    }

    panelResultado.hidden = false;
  } catch (error) {
    mostrarError((error as Error).message);
  }
}

function mostrarError(mensaje: string): void {
  mensajeError.textContent = "⚠ " + mensaje;
  mensajeError.hidden = false;
}

botonConvertir.addEventListener("click", convertir);

// También convertir al presionar Enter en el campo de texto
campoEntrada.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    convertir();
  }
});
