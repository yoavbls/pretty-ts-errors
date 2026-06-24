# Referenzdokument: Workspace-Handoff zur PNPM-, Nx-, Extension-Delivery- und Local-Translator-Migration in `pretty-ts-errors`
[INTENT: KONTEXT]

---

## 0. Quellenbasis und Scope-Grenzen
[INTENT: KONTEXT]

**Workspace-Root:** `C:\Projects\development-platform\vs-code\extensions\pretty-ts-errors`

**Quellemodus:** `CURRENT_CONTEXT_DEFAULT` mit expliziten Zusatzreferenzen aus dem laufenden Chat-Kontext.

**Freigegebene Quellenbasis fuer diesen Handoff:**

- die komplette aktuelle Konversation von Beginn bis zu diesem Stand
- der bestaetigte Migrationsplan `nx-pnpm-translator-migration_c751d78b.plan.md` als Arbeitsreferenz
- die in dieser Session gelesenen AI-Base-Referenzen fuer:
  - PNPM Fortress Core / Monorepo Boilerplate / Omitted Properties / Trust-Downgrade Response Order
  - Nx `project.json` Governance
  - Nx TypeScript Workspace Governance
  - Nx Shared Package Build Orchestration
  - VS Code Extension PNPM-first Bundle-first Delivery
- die in dieser Session gelesenen bestehenden Handoff-Dokumente:
  - `HANDOFF_O3_O1_LOCAL_TRANSLATOR.md`
  - `HANDOFF_Y1_WORKSPACE_SCANNER_TRUSTED_MARKDOWN.md`
- die in dieser Session gelesenen und/oder geaenderten Workspace-Dateien
- die in dieser Session ausgefuehrten Validierungs- und Installationslaeufe

**Explizit nicht Ziel dieses Dokuments:**

- keine Neuinterpretation ausserhalb des aktuellen Kontexts
- keine autonome Projekt-Neusuche ausserhalb der bereits verwendeten Quellen
- keine Erfindung neuer Architekturziele, die nicht bereits im Kontext entstanden sind
- keine Bearbeitung oder Loeschung der zwei bestehenden Handoff-Berichte

**Wichtig zur Scope-Treue:**

- dieses Dokument ist der dritte Workspace-Handoff-Bericht
- die bestehenden zwei Handoffs wurden **nicht** bearbeitet
- dieser Bericht beschreibt den **aktuellen Stand** inkl. erledigter Arbeit, offener Themen, Blocker, Entscheidungen und Dateioberflaechen

---

## 1. Aufgabenuebersicht
[INTENT: KONTEXT]

Der Benutzer hat in dieser Session eine grosse Architektur- und Migrationsaufgabe fuer `pretty-ts-errors` gestartet.

Die uebergeordnete Zielrichtung war:

1. das aktuelle `npm`-/`turbo`-Workspace-Setup auf ein `pnpm@11.7.0`-basiertes Fortress-Monorepo umzustellen
2. `turbo` vollstaendig durch `nx` zu ersetzen
3. die VS Code Extension Delivery auf eine PNPM-first / bundle-first / offizielle `@vscode/vsce --no-dependencies`-Architektur umzustellen
4. die TypeScript-/ESM-Lane neu zu ordnen
5. den lokalen `ts-error-translator` aus `tmp/ts-error-translator` spaeter in ein internes Package unter `packages/` zu integrieren
6. O1/O3/Y1-bezogene Sicherheits- und Handoff-Folgeschritte erst **nach** der Monorepo-/Package-Manager-/Delivery-Umstellung anzugehen

Der Benutzer hat spaeter zusaetzlich klargestellt:

- Node-Toolchain fuer das Monorepo: `26.2.0`
- Package-Manager: `pnpm 11.7.0`
- ESM statt CommonJS
- `tsconfig` auf `ESNext`
- `@types/node` in der spaetesten durch Minimum-Release-Age erlaubten Linie
- Nx soll **nativ** genutzt werden
- im Nx-Monorepo sollen Leaf-`package.json`-Skripte nicht die Orchestrierung tragen; semantische Tasks sollen in `project.json` liegen
- `tmp/**` und `examples/**` sind keine produktiven Oberflaechen und duerfen nicht in die produktive App-Type-/Build-Oberflaeche hineinbluten

Der Benutzer hat zusaetzlich bestaetigt:

- eine unerwartet geaenderte Produktidentitaet in `apps/vscode-extension/package.json` (`publisher`, `repository.url`, `homepage`) soll als beabsichtigt behandelt und **beibehalten** werden

---

## 2. Informationsregister
[INTENT: REFERENZ]

| ID | Typ | Beschreibung | Veraenderung | Status |
|----|-----|--------------|--------------|--------|
| REQ-001 | ANFORDERUNG | Root-Control-Plane auf `pnpm@11.7.0` + Fortress-Workspace umstellen | Ja | Erledigt |
| REQ-002 | ANFORDERUNG | `turbo` vollstaendig durch `nx` ersetzen | Ja | Erledigt |
| REQ-003 | ANFORDERUNG | VS Code Extension Delivery auf PNPM-first / bundle-first / `@vscode/vsce --no-dependencies` umstellen | Ja | Grossteils erledigt |
| REQ-004 | ANFORDERUNG | Translator-Logik spaeter unter `packages/` statt `apps/` integrieren | Nein | Architektur festgelegt, Umsetzung offen |
| REQ-005 | ANFORDERUNG | TypeScript-/Tooling-Stand auf 2026 anheben | Ja | Teilweise erledigt |
| REQ-006 | ANFORDERUNG | `tmp/**` und `examples/**` nicht produktiv mitbauen / mittypechecken | Ja | Erledigt fuer die produktive App-Lane |
| REQ-007 | ANFORDERUNG | Leaf-`package.json`-Skripte duerfen im Nx-Monorepo nicht die Task-Orchestrierung tragen | Ja | Erledigt |
| DEC-001 | ENTSCHEIDUNG | Root-Toolchain bleibt `Node 26.2.0`, auch wenn VS Code Stable embedded Node `24.16.0` nutzt | Ja | Aktiv |
| DEC-002 | ENTSCHEIDUNG | ESM-Zielarchitektur fuer die Extension; Node-Extension-Host only | Ja | Aktiv |
| DEC-003 | ENTSCHEIDUNG | Build- und Typecheck-Lane der Extension werden getrennt gefuehrt | Ja | Aktiv |
| DEC-004 | ENTSCHEIDUNG | `trustPolicyExclude` fuer `semver@6.3.1` ist aktuell notwendig | Ja | Aktiv |
| DEC-005 | ENTSCHEIDUNG | `registrySupportsTimeField` bleibt gemaess Referenz und verifiziertem Registry-Verhalten auf `false` | Ja | Aktiv |
| WARN-002 | WARNUNG | `skipTypeCheck` ist im Extension-Build aktuell `true`, obwohl der Benutzer spaeter `false` wollte | Nein | Offen |
| INFO-001 | INFORMATION | `apps/vscode-extension/package.json` verwendet aktuell `CyberT33N`-Identitaet und wurde auf Benutzerbestaetigung hin beibehalten | Nein | Aktiv |
| INFO-002 | INFORMATION | Ein `.vsix` wurde bereits erfolgreich unter `artifacts/vsix/pretty-ts-errors-0.8.7.vsix` erzeugt | Nein | Aktiv |

---

## 3. Current-State-Handoff
[INTENT: SPEZIFIKATION]

### 3.1 Root-Control-Plane und PNPM-Fortress-Status
[INTENT: SPEZIFIKATION]

**Ist-Zustand vor der Migration:**

- Root `package.json` war `npm`-/`turbo`-basiert
- `packageManager` stand auf `npm@10.0.0`
- `turbo.json` war die Root-Orchestrierung
- `package-lock.json` existierte
- es gab kein `pnpm-workspace.yaml`
- es gab kein `nx.json`

**Jetzt umgesetzter Stand:**

- Root `package.json` fuehrt jetzt nur noch die Root-Control-Plane:
  - `packageManager: "pnpm@11.7.0"`
  - `devEngines.packageManager`
  - `devEngines.runtime` mit `node 26.2.0`
- Root-`scripts` wurden aus `package.json` entfernt; Root-Orchestrierung laeuft ueber `project.json`
- neues `pnpm-workspace.yaml` als Fortress-Monorepo-Oberflaeche wurde erstellt
- `package-lock.json` wurde geloescht
- `turbo.json` wurde geloescht

**Wichtige PNPM-Fortress-Details im aktuellen Workspace:**

- `minimumReleaseAge: 10080`
- `minimumReleaseAgeIgnoreMissingTime: false`
- `minimumReleaseAgeStrict: true`
- `trustPolicy: no-downgrade`
- `blockExoticSubdeps: true`
- `strictDepBuilds: true`
- `allowBuilds` ist explizit befuellt statt global offen
- `resolutionMode: time-based`
- `registrySupportsTimeField: false`
- `catalogMode: strict`

**Verifizierter Installationsstatus:**

- `pnpm install` laeuft erfolgreich unter `pnpm v11.7.0`
- der Workspace hat jetzt ein `pnpm-lock.yaml`
- `nx@23.0.0` ist explizit in `allowBuilds` freigegeben, weil dessen `postinstall` in diesem Install-Domain gebraucht wird

---

### 3.2 Warum `trustPolicyExclude` statt `overrides` fuer `semver@6.3.1`
[INTENT: SPEZIFIKATION]

Diese Session hat den Trust-Downgrade-Pfad gemaess Referenz abgearbeitet:

1. **zuerst Updates / neuere freigegebene Versionen**
2. **dann** nur wenn moeglich ein enger Override-Repair
3. **erst danach** exakte `trustPolicyExclude`

Das wurde konkret auf den relevanten Graphen angewendet:

- `@nx/js@23.0.0`
- zieht `@babel/core@7.29.7`
- `@babel/core@7.29.7` deklariert `semver: ^6.3.1`
- in der relevanten `6.3.x`-Linie existieren nur:
  - `6.3.0`
  - `6.3.1`

**Warum kein `override`:**

- ein zulassiger Repair muesste contract-kompatibel innerhalb der erlaubten Linie liegen
- `6.3.0` ist **unterhalb** des Contract-Floors `^6.3.1`
- `6.3.1` ist genau die geblockte Version
- damit existiert **kein** erlaubter enger Patch-Repair

**Daher ist die aktuelle korrekte Reaktion:**

- `trustPolicyExclude: [semver@6.3.1]`

Die Begruendung steht auch als Kommentar direkt in `pnpm-workspace.yaml`.

**Wichtige Folgepflicht:**

- sobald `@nx/js` / `@babel/core` einen trust-konformen Graphen liefern, muss diese Ausnahme wieder entfernt werden

---

### 3.3 `registrySupportsTimeField` ist weiterhin `false`
[INTENT: SPEZIFIKATION]

**Aktueller Status:**

- `registrySupportsTimeField` steht aktuell weiterhin auf `false`

**Warum diese Abweichung entstanden ist:**

- die offizielle PNPM-Dokumentation und Live-Checks in dieser Session zeigen:
  - `resolutionMode: time-based` braucht npm-**full metadata**
  - `registrySupportsTimeField: true` ist nur korrekt, wenn die Registry das `time`-Feld bereits im **abbreviated metadata**-Pfad liefert
  - fuer `registry.npmjs.org` ist das in dem hier verwendeten Metadatenpfad **nicht** gegeben
- ein Live-Check fuer `@eslint/js` zeigte:
  - abbreviated metadata: **kein** `time`
  - full metadata: `time` **vorhanden**

**Konsequenz:**

- mit `registrySupportsTimeField: true` brach der Workspace in dieser Session real mit `ERR_PNPM_MISSING_TIME`

**Aktuelle Entscheidung:**

- der Benutzer hat spaeter explizit bestaetigt, dass diese Property gemaess Referenz auf `false` bleiben soll
- das ist im aktuellen Registry-Setup mit `registry.npmjs.org` auch technisch die korrekte Haltung
- `true` waere erst dann wieder zulaessig, wenn eine andere Registry-/Mirror-Architektur oder ein verifizierter Metadatenpfad das `time`-Feld im abbreviated response konsistent liefert

---

### 3.4 Nx-Control-Plane und Task-Semantik
[INTENT: SPEZIFIKATION]

**Neue Root-Oberflaechen:**

- `nx.json`
- `project.json` am Workspace-Root
- `project.json` fuer:
  - `packages/utils`
  - `packages/formatter`
  - `packages/vscode-formatter`
  - `apps/vscode-extension`

**Wichtige Nx-Entscheidungen:**

- `@nx/js/typescript` ist auf `packages/**/*` als standardisierte TypeScript-Governance aktiv
- Shared Packages nutzen jetzt explizite `@nx/js:tsc`-Build-Targets
- die VS Code Extension nutzt `@nx/esbuild:esbuild`
- Leaf-`package.json`-Skripte wurden als Orchestrierungsoberflaechen entfernt
- Root-Format-/Sync-Funktionen leben jetzt im Root-`project.json`

**Verifizierter Nx-Status:**

- `nx show projects` erkennt aktuell:
  - `@pretty-ts-errors/utils`
  - `@pretty-ts-errors/formatter`
  - `@pretty-ts-errors/vscode-formatter`
  - `pretty-ts-errors`
  - `workspace-root`
- `nx sync:check` ist erfolgreich
- `nx build @pretty-ts-errors/utils` ist erfolgreich
- `nx build @pretty-ts-errors/formatter` ist erfolgreich
- `nx build @pretty-ts-errors/vscode-formatter` ist erfolgreich
- `nx build pretty-ts-errors` ist erfolgreich

---

### 3.5 TypeScript-/ESM-Umstellung
[INTENT: SPEZIFIKATION]

**Root-TS-Stand:**

- `tsconfig.base.json` wurde auf:
  - `target: ESNext`
  - `module: ESNext`
  - `moduleResolution: Bundler`
  umgestellt

**Shared Packages:**

- `packages/utils`
- `packages/formatter`
- `packages/vscode-formatter`

wurden auf buildbare Nx-Paketoberflaechen umgestellt:

- `tsconfig.lib.json`
- `project.json`
- ESM-Package-Surface via `type: module`
- `exports`-Eintraege
- public `dist/index.*`-Vertrag

**App-Surface:**

- `apps/vscode-extension/package.json` hat jetzt `type: "module"`
- die App-Type-Surfaces wurden in zwei Rollen getrennt:
  - `tsconfig.app.json`
  - `tsconfig.test.json`

**Wichtige App-Korrekturen:**

- lokale LSP-Diagnostic-Konvertierung ueber `src/lspDiagnostic.ts`
- kein Runtime-Deep-Import mehr als Designentscheidung fuer diesen Pfad
- `tmp/**` und `examples/**` sind ueber `.nxignore` aus der Nx-Nebenflaeche ausgeschlossen

---

### 3.6 VS Code Extension Delivery
[INTENT: SPEZIFIKATION]

**Manifest-/Produktoberflaeche:**

- `displayName` ist jetzt:
  - `Pretty TypeScript Errors [Secured]`
- `publisher`, `repository.url` und `homepage` sind aktuell:
  - `CyberT33N`
  - `https://github.com/CyberT33N/pretty-ts-errors`
- diese Identitaetsaenderung wurde nicht von mir initiiert, aber spaeter vom Benutzer explizit bestaetigt und daher beibehalten

**Delivery-Oberflaechen:**

- `.vscodeignore` fuer die VSIX-Strategie wurde eingefuehrt
- `.vscode/tasks.json` und `.vscode/launch.json` wurden auf Nx-Tasks / `dist/**`-Bundle-Vertrag umgestellt
- `apps/vscode-extension/scripts/build.js` wurde entfernt
- neues `apps/vscode-extension/scripts/package-vsix.mjs` wurde erstellt

**Aktuelle Packaging-Logik:**

- `pretty-ts-errors:typecheck`
- `pretty-ts-errors:build:production`
- `apps/vscode-extension/scripts/package-vsix.mjs`

Das Packaging-Skript erledigt:

- Stage-Directory
- Kopie von `dist/`, `assets/`, `syntaxes/`, `webview/`
- staged `package.json`
- Materialisierung von `catalog:`-Dependencies
- `NODE_PATH`- / `node_modules`-Bridge fuer `@vscode/vsce`
- offizielles `vsce package --no-dependencies`

**Verifizierter Delivery-Status:**

- `tsc -p apps/vscode-extension/tsconfig.app.json --noEmit` ist erfolgreich
- `tsc -p apps/vscode-extension/tsconfig.test.json --noEmit` ist erfolgreich
- `nx run pretty-ts-errors:build:production` ist erfolgreich
- `nx run pretty-ts-errors:package` ist erfolgreich
- vorhandenes Artefakt:
  - `artifacts/vsix/pretty-ts-errors-0.8.7.vsix`

**Wichtige operative Beobachtung:**

- vor dem final erfolgreichen Produktions-Build gab es ein `EPERM` auf `apps/vscode-extension/dist`
- die saubere Behebung war das rekursive Entfernen des alten `dist`-Verzeichnisses
- danach war `build:production` wieder gruen
- Nx markierte `pretty-ts-errors:build:production` als flaky task, weil in derselben Session ein frueherer Fehllauf existierte

---

### 3.7 `skipTypeCheck` ist aktuell noch `true`
[INTENT: SPEZIFIKATION]

**Aktueller Status:**

- im App-`project.json`
  - `build`
  - `dev`
  stehen aktuell beide auf:
  - `skipTypeCheck: true`

**Warum das aktuell so ist:**

- die Bundle-Lane sollte nicht am kompletten Workspace- oder Beispiel-/`tmp`-Noise scheitern
- deshalb wurde die App-Typecheck-Lane explizit getrennt:
  - `typecheck` target mit `tsconfig.app.json`
  - Build/Bundle target mit `@nx/esbuild`
  - Packaging target fuehrt aktuell zuerst `typecheck`, dann `build:production`, dann `package-vsix.mjs` aus

**Wichtige offene Benutzeranforderung:**

- der Benutzer hat spaeter explizit gesagt, `skipTypeCheck` muesse eigentlich auf `false`

**Daraus folgt fuer die Fortsetzung:**

- das Thema ist **nicht erledigt**
- aktuell existiert eine funktionierende, getrennte Architektur
- aber die Benutzerforderung nach `skipTypeCheck: false` ist noch offen und muss bewusst gegen die aktuelle Lane-Trennung entschieden oder umgesetzt werden

---

### 3.8 `tmp/**` und `examples/**`
[INTENT: SPEZIFIKATION]

Der Benutzer hat spaeter klargestellt:

- `tmp` ist kein produktiver Teil des Produktbaus
- `examples` ist kein produktiver Teil des Produktbaus

Der aktuelle Stand dazu:

- `.nxignore` enthaelt:
  - `tmp/**`
  - `examples/**`
- die produktive App-Typecheck-Lane wurde auf `tsconfig.app.json` eingegrenzt
- die Test-Lane wurde auf `tsconfig.test.json` eingegrenzt

**Wichtig:**

- `tmp/ts-error-translator` ist weiterhin im Repository vorhanden
- das ist absichtlich so, weil die spaetere Translator-Extraktion aus diesem Clone noch aussteht

---

### 3.9 Translator-Extraktion: aktueller Stand
[INTENT: SPEZIFIKATION]

Der eigentliche lokale Translator-Einbau ist **noch nicht umgesetzt**.

Was bereits erfolgt ist:

- die Upstream-Struktur in `tmp/ts-error-translator` wurde architektonisch ausgewertet
- bestaetigt wurde:
  - Zielort spaeter `packages/error-translator/`
  - nicht `apps/`
- bestaetigt wurde:
  - der relevante Kern sitzt primar in `packages/engine`
  - `parser`, `searcher` und die Upstream-VSCode-App sind fuer O1 nicht der primaere Kern
- die `move_paths`-Schemaflaeche des Dateisystem-Tools wurde gelesen

Was **noch offen** ist:

- `packages/error-translator/` anlegen
- benoetigte Engine-Dateien physisch verschieben
- bundling-/generated-data-Lane fuer `bundleErrors`/`tsErrorMessages` aufbauen
- internes Package `project.json`, `package.json`, `tsconfig` und Nx-Ziele anlegen
- lokale API fuer die Extension-/Formatter-Integration schaffen

---

### 3.10 TypeScript-2026-Refresh: aktueller Stand
[INTENT: SPEZIFIKATION]

**Bereits umgesetzt:**

- Root `typescript` auf die aktuelle durch Minimum-Release-Age erlaubte Linie:
  - `6.0.3`
- `@types/node` auf:
  - `25.9.3`
- `eslint` auf:
  - `10.5.0`
- `@eslint/js` auf:
  - `10.0.1`
- `typescript-eslint` auf:
  - `8.61.1`
- `@types/vscode` auf:
  - `1.120.0`
- `@vscode/test-electron` auf:
  - `3.0.0`
- `vscode-languageclient` auf:
  - `10.0.0`
- `@vscode/vsce` auf:
  - `3.9.2`

**Noch offen:**

- der inhaltliche 2026-Refresh der Translator-Datenbasis gegen die installierten TypeScript-Quellen
- die eigentliche Auswertung und Integration der neuen TS-Deklarationen fuer den Translator

---

### 3.11 Noch nicht angegangene O1/O3/Y1-Folgearbeit
[INTENT: SPEZIFIKATION]

Die folgenden fachlichen Arbeitspakete sind noch **nicht** umgesetzt:

1. **Remote-Translator-Egress entfernen**
   - `packages/vscode-formatter/src/components/actions.ts`
   - `lz-string`-Pfad
   - externe `ts-error-translator.vercel.app`-Nutzung

2. **Plain-English-Translator lokal integrieren**
   - neues internes `packages/error-translator`

3. **WebView-/Hover-Haertung**
   - strukturierter Datenpfad statt HTML-String-Pipeline
   - `innerHTML`-Reduktion / Ersetzung
   - Trusted-Markdown-/supportHtml-Haertung

4. **Bestehende Handoff-Berichte refactoren**
   - `HANDOFF_O3_O1_LOCAL_TRANSLATOR.md`
   - `HANDOFF_Y1_WORKSPACE_SCANNER_TRUSTED_MARKDOWN.md`

Diese Punkte waren vom Benutzer bewusst nachgelagert und sollten erst nach der Monorepo-/Package-Manager-/Delivery-Umstellung kommen.

---

## 4. Dateiinventar der in dieser Session veraenderten Hauptoberflaechen
[INTENT: REFERENZ]

### 4.1 Neu erstellt

- `pnpm-workspace.yaml`
- `nx.json`
- `project.json`
- `.nxignore`
- `packages/utils/project.json`
- `packages/formatter/project.json`
- `packages/vscode-formatter/project.json`
- `packages/utils/tsconfig.lib.json`
- `packages/formatter/tsconfig.lib.json`
- `packages/vscode-formatter/tsconfig.lib.json`
- `apps/vscode-extension/project.json`
- `apps/vscode-extension/tsconfig.app.json`
- `apps/vscode-extension/tsconfig.test.json`
- `apps/vscode-extension/.vscodeignore`
- `apps/vscode-extension/scripts/package-vsix.mjs`
- `apps/vscode-extension/src/lspDiagnostic.ts`
- `HANDOFF_WORKSPACE_NX_PNPM_EXTENSION_DELIVERY_TRANSLATOR_2026_06_24.md` (dieser Bericht)

### 4.2 Aktualisiert

- `package.json`
- `.gitignore`
- `tsconfig.base.json`
- `.vscode/tasks.json`
- `.vscode/launch.json`
- `.vscode/settings.json`
- `packages/utils/package.json`
- `packages/formatter/package.json`
- `packages/vscode-formatter/package.json`
- `packages/utils/src/index.ts`
- `packages/formatter/src/addMissingParentheses.ts`
- `apps/vscode-extension/package.json`
- `apps/vscode-extension/tsconfig.json`
- `apps/vscode-extension/src/diagnostics.ts`
- `apps/vscode-extension/src/provider/selectedTextHoverProvider.ts`
- `apps/vscode-extension/src/formattedDiagnosticsStore.ts`
- `apps/vscode-extension/src/provider/webviewViewProvider.ts`
- `apps/vscode-extension/src/test/runTest.ts`

### 4.3 Geloescht

- `turbo.json`
- `package-lock.json`
- `apps/vscode-extension/scripts/build.js`

---

## 5. Aktueller Verifikationsstand
[INTENT: REFERENZ]

**Erfolgreich verifiziert in dieser Session:**

- `pnpm install`
- `nx sync:check`
- `nx build @pretty-ts-errors/utils`
- `nx build @pretty-ts-errors/formatter`
- `nx build @pretty-ts-errors/vscode-formatter`
- `nx build pretty-ts-errors`
- `tsc -p apps/vscode-extension/tsconfig.app.json --noEmit`
- `tsc -p apps/vscode-extension/tsconfig.test.json --noEmit`
- `nx run pretty-ts-errors:build:production`
- `nx run pretty-ts-errors:package`

**Erzeugtes Release-Artefakt:**

- `artifacts/vsix/pretty-ts-errors-0.8.7.vsix`

**Wichtiger Hinweis:**

- der Package-/Build-Pfad war waehrend der Session temporär sensitiv gegen alte `dist`-Reste
- nach rekursivem Entfernen von `apps/vscode-extension/dist` war der Produktions-Build wieder gruen

---

## 6. Offene Punkte und Blocker fuer die naechste Fortsetzung
[INTENT: SPEZIFIKATION]

### 6.1 Noch offene fachliche Anforderungen

1. `skipTypeCheck` in `apps/vscode-extension/project.json` soll aus Benutzersicht eigentlich auf `false`
   - aktueller Stand nutzt getrennte `typecheck`- und `build`-Lanes
   - explizite Umstellung auf `false` ist noch offen

2. Translator-Extraktion
   - noch nicht begonnen auf Dateisystemebene

3. 2026-Refresh des Translators gegen aktuelle TypeScript-Quellen
   - noch offen

4. O1/O3/Y1-Folgearbeit
   - noch offen

### 6.2 Konkrete naechste Resume-Reihenfolge

1. **Entscheidung und Umsetzung fuer `skipTypeCheck`**
   - falls Benutzerforderung strikt umgesetzt werden soll:
     - Build-Lane so anpassen, dass `skipTypeCheck: false` funktioniert
     - ohne `tmp/**` / `examples/**` wieder in die produktive App-Lane hineinzuziehen

2. **Translator-Package bauen**
   - `packages/error-translator/`
   - Quellverschiebung per `move_paths`
   - Nx-/PNPM-/TS-Surfaces anlegen

3. **Formatter-/Extension-Integration**
   - Remote-Link entfernen
   - lokale Translator-API anschliessen
   - `lz-string` entfernen

4. **Security-Haertung**
   - WebView-/Hover-Pipeline umstellen
   - Handoffs aktualisieren

---

## 7. Resume-Hinweise fuer einen neuen Agenten
[INTENT: KONTEXT]

Ein neuer Agent kann von diesem Stand aus direkt weiterarbeiten.

**Wichtigste Resume-Fakten:**

- der Workspace ist bereits auf PNPM + Nx migriert
- die Delivery-Lane ist funktional und hat eine VSIX erzeugt
- die noch offene Arbeit ist **nicht** mehr Root-Migration, sondern:
  - offene Fortress-Policy-Entscheidungen
  - Translator-Extraktion
  - Translator-2026-Refresh
  - O1/O3/Y1-Folgehaertung

**Besonders wichtig fuer den Resume-Agenten:**

- die bestehenden zwei Handoff-Berichte bleiben unangetastet
- `tmp/ts-error-translator` bleibt vorerst als lokale Extraktionsbasis erhalten
- `publisher` / `repository.url` / `homepage` in `apps/vscode-extension/package.json` sind aktuell absichtlich auf `CyberT33N` belassen
- `trustPolicyExclude: semver@6.3.1` ist absichtlich gesetzt und muss nicht als Zufallsrest fehlinterpretiert werden
- `registrySupportsTimeField: false` ist jetzt die explizit bestaetigte Zielhaltung
- `skipTypeCheck: true` bleibt die noch offene Konfigurationsdiskussion

---

## 8. Kurzfazit
[INTENT: KONTEXT]

Die ersten drei grossen Migrationsblöcke sind in der aktuellen Session im Kern umgesetzt worden:

- PNPM Fortress Root
- Nx-Monorepo-Orchestrierung
- VS Code Extension Delivery Lane

Der Workspace ist installierbar, synchronisiert, buildbar und kann eine `.vsix` erzeugen.

Nicht erledigt sind aktuell die inhaltliche Local-Translator-Integration, der 2026-Refresh dieser Translator-Datenbasis, die O1/O3/Y1-Haertung sowie die noch offene Konfigurationsforderung:

- `skipTypeCheck = false`

Dieser Bericht ist als neuer dritter Workspace-Handoff gedacht und soll die zwei bestehenden Handoffs nicht ersetzen, sondern ergaenzen.
