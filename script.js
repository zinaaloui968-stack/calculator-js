const display = document.getElementById("display");

const historyList = document.getElementById("history-list");

const clearHistoryBtn = document.getElementById("clear-history");

const buttons = document.querySelector(".buttons");

buttons.addEventListener("click", function(event) {
    console.log("Un bouton a été cliqué");
});
const OPERATORS = ["+", "-", "×", "÷", "%"];
const STORAGE_KEY = "calculatrice-historique";
let justEvaluated = false;
let history = loadHistory();

/* ---------- Historique ---------- */
function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
        /* stockage indisponible : l'historique reste en mémoire */
    }
}

function renderHistory() {
    historyList.innerHTML = "";

    if (history.length === 0) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "Aucune opération";
        historyList.appendChild(li);
        return;
    }

    // Les plus récentes en haut
    [...history].reverse().forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = `${entry.expression} = ${entry.result}`;
        li.title = "Cliquer pour réutiliser le résultat";
        li.addEventListener("click", () => {
            display.value = entry.result;
            justEvaluated = true;
        });
        historyList.appendChild(li);
    });
}

function addToHistory(expression, result) {
    history.push({ expression, result });
    saveHistory();
    renderHistory();
}

clearHistoryBtn.addEventListener("click", () => {
    history = [];
    saveHistory();
    renderHistory();
});

/* ---------- Calculatrice ---------- */
function append(value) {
    const isOp = OPERATORS.includes(value);
    const last = display.value.slice(-1);

    if (justEvaluated && !isOp) display.value = "0";
    justEvaluated = false;

    if (display.value === "0" && !isOp && value !== ".") {
        display.value = value;
        return;
    }
    // Remplace l'opérateur précédent au lieu d'en empiler deux
    if (isOp && OPERATORS.includes(last)) {
        display.value = display.value.slice(0, -1) + value;
        return;
    }
    // Un seul point par nombre
    if (value === ".") {
        const currentNumber = display.value.split(/[+\-×÷%]/).pop();
        if (currentNumber.includes(".")) return;
    }
    display.value += value;
}

function calculate() {
    // Expression telle qu'affichée, sans opérateur final éventuel
    const shownExpression = display.value.replace(/[+\-×÷]+$/, "");

    let expr = shownExpression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    try {
        // Sécurité : seuls chiffres, opérateurs et parenthèses sont autorisés
        if (!/^[\d+\-*/().\s]+$/.test(expr)) throw new Error("invalide");
        const result = Function(`"use strict"; return (${expr})`)();
        if (!isFinite(result)) throw new Error("division par zéro");

        const resultText = String(parseFloat(result.toFixed(10)));
        display.value = resultText;

        // On n'enregistre que les vrais calculs (pas un simple nombre)
        if (shownExpression !== resultText) {
            addToHistory(shownExpression, resultText);
        }
    } catch {
        display.value = "Erreur";
    }
    justEvaluated = true;
}

document.querySelector(".buttons").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (display.value === "Erreur") display.value = "0";

    const { value, action } = btn.dataset;
    if (value) append(value);
    else if (action === "clear") display.value = "0";
    else if (action === "delete") display.value = display.value.slice(0, -1) || "0";
    else if (action === "equal") calculate();
});

renderHistory();
