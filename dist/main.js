"use strict";
/*
 * main.ts
 * Conecta el analizador con la interfaz (HTML).
 */
const campoEntrada = document.getElementById("entrada");
const botonConvertir = document.getElementById("convertir");
const panelResultado = document.getElementById("resultado");
const salidaPrefija = document.getElementById("salida-prefija");
const salidaSubfija = document.getElementById("salida-sufija");
const listaTokens = document.getElementById("lista-tokens");
const mensajeError = document.getElementById("error");
function convertir() {
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
        const resultado = convertirExpresion(expresion);
        salidaPrefija.textContent = resultado.prefija;
        salidaSubfija.textContent = resultado.sufija;
        // Mostrar los tokens que encontró el análisis léxico
        for (const token of resultado.tokens) {
            const etiqueta = document.createElement("span");
            etiqueta.className = "token token-" + token.tipo.toLowerCase();
            etiqueta.textContent = token.valor;
            etiqueta.title = token.tipo;
            listaTokens.appendChild(etiqueta);
        }
        panelResultado.hidden = false;
    }
    catch (error) {
        mostrarError(error.message);
    }
}
function mostrarError(mensaje) {
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
