# Referenzdokument: Workspace-Handoff zu den verbleibenden Y1-Befunden in `tmp/ts-error-translator`
[INTENT: KONTEXT]

---

## 0. Quellenbasis und Scope
[INTENT: KONTEXT]

- Workspace-Root: `C:\Projects\development-platform\vs-code\extensions\pretty-ts-errors`
- Fachlicher Zielbereich: `tmp/ts-error-translator`
- Verwendete Quellen fuer diesen Handoff:
  - aktueller Chat-Kontext inklusive des zuvor erstellten Security-Audits
  - `tmp/ts-error-translator/packages/searcher/src/index.ts`
  - `tmp/ts-error-translator/apps/vscode/src/extension.ts`
- Explizit aus dem Handoff ausgeschlossen:
  - `R1`
  - `O3`
  - `O2`
  - `Y3`
  - `O1`
- Ziel dieses Dokuments:
  - nur die beiden verbleibenden `Y1`-Themen auf Workspace-Ebene so aufbereiten, dass ein neuer Agent die Behebung direkt fortsetzen kann

---

## 1. Aufgabenuebersicht
[INTENT: KONTEXT]

Im Workspace `pretty-ts-errors` ist fuer den aktuell relevanten Unterbereich `tmp/ts-error-translator` nur noch ein enger Restscope offen. Dieser Restscope umfasst genau zwei `Y1`-Befunde:

1. der Workspace-Scanner in `tmp/ts-error-translator/packages/searcher/src/index.ts`
2. die Trusted-Markdown-Verwendung in `tmp/ts-error-translator/apps/vscode/src/extension.ts`

Das Problem beim Scanner ist keine Exfiltration und keine verdeckte Ausfuehrung, sondern eine zu breite lokale Read-/Discovery-Surface, weil der Scan-Root implizit aus `INIT_CWD` oder `process.cwd()` abgeleitet wird und danach rekursiv alle `ts/tsx`-Dateien liest. Das Problem beim Trusted Markdown ist keine bestaetigte Missbrauchslogik, sondern eine zu breit gesetzte VS-Code-Vertrauensgrenze, weil ein kompletter `MarkdownString` als trusted markiert wird, obwohl darin mehr als nur der notwendige Command-Link steckt.

Beide Themen muessen nicht als Malware-Befund behandelt werden. Beide muessen aber sauber eingegrenzt werden, damit spaetere Erweiterungen nicht unbemerkt eine groessere lokale Dateileseflaeche oder eine groessere Command-/Link-Trust-Surface erzeugen.

---

## 2. Informationsregister (INHALT-Einheiten)
[INTENT: REFERENZ]

| ID | Typ | Beschreibung | Veraenderung | Status |
|----|-----|-------------|-------------|--------|
| REQ-001 | ANFORDERUNG | Der rekursive Workspace-Scanner darf seinen Scan-Root nicht nur implizit aus `INIT_CWD` oder `process.cwd()` beziehen. | Ja | Offen |
| REQ-002 | ANFORDERUNG | Der Trusted-Markdown-Pfad in der VS Code Extension muss auf den minimal noetigen Trust-Scope reduziert werden. | Ja | Offen |
| CONV-001 | CONSTRAINT | Dieser Handoff behandelt absichtlich nur die beiden `Y1`-Befunde und listet die ausgeschlossenen Risikoklassen nicht erneut auf. | Nein | Aktiv |

---

## 3. Informationseinheiten
[INTENT: SPEZIFIKATION]

### 3.1 REQ-001: Workspace-Scanner muss einen expliziten und begrenzten Scan-Root haben
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Das Paket `@total-typescript/searcher` ist ein lokales Hilfstool, das Tip-Muster in Quellcode sucht. Der aktuelle Code baut den Scan-Root aus `process.env.INIT_CWD || process.cwd()` und traversiert danach rekursiv `./**/*.{ts,tsx}`. Anschliessend wird jede gefundene Datei mit `readFile(..., 'utf-8')` vollstaendig gelesen und an `getTipsFromFile()` uebergeben.

Das ist fuer den Zweck des Tools plausibel, aber die Vertrauensgrenze ist zu offen: Der effektive Suchraum haengt vom Aufrufkontext ab und ist nicht als explizite Fachentscheidung im Tool modelliert. Dadurch kann das Tool mehr vom lokalen Workspace lesen als eigentlich beabsichtigt, wenn es aus einem unerwarteten Root gestartet wird.

**Ist-Zustand:**
- In `tmp/ts-error-translator/packages/searcher/src/index.ts` wird der Root hier implizit gebildet:
  - `path.resolve(process.env.INIT_CWD || process.cwd(), './**/*.{ts,tsx}')`
- Die Traversierung erfolgt ueber `fast-glob`.
- Die Ignore-Liste enthaelt nur:
  - `**/node_modules/**`
  - `**/dist/**`
  - `**/DefinitelyTyped/**`
- Jede gefundene Datei wird danach gelesen:
  - `const fileContents = await readFile(file, 'utf-8');`
- Es gibt aktuell keinen expliziten Root-Parameter, keine bestaetigte Root-Grenze und keine Sichtbarmachung des final aufgeloesten Scan-Ziels vor dem Read.

**Soll-Zustand:**
Die Behebung muss das Ergebnis liefern, dass der Scan-Root nicht mehr nur implizit aus Prozesskontext stammt. Der Scanner muss vor dem rekursiven Lesen klar an einen beabsichtigten lokalen Zielbereich gebunden werden.

Das Minimalziel der Behebung ist:
- der effektive Scan-Root muss explizit bestimmt werden
- der effektive Scan-Root muss fuer den Aufrufer nachvollziehbar sein
- der rekursive Read darf nur ueber diesen bewusst gewaehlten Zielbereich laufen

Was noch **nicht** festgelegt ist:
- ob die Bindung ueber einen CLI-Parameter, eine interaktive Bestaetigung oder eine andere Root-Festlegung umgesetzt wird

Was jedoch **verbindlich** ist:
- `INIT_CWD || process.cwd()` alleine reicht als Sicherheitsgrenze nicht aus
- der Scanner darf nicht stillschweigend einen zu grossen lokalen Baum einlesen

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `tmp/ts-error-translator/packages/searcher/src/index.ts` | EnthaeIt die Root-Aufloesung, die rekursive Traversierung und den Datei-Read. | `run()`, `toIgnore`, `fg.default(...)`, `readFile(...)` |
| `tmp/ts-error-translator/packages/searcher/package.json` | Zeigt, dass das Tool ueber den aktuellen Arbeitskontext gestartet wird. | Script `go`, Nutzung von `INIT_CWD` |

**✅ Positivbeispiel(e):**

```ts
const scanRoot = resolvedUserProvidedRoot;

const files = await fg.default(path.join(scanRoot, '**/*.{ts,tsx}'), {
  ignore: toIgnore,
});
```

Dieses Muster ist korrekt, weil der rekursive Read an einen bewusst festgelegten Root gebunden ist.

**❌ Negativbeispiel(e):**

```ts
const files = await fg.default(
  path.resolve(process.env.INIT_CWD || process.cwd(), './**/*.{ts,tsx}'),
  { ignore: toIgnore },
);
```

Dieses Muster ist hier falsch, weil der effektive Scan-Root nur aus dem Laufkontext abgeleitet wird und nicht als explizit begrenzte Fachentscheidung sichtbar ist.

---

### 3.2 REQ-002: Trusted Markdown muss auf den minimal noetigen Trust-Scope reduziert werden
[INTENT: SPEZIFIKATION]

**Typ:** ANFORDERUNG

**Beschreibung:**
Die VS Code Extension baut Hover-Inhalte als `MarkdownString` und markiert den gesamten String mit `isTrusted = true` und `supportHtml = true`. Im selben String werden sowohl sichtbare Texte (`thisTip.name`, `thisTip.message`, Linktext) als auch ein Command-URI fuer `ts-error-translator.dont-show-again` zusammengefuehrt.

Der Befund ist nicht, dass aktuell user-kontrollierter Input in diesen Pfad gelangt. Der Befund ist, dass die Vertrauensgrenze zu breit definiert ist. Der Code vertraut einem kompletten generierten Markdown-Block, obwohl nur ein kleiner Teil davon zwingend trust-benoetigt ist.

**Ist-Zustand:**
- In `tmp/ts-error-translator/apps/vscode/src/extension.ts` wird pro Hover ein `MarkdownString` aufgebaut.
- Der Inhalt setzt sich zusammen aus:
  - `thisTip.name`
  - `thisTip.message`
  - `thisTip.link.url`
  - einem Command-Link auf `ts-error-translator.dont-show-again`
- Danach wird derselbe String pauschal als trusted markiert:
  - `mdString.isTrusted = true;`
  - `mdString.supportHtml = true;`
- Die aktuellen Tip-Daten stammen aus internen, statischen Quellen und nicht aus Benutzereingaben. Deshalb ist der Befund `Y1` und nicht hoeher.

**Soll-Zustand:**
Die Behebung muss den Trust-Scope auf das minimal noetige Mass reduzieren.

Verbindliche Zielbedingungen:
- Trusted Markdown darf nur fuer den Teil verwendet werden, der den Trust wirklich braucht
- frei kombinierte oder spaeter erweiterbare Textinhalte duerfen nicht pauschal im selben trusted Block landen
- es darf keine spaetere stillschweigende Oeffnung entstehen, bei der zusaetzliche oder user-nahe Inhalte automatisch denselben trusted Pfad benutzen

Was noch **nicht** festgelegt ist:
- ob die Behebung ueber getrennte Markdown-Bloecke, eine engere Trust-Whitelisting-Strategie oder eine andere, gleichwertig enge Aufteilung erfolgt

Was jedoch **verbindlich** ist:
- der gesamte zusammengesetzte Hover-String darf nicht dauerhaft breit trusted bleiben
- der Command-/Link-Trust muss vom restlichen Inhalt so weit wie moeglich entkoppelt werden

**Dateireferenzen:**

| Dateipfad | Relevanz | Relevante Elemente |
|-----------|----------|-------------------|
| `tmp/ts-error-translator/apps/vscode/src/extension.ts` | EnthaeIt den kompletten Hover-Aufbau und die Trusted-Markdown-Markierung. | `hoverProvider`, `MarkdownString`, `mdString.isTrusted`, `mdString.supportHtml` |
| `tmp/ts-error-translator/packages/parser/src/tipInfo.ts` | Zeigt, dass die aktuellen Inhalte aus statischen, repo-internen Tip-Daten stammen. | `tipInfo`, `name`, `message`, `link.url` |

**✅ Positivbeispiel(e):**

```ts
const body = new vscode.MarkdownString();
body.appendText(thisTip.message ?? '');

const trustedActions = new vscode.MarkdownString(markAsLearnedText);
trustedActions.isTrusted = true;
```

Dieses Muster ist korrekt, weil der sichtbare Inhalt nicht automatisch denselben Trust-Scope wie der Command-Link erhaelt.

**❌ Negativbeispiel(e):**

```ts
const mdString = new vscode.MarkdownString(
  `**${thisTip.name}**\n\n${thisTip.message}\n\n${linkText} | ${markAsLearnedText}`,
);
mdString.isTrusted = true;
mdString.supportHtml = true;
```

Dieses Muster ist hier falsch, weil der komplette zusammengebaute Hover-Block trusted wird, obwohl nur ein Teil davon den Trust wirklich benoetigt.

---

### 3.3 CONV-001: Dieser Handoff ist absichtlich auf zwei Y1-Themen begrenzt
[INTENT: CONSTRAINT]

**Typ:** CONSTRAINT

**Beschreibung:**
Dieser Handoff ist kein Voll-Audit-Neuaufguss. Er ist absichtlich auf die zwei verbleibenden `Y1`-Themen beschraenkt:

- Workspace-Scanner
- Trusted Markdown

Die zuvor genannten Risikoklassen `R1`, `O3`, `O2`, `Y3` und `O1` sollen in diesem Handoff nicht erneut ausformuliert werden.

---

## 4. Konventionen & Constraints
[INTENT: CONSTRAINT]

- Der Handoff gilt auf Workspace-Ebene, aber der fachliche Reparaturfokus liegt in `tmp/ts-error-translator`.
- Es sollen nur die beiden verbleibenden `Y1`-Themen bearbeitet werden.
- Es sollen keine ausgeschlossenen Risikoklassen erneut dokumentiert oder priorisiert werden.
- Der neue Agent muss zwischen Problemkern und verbindlichem Behebungsziel unterscheiden:
  - Problemkern = aktuelle zu breite lokale Read-/Discovery-Surface bzw. zu breite Trusted-Markdown-Surface
  - Behebungsziel = engerer, expliziter Root beim Scanner bzw. minimaler Trust-Scope beim Hover-Markdown
- Wo die genaue Implementierungsvariante noch nicht festgelegt ist, darf kein neuer Agent stillschweigend neue Architektur erfinden. Er muss die Behebung am verbindlichen Zielzustand ausrichten.

---

## 5. Dateipfad-Index
[INTENT: REFERENZ]

| # | Dateipfad | Relevanz | Zugehoerige Einheit-IDs |
|---|-----------|----------|----------------------|
| 1 | `tmp/ts-error-translator/packages/searcher/src/index.ts` | Scanner-Root, Traversierung und Datei-Read | REQ-001 |
| 2 | `tmp/ts-error-translator/packages/searcher/package.json` | Aufrufkontext des Scanner-Tools | REQ-001 |
| 3 | `tmp/ts-error-translator/apps/vscode/src/extension.ts` | Hover-Aufbau, Command-Link und Trusted Markdown | REQ-002 |
| 4 | `tmp/ts-error-translator/packages/parser/src/tipInfo.ts` | Statische Quelle der aktuellen Tip-Inhalte | REQ-002 |

---

## 6. Ausfuehrungskontext fuer LLM-Agents
[INTENT: KONTEXT]

Der nachfolgende Agent muss **nicht** erneut das ganze Security-Audit aufrollen. Er muss nur diese beiden Punkte weiterverfolgen:

1. `REQ-001` in `tmp/ts-error-translator/packages/searcher/src/index.ts`
2. `REQ-002` in `tmp/ts-error-translator/apps/vscode/src/extension.ts`

Empfohlene Arbeitsreihenfolge:

1. zuerst `REQ-001`, weil der Scanner eine direkte Workspace-Read-Surface ist
2. danach `REQ-002`, weil der Trusted-Markdown-Pfad eine VS-Code-Vertrauensgrenze betrifft

Nicht neu zu klaeren:

- dass beide Themen aktuell als `Y1` eingeordnet sind
- dass die ausgeschlossenen Risikoklassen in diesem Handoff nicht wieder ausgefuehrt werden sollen

Noch offen und bei der Umsetzung bewusst zu entscheiden:

- die konkrete API-/UX-Form fuer die explizite Root-Bindung des Scanners
- die konkrete technische Aufteilung, mit der der Trusted-Markdown-Scope minimal gemacht wird

Verbindlich ist nur das Ergebnis:

- der Scanner muss einen expliziten, eng begrenzten lokalen Zielbereich bekommen
- der Hover-Markdown muss nur noch dort trusted sein, wo Trust technisch wirklich noetig ist
