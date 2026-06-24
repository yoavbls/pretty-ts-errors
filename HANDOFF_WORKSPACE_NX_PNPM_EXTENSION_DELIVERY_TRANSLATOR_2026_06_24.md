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
| DEC-006 | ENTSCHEIDUNG | `skipTypeCheck` wurde fuer `build` und `dev` auf `false` umgestellt | Ja | Aktiv |
| DEC-007 | ENTSCHEIDUNG | Lokale Translator-Integration laeuft jetzt first-party unter `packages/error-translator` | Ja | Aktiv |
| DEC-008 | ENTSCHEIDUNG | Die Translator-Matching-Datenbank wurde gegen `typescript@6.0.3` auf 2026-Stand aktualisiert | Ja | Aktiv |
| DEC-009 | ENTSCHEIDUNG | Sidebar-WebView und Hover wurden auf sichere O1/O3-Zielpfade umgebaut | Ja | Aktiv |
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

### 3.7 `skipTypeCheck` steht jetzt auf `false`
[INTENT: SPEZIFIKATION]

**Aktueller Status:**

- im App-`project.json`
  - `build`
  - `dev`
  stehen jetzt beide auf:
  - `skipTypeCheck: false`

**Warum diese Umstellung jetzt tragfaehig ist:**

- die App-Typecheck-Lane bleibt weiterhin explizit getrennt:
  - `typecheck` target mit `tsconfig.app.json`
  - Build/Bundle target mit `@nx/esbuild`
  - Packaging target fuehrt `typecheck`, danach `build:production`, danach `package-vsix.mjs` aus
- nach der lokalen Translator-Integration und der Referenzbereinigung laeuft die Lane stabil mit aktivem Typecheck

**Verifizierter Status:**

- `pnpm exec nx run pretty-ts-errors:typecheck` ist erfolgreich
- `pnpm exec nx run pretty-ts-errors:package` ist erfolgreich

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

Der lokale Translator-Einbau ist jetzt **umgesetzt**.

Was umgesetzt wurde:

- `packages/error-translator/` wurde angelegt
- benoetigte Engine-Dateien, Translation-Markdowns und Build-Helfer wurden aus `tmp/ts-error-translator` uebernommen
- ein internes first-party Package mit `package.json`, `project.json`, `tsconfig`, `tsconfig.lib.json` und `vitest`-Tests existiert jetzt
- die lokale API exportiert:
  - `parseErrors`
  - `parseErrorsWithDb`
  - `fillBodyWithItems`
  - `translateDiagnosticMessage`
  - `hasTranslation`
- der bisherige Remote-Translator-Egress ueber `ts-error-translator.vercel.app` wurde entfernt
- `lz-string` wurde aus dem Produktpfad entfernt

**Aktuelle Zielverortung:**

- `packages/error-translator/`
- `tmp/ts-error-translator/` bleibt weiter als lokale Referenz-/Attributionsbasis erhalten

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

**Jetzt ebenfalls umgesetzt:**

- `packages/error-translator/scripts/refreshTsErrorMessages.mjs` materialisiert die aktuelle TypeScript-Diagnostic-Datenbank aus dem installierten `typescript`
- `packages/error-translator/src/generated/tsErrorMessages.json` wurde auf den 2026-Stand aktualisiert
- verifizierter Abgleich gegen `typescript@6.0.3`:
  - `dbMessageEntries: 2130`
  - `currentDiagnostics: 2130`
  - `missingMessagesCount: 0`
  - `missingCurrentCodesCount: 0`
  - `staleDbCodesCount: 0`

---

### 3.11 O1/O3-Haertung: aktueller Stand
[INTENT: SPEZIFIKATION]

Die O1/O3-Arbeitspakete fuer das Produkt wurden jetzt umgesetzt:

1. **Remote-Translator-Egress entfernt**
   - kein `ts-error-translator.vercel.app`-Pfad mehr im Produkt
   - kein `lz-string`-Pfad mehr im Produkt
   - lokale Plain-English-Translation wird first-party erzeugt

2. **Plain-English-Translator lokal integriert**
   - neues internes `packages/error-translator`
   - lokale Build-/Refresh-Lane fuer `bundleErrors` und `tsErrorMessages`

3. **WebView-/Hover-Haertung umgesetzt**
   - strukturierter Datenpfad statt HTML-String-Pipeline
   - kein diagnostikgetriebener `innerHTML`-Pfad mehr
   - WebView rendert ueber DOM-APIs
   - Hover trennt untrusted Diagnoseinhalt von trusted Command-Aktionen
   - `supportHtml` wurde im Hover-Pfad entfernt

4. **Handoff-Refactor**
   - `HANDOFF_WORKSPACE_NX_PNPM_EXTENSION_DELIVERY_TRANSLATOR_2026_06_24.md` wurde auf den aktuellen technischen Stand nachgezogen
   - die Y1-spezifische `tmp/`-Dokumentation bleibt als separate Referenz bestehen

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

Aktuell gibt es aus diesem Arbeitsstrang keine offenen Pflichtpunkte mehr fuer:

- PNPM-Fortress-Control-Plane
- Nx-Monorepo-Orchestrierung
- lokale Translator-Integration
- 2026-Refresh der Translator-Matching-Daten
- O1/O3-Haertung im Produktpfad

Getrennt davon bleibt nur die separat dokumentierte `tmp/`-/Y1-Referenzoberflaeche als eigener Nacharbeitsstrang.

### 6.2 Konkrete naechste Resume-Reihenfolge

1. **Optional: separate Y1-`tmp/`-Restarbeit**
   - nur falls die geklonte Upstream-Referenz in `tmp/` selbst gehaertet werden soll

2. **Optional: weitere Produktverbesserungen ausserhalb dieses Strangs**
   - z. B. gezielte UX-Weiterentwicklung fuer strukturierte Sidebar-Modelle

---

## 7. Resume-Hinweise fuer einen neuen Agenten
[INTENT: KONTEXT]

Ein neuer Agent kann von diesem Stand aus direkt weiterarbeiten.

**Wichtigste Resume-Fakten:**

- der Workspace ist bereits auf PNPM + Nx migriert
- die Delivery-Lane ist funktional und hat eine VSIX erzeugt
- die Produktarbeit dieses Strangs ist funktional umgesetzt:
  - lokale Translator-Integration
  - 2026-Refresh der Translator-Matching-Daten
  - O1/O3-Haertung im Produktpfad

**Besonders wichtig fuer den Resume-Agenten:**

- die bestehenden zwei Handoff-Berichte bleiben unangetastet
- `tmp/ts-error-translator` bleibt vorerst als lokale Extraktionsbasis erhalten
- `publisher` / `repository.url` / `homepage` in `apps/vscode-extension/package.json` sind aktuell absichtlich auf `CyberT33N` belassen
- `trustPolicyExclude: semver@6.3.1` ist absichtlich gesetzt und muss nicht als Zufallsrest fehlinterpretiert werden
- `registrySupportsTimeField: false` ist jetzt die explizit bestaetigte Zielhaltung
- `skipTypeCheck` steht jetzt in `build` und `dev` auf `false`
- die aktuelle VSIX wurde erfolgreich neu erzeugt

---

## 8. Kurzfazit
[INTENT: KONTEXT]

Die grossen Migrations- und Härtungsblöcke dieses Strangs sind jetzt umgesetzt:

- PNPM Fortress Root
- Nx-Monorepo-Orchestrierung
- VS Code Extension Delivery Lane
- lokale Translator-Integration
- 2026-Refresh der Translator-Matching-Datenbasis
- O1/O3-Haertung im Produktpfad

Der Workspace ist installierbar, synchronisiert, buildbar, typecheckt erfolgreich und kann eine `.vsix` erzeugen.

Dieser Bericht ist als neuer dritter Workspace-Handoff gedacht und soll die zwei bestehenden Handoffs nicht ersetzen, sondern ergaenzen.
