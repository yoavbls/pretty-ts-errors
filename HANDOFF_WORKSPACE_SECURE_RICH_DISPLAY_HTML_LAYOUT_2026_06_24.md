# Referenzdokument: Workspace-Handoff zur sicheren Wiederherstellung der rich display / HTML-Aussengeruest-Architektur in `pretty-ts-errors`
[INTENT: KONTEXT]

---

## 0. Quellenbasis und Scope-Grenzen
[INTENT: KONTEXT]

**Workspace-Root:** `C:\Projects\development-platform\vs-code\extensions\pretty-ts-errors`

**Quellemodus:** `CURRENT_CONTEXT_DEFAULT` mit expliziten Zusatzreferenzen aus dem laufenden Chat-Kontext.

**Freigegebene Quellenbasis fuer diesen Handoff:**

- die komplette aktuelle Konversation bis zu diesem Stand
- die im aktuellen Verlauf gelesenen Workspace-Dateien, insbesondere:
  - `apps/vscode-extension/src/hoverContent.ts`
  - `apps/vscode-extension/src/diagnostics.ts`
  - `apps/vscode-extension/src/provider/hoverProvider.ts`
  - `apps/vscode-extension/src/provider/sidebarViewModel.ts`
  - `apps/vscode-extension/src/provider/selectedTextHoverProvider.ts`
  - `apps/vscode-extension/src/formattedDiagnosticsStore.ts`
  - `apps/vscode-extension/src/supportedDiagnosticSources.ts`
  - `apps/vscode-extension/src/test/suite/index.ts`
  - `apps/vscode-extension/src/test/suite/extension.test.ts`
  - `apps/vscode-extension/webview/index.js`
  - `apps/vscode-extension/project.json`
  - `apps/vscode-extension/package.json`
  - `packages/formatter/src/errorMessagePrettifier.ts`
  - `packages/error-translator/vendor/matt-pocock/errors/2739.md`
  - `examples/errors.js`
- die lokal angelegte Upstream-Referenz:
  - `tmp/upstream-yoavbls-pretty-ts-errors`
  - insbesondere `tmp/upstream-yoavbls-pretty-ts-errors/apps/vscode-extension/src/diagnostics.ts`
- die vom Benutzer eingebrachten Screenshots zur aktuellen Anzeige sowie der Verweis auf den Screenshot in `README.md`
- der aktuelle Workspace-Status inklusive des lokal vorhandenen VSIX-Artefakts `artifacts/vsix/pretty-ts-errors-1.0.2.vsix`

**Explizite Scope-Grenzen:**

- Fokus dieses Dokuments ist die **Anzeige-Architektur** der Extension:
  - nativer Hover
  - Sidebar / Webview
  - sichere Trennung von Layout und untrusted Diagnostic-Content
- Der Handoff deckt nur Themen ab, die im aktuellen Source Bundle bereits diskutiert, implementiert oder als Zielbild beschrieben wurden.
- Keine neue, hiervon unabhaengige Produktroadmap.
- Keine autonome Projekt-Vollsuche ausserhalb der oben genannten Quellen.

**Explizite Exklusionen:**

- keine neue Loesung, die wieder generisches untrusted HTML direkt in trusted Hover-Surfaces injiziert
- keine Wiedereroeffnung des entfernten Remote-Translator-Egress
- keine Erfindung neuer UX-Ziele ausserhalb der bereits diskutierten Screenshot-/README-Paritaet

---

## 1. Aufgabenuebersicht
[INTENT: KONTEXT]

Dieser Handoff beschreibt den aktuellen Workspace-Stand und das empfohlene Zielbild fuer die **sichere Wiederherstellung der reicheren Anzeige** in `pretty-ts-errors`.

Die Kernlage aus dem aktuellen Kontext ist:

1. Das Originalprojekt `yoavbls/pretty-ts-errors` wurde lokal als Vergleichsbasis unter `tmp/upstream-yoavbls-pretty-ts-errors` geklont.
2. Die frueheren Sicherheitsprobleme wurden bereits entfernt:
   - kein Remote-Translator-Egress mehr
   - kein untrusted Diagnostic-HTML mehr via `innerHTML` in die Webview
   - kein globaler trusted Hover-Body mit `supportHtml = true`
3. Die reichere Darstellung wurde bereits **teilweise** sicher wiederhergestellt:
   - der Hover nutzt wieder den Formatter-Kern fuer den Haupttext
   - Codeblöcke und formatierte Type-Fragmente werden als Markdown aufgebaut
   - die Sidebar rendert den `bodyMarkdown` per Safe-DOM
4. Die aktuelle Anzeige ist funktional korrekt und getestet, aber **noch nicht 100% screenshot-identisch** zum README-/Original-Eindruck.
5. Die priorisierte Zielarchitektur ist:
   - **maximale Sicherheit zuerst**
   - **host-owned Layout**
   - **untrusted externer Content bleibt Daten**
   - **HTML im Aussengeruest nur dort, wo die Extension selbst die komplette Struktur kontrolliert**

Der fachlich richtige Zielzustand ist **nicht** die Rueckkehr zum alten globalen `supportHtml = true`-Hoverpfad, sondern eine Architektur, in der:

- die Extension ihr Layout selbst kontrolliert,
- externer / workspace-kontrollierter Diagnostic-Text niemals als frei interpretierbares HTML behandelt wird,
- und die Rich-Display-Paritaet ueber ein strukturiertes Renderer-Modell erreicht wird.

---

## 2. Informationsregister (INHALT-Einheiten)
[INTENT: REFERENZ]

| ID | Typ | Beschreibung | Veraenderung | Status |
|----|-----|--------------|-------------|--------|
| REQ-001 | ANFORDERUNG | Die Anzeige der Extension muss wieder reich / enriched sein und sich so weit wie moeglich an der frueheren README-/Original-Darstellung orientieren. | Ja | Aktiv |
| REQ-002 | ANFORDERUNG | Maximale Sicherheit hat hoechste Prioritaet; externer / generischer Content darf den Benutzer nicht gefaehrden oder korrumpieren. | Ja | Aktiv |
| REQ-003 | ANFORDERUNG | Wenn technisch moeglich, soll das Aussengeruest fuer die Anzeige wieder host-owned / HTML-gesteuert gestaltet werden koennen, ohne untrusted HTML zuzulassen. | Ja | Aktiv |
| REQ-004 | ANFORDERUNG | Der Handoff muss auf Workspace-Ebene den empfohlenen Architekturpfad und die daraus folgende Implementierungsrichtung vollstaendig dokumentieren. | Ja | Erledigt mit diesem Dokument |
| DEC-001 | ENTSCHEIDUNG | Der alte trusted Hover-Body mit `supportHtml = true` ist nicht die empfohlene Zielarchitektur. | Ja | Aktiv |
| DEC-002 | ENTSCHEIDUNG | Empfohlene Top-1-Architektur ist ein strukturierter Layout-/Token-/AST-Renderer mit Dual-Output fuer Hover und Sidebar. | Ja | Aktiv |
| DEC-003 | ENTSCHEIDUNG | Host-owned HTML ist nur fuer vom Produkt voll kontrollierte Shell-Surfaces zulaessig, nicht fuer untrusted Diagnostic-Rohstrings. | Ja | Aktiv |
| INFO-001 | INFORMATION | Das Originalprojekt wurde lokal unter `tmp/upstream-yoavbls-pretty-ts-errors` geklont und ist fuer Direktvergleiche verfuegbar. | Nein | Aktiv |
| INFO-002 | INFORMATION | Der aktuelle Hover-Body in `hoverContent.ts` rendert den Fehlertext als Markdown mit `supportHtml = false`. | Nein | Aktiv |
| INFO-003 | INFORMATION | Die Sidebar / Webview rendert `bodyMarkdown` per Safe-DOM in `webview/index.js`. | Nein | Aktiv |
| INFO-004 | INFORMATION | Ein echter Extension-Integrationstest prueft den Custom-Hover ueber `examples/errors.js`. | Nein | Aktiv |
| INFO-005 | INFORMATION | Das aktuelle Artefakt `artifacts/vsix/pretty-ts-errors-1.0.2.vsix` wurde erfolgreich gebaut. | Nein | Aktiv |
| WARN-001 | WARNUNG | Die Darstellung ist aktuell nicht 100% screenshot-identisch; insbesondere `TS2739` und weitere Fehlerfamilien haben noch Format-Paritaetsluecken. | Nein | Offen |
| WARN-002 | WARNUNG | Die Hoehe des nativen VS-Code-Hovers ist nicht vollstaendig von der Extension kontrollierbar. | Nein | Aktiv |
| WF-001 | WORKFLOW | Die sichere Endarchitektur soll das Layout in strukturierte Nodes aufteilen und Hover-/Sidebar-Rendering aus derselben Zwischenrepräsentation ableiten. | Ja | Offen |
| WF-002 | WORKFLOW | Fuer Screenshot-Paritaet muessen gezielte Formatter-Regeln pro Fehlerfamilie (`TS2739`, `TS2741`, `TS2322`, `TS2345`) erweitert und getestet werden. | Ja | Offen |
| WF-003 | WORKFLOW | Falls host-owned HTML im Aussengeruest weiter ausgebaut wird, darf dies nur fuer voll kontrollierte Shell-Strukturen gelten; eingefuellter externer Inhalt bleibt escaped/textuell/tokenisiert. | Ja | Offen |

---

## 3. Informationseinheiten
[INTENT: SPEZIFIKATION]

### 3.1 REQ-001: Die Anzeige muss wieder reich / enriched sein
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Die Extension soll fuer TypeScript-/JSDoc-Diagnostics wieder eine reichere Anzeige liefern, die sich an der frueheren visuellen Wirkung des Originalprojekts und des README-Screenshots orientiert. Relevante Merkmale sind:

- Trennung von Fehlersatz und Type-Blöcken
- mehrzeilige Codeblöcke fuer relevante Typen
- besser strukturierte Anzeige fuer "is missing..."- und "is not assignable..."-Faelle
- bessere Paritaet zwischen Hover und Sidebar

**Ist-Zustand:**
Die aktuelle Implementierung liefert bereits wieder Rich-Display-Merkmale:

- `apps/vscode-extension/src/hoverContent.ts` baut den Fehlertext ueber `buildPrettyDiagnosticMessageMarkdown()` aus dem Formatter-Kern auf.
- `apps/vscode-extension/src/hoverContent.ts` rendert Codefences und strukturierte Textteile als Markdown.
- `apps/vscode-extension/webview/index.js` rendert den Haupttext der Sidebar ueber `appendMarkdownBlocks()` in Safe-DOM-Codecontainer und Paragraphen.
- `apps/vscode-extension/src/test/suite/extension.test.ts` prueft Rich-Merkmale wie `TS2741`, Codefences sowie `street: string` und `country: string`.

Trotzdem ist die aktuelle Darstellung noch nicht 100% README-/Original-paritaetisch. Der aktuelle `TS2739`-Fall zeigt dies deutlich:

- die Plural-Form wird zwar in Listenform dargestellt,
- die Plain-English-Uebersetzung bleibt noch relativ roh,
- und die exakte visuelle Segmentierung aus dem alten HTML-trusted Hover ist noch nicht vollstaendig reproduziert.

**Soll-Zustand:**
Die Anzeige soll wieder so reich wie moeglich sein, jedoch auf dem sicheren Renderer-Pfad. Insbesondere muessen:

- Hauptfehler, Typblöcke, Property-Listen und Relationslinien sauber segmentiert sein,
- Fehlerfamilien mit bekannter hoher Sichtbarkeit (`TS2739`, `TS2741`, `TS2322`, `TS2345`) gezielt auf Screenshot-Paritaet gezogen werden,
- Hover und Sidebar aus derselben logischen Rich-Display-Zwischenrepräsentation ableitbar sein.

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `apps/vscode-extension/src/hoverContent.ts` | Hover-Body und Actions-Rendering | `buildPrettyDiagnosticMessageMarkdown()`, `createBodyMarkdown()`, `createHoverContents()` |
| `apps/vscode-extension/webview/index.js` | Safe-DOM-Rendering der Sidebar | `createDiagnosticCard()`, `appendMarkdownBlocks()`, `appendMarkdownParagraphs()` |
| `packages/formatter/src/errorMessagePrettifier.ts` | Regelbasierte Aufspaltung des Diagnostic-Textes | `getRules()` |
| `packages/error-translator/vendor/matt-pocock/errors/2739.md` | Plain-English-Text fuer `TS2739` | gesamte Datei |
| `examples/errors.js` | gezieltes Repro fuer JS-/Plural-Fall | `pluralHoverExample` |

**✅ Positivbeispiel(e):**

```ts
const hoverParts = await createHoverContents(lspDiagnostic, {
  bodyMarkdown,
});
```

```js
const messageSection = document.createElement("section");
messageSection.className = "diagnostic-message-section";
appendMarkdownBlocks(messageSection, diagnostic.bodyMarkdown);
```

**❌ Negativbeispiel(e):**

```ts
const markdown = new MarkdownString(formattedDiagnostic);
markdown.isTrusted = { enabledCommands };
markdown.supportHtml = true;
```

Warum falsch:
Dieses Muster koppelt den kompletten formatierten Fehlertext wieder an einen global trusted HTML-Hoverpfad und fuehrt genau in Richtung der frueheren O3-Sicherheitsproblematik.

---

### 3.2 REQ-002: Maximale Sicherheit hat hoechste Prioritaet
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Die rich display darf nur so weit ausgebaut werden, wie es mit maximaler Sicherheit gegenueber externen oder workspace-/dependency-kontrollierten Quellen vereinbar ist.

**Ist-Zustand:**
Die aktuelle Implementierung trennt die Trust-Grenzen bereits:

- Der Hover-Body verwendet `MarkdownString` mit `supportHtml = false`.
- Die Actions werden separat in `createActionsMarkdown()` gebaut und nur fuer `enabledCommands` trusted gemacht.
- Die Sidebar rendert `bodyMarkdown` via DOM-Aufbau und `textContent`, nicht via `innerHTML`.
- Der Remote-Translator wurde bereits frueher entfernt.

**Soll-Zustand:**
Alle weiteren UX-/Design-Verbesserungen muessen diese Trennung beibehalten:

- untrusted Diagnostic-Text bleibt Daten
- keine freie HTML-Interpretation fuer Diagnostic-Rohstrings
- keine Wiedereroeffnung eines global trusted HTML-Hover-Bodies

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `apps/vscode-extension/src/hoverContent.ts` | sichere Trust-Trennung im Hover | `createBodyMarkdown()`, `createActionsMarkdown()` |
| `apps/vscode-extension/webview/index.js` | Safe-DOM statt `innerHTML` | `appendMarkdownBlocks()`, `createInlineMarkdownFragment()` |
| `apps/vscode-extension/src/provider/sidebarViewModel.ts` | strukturierte Modellweitergabe in die Sidebar | `SidebarDiagnosticModel.bodyMarkdown`, `createSidebarDiagnosticModel()` |

**✅ Positivbeispiel(e):**

```ts
const markdown = new MarkdownString();
markdown.appendMarkdown(bodyMarkdown);
markdown.supportHtml = false;
```

```js
const code = document.createElement("code");
code.textContent = fenceMatch.groups.code;
```

**❌ Negativbeispiel(e):**

```js
contentElement.innerHTML = diagnostic.message;
```

Warum falsch:
Das wuerde untrusted Diagnostic-Text wieder direkt in eine HTML-Surface schreiben und die Sicherheitsgrenze oeffnen.

---

### 3.3 REQ-003: Host-owned HTML-Aussengeruest nur mit sicheren Slots
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Falls technisch moeglich, soll das Aussengeruest fuer die Anzeige wieder vollstaendig vom Produkt kontrolliert werden koennen, einschliesslich HTML-Layout fuer wiederkehrende visuelle Bereiche. Gleichzeitig darf externer Content niemals als frei interpretierbares HTML in dieses Geruest einfliessen.

**Ist-Zustand:**
Im aktuellen Code ist das bereits teilweise umgesetzt:

- Die Sidebar hat ein host-owned HTML-/DOM-Geruest (`diagnostic-card`, `translation-card`, Actions, Copy-Button, Codecontainer).
- Der eigentliche Fehlerinhalt (`bodyMarkdown`) wird aber in dieses Geruest nur als strukturierter Markdown-/Text-Content eingespeist.
- Im nativen VS-Code-Hover gibt es aktuell **kein** host-owned HTML-Aussengeruest fuer den Body; dort bleibt der sichere Markdown-Pfad aktiv.

**Soll-Zustand:**
Die empfohlene Endarchitektur ist:

- host-owned HTML nur fuer komplett kontrollierte Shell-Bereiche
- eingebetteter externer Content nur als:
  - Markdown
  - escaped Text
  - tokenisierte / typisierte Layout-Nodes
- kein generisches Einfuegen fremder HTML-Fragmente

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `apps/vscode-extension/webview/index.js` | bestehendes host-owned HTML-/DOM-Aussengeruest | `createDiagnosticCard()`, `createTranslationsSection()`, `appendMarkdownBlocks()` |
| `apps/vscode-extension/src/hoverContent.ts` | sicherer Hover-Body ohne HTML-Trust | `buildPrettyDiagnosticMessageMarkdown()`, `createBodyMarkdown()` |
| `packages/formatter/src/errorMessagePrettifier.ts` | aktuelle Vorstufe des kuenftigen Strukturmodells | `getRules()` |

**✅ Positivbeispiel(e):**

```js
const card = document.createElement("article");
card.className = "diagnostic-card";

const messageSection = document.createElement("section");
messageSection.className = "diagnostic-message-section";
appendMarkdownBlocks(messageSection, diagnostic.bodyMarkdown);
card.appendChild(messageSection);
```

**❌ Negativbeispiel(e):**

```ts
const markdownString = new MarkdownString(fullHtmlFromDiagnostic);
markdownString.supportHtml = true;
```

Warum falsch:
Das HTML-Geruest waere dann nicht mehr wirklich host-owned, weil der eingefuellte Diagnostic-String selbst interpretierbares HTML transportieren duerfte.

---

### 3.4 REQ-004: Workspace-Handoff auf empfohlene Option und Implementierungsweg ausrichten
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Das Dokument muss den aktuell empfohlenen Architekturpfad und die daraus folgende Weiterarbeit so festhalten, dass ein neuer Agent ohne weitere Projektsuche direkt fortsetzen kann.

**Ist-Zustand:**
Die empfohlene Option wurde im laufenden Kontext bereits festgelegt:

- Top-1-Empfehlung: **strukturierter Token-/AST-Renderer mit Dual-Output**
- Rich Display soll ohne Wiedereroeffnung des alten HTML-trusted Hover-Bodies erreicht werden.

**Soll-Zustand:**
Ein Folge-Agent muss aus diesem Dokument direkt ableiten koennen:

- welche Pfade bereits sicher sind,
- welche Rendering-Paritaetsluecken noch offen sind,
- welche Implementierungsschritte fuer die Endarchitektur ausstehen,
- welche Tests und Vergleichsquellen bereits existieren.

**✅ Positivbeispiel(e):**

```md
- Upstream-Referenz lokal vorhanden
- Hover-Body sicherer Markdown-Pfad
- Sidebar host-owned DOM-Shell
- naechster Schritt: typed DiagnosticLayoutModel
```

**❌ Negativbeispiel(e):**

```md
Die Anzeige ist im Wesentlichen fertig. Nur noch Kleinigkeiten.
```

Warum falsch:
Das verschweigt die noch offenen Format-Paritaetsluecken und ist fuer einen Folge-Agenten nicht HCOA-ready.

---

### 3.5 DEC-001: Der alte globale `supportHtml = true`-Hoverpfad ist nicht die Zielarchitektur
[INTENT: SPEZIFIKATION]

**Typ:** ENTSCHEIDUNG

**Beschreibung:**
Das Originalprojekt nutzte fuer den fertig formatierten Hover einen `MarkdownString` mit `supportHtml = true` und `isTrusted = { enabledCommands }`. Diese Kombination ist nicht die empfohlene Zielarchitektur fuer den aktuellen Workspace.

**Ist-Zustand:**
Im Upstream-Klon steht der alte Pfad sichtbar in:

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `tmp/upstream-yoavbls-pretty-ts-errors/apps/vscode-extension/src/diagnostics.ts` | alter trusted Hoverpfad | `prettifyDiagnosticForHover()`, `MarkdownString`, `supportHtml = true`, `isTrusted = { enabledCommands }` |

**Soll-Zustand:**
Der Hover-Body bleibt bei `supportHtml = false`; reiche Darstellung kommt ueber sicheren Markdown-/Token-/Node-Renderpfad.

---

### 3.6 DEC-002: Empfohlene Top-1-Architektur ist ein strukturierter Layout-/Token-/AST-Renderer mit Dual-Output
[INTENT: SPEZIFIKATION]

**Typ:** ENTSCHEIDUNG

**Beschreibung:**
Die beste aktuelle Architekturentscheidung fuer den weiteren Ausbau ist:

- eine gemeinsame strukturierte Zwischenrepräsentation fuer Fehlerdarstellung
- ein Markdown-Output fuer den nativen Hover
- ein Safe-DOM-/host-owned HTML-Output fuer Sidebar/Webview

**Ist-Zustand:**
Der aktuelle Code ist eine Vorstufe dazu:

- `hoverContent.ts` materialisiert bereits prettified Markdown
- `webview/index.js` rendert bereits `bodyMarkdown` strukturiert in DOM
- die Daten werden bereits ueber `FormattedDiagnostic.bodyMarkdown` weitergereicht

**Soll-Zustand:**
Ein kuenftiger `DiagnosticLayoutModel` sollte statt bloßer String-Rewrites typed Nodes wie diese tragen:

- `paragraph`
- `inlineCode`
- `codeBlock`
- `propertyList`
- `typeBlock`
- `relationLine`

und daraus zwei Renderer ableiten:

- `renderHoverMarkdown(layout)`
- `renderSidebarDom(layout)`

---

### 3.7 DEC-003: Host-owned HTML ist nur fuer voll kontrollierte Shell-Surfaces zulaessig
[INTENT: SPEZIFIKATION]

**Typ:** ENTSCHEIDUNG

**Beschreibung:**
HTML im Aussengeruest ist akzeptabel, wenn die komplette Struktur von der Extension stammt und untrusted Content weiterhin nur als Daten eingehaengt wird.

**Ist-Zustand:**
Die Sidebar erfuellt dieses Muster bereits teilweise.

**Soll-Zustand:**
Dieses Prinzip bleibt verbindlich:

- HTML nur aus eigener Struktur
- Slots nur fuer escaped / tokenisierte / markdownbasierte Inhalte
- keine generische HTML-Interpolation aus Diagnostic-Rohstrings

---

### 3.8 INFO-001: Upstream-Klon ist lokal verfuegbar
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
Das Originalprojekt `yoavbls/pretty-ts-errors` wurde lokal nach `tmp/upstream-yoavbls-pretty-ts-errors` geklont. Dieser Clone dient als Referenz fuer:

- alte Hover-Architektur
- README-/Screenshot-Paritaet
- direkten Codevergleich

---

### 3.9 INFO-002: Der aktuelle Hover-Body ist sicherer Markdown statt trusted HTML
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
Der aktuelle Body des Hovers wird in `apps/vscode-extension/src/hoverContent.ts` via `MarkdownString.appendMarkdown()` aufgebaut und explizit mit `supportHtml = false` abgeschlossen.

---

### 3.10 INFO-003: Die Sidebar rendert den Haupttext via Safe-DOM
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
Der Haupttext eines Diagnostics liegt im Modell als `bodyMarkdown` vor und wird in `apps/vscode-extension/webview/index.js` ueber `appendMarkdownBlocks()` und `appendMarkdownParagraphs()` in DOM-Elemente materialisiert.

---

### 3.11 INFO-004: Ein echter Extension-Integrationstest ist vorhanden
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
`apps/vscode-extension/src/test/suite/extension.test.ts` prueft den aktiven Hover gegen `examples/errors.js` per `vscode.executeHoverProvider`.

**Ist-Zustand:**
Der Test verifiziert aktuell:

- `Show in Sidebar`
- `Local explanation`
- `TS2741`
- Codefences
- `street: string`
- `country: string`

---

### 3.12 INFO-005: Das aktuelle VSIX-Artefakt ist gebaut
[INTENT: SPEZIFIKATION]

**Typ:** INFORMATION

**Beschreibung:**
Der aktuelle Package-Lauf hat `artifacts/vsix/pretty-ts-errors-1.0.2.vsix` erfolgreich erzeugt.

---

### 3.13 WARN-001: Die Anzeige ist noch nicht 100% screenshot-identisch
[INTENT: SPEZIFIKATION]

**Typ:** WARNUNG

**Beschreibung:**
Obwohl die Anzeige wieder reich ist, ist sie noch nicht 100% deckungsgleich mit dem README-/Original-Screenshot. Die Gruende sind bereits im aktuellen Source Bundle belegt:

- andere Fehlerfamilien werden unterschiedlich gut zerlegt
- `TS2739` hat aktuell eine eher rohe Plain-English-Translation
- der sichere Markdown-Pfad reproduziert nicht jeden frueheren HTML-/Hover-Hack pixelgleich

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `packages/error-translator/vendor/matt-pocock/errors/2739.md` | flache Explanation fuer `TS2739` | gesamte Datei |
| `packages/formatter/src/errorMessagePrettifier.ts` | nur partielle Spezialregeln fuer Fehlerfamilien | Plural-Regel `is missing the following properties...` |

---

### 3.14 WARN-002: Die Hoehe des nativen Hovers ist nicht vollstaendig kontrollierbar
[INTENT: SPEZIFIKATION]

**Typ:** WARNUNG

**Beschreibung:**
Die nativen VS-Code-Hover-Container werden vom Editor selbst kontrolliert. Die Extension kann den Inhalt verbessern, aber nicht frei die Widget-Hoehe deterministisch erzwingen.

---

### 3.15 WF-001: Endarchitektur auf ein typed `DiagnosticLayoutModel` heben
[INTENT: SPEZIFIKATION]

**Typ:** WORKFLOW

**Beschreibung:**
Naechster Hauptschritt fuer eine robuste Endarchitektur:

1. aktuellen Formatter von bloßem String-Rewrite in typed Layout-Nodes ueberfuehren
2. denselben Layout-Baum in zwei Renderer speisen:
   - Hover-Markdown
   - Sidebar-Safe-DOM
3. Translation-Blöcke und Property-Listen ebenfalls als typed Nodes modellieren

**Ist-Zustand:**
Aktuell wird `bodyMarkdown` als String erzeugt und spaeter erneut geparst / gerendert.

**Soll-Zustand:**
Ein gemeinsames Modell vermeidet Drift zwischen Hover und Sidebar.

---

### 3.16 WF-002: Fehlerfamilien gezielt auf Screenshot-Paritaet ziehen
[INTENT: SPEZIFIKATION]

**Typ:** WORKFLOW

**Beschreibung:**
Gezielte Paritaetsarbeit fuer die sichtbarsten Fehlerfamilien:

1. `TS2739`
2. `TS2741`
3. `TS2322`
4. `TS2345`

Je Fehlerfamilie sollten:

- Repro-Beispiele in `examples/`
- Formatter-Regeln
- Plain-English-Translations
- Integrationstests / Snapshot-Tests

koordiniert nachgezogen werden.

---

### 3.17 WF-003: Host-owned HTML im Aussengeruest nur mit sicheren Slots weiter ausbauen
[INTENT: SPEZIFIKATION]

**Typ:** WORKFLOW

**Beschreibung:**
Falls die Designqualitaet weiter erhoeht werden soll, ist der sichere Ausbaupfad:

- mehr host-owned Layout in Sidebar/Webview
- kein generisches HTML fuer Diagnostic-Rohstrings
- Slots nur fuer:
  - escaped Text
  - Markdown
  - typed Layout-Nodes

Dies gilt ausdruecklich **nicht** als Freigabe, den nativen Hover-Body wieder global auf `supportHtml = true` zu setzen.

---

## 4. Konventionen & Constraints
[INTENT: CONSTRAINT]

- Maximale Sicherheit hat Vorrang vor visueller Paritaet.
- Untrusted Diagnostic-Text bleibt Daten und darf nicht als frei interpretierbares HTML behandelt werden.
- Host-owned HTML ist nur fuer voll kontrollierte Shell-Surfaces zulaessig.
- Rich-Display-Paritaet soll bevorzugt ueber strukturierte Renderer-Modelle statt ueber globales HTML-Trusting erreicht werden.
- Hover und Sidebar sollen langfristig aus derselben logischen Rich-Display-Zwischenrepräsentation ableitbar sein.
- Die nativen VS-Code-Hover-Grenzen (Hoehe, Host-Chrome, Scroll-Verhalten) sind weiterhin editorbestimmt.

---

## 5. Dateipfad-Index
[INTENT: REFERENZ]

| # | Dateipfad | Relevanz | Zugehoerige Einheit-IDs |
|---|-----------|----------|-------------------------|
| 1 | `apps/vscode-extension/src/hoverContent.ts` | sicherer Rich-Hover-Body, Markdown-Prettifier, Action-Trust-Trennung | REQ-001, REQ-002, INFO-002, DEC-001, DEC-002 |
| 2 | `apps/vscode-extension/src/diagnostics.ts` | Diagnostic-Sync, Cache, bodyMarkdown-Erzeugung, Hover-Provider-Registrierung | REQ-001, REQ-002, INFO-002, INFO-004 |
| 3 | `apps/vscode-extension/src/provider/hoverProvider.ts` | Store- und Live-Diagnostic-Fallback fuer Hover | REQ-001, INFO-002, INFO-004 |
| 4 | `apps/vscode-extension/src/provider/sidebarViewModel.ts` | strukturiertes Sidebar-Modell inkl. `bodyMarkdown` | REQ-003, INFO-003 |
| 5 | `apps/vscode-extension/src/provider/selectedTextHoverProvider.ts` | Debug-Hover fuer selektierten Text | INFO-004 |
| 6 | `apps/vscode-extension/src/formattedDiagnosticsStore.ts` | Speicherstruktur fuer Rich-Diagnostic-Items | REQ-001, INFO-003 |
| 7 | `apps/vscode-extension/src/supportedDiagnosticSources.ts` | zugelassene Diagnostic-Quellen | REQ-002 |
| 8 | `apps/vscode-extension/src/test/suite/index.ts` | Test-Harness, Testdatei-Discovery | INFO-004 |
| 9 | `apps/vscode-extension/src/test/suite/extension.test.ts` | echter Extension-Integrationstest fuer Hover-Rich-Display | INFO-004, WF-002 |
| 10 | `apps/vscode-extension/webview/index.js` | Safe-DOM-Rendering des richen Sidebar-Inhalts | REQ-001, REQ-002, REQ-003, INFO-003, WF-003 |
| 11 | `apps/vscode-extension/project.json` | Build-/Test-/Package-Targets, ESM-Banner-Fix | INFO-005 |
| 12 | `apps/vscode-extension/package.json` | Extension-Manifest und VS Code Engine-Line | INFO-005 |
| 13 | `packages/formatter/src/errorMessagePrettifier.ts` | bestehende Formatter-Regelbasis, u.a. Plural-Regel | REQ-001, WARN-001, WF-001, WF-002 |
| 14 | `packages/error-translator/vendor/matt-pocock/errors/2739.md` | aktuelle Plain-English-Uebersetzung fuer `TS2739` | WARN-001, WF-002 |
| 15 | `examples/errors.js` | JS-Repro inkl. Plural-Form fuer `TS2739` | INFO-004, WF-002 |
| 16 | `tmp/upstream-yoavbls-pretty-ts-errors/apps/vscode-extension/src/diagnostics.ts` | lokaler Upstream-Vergleich fuer den alten trusted Hoverpfad | DEC-001, INFO-001 |
| 17 | `artifacts/vsix/pretty-ts-errors-1.0.2.vsix` | aktuelles Installationsartefakt | INFO-005 |

---

## 6. Ausfuehrungskontext fuer LLM-Agents
[INTENT: KONTEXT]

Ein Folge-Agent kann mit diesem Dokument direkt weiterarbeiten, ohne neue Projektsuche, wenn er die folgenden Punkte beachtet:

1. **Sicherheitsgrenze zuerst**
   - Kein globaler Rueckfall auf `supportHtml = true` fuer den Fehler-Body.
   - Kein generisches HTML aus Diagnostic-Rohstrings.

2. **Empfohlene Zielarchitektur**
   - typed `DiagnosticLayoutModel`
   - Dual-Output fuer Hover und Sidebar
   - host-owned HTML nur fuer kontrollierte Shell-Surfaces

3. **Aktuelle Funktionslage**
   - Rich-Display ist wieder aktiv
   - Hover und Sidebar nutzen beide bereits denselben prettified Haupttext in unterschiedlicher Form
   - Integrationstest ist grün
   - VSIX `1.0.2` ist gebaut

4. **Offene Kernarbeit**
   - Screenshot-Paritaet pro Fehlerfamilie
   - `TS2739`-Translation und Layout weiter schaerfen
   - gemeinsame strukturierte Zwischenrepräsentation statt Markdown-String als Endformat

5. **Wichtige Nicht-Ziele**
   - keine neue Remote-Translation
   - keine Wiedereroeffnung des alten trusted HTML-Hovers
   - keine Sicherheitsabsenkung zugunsten von Komfort oder Geschwindigkeit

Wenn keine weitere Scope-Aenderung erfolgt, ist die empfohlene Fortsetzungsreihenfolge:

1. `TS2739`-Paritaet verbessern
2. typed Layout-Modell einziehen
3. denselben Modellpfad fuer weitere Fehlerfamilien verallgemeinern

