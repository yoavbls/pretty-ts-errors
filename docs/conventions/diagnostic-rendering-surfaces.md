# Diagnostic Rendering Surfaces

## Status

Diese Konvention ist fuer den aktuellen Workspace **verbindlich**.

Sie beschreibt die architektonisch korrekte Behandlung von:

- nativer Hover-Darstellung
- Sidebar-/Webview-Darstellung
- Syntax-Highlighting
- Typ-Formatierung und Wrapping
- Trust-Boundaries fuer generischen, externen Diagnostic-Content

## Zweck

Das Ziel dieser Konvention ist eine Enterprise-grade Richtlinie fuer die
Darstellung von TypeScript-Diagnostics in `pretty-ts-errors`, bei der:

- die Sicherheitsgrenze eindeutig bleibt,
- der Rich-Display-Pfad dauerhaft wartbar bleibt,
- Hover und Sidebar aus derselben semantischen Informationsbasis ableitbar
  bleiben,
- und spaetere Aenderungen nicht versehentlich wieder in trusted raw HTML,
  unklare Renderer-Zustaende oder Surface-Drift abgleiten.

## Korrekte Ablage

Der **korrekte Ablageort** fuer diese Konvention ist:

- als TOC auf Workspace-Ebene: `CONVENTIONS.md`
- als fachliche Detailkonvention: `docs/conventions/diagnostic-rendering-surfaces.md`

Diese Entscheidung ist absichtlich so getroffen:

- `HANDOFF_*.md`-Dateien sind transiente Uebergabeartefakte und nicht die
  dauerhafte Autoritaet fuer Richtlinien.
- `docs/ARCHITECTURE.md` beschreibt die grobe Struktur des Repositories, aber
  nicht fein genug die verbindlichen Regeln fuer konkrete Trust-Boundaries und
  Rendering-Surfaces.
- diese Konvention ist **cross-cutting**, weil sie gleichzeitig
  `apps/vscode-extension`, `packages/error-translator` und `packages/formatter`
  betrifft.

## Architekturentscheidung

### Top-Level-Entscheidung

Der verbindliche Zielzustand lautet:

- **eine gemeinsame semantische Rich-Content-Zwischenrepraesentation**
- **ein nativer Hover als sicherer Markdown-Surface**
- **eine Sidebar als host-owned HTML-/DOM-Shell**
- **generischer externer Content bleibt Daten und wird nicht als freies HTML
  interpretiert**

Diese Entscheidung schliesst explizit aus:

- globales `supportHtml = true` fuer den Hover-Body
- untrusted Diagnostic-HTML im Webview
- ein Mischen von Layout-Autoritaet und Payload-Autoritaet

## DDD-Analyse

### Bounded Context

Der relevante fachlich-technische Bounded Context ist
**Diagnostic Presentation**.

Er ist zustaendig fuer:

- Strukturierung von Diagnostics fuer UI-Surfaces
- Erhaltung der semantischen Information beim Uebergang von rohem Error-Text zu
  Rich-Display
- Durchsetzung der Sicherheitsgrenze zwischen Produkt-Layout und generischem
  Content

### Ubiquitous Language

Die folgenden Begriffe sind innerhalb dieses Contexts verbindlich:

- **outer shell**: vollstaendig produktkontrolliertes HTML-/DOM-Geruest
- **inner layer**: semantisch strukturierter, generischer Diagnostic-Content
- **trusted shell**: vom Produkt erzeugte Struktur, Klassen, Buttons, Sections,
  Header, Karten
- **untrusted payload**: workspace- oder dependency-kontrollierter
  Diagnostic-Text, Typ-Inhalt, Plain-English-Translation-Input
- **rich content model**: gemeinsame semantische Darstellung der
  Diagnostic-Inhalte
- **hover surface**: nativer VS-Code-Hover via `MarkdownString`
- **sidebar surface**: Webview-basierte host-owned Darstellung

### Schichtenmodell

Diese Konvention folgt fuer den Presentation-Context einem klaren Schichtenbild:

1. **Policy-/Semantik-Schicht**
   - `apps/vscode-extension/src/diagnosticRichContent.ts`
   - bildet semantische Nodes wie `paragraph`, `inlineCode`, `codeBlock`,
     `typeBlock`, `list`, `propertyList`
   - ist die Single Source of Truth fuer Rich-Display-Struktur

2. **Application-Schicht**
   - `apps/vscode-extension/src/provider/sidebarViewModel.ts`
   - `apps/vscode-extension/src/provider/webviewViewProvider.ts`
   - `apps/vscode-extension/src/commands/*.ts`
   - verantwortlich fuer Auswahl, Pinning, Locking, View-Model-Aufbau,
     Refresh-Zyklen und Command-Routing

3. **Delivery-/Adapter-Schicht**
   - Hover: `apps/vscode-extension/src/hoverContent.ts`
   - Sidebar/Webview: `apps/vscode-extension/webview/index.js`
   - Styling: `apps/vscode-extension/webview/style.css`
   - Syntax-Highlighting-Adapter: `apps/vscode-extension/src/provider/sidebarSyntaxHighlighter.ts`
   - Inline-Type-Formatting-Adapter: `apps/vscode-extension/src/provider/sidebarInlineTypeFormatter.ts`

## 12-Factor-Interpretation

Diese Extension ist keine klassische HTTP-App, aber die 12-Factor-Prinzipien
werden fuer den eingebetteten VS-Code-Kontext wie folgt interpretiert:

### 1. Codebase

Es gibt genau eine semantische Autoritaet fuer Rich-Display:
`DiagnosticRichContentModel`.

### 2. Dependencies

Rendering-Abhaengigkeiten muessen explizit und nachvollziehbar sein.
Der aktuelle Standard ist:

- `shiki`: erlaubt
- `vscode-shiki-bridge`: **nicht** erlaubt

### 3. Config

Theme-Auswahl fuer Syntax-Highlighting ist Adapter-Logik und keine Domain-Regel.
Aktuell wird in der Sidebar ueber `ColorThemeKind` auf gebuendelte Shiki-Themes
gemappt.

### 5. Build / Release / Run

Die Richtlinie muss in denselben Pipelines validierbar sein, die auch das
Produkt bauen:

- `typecheck`
- `build`
- `extension test`
- `formatter test`
- `error-translator test`

### 6. Processes

Renderer muessen so weit wie moeglich funktional und zustandsarm bleiben.
Persistent gehalten werden nur UI-bezogene Zustandsaspekte wie:

- aktueller View-Mode
- gesperrter Diagnostic-Kontext
- gepinnte Diagnostics
- Highlighter-Cache

### 10. Dev / Prod Parity

Tests muessen dieselben semantischen Renderer-Pfade validieren wie die
tatsaechliche Extension.

### 11. Logs

Webview-Fehler und Renderer-Fehler duerfen nicht still scheitern.
Der Webview-Adapter meldet daher Logs zur Extension zurueck.

## Verbindliche Konventionen

### 1. Single Source of Truth

**MUST**

- Rich-Display-Struktur muss aus
  `apps/vscode-extension/src/diagnosticRichContent.ts` stammen.
- Hover und Sidebar duerfen nicht jeweils eigene, voneinander driftende
  Strukturmodelle aufbauen.

**MUST NOT**

- keine zweite Autoritaet aus frei zusammengeklebten HTML-Strings
- keine Sidebar-spezifische ad-hoc-Struktur als neue Wahrheitsquelle

### 2. Sidebar-Surface

Die Sidebar ist die **host-owned Shell-Surface**.

Sie darf:

- HTML und DOM fuer die aeussere Struktur voll kontrollieren
- Cards, Header, Actions, Sections, Divider, Copy-Buttons und Layout-Rahmen
  selbst erzeugen
- sichere Code-/Type-Block-Darstellung bereitstellen

Sie muss:

- DOM ueber `document.createElement(...)` aufbauen
- generischen Content nur als Daten konsumieren
- Text ueber `textContent` oder kontrollierte Token-Nodes materialisieren

Sie darf nicht:

- `innerHTML` fuer generische Diagnostic-Payload verwenden
- fremde HTML-Fragmente aus Error-Texten oder Translations einbetten

### 3. Innere isolierte Ebene

Die innere Ebene ist **nicht HTML**, sondern Daten.

Aktuell besteht sie aus:

- `paragraph`
- `inlineCode`
- `codeBlock`
- `typeBlock`
- `list`
- `propertyList`

Konsequenz:

- generischer externer Content ist nur Payload
- die Shell kontrolliert die Darstellungsstruktur
- die Payload kontrolliert nie die HTML-Interpretation

### 4. Hover-Surface

Der Hover ist **kein Webview**, sondern ein nativer VS-Code-Surface.

Darum gelten folgende Regeln:

**MUST**

- der Hover-Body bleibt `MarkdownString`
- `supportHtml` fuer den Body bleibt `false`
- Actions werden separat und nur fuer whitelisted Commands trusted gemacht
- dieselbe semantische Struktur darf in Hover-Markdown materialisiert werden

**MUST NOT**

- kein globales `supportHtml = true` fuer den Body
- keine Rueckkehr zu trusted raw HTML im Hover

## Warum der Hover anders behandelt werden muss

Der Unterschied zwischen Sidebar und Hover ist technisch fundamental:

### Sidebar

- eigenes Webview-Dokument
- eigene CSS-Schicht
- eigener DOM-Baum
- eigene JS-Laufzeit
- eigene CSP- und Nachrichtenkanal-Kontrolle

### Hover

- kein eigenes HTML-Dokument
- kein eigener DOM-Baum
- keine freie CSS-/JS-Oberflaeche
- nur `MarkdownString` als Host-API
- HTML dort waere nur ein sanitisiertes Teilset innerhalb des Host-Renderers

Deshalb gilt:

- **gleiche Sicherheitslogik**: ja
- **gleiche semantische Struktur**: ja
- **gleiche host-owned HTML-Shell**: nein

Die Limitierung des Hover-Bereichs ist also eine **VS-Code-Produktgrenze**, keine
zufaellige Projektentscheidung.

## Syntax-Highlighting-Konvention

### Verbindlicher Stand

Die Sidebar verwendet jetzt **reines Shiki**.

Der Standard lautet:

- `vscode-shiki-bridge`: verboten
- `shiki`: erlaubt
- nur gebuendelte Shiki-Sprachen und gebuendelte Shiki-Themes

### Aktuelles Mapping

- `type` -> `typescript`
- `typescriptreact` -> `tsx`
- `javascriptreact` -> `jsx`

### Theme-Standard

Die Theme-Wahl fuer die Sidebar folgt derzeit:

- Dark -> `dark-plus`
- Light -> `light-plus`
- High Contrast Dark -> `github-dark-high-contrast`
- High Contrast Light -> `github-light-high-contrast`

### Architektonische Begruendung

Diese Wahl ist bewusst konservativ:

- kein Bridge-Layer zu VS-Code-Extension-Themes
- kein zusaetzlicher Runtime-Kopplungspunkt an Theme-/Grammar-Introspection
- weniger Fehlermoeglichkeiten im Build und in der Extension-Runtime

### Erwartungsmanagement

Diese Konvention garantiert **nicht** 1:1 dieselbe Farbgebung wie der VS-Code-Editor.

Sie garantiert stattdessen:

- stabilen, reproduzierbaren Highlighting-Standard
- explizite Dependency-Kontrolle
- klaren Fallback-Pfad ohne VS-Code-Theme-Bridge

## Typ-Formatierung und Wrapping

Fuer die Sidebar gilt:

- lange komplexe Inline-Types duerfen zu multiline Rich-Code-Darstellung
  angehoben werden
- die aktuelle Sidebar-Formatter-Schicht arbeitet mit 4er-Einrueckung
- komplexe Types werden als Lesbarkeitsoptimierung strukturiert umgebrochen

Die lokale Adapter-Implementierung dafuer liegt in:

- `apps/vscode-extension/src/provider/sidebarInlineTypeFormatter.ts`

Diese Schicht ist bewusst lokal gehalten, damit keine zusaetzliche riskante
Formatter-Runtime in den Extension-Webview-Pfad gezogen wird.

## Escaping-Konvention

Template-Literal-Types und andere Inhalte mit eingebetteten Backticks muessen
intakt bleiben.

Darum gilt:

- Code-Spans verwenden variable Backtick-Fence-Laengen
- Parser und Renderer muessen mehrfache Backtick-Fences korrekt verstehen
- ein Inhalt wie `` `${string}@${string}.${string}` `` darf nie einen aeusseren
  Markdown-Code-Span zerbrechen

Relevante Dateien:

- `packages/error-translator/src/getImprovedMessage.ts`
- `apps/vscode-extension/src/diagnosticRichContent.ts`

## Prohibitions

Folgendes ist fuer diese Konvention explizit verboten:

- untrusted Diagnostic-HTML im Webview
- `innerHTML` fuer generischen Payload-Content
- global trusted HTML im Hover-Body
- Rueckkehr zu `vscode-shiki-bridge`
- parallele, voneinander abweichende Rich-Display-Strukturmodelle

## Dateien mit Richtlinienautoritaet

Die aktuell massgeblichen Implementierungsorte fuer diese Konvention sind:

- `CONVENTIONS.md`
- `docs/conventions/diagnostic-rendering-surfaces.md`
- `apps/vscode-extension/src/diagnosticRichContent.ts`
- `apps/vscode-extension/src/hoverContent.ts`
- `apps/vscode-extension/src/provider/sidebarViewModel.ts`
- `apps/vscode-extension/src/provider/webviewViewProvider.ts`
- `apps/vscode-extension/src/provider/sidebarSyntaxHighlighter.ts`
- `apps/vscode-extension/src/provider/sidebarInlineTypeFormatter.ts`
- `apps/vscode-extension/webview/index.js`
- `apps/vscode-extension/webview/style.css`
- `packages/error-translator/src/getImprovedMessage.ts`

## Pflege der Konvention

Diese Konvention **MUSS** aktualisiert werden, wenn sich mindestens einer der
folgenden Punkte aendert:

- die Trust-Boundary zwischen Shell und Payload
- die Rich-Content-Zwischenrepraesentation
- die Hover-Strategie
- die Sidebar-Syntax-Highlighting-Strategie
- die Escaping-Regeln fuer Translation- oder Type-Content

Parallel dazu muessen die passenden Tests mitgezogen werden:

- Extension-Tests fuer Hover und Sidebar
- Translator-Tests fuer Escaping und Platzhalterersetzung
- Formatter-Tests fuer Typ-Formatierung und Wrapping
