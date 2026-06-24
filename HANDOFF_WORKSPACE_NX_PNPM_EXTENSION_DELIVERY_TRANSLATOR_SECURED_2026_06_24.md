# Referenzdokument: Vollstaendiger Workspace-Handoff zur PNPM-, Nx-, Extension-Delivery-, Translator- und Security-Haertung in `pretty-ts-errors`
[INTENT: KONTEXT]

---

## 0. Quellenbasis und Scope-Grenzen
[INTENT: KONTEXT]

**Workspace-Root:** `C:\Projects\development-platform\vs-code\extensions\pretty-ts-errors`

**Quellemodus:** `CURRENT_CONTEXT_DEFAULT` mit expliziten Zusatzreferenzen aus dem laufenden Chat-Kontext.

**Freigegebene Quellenbasis fuer diesen Handoff:**

- die komplette aktuelle Konversation von Beginn bis zu diesem Stand
- die in dieser Session gelesenen AI-Base-Referenzen fuer:
  - PNPM Fortress Core / Monorepo Boilerplate / Omitted Properties / Trust-Downgrade Response Order
  - Nx `project.json` Governance
  - Nx TypeScript Workspace Governance
  - Nx Shared Package Build Orchestration
  - Monorepo TypeScript Workspace Config Governance
  - VS Code Extension PNPM-first Bundle-first Delivery
- die in dieser Session gelesenen bestehenden Handoff-Dokumente:
  - `HANDOFF_O3_O1_LOCAL_TRANSLATOR.md`
  - `HANDOFF_Y1_WORKSPACE_SCANNER_TRUSTED_MARKDOWN.md`
  - `HANDOFF_WORKSPACE_NX_PNPM_EXTENSION_DELIVERY_TRANSLATOR_2026_06_24.md`
- die in dieser Session gelesenen und/oder geaenderten Workspace-Dateien
- die in dieser Session ausgefuehrten Validierungs- und Installationslaeufe

**Explizit nicht Ziel dieses Dokuments:**

- keine Neuinterpretation ausserhalb des aktuellen Kontexts
- keine autonome Projekt-Neusuche ausserhalb der bereits verwendeten Quellen
- keine Erfindung neuer Architekturziele ausserhalb des bereits diskutierten oder implementierten Stands
- keine Bearbeitung oder Loeschung der drei bestehenden Handoff-Berichte

**Wichtig zur Scope-Treue:**

- dieses Dokument ist der **vierte** Workspace-Handoff-Bericht
- die drei bereits vorhandenen Handoffs bleiben bestehen
- dieses Dokument aggregiert den gesamten Stand von der initialen Root-Migration bis zur aktuellen Translator- und Security-Haertung
- das Dokument beschreibt nur den aktuellen Stand und die bereits identifizierten offenen Restpunkte

---

## 1. Aufgabenuebersicht
[INTENT: KONTEXT]

Der Benutzer hat in dieser Session eine mehrstufige Architektur- und Migrationsaufgabe fuer `pretty-ts-errors` verfolgt. Die Aufgabe lief nicht nur auf einen Package-Manager-Wechsel hinaus, sondern auf eine vollstaendige Umstellung des Monorepo-, Delivery- und Translator-Pfads.

Die uebergeordnete Zielrichtung war:

1. das bisherige `npm`-/`turbo`-Setup auf ein `pnpm@11.7.0`-basiertes Fortress-Monorepo umzustellen
2. `turbo` vollstaendig durch `nx` zu ersetzen
3. die VS Code Extension Delivery auf eine PNPM-first / bundle-first / offizielle `@vscode/vsce --no-dependencies`-Architektur umzustellen
4. die TypeScript-/ESM-Lane neu zu ordnen
5. den lokalen `ts-error-translator` aus `tmp/ts-error-translator` in ein internes Package unter `packages/` zu integrieren
6. die bisherigen O1/O3-Themen zu remedieren:
   - kein externer Translator-Egress mehr
   - keine diagnostikgetriebene HTML-String-Pipeline mehr in der Sidebar-WebView
   - minimalerer Trust-Scope im Hover-Pfad
7. alle relevanten Oberflaechen auf den aktuellen TypeScript-Stand zu ziehen
8. am Ende die Produktbenennung auf den gesicherten Zielzustand mit `[Secured]` auszurichten

Der Benutzer hat spaeter zusaetzlich explizit festgelegt:

- Root-Toolchain: `Node 26.2.0`
- Package-Manager: `pnpm 11.7.0`
- ESM statt CommonJS
- `tsconfig`-Ziel auf `ESNext`
- `@types/node` in der spaetesten durch Minimum-Release-Age erlaubten Linie
- die AI-Base-Referenzen sind der verbindliche Referenzwert
- `registrySupportsTimeField` soll am Ende auf dem Referenzwert `false` bleiben

Der Benutzer hat ausserdem spaeter explizit nachgezogen:

- die lokale Translator-Integration muss zwar auf den aktuellen TypeScript-Stand ausgerichtet werden, aber die noch fehlende 100%-Abdeckung der **kuratierten Plain-English-Uebersetzungen** bleibt ein offener Restpunkt
- fuer den neuen Handoff muss der komplette bisherige Stand **vom Anfang des Kontextes bis zum Ende** zusammengefasst werden

---

## 2. Informationsregister
[INTENT: REFERENZ]

| ID | Typ | Beschreibung | Veraenderung | Status |
|----|-----|--------------|--------------|--------|
| REQ-001 | ANFORDERUNG | Root-Control-Plane auf `pnpm@11.7.0` + Fortress-Workspace umstellen | Ja | Erledigt |
| REQ-002 | ANFORDERUNG | `turbo` vollstaendig durch `nx` ersetzen | Ja | Erledigt |
| REQ-003 | ANFORDERUNG | VS Code Extension Delivery auf PNPM-first / bundle-first / `@vscode/vsce --no-dependencies` umstellen | Ja | Erledigt |
| REQ-004 | ANFORDERUNG | Translator-Logik intern unter `packages/` integrieren | Ja | Erledigt |
| REQ-005 | ANFORDERUNG | TypeScript-/Tooling-Stand auf 2026 heben | Ja | Teilweise erledigt |
| REQ-006 | ANFORDERUNG | `tmp/**` und `examples/**` nicht produktiv mitbauen / mittypechecken | Ja | Erledigt |
| REQ-007 | ANFORDERUNG | Leaf-`package.json`-Skripte duerfen im Nx-Monorepo nicht die Task-Orchestrierung tragen | Ja | Erledigt |
| REQ-008 | ANFORDERUNG | O1: externer Translator-Egress muss entfernt werden | Ja | Erledigt |
| REQ-009 | ANFORDERUNG | O3: Sidebar-WebView muss von `innerHTML`-/HTML-String-Pipeline weg | Ja | Erledigt |
| REQ-010 | ANFORDERUNG | Hover-Trust-Scope muss reduziert werden | Ja | Erledigt |
| REQ-011 | ANFORDERUNG | Produktname muss mit dem Suffix ` [Secured]` ausgerichtet werden | Ja | Teilweise erledigt, Restflaechen noch nachziehen |
| REQ-012 | ANFORDERUNG | Die Translator-Registry muss am Ende 100% vollstaendig werden | Nein | Offen |
| REQ-013 | ANFORDERUNG | Alle TypeScript-Error-Codes muessen in der Plain-English-Registry enthalten sein | Nein | Offen |
| REQ-014 | ANFORDERUNG | Die komplette Translator-Welt darf am Ende keine 2023-Legacy-Luecke mehr enthalten | Nein | Offen |
| DEC-001 | ENTSCHEIDUNG | Root-Toolchain bleibt `Node 26.2.0`, auch wenn VS Code Stable embedded Node `24.16.0` nutzt | Ja | Aktiv |
| DEC-002 | ENTSCHEIDUNG | ESM-Zielarchitektur fuer die Extension; Node-Extension-Host only | Ja | Aktiv |
| DEC-003 | ENTSCHEIDUNG | Build- und Typecheck-Lane der Extension werden getrennt gefuehrt | Ja | Aktiv |
| DEC-004 | ENTSCHEIDUNG | `trustPolicyExclude` fuer `semver@6.3.1` ist aktuell notwendig | Ja | Aktiv |
| DEC-005 | ENTSCHEIDUNG | `registrySupportsTimeField` bleibt gemaess Referenz und verifiziertem Registry-Verhalten auf `false` | Ja | Aktiv |
| DEC-006 | ENTSCHEIDUNG | `skipTypeCheck` wurde fuer `build` und `dev` auf `false` umgestellt | Ja | Aktiv |
| DEC-007 | ENTSCHEIDUNG | Lokale Translator-Integration laeuft first-party unter `packages/error-translator` | Ja | Aktiv |
| DEC-008 | ENTSCHEIDUNG | Die Translator-Matching-Datenbank wurde gegen `typescript@6.0.3` auf 2026-Stand aktualisiert | Ja | Aktiv |
| DEC-009 | ENTSCHEIDUNG | Sidebar-WebView und Hover wurden auf sichere O1/O3-Zielpfade umgebaut | Ja | Aktiv |
| DEC-010 | ENTSCHEIDUNG | `apps/vscode-extension/tsconfig.json` ist jetzt wieder reine Koordinations-/Referenzoberflaeche statt source-owning `NodeNext`-Leaf | Ja | Aktiv |
| INFO-001 | INFORMATION | `apps/vscode-extension/package.json` verwendet aktuell die bestaetigte `CyberT33N`-Identitaet | Nein | Aktiv |
| INFO-002 | INFORMATION | Ein `.vsix` wurde erfolgreich unter `artifacts/vsix/pretty-ts-errors-0.8.7.vsix` erzeugt | Nein | Aktiv |
| INFO-003 | INFORMATION | Die aktuelle TypeScript-Matcher-DB hat `2130` Eintraege und deckt `typescript@6.0.3` vollstaendig ab | Nein | Aktiv |
| INFO-004 | INFORMATION | Das kuratierte Plain-English-Korpus umfasst aktuell nur `67` Markdown-Uebersetzungen | Nein | Aktiv |
| WARN-001 | WARNUNG | Die Plain-English-Registry ist **nicht** 100% vollstaendig; viele Fehlercodes haben noch keine kuratierte Uebersetzung | Nein | Offen |
| WARN-002 | WARNUNG | `trustPolicyExclude: semver@6.3.1` ist weiterhin eine temporare Fortress-Ausnahme | Nein | Offen |

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
- `pnpm-workspace.yaml` existiert als Fortress-Monorepo-Oberflaeche
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
- `saveExact: true`
- `savePrefix: ""`
- `nodeLinker: isolated`

**Verifizierter Installationsstatus:**

- `pnpm install` laeuft erfolgreich unter `pnpm v11.7.0`
- der Workspace hat ein `pnpm-lock.yaml`
- der Lockfile erfuellt die Supply-Chain-Policies

---

### 3.2 Warum `trustPolicyExclude` statt `overrides` fuer `semver@6.3.1`
[INTENT: SPEZIFIKATION]

Der Trust-Downgrade-Pfad wurde gemaess Referenz abgearbeitet:

1. zuerst Updates / neuere freigegebene Versionen
2. dann nur wenn moeglich ein enger Override-Repair
3. erst danach exakte `trustPolicyExclude`

Der relevante Graph:

- `@nx/js@23.0.0`
- zieht `@babel/core@7.29.7`
- `@babel/core@7.29.7` deklariert `semver: ^6.3.1`
- in der relevanten `6.3.x`-Linie existieren nur:
  - `6.3.0`
  - `6.3.1`

**Warum kein `override`:**

- `6.3.0` liegt unterhalb des Contract-Floors `^6.3.1`
- `6.3.1` ist genau die geblockte Version
- damit existiert kein zulaessiger enger Patch-Repair

**Daher bleibt korrekt:**

- `trustPolicyExclude: [semver@6.3.1]`

**Folgepflicht:**

- sobald `@nx/js` / `@babel/core` einen trust-konformen Graphen liefern, muss diese Ausnahme entfernt werden

---

### 3.3 `registrySupportsTimeField` bleibt auf `false`
[INTENT: SPEZIFIKATION]

**Warum:**

- `resolutionMode: time-based` braucht die korrekte Zeitmetadaten-Surface
- `registrySupportsTimeField: true` ist nur korrekt, wenn die Registry das `time`-Feld bereits im **abbreviated metadata**-Pfad liefert
- fuer `registry.npmjs.org` ist das im verwendeten Pfad nicht gegeben

**Verifizierte Live-Beobachtung:**

Getestete Pakete:

- `esbuild`
- `typescript`
- `@eslint/js`
- `@nx/js`

Ergebnis:

- full metadata: `time` vorhanden
- abbreviated metadata: `time` **nicht** vorhanden

**Konsequenz:**

- `registrySupportsTimeField: false` ist technisch korrekt
- `true` waere im aktuellen Setup ein falscher globaler Registry-Claim

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
  - `packages/error-translator`
  - `apps/vscode-extension`

**Wichtige Nx-Entscheidungen:**

- `@nx/js/typescript` ist auf `packages/**/*` als standardisierte TypeScript-Governance aktiv
- Shared Packages nutzen explizite `@nx/js:tsc`-Build-Targets
- das neue Translator-Paket nutzt ebenfalls `@nx/js:tsc`
- die VS Code Extension nutzt `@nx/esbuild:esbuild`
- Leaf-`package.json`-Skripte wurden als Orchestrierungsoberflaechen entfernt
- Root-Format-/Sync-Funktionen leben im Root-`project.json`

**Verifizierter Nx-Status:**

- `nx show projects` erkennt aktuell:
  - `@pretty-ts-errors/error-translator`
  - `@pretty-ts-errors/utils`
  - `@pretty-ts-errors/formatter`
  - `pretty-ts-errors`
  - `workspace-root`
- `pnpm exec nx sync` ist erfolgreich
- `pnpm exec nx sync:check` ist erfolgreich

---

### 3.5 TypeScript-/ESM-Umstellung
[INTENT: SPEZIFIKATION]

**Root-TS-Stand:**

- `tsconfig.base.json` ist auf:
  - `target: ESNext`
  - `module: ESNext`
  - `moduleResolution: Bundler`
  gestellt

**Workspace-Rollenaufteilung:**

- Root-`tsconfig.json` ist die Koordinations-/Referenzoberflaeche
- `apps/vscode-extension/tsconfig.json` ist jetzt ebenfalls wieder Koordinationsoberflaeche:
  - `files: []`
  - `references` auf `tsconfig.app.json` und `tsconfig.test.json`
- `apps/vscode-extension/tsconfig.app.json` ist die produktive App-Rolle:
  - `module: ESNext`
  - `moduleResolution: Bundler`
  - `noEmit: true`
- `apps/vscode-extension/tsconfig.test.json` bleibt die Test-Rolle

**Wichtige Folge dieser Korrektur:**

- die zuvor im Editor sichtbaren `TS2835`-Fehler mit verpflichtenden `.js`-Suffixen kamen aus einer source-owning `NodeNext`-Fehlklassifikation der Leaf-`tsconfig.json`
- diese Ursache wurde beseitigt
- es war **nicht** notwendig, die ganzen App-Imports kuenstlich auf `.js` umzuschreiben

**Verifizierter Status:**

- `pnpm exec tsc -p apps/vscode-extension/tsconfig.json --noEmit` ist erfolgreich
- `pnpm exec tsc -p apps/vscode-extension/tsconfig.app.json --noEmit` ist erfolgreich
- `pnpm exec tsc -p apps/vscode-extension/tsconfig.test.json --noEmit` ist erfolgreich
- `pnpm exec nx run pretty-ts-errors:typecheck` ist erfolgreich

---

### 3.6 VS Code Extension Delivery
[INTENT: SPEZIFIKATION]

**Manifest-/Produktoberflaeche:**

- `displayName` ist aktuell:
  - `Pretty TypeScript Errors [Secured]`
- `publisher`, `repository.url` und `homepage` sind aktuell:
  - `CyberT33N`
  - `https://github.com/CyberT33N/pretty-ts-errors`
- diese Identitaetsaenderung wurde im Chat bestaetigt und beibehalten

**Delivery-Oberflaechen:**

- `.vscodeignore` fuer die VSIX-Strategie wurde eingefuehrt
- `.vscode/tasks.json` und `.vscode/launch.json` wurden auf Nx-Tasks / `dist/**`-Bundle-Vertrag umgestellt
- `apps/vscode-extension/scripts/build.js` wurde entfernt
- `apps/vscode-extension/scripts/package-vsix.mjs` materialisiert `catalog:`-Dependencies in einen Stage-Manifest-Pfad

**Aktueller Packaging-Status:**

- `pnpm exec nx run pretty-ts-errors:package` ist erfolgreich
- Artefakt:
  - `artifacts/vsix/pretty-ts-errors-0.8.7.vsix`

**Wichtige operative Beobachtung:**

- der bekannte Windows-`EPERM` auf `apps/vscode-extension/dist` kann weiterhin auftreten, wenn alte Artefakte oder ein Watcher die Surface halten
- der saubere Workaround bleibt:
  - altes `apps/vscode-extension/dist` entfernen
  - Packaging-Lane erneut starten

---

### 3.7 Produktname / `[Secured]`-Zielbild
[INTENT: SPEZIFIKATION]

**Bereits korrekt gesetzt:**

- `apps/vscode-extension/package.json#displayName`
  - `Pretty TypeScript Errors [Secured]`

**Noch offene user-facing Restflaechen zum Nachziehen:**

- `apps/vscode-extension/package.json#contributes.viewsContainers.activitybar[0].title`
  - aktuell: `Pretty TypeScript Errors`
- `apps/vscode-extension/package.json#contributes.commands[*].category`
  - aktuell: `Pretty TS Errors`
- `apps/vscode-extension/src/logger.ts`
  - aktueller Output-Channel-Name: `Pretty TypeScript Errors`
- `apps/vscode-extension/webview/index.html`
  - aktueller Title: `Pretty TS Errors - Markdown Preview`

**Architektonische Interpretation:**

- der Kernname ist bereits mit `[Secured]` auf der Extension-Manifest-Oberflaeche gesetzt
- einzelne user-facing Restflaechen koennen noch nachgezogen werden, wenn eine vollstaendig konsistente Benennungsoberflaeche gewuenscht ist

---

### 3.8 Translator-Architektur: aktueller Zustand
[INTENT: SPEZIFIKATION]

Der lokale Translator-Einbau ist jetzt **technisch integriert**, aber **inhaltlich noch nicht 100% fertig**.

**Was jetzt existiert:**

- neues internes Package:
  - `packages/error-translator/`
- lokale first-party API:
  - `parseErrors`
  - `parseErrorsWithDb`
  - `fillBodyWithItems`
  - `translateDiagnosticMessage`
  - `hasTranslation`
- lokale generated data surfaces:
  - `packages/error-translator/src/generated/tsErrorMessages.json`
  - `packages/error-translator/src/generated/bundleErrors.json`
- Upstream-Attributions-/Rohdatenbasis:
  - `packages/error-translator/vendor/matt-pocock/errors/*.md`

**Was bewusst nicht uebernommen wurde:**

- keine komplette Upstream-VS-Code-App
- keine Upstream-Workspace- oder Turbo-Oberflaeche
- keine Upstream-Parser-/Searcher-Pakete als Produktbestandteil

**Aktuelle Produktintegration:**

- `packages/vscode-formatter` konsumiert den lokalen Translator
- die Sidebar rendert die lokale Plain-English-Translation direkt im Produkt
- kein externer Remote-Fallback mehr

---

### 3.9 Translator-Skripte / No-Code-Operations / Shims
[INTENT: SPEZIFIKATION]

Der Benutzer hat explizit gefragt, ob hier zusaetzliche Migrations-, Shims- oder No-Code-Kompatibilitaetsoberflaechen eingefuehrt wurden.

**Ja, es gibt zwei neue Build-/Maintenance-Skripte:**

1. `packages/error-translator/scripts/refreshTsErrorMessages.mjs`
   - liest die aktuell installierte TypeScript-Diagnostic-Datenbasis direkt aus `typescript`
   - generiert daraus `src/generated/tsErrorMessages.json`
   - Zweck: die **Matcher-/Erkennungsdatenbank** auf den aktuellen TS-Stand ziehen

2. `packages/error-translator/scripts/bundleErrors.mjs`
   - liest die kuratierten Markdown-Dateien unter `vendor/matt-pocock/errors/*.md`
   - materialisiert daraus `src/generated/bundleErrors.json`
   - Zweck: die **Runtime-Uebersetzungsdaten** lokal als statisches Bundle bereitstellen

**Wichtig:**

- das sind **keine Runtime-Shims**
- das sind **keine Abwaertskompatibilitaets-Layer**
- das sind **keine No-Code-Fallback-Systeme**
- das sind **Build-/Refresh-Skripte fuer Datenmaterialisierung**

**Was explizit nicht existiert:**

- kein externer Service-Fallback
- kein Legacy-Translator-Proxy
- kein Runtime-FS-Zugriff auf die rohen Markdown-Dateien
- kein network-basierter Translator

---

### 3.10 TypeScript-2026-Refresh: was erledigt ist und was nicht
[INTENT: SPEZIFIKATION]

Hier ist die praezise Trennung entscheidend.

**Erledigt:**

- die **technische Fehlererkennung** wurde gegen `typescript@6.0.3` aktualisiert
- `packages/error-translator/src/generated/tsErrorMessages.json` wurde neu generiert
- verifizierter Abgleich:
  - `dbMessageEntries: 2130`
  - `currentDiagnostics: 2130`
  - `missingMessagesCount: 0`
  - `missingCurrentCodesCount: 0`
  - `staleDbCodesCount: 0`

**Nicht erledigt:**

- die **kuratierten Plain-English-Uebersetzungen** sind **nicht** 100% vollstaendig
- das aktuelle Markdown-Korpus unter `vendor/matt-pocock/errors` umfasst nur `67` Uebersetzungsdateien
- damit sind zwar alle aktuellen TS-Diagnostics **erkennbar**, aber nicht alle haben schon einen kuratierten Plain-English-Text

**Das bedeutet architektonisch:**

- die 2026-Kompatibilitaet der **Matching-Ebene** ist hergestellt
- die 2026-Komplettheit der **Translation-Registry** ist **noch offen**

---

### 3.11 O1/O3-Haertung: aktueller Stand
[INTENT: SPEZIFIKATION]

**O1 / Remote-Egress:**

- der bisherige Translator-Egress zu `ts-error-translator.vercel.app` wurde entfernt
- `lz-string` wurde aus dem Produktpfad entfernt
- die Produktoberflaeche uebersetzt lokal

**O3 / Sidebar-WebView:**

- die alte Pipeline:
  - HTML-Strings aufbauen
  - via `postMessage({ html })` transportieren
  - im WebView per `innerHTML` einsetzen
- wurde ersetzt durch:
  - strukturiertes Sidebar-View-Model
  - DOM-Knoten-Erzeugung im WebView
  - kein diagnostikgetriebener `innerHTML`-Transport mehr

**Hover / Trust-Scope:**

- Hover-Inhalt und Hover-Aktionen wurden getrennt
- der untrusted Diagnoseinhalt wird als normales Markdown ohne `supportHtml` transportiert
- trusted bleibt nur noch die Command-Aktionsoberflaeche

---

### 3.12 Offene Restarbeit fuer den Translator
[INTENT: SPEZIFIKATION]

Die folgenden Punkte sind **inhaltlich offen** und muessen fuer den gewuenschten Endzustand noch umgesetzt werden:

1. **Die Translation-Registry muss 100% vollstaendig werden**
   - aktuell nur `67` kuratierte Plain-English-Uebersetzungen
   - Ziel: alle relevanten aktuellen TS-Error-Codes muessen eine kuratierte Uebersetzung erhalten

2. **Alle Error-Codes muessen herausgefunden und abgedeckt werden**
   - die aktuelle Matcher-DB kennt bereits alle aktuellen Diagnostics
   - die kuratierte Registry muss auf diese Menge hochgezogen werden

3. **Die Legacy-Welt des 2023er-Korpus darf inhaltlich nicht als Endzustand stehen bleiben**
   - aktuelle Vendor-Basis ist ein Startpunkt, nicht der Zielzustand
   - am Ende muss die eigene Registry den aktuellen TypeScript-Stand 100% abbilden

4. **Bei spaeteren TypeScript-Upgrades muss der Refresh erneut gefahren werden**
   - `refreshTsErrorMessages.mjs` ist die technische Refresh-Oberflaeche
   - neue oder geaenderte TS-Diagnostics muessen danach wieder in die kuratierte Registry gezogen werden

---

## 4. Dateiinventar der wichtigsten Oberflaechen
[INTENT: REFERENZ]

### 4.1 Neue bzw. neue Hauptoberflaechen

- `pnpm-workspace.yaml`
- `nx.json`
- `project.json`
- `.nxignore`
- `apps/vscode-extension/project.json`
- `apps/vscode-extension/.vscodeignore`
- `apps/vscode-extension/scripts/package-vsix.mjs`
- `apps/vscode-extension/src/lspDiagnostic.ts`
- `apps/vscode-extension/src/hoverContent.ts`
- `apps/vscode-extension/src/provider/sidebarViewModel.ts`
- `packages/error-translator/package.json`
- `packages/error-translator/project.json`
- `packages/error-translator/tsconfig.json`
- `packages/error-translator/tsconfig.lib.json`
- `packages/error-translator/src/index.ts`
- `packages/error-translator/src/parseErrors.ts`
- `packages/error-translator/src/getImprovedMessage.ts`
- `packages/error-translator/src/translateDiagnosticMessage.ts`
- `packages/error-translator/src/generated/tsErrorMessages.json`
- `packages/error-translator/src/generated/bundleErrors.json`
- `packages/error-translator/scripts/refreshTsErrorMessages.mjs`
- `packages/error-translator/scripts/bundleErrors.mjs`
- `packages/error-translator/test/engine.test.ts`
- `packages/error-translator/vendor/matt-pocock/errors/*.md`
- `HANDOFF_WORKSPACE_NX_PNPM_EXTENSION_DELIVERY_TRANSLATOR_SECURED_2026_06_24.md` (dieser Bericht)

### 4.2 Wichtige aktualisierte Oberflaechen

- `package.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `.vscode/tasks.json`
- `.vscode/launch.json`
- `.vscode/settings.json`
- `apps/vscode-extension/package.json`
- `apps/vscode-extension/tsconfig.json`
- `apps/vscode-extension/tsconfig.app.json`
- `apps/vscode-extension/tsconfig.test.json`
- `apps/vscode-extension/src/diagnostics.ts`
- `apps/vscode-extension/src/provider/markdownWebviewProvider.ts`
- `apps/vscode-extension/src/provider/selectedTextHoverProvider.ts`
- `apps/vscode-extension/src/provider/webviewViewProvider.ts`
- `apps/vscode-extension/webview/index.js`
- `apps/vscode-extension/webview/style.css`
- `apps/vscode-extension/src/logger.ts`
- `packages/vscode-formatter/package.json`
- `packages/vscode-formatter/tsconfig.json`
- `packages/vscode-formatter/src/components/actions.ts`
- `packages/vscode-formatter/src/format/prettifyDiagnosticForSidebar.ts`
- `packages/vscode-formatter/src/format/prettifyDiagnosticForHover.ts`
- `README.md`
- `pnpm-lock.yaml`
- `HANDOFF_O3_O1_LOCAL_TRANSLATOR.md`
- `HANDOFF_WORKSPACE_NX_PNPM_EXTENSION_DELIVERY_TRANSLATOR_2026_06_24.md`

---

## 5. Aktueller Verifikationsstand
[INTENT: REFERENZ]

Erfolgreich verifiziert in diesem Kontext:

- `pnpm install`
- `pnpm exec nx sync`
- `pnpm exec nx sync:check`
- `pnpm exec nx build @pretty-ts-errors/utils`
- `pnpm exec nx build @pretty-ts-errors/formatter`
- `pnpm exec nx build @pretty-ts-errors/error-translator`
- `pnpm exec nx test @pretty-ts-errors/error-translator`
- `pnpm exec nx build @pretty-ts-errors/vscode-formatter`
- `pnpm exec tsc -p apps/vscode-extension/tsconfig.json --noEmit`
- `pnpm exec tsc -p apps/vscode-extension/tsconfig.app.json --noEmit`
- `pnpm exec tsc -p apps/vscode-extension/tsconfig.test.json --noEmit`
- `pnpm exec nx run pretty-ts-errors:typecheck`
- `pnpm exec nx run pretty-ts-errors:package`

**Erzeugtes Artefakt:**

- `artifacts/vsix/pretty-ts-errors-0.8.7.vsix`

---

## 6. Offene Punkte und Resume-Reihenfolge
[INTENT: SPEZIFIKATION]

### 6.1 Noch offene fachliche Anforderungen

1. Die Translator-Registry ist **nicht** 100% vollstaendig
   - das kuratierte Korpus umfasst nur `67` Plain-English-Dateien
   - es muessen weitere Error-Codes kuratiert und eingebunden werden

2. Alle aktuellen relevanten TypeScript-Error-Codes muessen kuratierte Plain-English-Texte bekommen
   - die technische Matcher-Ebene ist bereit
   - die inhaltliche Registry muss nachgezogen werden

3. Die inhaltliche 2023-Legacy-Basis darf nicht der Endzustand bleiben
   - Vendor-Content ist derzeit Startbasis
   - Ziel ist eine 100% aktuelle eigene Registry

4. `trustPolicyExclude: semver@6.3.1` bleibt ein spaeter zu entfernender Fortress-Sonderfall

### 6.2 Konkrete naechste Resume-Reihenfolge

1. **Translator-Registry vervollstaendigen**
   - alle aktuellen TS-Codes gegen die kuratierte Markdown-/JSON-Registry abgleichen
   - fehlende Plain-English-Texte systematisch ergaenzen

2. **Legacy-Reduktion der Vendor-Basis**
   - Vendor-Korpus nicht nur technisch behalten, sondern inhaltlich ueberholen

3. **Spaetere Upgrades**
   - bei neuem TypeScript:
     - `refreshTsErrorMessages.mjs`
     - fehlende Registry-Eintraege ergaenzen

4. **Separater optionaler Reststrang**
   - `tmp/ts-error-translator` selbst haerten, falls der Benutzer auch die lokale Upstream-Referenzflaeche noch nacharbeiten will

---

## 7. Resume-Hinweise fuer einen neuen Agenten
[INTENT: KONTEXT]

Ein neuer Agent kann von diesem Stand aus direkt weiterarbeiten.

**Wichtigste Resume-Fakten:**

- der Workspace ist bereits auf PNPM + Nx migriert
- die Delivery-Lane ist funktional und erzeugt eine VSIX
- der lokale Translator ist als first-party Package integriert
- die O1/O3-Haertung im Produktpfad ist umgesetzt
- die technische 2026-Kompatibilitaet der TS-Matcher-Datenbank ist hergestellt
- die inhaltliche 100%-Vollstaendigkeit der Plain-English-Registry ist **noch offen**

**Besonders wichtig fuer den Resume-Agenten:**

- die drei bestehenden Handoff-Berichte bleiben unangetastet
- `tmp/ts-error-translator` bleibt vorerst als lokale Referenz-/Attributionsbasis erhalten
- `registrySupportsTimeField: false` ist die explizit bestaetigte Zielhaltung
- `skipTypeCheck` steht jetzt in `build` und `dev` auf `false`
- `apps/vscode-extension/tsconfig.json` ist jetzt wieder reine Koordinationsflaeche
- die eigentliche Produktrolle liegt in `tsconfig.app.json`
- die derzeit groesste offene Sache ist **nicht** mehr Root-Migration, sondern die **inhaltliche Vollstaendigkeit** der Translator-Registry

---

## 8. Kurzfazit
[INTENT: KONTEXT]

Die grossen Migrations- und Haertungsbloecke dieses Strangs sind umgesetzt:

- PNPM Fortress Root
- Nx-Monorepo-Orchestrierung
- VS Code Extension Delivery Lane
- lokale Translator-Integration
- 2026-Refresh der Translator-Matching-Datenbasis
- O1/O3-Haertung im Produktpfad
- Korrektur der Leaf-`tsconfig`-Koordinationsrolle

Der Workspace ist installierbar, synchronisiert, buildbar, typecheckt erfolgreich und erzeugt eine `.vsix`.

**Nicht erledigt** ist weiterhin die inhaltliche 100%-Vollstaendigkeit der Plain-English-Translationen:

- alle Error-Codes muessen am Ende eine kuratierte Uebersetzung erhalten
- die Registry muss 100% vollstaendig werden
- die verbleibende 2023-Legacy-Basis des Vendor-Korpus darf nicht der Endzustand bleiben

Dieser Bericht ist als neuer vierter Workspace-Handoff gedacht und soll die drei bestehenden Handoffs nicht ersetzen, sondern ergaenzen.
