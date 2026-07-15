/**
 * Aufgabe:
 * Übersetzt data-ui-* Attribute in modulinterne Funktionsaufrufe.
 *
 * Abhängigkeiten:
 * - Browser-APIs: document, Element und HTMLElement.
 * - Die erlaubten Handler werden von app.js als explizite Map übergeben.
 *
 * Liefert an:
 * - app.js: registerDelegatedUiEvents(...), das die vier zentralen Listener
 *   registriert. Dadurch funktionieren auch nachträglich gerenderte Elemente,
 *   ohne globale window-Funktionen oder Inline-Handler zu benötigen.
 */

export function splitUiActionStatements(expression) {
    const statements = [];
    let current = "";
    let quote = "";
    let depth = 0;

    for (const character of expression) {
        if (quote !== "") {
            current += character;
            if (character === quote && current.at(-2) !== "\\") quote = "";
            continue;
        }
        if (character === "'" || character === '"') { quote = character; current += character; continue; }
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
        if (character === ";" && depth === 0) {
            if (current.trim() !== "") statements.push(current.trim());
            current = "";
            continue;
        }
        current += character;
    }
    if (current.trim() !== "") statements.push(current.trim());
    return statements;
}

function splitUiActionArguments(argumentText) {
    if (argumentText.trim() === "") return [];
    const argumentsList = [];
    let current = "";
    let quote = "";
    let depth = 0;

    for (const character of argumentText) {
        if (quote !== "") {
            current += character;
            if (character === quote && current.at(-2) !== "\\") quote = "";
            continue;
        }
        if (character === "'" || character === '"') { quote = character; current += character; continue; }
        if (character === "(" || character === "[") depth += 1;
        if (character === ")" || character === "]") depth -= 1;
        if (character === "," && depth === 0) {
            argumentsList.push(current.trim());
            current = "";
            continue;
        }
        current += character;
    }
    argumentsList.push(current.trim());
    return argumentsList;
}

function parseUiActionArgument(token, event, element) {
    if (token === "event") return event;
    if (token === "this") return element;
    if (token === "this.value") return element.value;
    if (token === "this.checked") return element.checked;
    if (token === "true") return true;
    if (token === "false") return false;
    if (token === "null") return null;
    if (token === "undefined") return undefined;
    if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
    if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
        return token.slice(1, -1).replace(/\\(['"\\])/g, "$1");
    }
    throw new Error(`Nicht unterstütztes UI-Aktionsargument: ${token}`);
}

function runUiActionExpression(expression, event, element, handlers) {
    for (const statement of splitUiActionStatements(expression)) {
        if (statement === "event.stopPropagation()") { event.stopPropagation(); continue; }
        if (statement === "event.preventDefault()") { event.preventDefault(); continue; }

        const match = statement.match(/^([A-Za-z_$][\w$]*)\((.*)\)$/s);
        if (match === null) throw new Error(`Ungültige UI-Aktion: ${statement}`);
        const handler = handlers[match[1]];
        if (typeof handler !== "function") throw new Error(`Unbekannte UI-Aktion: ${match[1]}`);
        const args = splitUiActionArguments(match[2]).map(token => parseUiActionArgument(token, event, element));
        handler(...args);
    }
}

export function registerDelegatedUiEvents({ handlers, eventTypes }) {
    const frozenHandlers = Object.freeze({ ...handlers });

    for (const eventType of eventTypes) {
        document.addEventListener(eventType, event => {
            if (!(event.target instanceof Element)) return;
            const attributeName = `data-ui-${event.type}`;
            const element = event.target.closest(`[${attributeName}]`);
            if (!(element instanceof HTMLElement) || !element.hasAttribute(attributeName)) return;
            runUiActionExpression(element.getAttribute(attributeName) || "", event, element, frozenHandlers);
        });
    }
}
