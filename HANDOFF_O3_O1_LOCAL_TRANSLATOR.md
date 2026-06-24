# Referenzdokument: O3/O1-Remediation und lokale Internalisierung des Matt-Pocock-Translators in `pretty-ts-errors`
[INTENT: KONTEXT]

---

## 0. Quellenbasis & Scope-Grenzen
[INTENT: KONTEXT]

**Quellemodus:** `CURRENT_CONTEXT_DEFAULT` mit expliziter externer Referenz auf `https://github.com/mattpocock/ts-error-translator`

**Freigegebenes Source-Bundle:**

- die aktuelle Task-Konversation bis zu diesem Stand
- die bereits geprueften lokalen Repo-Dateien in `pretty-ts-errors`
- die geprueften Web-Fakten zu `mattpocock/ts-error-translator`, `ts-error-translator.vercel.app`, `Decoded`, `dmmulroy/ts-error-translator.nvim` und `synoet/ts-error-translator-proxy`
- die lokal angelegte Upstream-Clone-Referenz in `tmp/ts-error-translator`

**Explizit ausgeschlossen:**

- `.git`
- die Themenbereiche `Y3` und `Y1`
- die spaetere `pnpm`-Migration
- jede autonome Suche ausserhalb der bereits geprueften lokalen Dateien, Web-Fakten und des lokal geklonten Upstream-Repos

**Scope dieses Dokuments:**

- dieses Dokument beschreibt ausschliesslich die O3- und O1-bezogene Zielrichtung
- O3 muss vollstaendig erklaeren, dass Trusted Diagnostic Content aktuell `HTML`- und `WebView`-Surfaces erreicht
- O1 muss vollstaendig erklaeren, dass der volle Fehlertext an einen Drittanbieter abfliessen kann
- O1 muss explizit festhalten, dass die Plain-English-Translator-Logik architektonisch aus Matt Pococks Projekt stammt
- dieses Dokument definiert den korrekten Hand-off fuer eine lokale, first-party Integration des Translators in das Monorepo

**Nicht Ziel dieses Dokuments:**

- keine Umsetzung der Aenderungen selbst
- keine Behandlung von `Y3`/`Y1`
- keine Vollanalyse aller sonstigen externen Links ausserhalb des hier explizit benoetigten Kontexts

---

## 1. Aufgabenuebersicht
[INTENT: KONTEXT]

Dieses Referenzdokument beschreibt den vollstaendigen Hand-off fuer zwei unmittelbar zusammenhaengende Themen in `pretty-ts-errors`:

1. **O3 / Trusted Diagnostic Content erreicht HTML- und WebView-Surfaces**  
   Der aktuelle Rendering-Pfad materialisiert Diagnostic-Inhalte in HTML-Strings, transportiert diese in die Sidebar-WebView und setzt sie dort per `innerHTML` ein. Der korrekte Zielzustand ist ein strikt strukturierter, lokal gerenderter Datenfluss ohne diagnostikgetriebene HTML-Injektion.

2. **O1 / Voller Fehlertext kann an einen Drittanbieter abfliessen**  
   Der aktuelle Translator-Pfad oeffnet `ts-error-translator.vercel.app` und uebergibt den kompletten Fehlertext als URL-Parameter. Der korrekte Zielzustand ist eine lokale Inhouse-Integration der Plain-English-Translator-Logik ohne externe Remote-Verbindung.

Der Zielansatz fuer die O1-Remediation ist **nicht**, ein neues Remote-System zu waehlen, sondern **Matt Pococks Source-basierte Translator-Logik** lokal in das bestehende Monorepo zu uebernehmen, auf den benoetigten Kern zu reduzieren und als internes Package zu betreiben.

Der Zielansatz fuer die O3-Remediation ist **nicht**, die bestehende HTML-String-Pipeline nur leicht zu kaschieren, sondern den Diagnose-zu-UI-Pfad so umzubauen, dass:

- Diagnostic-Daten als strukturierte View-Modelle transportiert werden,
- WebView-Rendering ueber sichere DOM-/`textContent`-Pfade erfolgt,
- keine diagnostikgetriebenen Rohstrings mehr via `innerHTML` in die WebView gelangen,
- und lokale Translator-Daten nicht ueber externe Browser-Links oder Drittanbieter-Surfaces laufen.

Das Dokument ist HCOA-ready und so strukturiert, dass ein neuer Agent in einem frischen Kontextfenster direkt mit der Umsetzung fortfahren kann.

---

## 2. Informationsregister (INHALT-Einheiten)
[INTENT: REFERENZ]

| ID | Typ | Beschreibung | Veraenderung | Status |
|----|-----|-------------|--------------|--------|
| REQ-001 | ANFORDERUNG | O3 muss vollstaendig dokumentieren, dass Trusted Diagnostic Content aktuell `HTML`- und `WebView`-Surfaces erreicht, und wie der sichere Zielzustand aussieht. | Ja | Festgelegt |
| INFO-001 | INFORMATION | Aktueller Repo-Zustand: Remote-Translator-Link, HTML-String-Pipeline und WebView-`innerHTML`-Pfad sind vorhanden. | Nein | Festgestellt |
| REQ-002 | ANFORDERUNG | O1 muss vollstaendig dokumentieren, dass der volle Fehlertext an einen Drittanbieter abfliessen kann, und dass die Translator-Logik architektonisch von Matt Pocock stammt. | Ja | Festgelegt |
| INFO-002 | INFORMATION | Das lokal geklonte Upstream-Repo von Matt Pocock ist ein Monorepo mit `packages/engine`, `packages/parser`, `packages/searcher` und `apps/vscode`. | Nein | Festgestellt |
| REQ-003 | ANFORDERUNG | Das Upstream-Repo muss in `tmp/` im Projekt liegen und als lokale Extraktionsbasis fuer den Folge-Agenten dienen. | Ja | Bereits vorbereitet |
| REQ-004 | ANFORDERUNG | Es duerfen nur die benoetigten Source-Daten uebernommen werden; Upstream-VS-Code-App und unnoetige Pakete duerfen nicht mit eingebunden werden. | Ja | Festgelegt |
| REQ-005 | ANFORDERUNG | Die korrekte Zielverortung im Monorepo ist `packages/`, nicht `apps/`. | Ja | Architektonisch festgelegt |
| REQ-006 | ANFORDERUNG | Es muss ein neues internes Translator-Package mit klarer, first-party API entstehen. | Ja | Architektonisch festgelegt |
| REQ-007 | ANFORDERUNG | Der bestehende Remote-Translator-Pfad muss komplett durch eine lokale Integration ersetzt werden. | Ja | Festgelegt |
| INFO-003 | INFORMATION | 2026 gibt es neuere GitHub-Projekte, aber keinen klar reifen VS-Code-/offline-/enterprise-tauglichen Drop-in-Ersatz fuer diesen Use-Case. | Nein | Festgestellt |
| WF-001 | WORKFLOW | Es gibt eine konkrete empfohlene Umsetzungsreihenfolge fuer Clone, Extraktion, Monorepo-Package, UI-Integration und O3-Haertung. | Ja | Festgelegt |
| CONST-001 | CONSTRAINT | Alle fuer den Translator relevanten Remote-Verbindungen muessen entfernt werden; `Y3` und `Y1` sind aus dem Scope ausgeschlossen. | Nein | Festgelegt |

---

## 3. Informationseinheiten
[INTENT: SPEZIFIKATION]

### 3.1 REQ-001: O3 vollstaendig dokumentieren und sichere Zielarchitektur festlegen
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Das Hand-off muss explizit und vollstaendig dokumentieren, dass Trusted Diagnostic Content aktuell bis in `HTML`- und `WebView`-Surfaces gelangt. Es muss ebenfalls den korrekten Zielzustand beschreiben: Der Diagnose-zu-UI-Pfad darf nicht mehr auf diagnostikgetriebenen HTML-Strings basieren, sondern muss auf einem strukturierten, first-party kontrollierten View-Model- und Safe-Render-Pfad beruhen.

**Ist-Zustand:**

- `apps/vscode-extension/src/diagnostics.ts` erstellt `MarkdownString`-Instanzen und setzt `isTrusted` sowie `supportHtml`.
- `packages/vscode-formatter/src/format/identSentences.ts` materialisiert diagnostiknahe Zeilen in HTML-Fragmenten.
- `packages/vscode-formatter/src/components/plainCodeBlock.ts` und `packages/vscode-formatter/src/components/htmlCodeBlock.ts` bauen HTML-Strings.
- `apps/vscode-extension/src/provider/webviewViewProvider.ts` sammelt `fullHtml` und sendet dieses per `webview.postMessage({ command: "update-content", html: fullHtml })` in die WebView.
- `apps/vscode-extension/webview/index.js` setzt `$content.innerHTML = message.html`.
- `apps/vscode-extension/src/provider/markdownWebviewProvider.ts` aktiviert `enableScripts` und rewritet die CSP in Richtung `unsafe-inline`.

**Soll-Zustand:**

- Keine diagnostikabgeleitete Zeichenkette darf ungeescaped in HTML interpoliert werden.
- Die Sidebar-WebView darf keine diagnostikabgeleiteten Payloads mehr per `innerHTML` einsetzen.
- Der Extension-Host muss strukturierte Datenmodelle erzeugen, zum Beispiel `DiagnosticSidebarModel`, `PlainEnglishTranslation` und `ActionDescriptor`.
- Die WebView muss daraus DOM-Knoten mit `textContent` oder aehnlich sicheren DOM-APIs aufbauen.
- HTML darf nur noch aus internen, vorgegebenen Template-Huellen stammen, nicht aus untrusted Diagnostic Content.
- Hover-/Markdown-Surfaces muessen diagnostikabgeleitete Inhalte nur escaped oder in plain markdown/text transportieren; keine rohen diagnostikgetriebenen HTML-Segmente.

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `apps/vscode-extension/src/diagnostics.ts` | Einstieg des Trusted-Diagnostic-Pfads | `registerOnDidChangeDiagnostics()`, `MarkdownString`, `supportHtml`, `isTrusted` |
| `packages/vscode-formatter/src/format/identSentences.ts` | Baut HTML-nahe Zeilenfragmente aus Diagnoseinhalt | `identSentences()` |
| `packages/vscode-formatter/src/components/plainCodeBlock.ts` | Interpoliert Content in HTML | `plainCodeBlock()` |
| `packages/vscode-formatter/src/components/htmlCodeBlock.ts` | Baut HTML fuer Sidebar-Codebloecke | `htmlCodeBlock()` |
| `apps/vscode-extension/src/provider/webviewViewProvider.ts` | Transportiert `fullHtml` in die WebView | `refresh()` |
| `apps/vscode-extension/webview/index.js` | Setzt HTML tatsaechlich in die DOM-Surface ein | `window.addEventListener("message", ...)`, `innerHTML` |
| `apps/vscode-extension/src/provider/markdownWebviewProvider.ts` | Aktiviert WebView-Capabilities und CSP-Rewrite | `getWebviewOptions()`, `patchCspSafeAttrs()` |

**Positivbeispiel(e):**

```ts
type PlainEnglishTranslation = {
  code: number;
  rawError: string;
  body: string | null;
};

type DiagnosticSidebarModel = {
  originalMessage: string;
  translations: PlainEnglishTranslation[];
  actions: Array<{ kind: 'copy' | 'pin' | 'reveal' | 'showTranslation' }>;
};
```

```js
const paragraph = document.createElement("p");
paragraph.textContent = model.originalMessage;
container.appendChild(paragraph);
```

**Negativbeispiel(e):**

```ts
const fullHtml = sections.join("");
webview.postMessage({ command: "update-content", html: fullHtml });
```

```js
$content.innerHTML = message.html;
```

**Warum falsch:**
Die beiden Muster transportieren und materialisieren diagnostikabgeleitete HTML-Strings direkt in die WebView-Surface. Genau das ist der O3-Pfad, der entfernt werden muss.

---

### 3.2 INFO-001: Aktueller Repo-Zustand fuer O3 und O1
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
Der aktuelle Repo-Zustand kombiniert zwei Problemfelder:

1. Der Translator fuer "plain English" ist nicht lokal integriert, sondern nur als externer Link vorhanden.
2. Die bestehende Sidebar-/Hover-Render-Pipeline arbeitet mit trusted HTML-/Markdown-Surfaces und einer WebView-`innerHTML`-Materialisierung.

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `packages/vscode-formatter/src/components/actions.ts` | enthaelt den externen Translator-Link | `errorMessageTranslationLink()` |
| `packages/vscode-formatter/package.json` | zeigt aktuelle lokale Translator-Abhaengigkeit | `lz-string` |
| `apps/vscode-extension/src/diagnostics.ts` | trusted Markdown-Pfad | `MarkdownString`, `supportHtml`, `isTrusted` |
| `apps/vscode-extension/src/provider/webviewViewProvider.ts` | HTML-Transport in WebView | `refresh()` |
| `apps/vscode-extension/webview/index.js` | `innerHTML`-Setzung | `update-content`-Handler |

---

### 3.3 REQ-002: O1-Abfluss des vollen Fehlertexts entfernen und Matt-Pocock-Herkunft festhalten
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Das Hand-off muss vollstaendig dokumentieren, dass aktuell der volle Fehlertext an einen Drittanbieter abfliessen kann. Gleichzeitig muss es explizit festhalten, dass die Translator-Logik fachlich/architektonisch aus Matt Pococks Projekt stammt und lokal uebernommen werden soll, statt weiterhin ueber eine externe gehostete App zu laufen.

**Ist-Zustand:**

- `packages/vscode-formatter/src/components/actions.ts` komprimiert den kompletten `Diagnostic["message"]` mit `lz-string`.
- Danach wird `https://ts-error-translator.vercel.app/?error=...` gebaut.
- Die aktuelle Anwendung nutzt also **keinen lokalen Translator**, sondern nur einen Browser-Link auf eine gehostete Drittanbieter-App.
- Die Idee der Plain-English-Umformung stammt architektonisch von Matt Pococks Projekt `ts-error-translator` / `Total TypeScript`.

**Soll-Zustand:**

- Der Remote-Translator-Link muss vollstaendig entfernt werden.
- Stattdessen muss eine lokale first-party Translator-API verwendet werden.
- Die neue lokale Translator-Funktion muss 100% der aktuell aus Matt Pococks Source uebernehmbaren Uebersetzungsfunktionalitaet bereitstellen.
- Fuer nicht uebersetzte Error-Codes darf **kein** Remote-Fallback existieren. Stattdessen muss lokal angezeigt werden, dass fuer diesen Code keine Plain-English-Translation vorhanden ist.

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `packages/vscode-formatter/src/components/actions.ts` | aktueller O1-Egress-Punkt | `errorMessageTranslationLink()` |
| `packages/vscode-formatter/package.json` | enthaelt `lz-string` fuer den URL-Parameter-Pfad | `dependencies.lz-string` |
| `tmp/ts-error-translator/apps/vscode/src/humaniseDiagnostic.ts` | zeigt, wie Matt lokal Uebersetzungen ausliefert | `humaniseDiagnostic()` |
| `tmp/ts-error-translator/apps/vscode/src/bundleErrors.ts` | zeigt, wie Matt lokale Error-Markdown-Dateien in ein Bundle ueberfuehrt | `bundleErrors()` |

**Positivbeispiel(e):**

```ts
import { translateDiagnosticMessage } from '@pretty-ts-errors/error-translator';

const translations = translateDiagnosticMessage(diagnostic.message);
```

```ts
const actions = [
  { kind: 'showTranslation', diagnosticMessage: diagnostic.message },
];
```

**Negativbeispiel(e):**

```ts
const encodedMessage = compressToEncodedURIComponent(message);
return `https://ts-error-translator.vercel.app/?error=${encodedMessage}`;
```

**Warum falsch:**
Dieses Muster uebergibt den kompletten Fehlertext an einen externen Web-Dienst und verletzt damit die Null-Remote-Vorgabe fuer den Translator-Pfad.

**Wichtiger Zusatzhinweis:**
Im gleichen Action-Bereich existiert zusaetzlich ein externer Link zu `typescript.tv`. Dieser ist **nicht** der O1-Translator-Pfad, bleibt aber eine weitere externe Surface. Wenn "alle externen Remote-Verbindungen" wortwoertlich gilt, muss dieser Link gesondert mitentschieden werden.

---

### 3.4 INFO-002: Upstream-Struktur des Matt-Pocock-Repos
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
Das lokal geklonte Upstream-Repo `tmp/ts-error-translator` ist ein Monorepo mit einer klaren Trennung zwischen Engine, Parser/Tips, Search-Utility und VS-Code-App:

- `packages/engine`  
  Kern fuer Error-Matching und Plain-English-Translation
- `packages/parser`  
  Tips-/Syntax-/Education-Parser, nicht der Kern der Error-Translation
- `packages/searcher`  
  Utility fuer Tip-Suche in Codebasen, nicht der Kern der Error-Translation
- `apps/vscode`  
  Matts eigene VS-Code-Extension mit Hover-/Diagnostic-Integration

Zusatzfakten aus dem Clone:

- `packages/engine/errors/*.md` enthaelt aktuell **67** kuratierte Error-Translation-Dateien
- `packages/engine/src/tsErrorMessages.json` enthaelt das groessere Diagnostic-Matching-Register
- `apps/vscode/src/humaniseDiagnostic.ts` zeigt die lokale Verwendung des Engines plus `bundleErrors.json`

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `tmp/ts-error-translator/package.json` | Upstream-Monorepo-Root | `workspaces`, Scripts |
| `tmp/ts-error-translator/packages/engine/package.json` | Kernpackage fuer Error-Translation | Package-Name, Dependencies |
| `tmp/ts-error-translator/packages/parser/package.json` | Tip-Parser, fuer O1 nicht zwingend notwendig | Package-Name |
| `tmp/ts-error-translator/packages/searcher/package.json` | Tip-Suche, fuer O1 nicht zwingend notwendig | Package-Name |
| `tmp/ts-error-translator/apps/vscode/package.json` | volle Upstream-VS-Code-App | `displayName`, Scripts |
| `tmp/ts-error-translator/packages/engine/errors/*.md` | kuratierte Translationen | 67 Markdown-Dateien |

---

### 3.5 REQ-003: Upstream-Clone in `tmp/` als lokale Extraktionsbasis verwenden
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Das Upstream-Repo muss im Projekt unter `tmp/` liegen, damit der Folge-Agent die reale Source-Struktur lokal referenzieren und daraus die benoetigten Teile extrahieren kann. Dieses `tmp/`-Verzeichnis ist **Analyse-/Extraktionsbasis**, nicht Ziel des Runtime-Produkts.

**Ist-Zustand:**

- Das Repo wurde lokal geklont nach `tmp/ts-error-translator`.
- Der Clone ist bereits im Workspace vorhanden und kann vom Folge-Agenten direkt gelesen werden.

**Soll-Zustand:**

- Der Clone bleibt als lokale Referenz erhalten, bis die benoetigten Quellen in ein first-party Package uebernommen wurden.
- Der Folge-Agent darf den Clone fuer Dateivergleiche, Datenuebernahme und Attributionsarbeit benutzen.
- Der Clone darf **nicht** als Runtime-Abhaengigkeit, Git-Submodule oder finaler Shipping-Ort verwendet werden.

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `tmp/ts-error-translator/` | lokale Upstream-Quelle | gesamtes Upstream-Repo |

**Positivbeispiel(e):**

```powershell
git clone "https://github.com/mattpocock/ts-error-translator.git" "tmp/ts-error-translator"
```

**Negativbeispiel(e):**

```text
Remote-Translator weiter ueber Browser-Link verwenden und gar keinen lokalen Source-Clone anlegen.
```

**Warum falsch:**
Ohne lokalen Clone gibt es keine first-party kontrollierte Extraktionsbasis. Der ganze Zweck der Inhouse-Integration waere dann verfehlt.

---

### 3.6 REQ-004: Nur benoetigte Source-Daten uebernehmen, nicht die komplette Upstream-App
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Es duerfen nur die Teile von Matt Pococks Repo uebernommen werden, die fuer die lokale Plain-English-Translation wirklich benoetigt werden. Die komplette Upstream-VS-Code-App, das Tip-System und sonstige Release-/Workspace-Infrastruktur duerfen nicht mit in das Zielpaket wandern.

**Ist-Zustand:**

- Upstream enthaelt neben der Translation-Engine auch eine VS-Code-App und Tip-/Search-Pakete.
- Die aktuelle Zielanwendung `pretty-ts-errors` benoetigt fuer O1 nur die lokale Translator-Funktionalitaet, nicht Matts gesamtes Produkt.

**Soll-Zustand:**

**Zu uebernehmen:**

- `tmp/ts-error-translator/packages/engine/src/parseErrors.ts`
- `tmp/ts-error-translator/packages/engine/src/tsErrorMessages.json`
- `tmp/ts-error-translator/packages/engine/errors/*.md`
- die in `tmp/ts-error-translator/apps/vscode/src/bundleErrors.ts` erkennbare Bundling-Idee, jedoch nur als lokale Build-/Sync-Mechanik
- die in `tmp/ts-error-translator/apps/vscode/src/humaniseDiagnostic.ts` erkennbare Verwendungslogik als Integrationsreferenz

**Nicht zu uebernehmen:**

- `tmp/ts-error-translator/apps/vscode/*` als ganze App
- `tmp/ts-error-translator/packages/parser/*`
- `tmp/ts-error-translator/packages/searcher/*`
- Husky-/Changesets-/Turbo-/Release-Scaffolding aus dem Upstream-Root
- externe "request translation"- oder Web-Link-Fallbacks

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `tmp/ts-error-translator/packages/engine/src/parseErrors.ts` | Kern-Matching | `parseErrors()`, `parseErrorsWithDb()` |
| `tmp/ts-error-translator/packages/engine/src/tsErrorMessages.json` | TypeScript-Diagnostic-Matching-DB | Diagnostic-Text -> Code |
| `tmp/ts-error-translator/packages/engine/errors/*.md` | kuratierte Plain-English-Source-Daten | 67 Markdown-Dateien |
| `tmp/ts-error-translator/apps/vscode/src/bundleErrors.ts` | Build-Idee fuer lokales Bundle | `bundleErrors()` |
| `tmp/ts-error-translator/apps/vscode/src/humaniseDiagnostic.ts` | Referenz fuer lokale Usage | `humaniseDiagnostic()` |

**Positivbeispiel(e):**

```text
Lokales Zielpaket = Engine-Matching + Translation-Content + first-party Adapter.
Nicht Ziel = Matts komplette VS-Code-Extension.
```

**Negativbeispiel(e):**

```text
Das komplette Verzeichnis tmp/ts-error-translator/apps/vscode in apps/ oder packages/ kopieren und als Bestandteil des Produkts shippen.
```

**Warum falsch:**
Das waere keine gezielte Source-Uebernahme, sondern ein unnnoetiges Mitschleppen von Produktteilen, die `pretty-ts-errors` nicht braucht.

**Wichtiger Vollstaendigkeits-Hinweis:**
Die aktuelle Upstream-Coverage fuer Plain-English-Translation besteht aus **67** kuratierten Markdown-Dateien. "100% Funktionalitaet" bedeutet hier: **100% Paritaet zur aktuell vorhandenen Matt-Pocock-Translation-Coverage**, nicht 100% aller denkbaren TypeScript-Fehlercodes.

---

### 3.7 REQ-005: Die korrekte Zielverortung ist `packages/`, nicht `apps/`
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Die Frage `packages` oder `apps` ist fuer dieses Vorhaben architektonisch zu entscheiden. Die korrekte Zielverortung ist **`packages/`**, weil der Translator ein wiederverwendbares first-party Library-/Engine-Stueck ist und keine eigenstaendige App.

**Ist-Zustand:**

- `pretty-ts-errors` trennt bereits zwischen wiederverwendbaren Libraries in `packages/*` und der VS-Code-Extension in `apps/vscode-extension`.
- Es existiert noch kein internes Translator-Package.

**Soll-Zustand:**

- Neues Zielpaket unter `packages/error-translator/`
- Paketname: `@pretty-ts-errors/error-translator`
- Konsumenten:
  - primaer `packages/vscode-formatter`
  - indirekt `apps/vscode-extension` ueber den bereits vorhandenen Formatter-/Sidebar-Pfad

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `package.json` | bestaetigt Monorepo-Workspaces | `"workspaces": ["packages/*", "apps/*"]` |
| `packages/` | Ort fuer Libraries | vorhandene interne Packages |
| `apps/vscode-extension/` | Ort der Produkt-App, nicht des wiederverwendbaren Translators | Extension-App |
| `packages/error-translator/` | empfohlener Zielort | neu anzulegen |

**Positivbeispiel(e):**

```json
{
  "name": "@pretty-ts-errors/error-translator",
  "private": true
}
```

**Negativbeispiel(e):**

```text
apps/translator/
apps/plain-english-translator/
```

**Warum falsch:**
Eine `apps/`-Verortung macht aus der Translator-Logik ein eigenes Produktartefakt. Hier wird aber ein first-party, wiederverwendbares Monorepo-Library-Package benoetigt.

---

### 3.8 REQ-006: Neues internes Translator-Package mit klarer first-party API aufbauen
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Es muss ein lokales Package entstehen, das Matts Translator-Logik als first-party API bereitstellt. Dieses Package darf keine Runtime-Netzwerkzugriffe und keine Runtime-Dateisystemabhaengigkeit benoetigen.

**Ist-Zustand:**

- Kein internes Translator-Package vorhanden
- Kein lokaler Plain-English-API-Vertrag vorhanden

**Soll-Zustand:**

**Empfohlene Zielstruktur:**

```text
packages/error-translator/
  package.json
  README.md
  src/
    index.ts
    parseErrors.ts
    translateDiagnosticMessage.ts
    generated/
      tsErrorMessages.json
      bundleErrors.json
  vendor/
    matt-pocock/
      errors/
        *.md
  test/
    translator.vitest.ts
```

**Empfohlener API-Vertrag:**

```ts
export interface ParsedError {
  code: number;
  error: string;
  rawError: string;
  items: Array<string | number>;
}

export interface PlainEnglishTranslation {
  code: number;
  rawError: string;
  body: string | null;
}

export function parseDiagnosticMessage(message: string): ParsedError[];
export function translateDiagnosticMessage(message: string): PlainEnglishTranslation[];
export function hasTranslation(code: number): boolean;
```

**Architekturregeln fuer das Paket:**

- keine Runtime-`fetch`-Aufrufe
- kein Runtime-`fs.readFileSync()` fuer Translationen
- statisches, eingechecktes Datenbundle fuer die Laufzeit
- rohe Upstream-Markdown-Dateien duerfen als Vendor-/Attributions-Quelle liegen bleiben

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `packages/error-translator/package.json` | neues internes Package | neu anzulegen |
| `packages/error-translator/src/index.ts` | oeffentliche API | neu anzulegen |
| `packages/error-translator/src/parseErrors.ts` | Engine-Matching | neu anzulegen |
| `packages/error-translator/src/translateDiagnosticMessage.ts` | Plain-English-Adapter | neu anzulegen |
| `packages/error-translator/src/generated/tsErrorMessages.json` | statische Matching-DB | neu anzulegen |
| `packages/error-translator/src/generated/bundleErrors.json` | statische Translation-DB | neu anzulegen |
| `packages/error-translator/vendor/matt-pocock/errors/` | rohe Upstream-Quellen | neu anzulegen |

**Positivbeispiel(e):**

```ts
import { parseErrors } from './parseErrors';
import bundleErrors from './generated/bundleErrors.json';

export function translateDiagnosticMessage(message: string) {
  return parseErrors(message).map((error) => ({
    code: error.code,
    rawError: error.parseInfo.rawError,
    body: bundleErrors[String(error.code)]?.body ?? null,
  }));
}
```

**Negativbeispiel(e):**

```ts
export function translate(message: string) {
  return fetch(`https://ts-error-translator.vercel.app/?error=${message}`);
}
```

```ts
const fileResult = fs.readFileSync(file, 'utf8');
```

**Warum falsch:**
Der erste Fall fuehrt die Remote-Abhaengigkeit wieder ein. Der zweite Fall macht die Laufzeit von Dateisystem-Zugriffen abhaengig, obwohl das Zielpaket fuer first-party, statische Monorepo-Nutzung gedacht ist.

---

### 3.9 REQ-007: Remote-Translator in `pretty-ts-errors` komplett durch lokale Integration ersetzen
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Der bestehende Remote-Translator muss komplett verschwinden. Die bestehende UI soll weiterhin Plain-English-Funktionalitaet anbieten, aber ueber lokale Engine-Daten, lokale Commands und lokale WebView-/Sidebar-Ausgabe.

**Ist-Zustand:**

- `packages/vscode-formatter/src/components/actions.ts` baut einen externen Translator-Link.
- `packages/vscode-formatter` haengt fuer diesen Pfad aktuell an `lz-string`.
- `apps/vscode-extension` hat keinen lokalen Command fuer "show plain English translation".

**Soll-Zustand:**

- `packages/vscode-formatter` verwendet `@pretty-ts-errors/error-translator`
- der externe Translator-Link wird ersetzt durch eine lokale Action/Command
- empfohlene UX:
  - Hover behaelt einen Action-Button
  - der Button oeffnet **nicht** den Browser
  - der Button routet in die bestehende Sidebar / denselben lokal kontrollierten Surface-Pfad
  - die Sidebar rendert die lokale Plain-English-Translation unter oder neben dem Originalfehler
- `lz-string` kann entfernt werden, wenn kein anderer Codepfad es mehr braucht

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `packages/vscode-formatter/src/components/actions.ts` | aktueller Remote-Link und neuer lokaler Action-Punkt | `errorMessageTranslationLink()` |
| `packages/vscode-formatter/package.json` | Abhaengigkeit auf `lz-string` und neue interne Package-Abhaengigkeit | `dependencies` |
| `packages/vscode-formatter/src/format/prettifyDiagnosticForSidebar.ts` | lokaler Sidebar-Integrationspunkt | `prettifyDiagnosticForSidebar()` |
| `packages/vscode-formatter/src/format/prettifyDiagnosticForHover.ts` | Hover-Aktionspunkt | `prettifyDiagnosticForHover()` |
| `apps/vscode-extension/src/extension.ts` | neuer Command-Registrierungspunkt | `activate()` |
| `apps/vscode-extension/src/provider/webviewViewProvider.ts` | Sidebar-State und lokale Translation-Ansicht | `lockToDiagnostic()`, `refresh()` |

**Positivbeispiel(e):**

```ts
export const showPlainEnglishTranslationLink = (range: Range, message: string) => {
  const args = encodeURIComponent(JSON.stringify([range, message]));
  return `command:prettyTsErrors.showPlainEnglishTranslation?${args}`;
};
```

```ts
const translations = translateDiagnosticMessage(diagnostic.message);
```

**Negativbeispiel(e):**

```ts
return d /*html*/ `
  <a title="See translation" href="https://ts-error-translator.vercel.app/?error=${encodedMessage}">
```

**Warum falsch:**
Damit bleibt der aktuelle Browser-/Drittanbieter-Pfad bestehen und O1 waere nicht remediiert.

---

### 3.10 INFO-003: 2026-Alternativen sind fuer diesen Use-Case keine bessere Zielbasis
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
Es wurden 2026-er Kandidaten geprueft, aber keiner ist fuer diesen speziellen Use-Case ein besserer Zielpfad als die lokale Uebernahme von Matt Pococks Engine-Daten:

- `imsesayflisl-design/Decoded`  
  aktuell und 2026 aktiv, aber provider-/LLM-/API-basiert und damit nicht passend zur Null-Remote-Vorgabe
- `dmmulroy/ts-error-translator.nvim`  
  lokal/offline und 2026 gepflegt, aber editor-spezifisch fuer Neovim/Lua, nicht VS-Code-zentriert
- `synoet/ts-error-translator-proxy`  
  architektonisch interessant als LSP-Proxy, aber jung, wenig Adoption, kein klarer reifer Standard

**Schlussfolgerung:**
Fuer `pretty-ts-errors` ist die korrekte Richtung eine first-party Package-Internalisierung auf Basis der Matt-Pocock-Source, nicht der Wechsel auf ein anderes Remote- oder fremdes Produktsystem.

---

### 3.11 WF-001: Empfohlene Umsetzungsreihenfolge fuer den Folge-Agenten
[INTENT: SPEZIFIKATION]

**Typ:** WORKFLOW

**Beschreibung:**
Die folgende Reihenfolge minimiert Risiko und haelt O1 und O3 sauber getrennt, ohne den Gesamtzusammenhang zu verlieren.

**Ist-Zustand:**

- der lokale Upstream-Clone liegt vor
- der Bericht dokumentiert die Zielrichtung
- noch keine Code-Integration umgesetzt

**Soll-Zustand:**

1. **Upstream-Referenz einfrieren**  
   Von `tmp/ts-error-translator` nur die benoetigten Engine-/Translation-Teile als lokale Referenz benutzen.

2. **Neues internes Package anlegen**  
   `packages/error-translator/` anlegen und mit first-party API versehen.

3. **Translation-Daten bundlen**  
   Die 67 Markdown-Dateien plus Matching-DB in statische first-party JSON-/Code-Daten ueberfuehren.

4. **Remote-Translator-Link entfernen**  
   In `packages/vscode-formatter/src/components/actions.ts` den externen Vercel-Link loeschen und lokale Command-/Action-Logik einsetzen.

5. **Sidebar lokal verknuepfen**  
   Lokale Translator-Ergebnisse in die bestehende Sidebar fuehren, nicht in den Browser.

6. **O3-Sidebar-Haertung umsetzen**  
   `webview.postMessage({ html })` + `innerHTML` durch strukturierte Modelle + sichere DOM-Renderlogik ersetzen.

7. **Hover-Pfad haerten**  
   Hover-Rendering so umbauen, dass diagnostikabgeleitete Werte escaped bleiben und keine neue HTML-Rohsurface entsteht.

8. **Tests ergaenzen**  
   Translator-API, Bundling-Paritaet, Sidebar-Rendering und O1-Null-Remote-Verhalten abdecken.

9. **Adjazente externe Links pruefen**  
   `typescript.tv` separat nach der globalen "no remote" Policy entscheiden.

**Positivbeispiel(e):**

```text
Clone -> internes Package -> Datenbundle -> lokale UI-Integration -> O3-Haertung -> Tests
```

**Negativbeispiel(e):**

```text
Zuerst die komplette Upstream-VS-Code-App einbauen und spaeter versuchen, unnoetige Teile wieder herauszuscheiden.
```

**Warum falsch:**
Das vergroessert Scope, Risiko und Drift unnnoetig. Das Ziel ist eine gezielte first-party Integration, kein Produkt-Fork der kompletten Upstream-App.

---

### 3.12 CONST-001: Harte Constraints fuer den Folge-Agenten
[INTENT: SPEZIFIKATION]

**Typ:** CONSTRAINT

**Beschreibung:**

- Kein externer Remote-Translator mehr
- Keine Drittanbieter-Fehlertext-Uebergabe mehr
- Keine Uebernahme der kompletten Upstream-VS-Code-App
- Keine Uebernahme von `packages/parser` oder `packages/searcher`, solange fuer Plain-English-Translation nicht zwingend benoetigt
- `Y3` und `Y1` sind explizit aus dem Scope ausgeschlossen
- `packages/` ist der Zielort, nicht `apps/`
- MIT-/Attributions-Pflichten fuer uebernommenen Upstream-Source muessen erhalten bleiben
- Nicht uebersetzte Codes bleiben lokal und duerfen keinen externen Fallback oeffnen

---

## 4. Konventionen & Constraints
[INTENT: CONSTRAINT]

- Das Ziel ist **first-party Integration**, nicht Browser-Delegation.
- O3 und O1 muessen als zusammenhaengender Trust-/Boundary-Fall behandelt werden.
- Der Translator wird als wiederverwendbares Monorepo-Package modelliert.
- Die bestehende VS-Code-App in `apps/vscode-extension` bleibt Produktoberflaeche; die Translator-Logik wandert **nicht** als eigene App nach `apps/`.
- Upstream-Source von Matt Pocock ist selektiv zu uebernehmen, nicht vollstaendig zu forken.
- Die im Upstream vorhandenen 67 kuratierten Translationen definieren die aktuelle Paritaetsbasis.
- `Y3` und `Y1` bleiben ausserhalb dieses Hand-offs.

---

## 5. Dateipfad-Index
[INTENT: REFERENZ]

| # | Dateipfad | Relevanz | Zugehoerige Einheit-IDs |
|---|-----------|----------|-------------------------|
| 1 | `HANDOFF_O3_O1_LOCAL_TRANSLATOR.md` | dieses Referenzdokument | alle |
| 2 | `packages/vscode-formatter/src/components/actions.ts` | aktueller Remote-Translator-Link, spaeter lokaler Action-Ersatz | INFO-001, REQ-002, REQ-007 |
| 3 | `packages/vscode-formatter/package.json` | `lz-string` heute, interne Package-Abhaengigkeit spaeter | INFO-001, REQ-002, REQ-007 |
| 4 | `packages/vscode-formatter/src/components/htmlCodeBlock.ts` | HTML-String-Erzeugung fuer Sidebar | REQ-001, INFO-001 |
| 5 | `packages/vscode-formatter/src/components/plainCodeBlock.ts` | HTML-Interpolation fuer Code-Content | REQ-001, INFO-001 |
| 6 | `packages/vscode-formatter/src/format/identSentences.ts` | HTML-nahe Materialisierung diagnostischer Zeilen | REQ-001 |
| 7 | `packages/vscode-formatter/src/format/prettifyDiagnosticForSidebar.ts` | Sidebar-Integrationspunkt fuer lokale Translation | REQ-007 |
| 8 | `packages/vscode-formatter/src/format/prettifyDiagnosticForHover.ts` | Hover-Integrationspunkt fuer lokale Action | REQ-007 |
| 9 | `apps/vscode-extension/src/diagnostics.ts` | Trusted-Markdown-Diagnostic-Pfad | REQ-001, INFO-001 |
| 10 | `apps/vscode-extension/src/provider/markdownWebviewProvider.ts` | WebView-Capabilities und CSP-Rewrite | REQ-001 |
| 11 | `apps/vscode-extension/src/provider/webviewViewProvider.ts` | HTML-Transport in die Sidebar und spaeter sichere Model-Render-Pipeline | REQ-001, REQ-007 |
| 12 | `apps/vscode-extension/webview/index.js` | `innerHTML`-Setzung, spaeter sichere DOM-Render-Logik | REQ-001 |
| 13 | `apps/vscode-extension/src/extension.ts` | neuer lokaler Translation-Command | REQ-007 |
| 14 | `package.json` | bestaetigt Monorepo-Workspaces | REQ-005 |
| 15 | `tmp/ts-error-translator/` | lokale Upstream-Extraktionsbasis | REQ-003 |
| 16 | `tmp/ts-error-translator/package.json` | Upstream-Monorepo-Root | INFO-002 |
| 17 | `tmp/ts-error-translator/apps/vscode/package.json` | bestaetigt, dass Upstream eine eigene VS-Code-App mitbringt | INFO-002, REQ-004 |
| 18 | `tmp/ts-error-translator/apps/vscode/src/humaniseDiagnostic.ts` | lokale Upstream-Nutzung von Engine + Bundle | REQ-002, REQ-004 |
| 19 | `tmp/ts-error-translator/apps/vscode/src/bundleErrors.ts` | Vorlage fuer lokales Error-Bundle | REQ-002, REQ-004 |
| 20 | `tmp/ts-error-translator/packages/engine/package.json` | bestaetigt Engine als separaten Kern | INFO-002, REQ-004 |
| 21 | `tmp/ts-error-translator/packages/engine/src/index.ts` | Engine-Exportflaeche | REQ-004 |
| 22 | `tmp/ts-error-translator/packages/engine/src/parseErrors.ts` | Matching-Algorithmus fuer Diagnostic-Parsing | REQ-004, REQ-006 |
| 23 | `tmp/ts-error-translator/packages/engine/src/getImprovedMessage.ts` | Upstream-Helfer fuer Template-Fuellung | REQ-004, REQ-006 |
| 24 | `tmp/ts-error-translator/packages/engine/src/tsErrorMessages.json` | TypeScript-Diagnostic-Matching-DB | INFO-002, REQ-004, REQ-006 |
| 25 | `tmp/ts-error-translator/packages/engine/errors/*.md` | 67 kuratierte Translation-Dateien | INFO-002, REQ-004, REQ-006 |
| 26 | `tmp/ts-error-translator/packages/parser/package.json` | Tip-System, nicht in den Zielscope uebernehmen | INFO-002, REQ-004 |
| 27 | `tmp/ts-error-translator/packages/searcher/package.json` | Search-Utility, nicht in den Zielscope uebernehmen | INFO-002, REQ-004 |
| 28 | `packages/error-translator/package.json` | neues internes Zielpackage | REQ-005, REQ-006 |
| 29 | `packages/error-translator/src/index.ts` | neue first-party API | REQ-006 |
| 30 | `packages/error-translator/src/parseErrors.ts` | lokale Portierung des Matching-Kerns | REQ-006 |
| 31 | `packages/error-translator/src/translateDiagnosticMessage.ts` | lokaler Plain-English-Adapter | REQ-006 |
| 32 | `packages/error-translator/src/generated/tsErrorMessages.json` | statische Matching-Daten | REQ-006 |
| 33 | `packages/error-translator/src/generated/bundleErrors.json` | statische Translation-Daten | REQ-006 |
| 34 | `packages/error-translator/vendor/matt-pocock/errors/` | rohe Upstream-Quellen fuer Attribution und Sync | REQ-006 |
| 35 | `packages/error-translator/test/translator.vitest.ts` | empfohlene Zieltests fuer lokale Translator-Paritaet | WF-001 |
| 36 | `packages/vscode-formatter/test/vscode-formatter.vitest.ts` | bestehender Testort fuer Formatter-Integration | WF-001 |

---

## 6. Ausfuehrungskontext fuer LLM-Agents
[INTENT: KONTEXT]

**Repo-Root:** `C:\Projects\development-platform\vs-code\extensions\pretty-ts-errors`

**Bereits erledigt in diesem Hand-off-Kontext:**

- O3- und O1-Pfade wurden lokal und anhand des aktuellen Repos nachvollzogen
- das Matt-Pocock-Upstream-Repo wurde nach `tmp/ts-error-translator` geklont
- die relevanten Upstream-Pakete und Dateien wurden identifiziert
- 2026-Alternativen wurden geprueft und fuer diesen Use-Case eingeordnet

**Aktuell etablierter Zielzustand aus diesem Dokument:**

- Plain-English-Translation wird first-party lokal in `packages/error-translator` integriert
- Matts Upstream-Source wird selektiv als Basis uebernommen
- die aktuelle Remote-Vercel-Translator-Delegation wird entfernt
- der O3-Pfad wird in Richtung strukturierter Datenmodelle und sicherem DOM-Rendering umgebaut

**Wichtige Umsetzungsdetails fuer den Folge-Agenten:**

- Das lokale Upstream-Repo in `tmp/ts-error-translator` ist **Referenzquelle**, nicht Zielsystem.
- Die 67 Upstream-Markdown-Dateien sind die aktuelle Paritaetsbasis fuer Plain-English-Translation.
- `packages/parser` und `packages/searcher` gehoeren nicht in den Zielscope, solange kein neuer, expliziter Bedarf entsteht.
- Der schnellste und sauberste Integrationspfad ist:
  - neues internes Package,
  - lokale Datenbundle-Erzeugung,
  - lokaler Sidebar-/Hover-Action-Ersatz,
  - WebView-Haertung gegen `innerHTML`.

**Noch nicht umgesetzt, aber durch dieses Dokument festgelegt:**

- Anlegen von `packages/error-translator`
- Portierung/Bundle der benoetigten Upstream-Source-Daten
- Entfernung des Remote-Translator-Links
- O3-Haertung der WebView-/HTML-Pipeline

**Explizit offene Restklaerung fuer den Folge-Agenten:**

- Ob der externe `typescript.tv`-Link im selben Arbeitsstrang mit entfernt/ersetzt wird, wenn "alle externen Remote-Verbindungen" wortwoertlich fuer die gesamte UI gelten soll.  
  Dieses Dokument markiert ihn bewusst als **adjazente externe Surface**, aber nicht als den eigentlichen O1-Translator-Pfad.

**HCOA-Hinweis:**

Der Folge-Agent kann auf Basis dieses Dokuments direkt eine mehrstufige Implementierung planen, ohne nochmals projektweit nach der O1-/O3-Ursache oder nach der Upstream-Paketstruktur suchen zu muessen. Alle dafuer benoetigten lokalen und externen Referenzpfade sind oben bereits gebunden.
