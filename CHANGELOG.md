# poke-global — Diario de Cambios

> Diario de trabajo del proyecto: cada cambio relevante queda registrado con su
> motivo, decisión técnica y archivos afectados. Es parte de la entrega de la
> prueba técnica: muestra proceso, no solo resultado.

## Formato de las entradas

Cada entrada registra: **fecha · tipo · descripción · decisión técnica · archivos afectados**.

Tipos usados: `setup` · `fix` · `architecture` · `feature` · `tests` · `docs` · `decision`.

---

## 2026-08-15

### [setup] Inicialización del proyecto — scaffold Vue 3

- **Descripción**: Repositorio inicializado con el template oficial Vue 3 + Vite (TypeScript, Pinia, Vue Router, Vitest, Playwright, ESLint + oxlint + Prettier).
- **Decisión técnica**: Se partió del scaffold estándar para garantizar configuración de toolchain correcta y actualizada, en lugar de montar el proyecto a mano.
- **Archivos afectados**: todo el árbol inicial (commit `ef97f94`).

### [fix] Conflicto de peer dependencies: `eslint-plugin-oxlint` vs `oxlint`

- **Descripción**: `npm install` fallaba con `ERESOLVE` — el scaffold declaraba `eslint-plugin-oxlint@~1.73.0` (que exige peer `oxlint@~1.73.0`) pero el root pedía `oxlint@~1.74.0`.
- **Decisión técnica**: Se alinearon ambas dependencias a la última estable (`~1.78.0`) en lugar de usar `--force`/`--legacy-peer-deps`, que habría aceptado un árbol de dependencias potencialmente roto. Resultado: instalación limpia, 0 vulnerabilidades.
- **Archivos afectados**: `package.json`, `package-lock.json`.

### [setup] Instalación de dependencias y verificación de la toolchain

- **Descripción**: `npm install` ejecutado; servidor de desarrollo arranca y responde `200` en `http://localhost:5173/`.
- **Decisión técnica**: Node v24.13.1 cumple el requisito `engines` (`>=24.12.0`).
- **Verificado**: `vue-tsc` (type-check) sin errores · Vitest 4 con 1 test pasando · Vite 8 arranca en ~2s.

### [decision] Evaluación del stack contra el objetivo 10/10

- **Descripción**: Diagnóstico del stack completo. Toolchain lista, pero el proyecto aún es el template vacío.
- **Hallazgos**:
  - Stack completo y funcional: Vue 3.5 + TS + Pinia 4 + Vitest + Playwright + lint/format.
  - **Sin arquitectura**: `App.vue` es el template "You did it!", router con 0 rutas, único store es el demo `counter`.
  - **README genérico**: no alineado con AI-First ni Spec-Driven.
  - **1 solo test** de scaffold; faltan tests de lógica de negocio.
  - **Nit técnico**: `vitest.config.ts` importa `./vite.config` sin extensión (Vite 8 avisa que será error futuro).
- **Próximo paso**: definir el problema sencillo que resuelve el proyecto y construirlo con arquitectura limpia.

### [docs] Creación de este diario de cambios

- **Descripción**: Inicio del diario de cambios del proyecto para registrar el proceso de desarrollo.
- **Decisión técnica**: Archivo raíz `CHANGELOG.md` (convención estándar, visible para cualquier evaluador) con entradas por fecha y tipo.
- **Archivos afectados**: `CHANGELOG.md`.

### [decision] Definición de la prueba técnica + verificación de la PokeAPI

- **Descripción**: Se recibe el enunciado completo de la prueba técnica: lista de pokémons favoritos con Vue.js, dos llamados a la PokeAPI (`GET /api/v2/pokemon` y `GET /api/v2/pokemon/{name}`), pantalla de loading con pokebola animada, botón compartir que copia nombre + atributos al portapapeles, favoritos persistidos en el store de Vue (Pinia). Se evalúa con arquitectura SOLID/KISS, unit tests y README con resumen de decisiones.
- **Decisión técnica**: Antes de diseñar, se verificó la API real con curl (no asumida): lista paginada `{count, next, previous, results[{name,url}]}` con **1351 pokémon**; detalle con `id, name, height, weight, types[], stats[], abilities[], sprites.other.official-artwork.front_default`. Se descartó un plan SDD previo que apuntaba a otro dominio (FX/fintech) por no corresponder a la prueba.
- **Implicación**: La paginación de la API (1351 registros) valida el requisito de la prueba de "pensar en gran cantidad de data" → la lista debe paginar/lazy-load, no cargar todo.
- **Archivos afectados**: ninguno (solo verificación externa).

### [setup] Inicio de SDD (Spec-Driven Development) — fases de planeación

- **Descripción**: Se inicia el ciclo SDD con el harness Gentle-AI. Cada fase SDD quedará registrada en este diario para evidenciar el uso del harness.
- **Decisión técnica**: Artifact store `openspec` (sin Engram, pedido explícito). Todas las fases se delegan a sub-agentes y se validan con el gatekeeper antes de avanzar.
- **Archivos afectados**: `openspec/config.yaml`, `openspec/specs/`, `openspec/changes/`, `.atl/skill-registry.md`, `CHANGELOG.md`.

### [decision] SDD Session Preflight — configurado por el usuario

- **Descripción**: El usuario completó el preflight de sesión en una sola ronda.
- **Decisión técnica** (valores canónicos cacheados para toda la sesión):
  - Execution mode: `interactive` — pausa tras cada fase para revisión del usuario
  - Artifact store: `openspec` — artefactos en `openspec/`, sin Engram
  - Delivery strategy: `ask-on-risk` — preguntar si el pronóstico supera 400 líneas
  - Review budget: `400` líneas
- **Implicación**: En modo interactivo, el orquestador detiene el pipeline entre fases y presenta proceed/adjust/stop; antes de `sdd-propose` se ofrece una ronda de preguntas de producto.
- **Archivos afectados**: `CHANGELOG.md` (decisión de sesión, no persistida en artefactos SDD).

### [decision] Ronda de preguntas de producto — decisiones confirmadas

- **Descripción**: Ronda interactiva antes de la propuesta para resolver tradeoffs reales de producto.
- **Decisiones confirmadas por el usuario**:
  1. Carga de lista: **infinite scroll** (carga incremental 20-30/página; los 1351 pokémon verificados obligan a paginar).
  2. Detalle: imagen + resumen, con botón **"ver más"** para el set completo (tipos, stats base, altura, peso, habilidades).
  3. Favoritos: **Pinia + localStorage** (persistencia real, cumple y demuestra el punto del enunciado).
  4. Compartir: copia al portapapeles nombre + atributos separados por coma (formato exacto a precisar en spec).
- **Archivos afectados**: ninguno (decisiones capturadas en la propuesta).

### [architecture] Fase SDD: propose — propuesta del cambio pokemon-favorites

- **Descripción**: Fase `sdd-propose` delegada al sub-agente. Generó `openspec/changes/pokemon-favorites/proposal.md` (109 líneas) con Intent, Scope (In/Out), Product Goals, 4 decisiones confirmadas como supuestos, requisitos iniciales, 4 capacidades declaradas (pokemon-list, pokemon-detail, favorites, share), enfoque, áreas afectadas (9 rutas), riesgos y 6 criterios de éxito verificables.
- **Decisión técnica**: Se descartó el plan JSON previo de dominio FX/fintech (no correspondía a la prueba); la propuesta se construyó sobre el enunciado real de Global66 + PokeAPI verificada.
- **Gatekeeper**: PASS — artefacto existe, alcance coherente, sin drift de las decisiones confirmadas.
- **Riesgos abiertos para spec**: formato exacto del share, cache de detalles, manejo de errores de red, rate limiting de PokeAPI, jank del infinite scroll, referencia al store demo `counter`.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/proposal.md`.

### [architecture] Fase SDD: spec — requerimientos y contratos por capacidad

- **Descripción**: Fase `sdd-spec` delegada al sub-agente. Generó 4 specs (una por capacidad, 15 requerimientos / 31 escenarios Given-When-Then, todas testables) en `openspec/changes/pokemon-favorites/specs/`.
- **Decisiones resueltas**:
  - **Share**: formato fijado → `pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90` (`{name}, {types}, HP {hp}, Attack {attack}, Defense {defense}, Speed {speed}`).
  - **Cache de detalles**: en memoria por nombre (sesión; fallos/404 nunca se cachean).
  - **Errores de red**: estado de error por página/detalle + retry; una página fallida no borra las cargadas.
  - **Store demo `counter`**: se elimina (App.vue demo, spec demo y su test) — el evaluador no debe ver código demo muerto.
- **Contratos TS derivados de la API real**: `PokemonSummary`, `PokemonListResponse`, `PokemonDetail`, `PokemonStats`, `FavoritePokemon` (snapshot con name/id/imageUrl/types/addedAt para render offline).
- **Gatekeeper**: PASS — 4 artefactos existen, sin drift.
- **Riesgos para design**: ubicación de la vista de favoritos (ruta vs. tab), sync cross-tab (SHOULD via storage event), etiquetas exactas de stats (special-attack/defense).
- **Archivos afectados**: `openspec/changes/pokemon-favorites/specs/{pokemon-list,pokemon-detail,favorites,share}/spec.md`.

### [decision] Contexto adicional para design — referencia UI + refinamiento de producto

- **Descripción**: El usuario aportó dos fuentes para la fase design: (1) un JSON de spec refinada con Welcome screen, búsqueda, tabs ALL/FAVORITES, modal de detalle y bottom nav; (2) una app de referencia real con UI pulida (https://vuekemon66.vercel.app/dex — SPA Vue, sin SSR, por eso el fetch solo devuelve el título).
- **Decisiones técnicas adoptadas del input**:
  - Rutas: `/` (Welcome) y `/pokemons` (lista) — pantalla de bienvenida antes de la lista.
  - Store único `usePokemonStore`: pokemonList, favorites (persistidos localStorage), activeTab ('ALL'|'FAVORITES'), searchFilter, selectedPokemon, loading.
  - Componentes: WelcomeView, PokeballLoader, SearchBar, PokemonRowItem, PokemonDetailModal (con navigator.clipboard), EmptyState, BottomNavBar.
- **Implicación**: El diseño debe integrar estas decisiones con las 4 specs ya generadas (infinite scroll + búsqueda; detalle resumen + "ver más"; favoritos snapshot; share con formato fijado).
- **Archivos afectados**: ninguno (input para la fase design).

### [architecture] Fase SDD: design — arquitectura por capas

- **Descripción**: Fase `sdd-design` delegada al sub-agente. Generó `openspec/changes/pokemon-favorites/design.md` (189 líneas): arquitectura de capas types → services → store → composables → components → views.
- **Decisiones de arquitectura**:
  - Store único `usePokemonStore` (setup store): lista paginada, favoritos persistidos, activeTab, searchFilter, selectedPokemon, loading.
  - Capa de servicios separada del store (SRP, interfaces para testeo).
  - Composable `useInfiniteScroll` (IntersectionObserver + guardas loading/hasNext/dedupe, con fallback si IO no existe).
  - Detalle en modal teleported (Escape, focus trap) + cache en memoria por nombre.
  - Favoritos como snapshots (name/id/imageUrl/types/addedAt) en localStorage con sync cross-tab.
  - Share: `navigator.clipboard.writeText` + fallback execCommand + feedback visual.
- **Gatekeeper**: PASS — artefacto existe, cada requisito de las 4 specs mapea a diseño.
- **Delta detectado (para alinear en archive)**: la spec original ubicaba lista en `/` y detalle en `/pokemon/:name`; la arquitectura adoptada (input del usuario) usa `/` = WelcomeView y `/pokemons` = lista con modal. El comportamiento es la fuente de verdad; verify validará comportamiento, no literales de URL.
- **Riesgos técnicos para tasks**: jsdom no dispara storage entre tabs, no tiene navigator.clipboard ni IntersectionObserver → los tests deben stub/mockear; verificación real en browser.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/design.md`.

### [decision] Corrección de routing — patrón canónico lista → detalle

- **Descripción**: El usuario detectó un anti-patrón en el routing adoptado (Welcome en `/`, lista en `/pokemons`, detalle solo en modal). Evaluación del orquestador confirmó el problema: el Welcome no está en el enunciado de la prueba (scope creep del JSON de referencia), y el detalle sin ruta rompe deep-linking, back button y share de URL.
- **Decisión técnica (patrón correcto adoptado)**:
  - `/` → `PokedexListView` (lista + búsqueda + tabs ALL/FAVORITES + infinite scroll) — la lista es la pantalla principal, como pide la prueba y la spec.
  - `/pokemon/:name` → `PokemonDetailView` (ruta param: deep-link, browser history, back button, URL compartible).
  - Sin WelcomeView como ruta.
  - Tabs como estado del store (la spec de favorites lo permite explícitamente).
- **Beneficio**: elimina el delta spec-vs-arquitectura pendiente; el diseño queda alineado con las specs y con el patrón URL-driven estándar.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/design.md` (en corrección).

### [architecture] Fase SDD: design corregido — patrón URL-driven aplicado

- **Descripción**: Re-ejecución de la fase `sdd-design` con feedback correctivo. Design.md reescrito (198 líneas).
- **Cambios aplicados**:
  - `/` → `PokedexListView` (la lista ES la pantalla principal, per spec).
  - `/pokemon/:name` → `PokemonDetailView` (vista dedicada enrutable: deep-link, browser back/history, URL compartible).
  - `WelcomeView` eliminado (scope creep del JSON de referencia).
  - `PokemonDetailModal` → `PokemonDetailPanel` (presentacional, sin teleport/dialog — ya no es modal).
  - Delta spec-vs-arquitectura eliminado de Open Questions (resuelto).
- **Decisión destacada**: se rechazó el route-driven modal (deep-link requeriría la lista montada detrás — más piezas móviles); la vista dedicada es la opción más simple y segura. El scroll/páginas de la lista se restauran vía browser history + estado del store.
- **Gatekeeper**: PASS — diseño coherente con specs pokemon-list y pokemon-detail, sin deltas.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/design.md`.

### [architecture] Fase SDD: tasks — plan de implementación + Review Workload Forecast

- **Descripción**: Fase `sdd-tasks` delegada al sub-agente. Generó `openspec/changes/pokemon-favorites/tasks.md` (629 palabras): 22 tareas en 6 fases TDD-first (Foundation, Core state, Components+styles, Views+router+integration, Demo cleanup, Docs+final gates), cada una RED → implementar → GREEN contra `npm run test:unit -- --run`.
- **Cobertura**: cada escenario clave de las 4 specs mapeado a tarea verificable (dedupe/exhaustion de paginación, cache por nombre, snapshots + sync cross-tab, formato exacto de share, error/retry/404, a11y).
- **Review Workload Forecast**:
  - Líneas estimadas: ~1300 (1200–1500) · Riesgo sobre budget de 400 líneas: **High**
  - Chained PRs recomendados: **Sí** (5 work units: tipos+servicios / store+composables / componentes / vistas+router+cleanup / README+gates)
  - **Decision needed before apply: Yes** (delivery `ask-on-risk`)
- **Gatekeeper**: PASS — artefacto existe, sin drift.
- **Riesgos**: e2e declarado pero requiere dev server + browsers (gate degrada a unit+type-check+lint si falla); `imageUrl` derivado del CDN de sprites; favoritos con `types: []` hasta visitar detalle.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/tasks.md`.

### [decision] Pipeline SDD en pausa — revisión del diseño Figma

- **Descripción**: Antes de lanzar `sdd-apply`, el usuario detuvo el pipeline (decisión de usuario, no fallo) al localizar el diseño oficial de la prueba en Figma: https://www.figma.com/design/edU7Pms8bvosgSYW23yOds/Pok%C3%A9dex (node-id=0-1).
- **Estado**: Las 4 fases de planeación SDD están completas y documentadas (propose → spec → design → tasks). La decisión de entrega (PRs encadenados vs. size:exception, ~1300 líneas, riesgo High) queda **pendiente** hasta retomar.
- **Pendiente**: incorporar el diseño Figma como fuente de verdad visual antes de apply; luego decidir entrega y lanzar apply.
- **Archivos afectados**: ninguno (pausa).

### [config] Setup Figma — tokens, .env y MCP server

- **Descripción**: Configuración para conectar el diseño Figma oficial de la prueba al harness. El usuario aportó un JSON de MCP con el paquete `@modelcontextprotocol/server-figma` y la variable `FIGMA_PERSONAL_ACCESS_TOKEN`.
- **Correcciones técnicas aplicadas (verificación real, no asumida)**:
  - El paquete `@modelcontextprotocol/server-figma` **no existe en npm** (404). Se reemplazó por el oficial de Figma: `figma-developer-mcp` (v0.13.2), que espera `FIGMA_API_KEY` (no `FIGMA_PERSONAL_ACCESS_TOKEN`).
  - El token `figd_tu_token_aqui` es un **placeholder** (18 chars); los tokens reales de Figma son `figd_` + ~40 chars. Conexión REST devolvió **HTTP 403** hasta poner el token real.
  - `.gitignore` ampliado: `.env`, `.env.*` excepto `.env.example` (los tokens NUNCA se commitean).
- **Config final**:
  - `.env` (ignorado por git): `FIGMA_API_KEY`, `FIGMA_ACCESS_TOKEN`, `FIGMA_PERSONAL_ACCESS_TOKEN` (alias), `FIGMA_FILE_KEY=edU7Pms8bvosgSYW23yOds`.
  - `.env.example` (commiteable): documentación de la estructura.
  - `opencode.json` (proyecto, scoped a poke-global): MCP `figma` local con wrapper `bash -lc "source .env && npx -y figma-developer-mcp"` — el token se lee del `.env` en runtime, nunca hardcodeado en config. Se verificó que opencode NO inyecta `.env` del proyecto en MCP env en tiempo de resolución, por eso el wrapper sourcea explícito.
  - **Verificado**: el MCP server arranca activo, detecta Personal Access Token y lee `FIGMA_API_KEY` del `.env` (enmascarado).
- **Pendiente del usuario**: reemplazar `figd_tu_token_aqui` por el token real en `.env` (NO pegarlo en el chat), luego reiniciar opencode para activar el MCP.
- **Archivos afectados**: `.env`, `.env.example`, `.gitignore`, `opencode.json`.

### [architecture] Conexión Figma exitosa + extracción del diseño oficial

- **Descripción**: El usuario puso el token real en `.env` (45 chars, ya no placeholder). Conexión REST verificada: **HTTP 200**. Se extrajo la estructura completa del archivo "Pokédex" vía API de Figma (sin exponer el token).
- **Hallazgos críticos — el diseño oficial difiere del plan SDD actual**:
  - Incluye **Splash** (loader pokebola), **Onboarding 01/02**, y **TabBar de 4 items** (Pokedex / Regiones / favoritos / Perfil) → contradice la decisión previa de `/` = lista directa sin onboarding; Regiones/Perfil serían pantallas "Construcción".
  - **Detalle rico**: Nº, nombre, descripción, Peso, Altura, Categoría, Habilidad, Género, Debilidades, navegación Próximo/Anterior → supera el "ver más" simple planeado.
  - **Filtro por tipo** (BottomSheet "Filtra por tus preferencias") → no cubierto en la spec actual (solo búsqueda por nombre).
  - **Favoritos con trash** (eliminar desde lista) y **empty state** específico.
  - **Estados**: Error ("Algo salió mal..." + Reintentar, Magikarp) y Construcción ("¡Muy pronto disponible!").
  - **Paleta/tipografía del sistema de diseño** documentadas (azul `#1e88e5` CTA, fondo `#fafafa`, cards por tipo, 18 tipos con iconos).
  - Textos del Figma en **portugués** ("Procurar Pókemon...") → decisión de idioma pendiente.
- **Artefacto**: `openspec/changes/pokemon-favorites/figma-design-notes.md` — referencia completa del diseño para realinear specs/design/tasks.
- **Implicación para el pipeline**: al reanudar, hay que decidir qué partes del Figma son alcance (splash/onboarding/tabbar/filtro por tipo/detalle rico) y realinear las specs antes de apply. El routing canónico lista→detalle sigue siendo válido para la lista principal.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/figma-design-notes.md`, `CHANGELOG.md`.

### [assets] Descarga de assets Figma — pantallas e iconos

- **Descripción**: Se descargaron los assets del diseño oficial vía API de Figma (`/v1/images/:key`) como referencia visual para la implementación.
- **Pantallas (12, PNG 2x)**: `design-reference/` — onboarding-01, onboarding-02, splash, pokedex-lista, pokedex-filtros, pokedex-detalle, pokedex-bottomsheet, pokedex-headerb2c, pokedex-favoritos, pokedex-error, pokedex-construccion, pokedex-error2.
- **Iconos (20)**: `design-reference/icons/` — 18 iconos de tipo (type-{water,fire,grass,...}, PNG 3x) + icon-heart / icon-heart-solid (PNG + SVG).
- **Decisión técnica**: los iconos de tipo como PNG (escala 3x) para la app; los corazones también en SVG (vector). Los sprites de pokémon NO se descargan de Figma — vienen de la PokeAPI (official-artwork), como decidió la spec (preserva los 2 endpoints).
- **Nota**: el modelo de orquestación no puede previsualizar imágenes; la verificación fue por formato/tamaño (`file`). Revisión visual queda para el usuario o el evaluador.
- **Pendiente**: decidir si estos assets se copian a `src/assets/` (uso en runtime) o quedan solo como referencia de diseño. Se resolverá en la fase de realineación de design.
- **Archivos afectados**: `design-reference/**` (no commiteado como runtime — evaluar en design).

### [architecture] Realineación SDD — Fase propose actualizada (Todo el Figma)

- **Descripción**: Realineación del SDD con el diseño Figma oficial como nueva fuente de verdad (sin reiniciar — el 80% del trabajo técnico seguía siendo válido). Decisiones del usuario: **Todo el Figma** + **UI en español**.
- **Cambios en `proposal.md`**: alcance ampliado de list/detail/favorites/share a Splash + Onboarding 01/02 (visual-only, sin auth real) + TabBar 4 items (Regiones/Perfil = "Construcción") + filtro por tipo (BottomSheet) + detalle rico (Nº, descripción, Peso/Altura/Categoría/Habilidad/Género, Debilidades, Próximo/Anterior) + favoritos con trash + estados Error/Construcción. Capacidades: 4 nuevas + 4 modificadas. Decisiones de producto pasaron de 4 a 10.
- **Decisiones abiertas para spec/design**:
  1. Detalle rico: descripción/categoría/género/debilidades NO están en `GET /pokemon/{name}` → usar species/type rompe la regla de 2 endpoints. Propuesta: datos locales (type-chart, textos bundled) o fallback "—".
  2. Onboarding skip: flag `pokemon-onboarding-seen` en localStorage (propuesta).
  3. Splash duration: ~1.5s fijo vs. hasta que la data esté lista.
  4. Filtro por tipo: single-select vs. múltiple (propuesta: single según "Aplicar" del Figma).
  5. Alcance del filtro: solo páginas cargadas vs. catálogo completo (rompe 2-endpoints).
  6. Assets: mapas de 18 tipos (nombre ES/color/icono) locales, sin dependencias nuevas.
- **Layout fino extraído** (actualizado en figma-design-notes.md): Card radius 16, botones **pill radius 100**, chips de tipo con icono en círculo blanco, TabBar/BottomSheet con sombra superior `0 -1px 3px rgba(0,0,0,.12)` y esquinas superiores redondeadas (16 y 24px), paddings y gaps exactos por componente.
- **Gatekeeper**: PASS — proposal actualizada integrando el Figma sin descartar decisiones previas no contradictorias.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/proposal.md`, `openspec/changes/pokemon-favorites/figma-design-notes.md`.

### [decision] Verificación de API para detalle rico + decisiones de filtro/onboarding

- **Descripción**: Re-verificación de la PokeAPI para el detalle rico del Figma (descripción, categoría, género, debilidades) — confirmado que **NO están en `GET /pokemon/{name}`**.
- **Evidencia verificada hoy**:
  - `GET /pokemon/pikachu` → NO tiene descripción/categoría/género/debilidades; solo referencia a `species`.
  - `GET /pokemon-species/25` → descripción ES ("Levanta su cola para vigilar..."), categoría ("Pokémon Ratón"), gender_rate.
  - `GET /type/electric` → `damage_relations.double_damage_from: ['ground']` y catálogo completo del tipo (114 pokémon, sin paginar).
- **Decisiones del usuario**:
  1. **Detalle rico**: autorizados los llamados extra. Estrategia: 1 extra por detalle (`species`, cacheado) + debilidades desde **mapa local estático** de los 18 tipos (datos fijos, cero llamados).
  2. **Splash/Onboarding**: flujo **fijo idéntico al Figma** (Splash → Onboarding 01 → Onboarding 02 → lista), sin saltos por localStorage.
  3. **Filtro por tipo**: **multi-select** (el diseño tiene checkbox) — al aplicar, busca en TODO el catálogo vía `GET /type/{tipo}` por tipo seleccionado, unión en memoria, y **paginación sobre el set filtrado** para mantener infinite scroll con los mismos filtros.
- **Implicación**: la regla de "solo 2 llamados" del enunciado se amplía (autorizado por el usuario, justificado por el diseño oficial); se documenta como desviación consciente.
- **Archivos afectados**: ninguno (decisiones para la realineación de specs).

### [architecture] Realineación SDD — Fase spec (8 specs alineadas con el Figma)

- **Descripción**: Realineación de la fase spec con el Figma oficial. 4 specs existentes ampliadas + 4 nuevas.
- **Actualizadas**: `pokemon-list` (filtro multi + infinite scroll sobre set unido + búsqueda local + cards con Nº/tipos/fondo por tipo), `pokemon-detail` (detalle rico: descripción/categoría/género vía `PokemonSpecies` cacheado, debilidades desde `WeaknessChart` local, Próximo/Anterior con contexto filtrado, reemplaza "ver más"), `favorites` (tab `/favorites`, trash, empty state con copy exacto, tap → detalle), `share` (formato fijado blindado contra campos nuevos).
- **Nuevas**: `onboarding-flow` (Splash 1.5s CSS + Onboarding 01/02 flujo fijo sin skip), `navigation-tabbar` (4 items, rutas, Regiones/Perfil → Construcción, preservación de estado por tab), `type-filter` (BottomSheet multi-checkbox, unión atómica de catálogos `GET /type/{tipo}` cacheados, paginación cliente), `feedback-states` (Error + Reintentar + Construcción, ambas con Magikarp inline).
- **Hallazgo técnico importante**: la API de lista solo trae `{name, url}` → los types de las cards del Figma requieren resolver vía `GET /pokemon/{name}` con cache compartido (1 request por pokémon por sesión, peor caso 24/página).
- **Decisiones cerradas**: Splash ~1.5s fijo, multi-select, sin flag de onboarding, Próximo/Anterior indexado por contexto, apply atómico, `Aplicar` deshabilitado sin selección, `gender_rate` → porcentajes con coma decimal.
- **Gatekeeper**: PASS — 8 specs existen, sin drift.
- **Riesgos para design**: mecanismo de Próximo/Anterior, estrategia de batching/dedupe del fan-out de types, habilidad en inglés (Overgrow vs "Espesura"), preservación de estado por tab (keep-alive vs store), búsqueda parcial, placement del share.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/specs/{pokemon-list,pokemon-detail,favorites,share,onboarding-flow,navigation-tabbar,type-filter,feedback-states}/spec.md`.

### [architecture] Realineación SDD — Fase design (arquitectura Figma completa)

- **Descripción**: `design.md` realineado (231 líneas) al Figma oficial y las 8 specs. Extiende el diseño previo sin descartarlo (capas, store único, servicios con caches, favoritos snapshot, infinite scroll 24/pág, share fijo, loader CSS).
- **Routing completo**:
  - `/splash` → SplashView (pokebola CSS, 1.5s → /onboarding)
  - `/onboarding` → OnboardingView (pasos 01/02, botones Continuar/Empecemos)
  - `/` → PokedexListView (shell TabBar)
  - `/regions`, `/profile` → ConstructionView ("¡Muy pronto disponible!")
  - `/favorites` → FavoritesView (snapshots, trash, empty)
  - `/pokemon/:name` → PokemonDetailView (detalle rico, TabBar visible)
  - **Guard de cold-load en memoria** (flag `flowComplete` en router): el flujo Splash→Onboarding corre en cada reload pero recuerda el target → preserva deep-links y browser history SIN persistir flag (la spec de onboarding prohíbe skip/flag).
- **Contrato de endpoints**: pasa de 2 a **4 whitelisted** (pokemon, pokemon/{name}, pokemon-species/{id}, type/{tipo}) — ampliación autorizada y justificada por el Figma.
- **Decisiones de diseño**: unión atómica de filtros (Promise.all sobre catálogos cacheados, retry solo de tipos fallidos), fan-out de types con 6 en vuelo, contexto Próximo/Anterior indexado en store (no en URL), KeepAlive solo en tabs, PNG de pantalla = solo referencia (nunca empaquetados), magikarp SVG inline, tokens pixel-fieles (card 16, pill 100, sombra superior).
- **Gatekeeper**: PASS — diseño responde a las 8 specs.
- **Riesgos para tasks**: tuning de concurrencia del fan-out, detalle vía deep-link con Próximo/Anterior deshabilitados (aceptado), shimmer duration.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/design.md`.

### [architecture] Realineación SDD — Fase tasks (plan completo Figma)

- **Descripción**: `tasks.md` reescrito para el alcance Figma completo: **40 tareas en 7 fases** TDD-first. Se migró lo válido del plan previo (paginación 24, snapshot favoritos, share fijo, búsqueda debounced, caches de sesión, limpieza demo) y se reemplazó lo contradictorio (2→4 endpoints, "ver más"→panel rico, entrada directa→flujo fijo con guard, single→multi filtro, fan-out con `useBoundedFanOut` ≤6 en vuelo, TabBar 4 items + Construction, estados Error/Construcción/Magikarp).
- **Copies en español embebidos** como strings exactos (onboarding, filtro, error, construcción, favoritos vacío). **Assets**: 18 PNG tipo + 2 hearts SVG → `src/assets/icons/` (tarea 1.5); PNG de pantalla solo referencia.
- **Review Workload Forecast**:
  - Líneas estimadas: **~3900** (3400–4400) · Riesgo sobre 400: **High**
  - Chained PRs recomendados: **Sí** — 6 PRs: Foundation → Core state → Shell/nav → Componentes+Estilos → Views → Limpieza/gates
  - **Decision needed before apply: Yes**
- **Gatekeeper**: PASS — 40 tareas cubren las 8 specs, self-contained.
- **Nota de dependencia**: las views (Fase 4) dependen de los componentes (Fase 5) pese a la numeración — el orden real de apply es 1→2→3→5→6→4→7.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/tasks.md`.

### [decision] Evaluación de seguridad/escalabilidad/SOLID/KISS + mejora aplicada

- **Descripción**: Evaluación del diseño por el orquestador (a petición del usuario) antes de apply, y mejora de escalabilidad aprobada.
- **Evaluación**:
  - **Seguridad: sólida** — única entrada dinámica es ruta param encodeada (nunca ejecutada); Vue escapa datos de API; localStorage con try/catch; guard cold-load solo en memoria.
  - **SOLID: bueno** — SRP por capas (services/store/composables/components/views), DIP (store testeado con servicio mockeado), OCP (TYPE_META extensible).
  - **KISS: bueno** — un store, sin librerías de animación, sin sobre-ingeniería.
  - **Escalabilidad: un punto débil real** — el fan-out de types en cards implicaba 1 request de detalle por pokémon visible (hasta 1351 por sesión si se scrollea todo). 
- **Mejora aprobada y aplicada a design.md + tasks.md**: **preload de catálogos de tipos** — al inicializar, se precargan los 18 `GET /type/{tipo}` (≤6 en vuelo) y se construye `nameToTypes: Map<name, TypeName[]>`. Las cards leen los types del mapa → **cero requests de detalle por card**; el filtro aplica desde los mismos catálogos cacheados (cero red al aplicar). Coste: 18 requests (~2-3MB JSON) una vez por sesión. Se **eliminó `useBoundedFanOut`** del diseño y tasks (menos código, más KISS).
- **Veredicto**: 8/10 antes → mejora aplicada; diseño más escalable y más simple a la vez.
- **Archivos afectados**: `openspec/changes/pokemon-favorites/design.md`, `openspec/changes/pokemon-favorites/tasks.md`.

### [config] MCP de Playwright — verificación visual del navegador

- **Descripción**: Se agrega el MCP de Playwright al `opencode.json` del proyecto para que el orquestador pueda abrir el navegador y verificar visualmente la app durante/después de la implementación (capturas, navegación real), no solo tests unitarios.
- **Config**: `@playwright/mcp` (v0.0.79) local con `--allowed-hosts localhost,127.0.0.1` (restringido al dev server local). Browsers de Playwright ya instalados (chromium/firefox/webkit en cache).
- **Verificado**: el config resuelve (5 MCP servers: codegraph, context7, engram, figma, playwright) y el server arranca activo.
- **Uso previsto**: en las fases de apply, `npm run dev` + MCP Playwright para capturar pantallas del flujo (splash → onboarding → lista → detalle → favoritos) y validar el Figma visualmente.
- **Archivos afectados**: `opencode.json`.

### [feature] PR 1 implementado y commiteado — Foundation

- **Descripción**: Fase 1 (Foundation) implementada por `sdd-apply` en la rama `feature/pokemon-favorites`, commit `05d3432` (30 archivos, 847 líneas). Strict TDD: RED → GREEN, **31/31 tests pasan**, type-check limpio.
- **Contenido**: `src/types/pokemon.ts` (10 contratos + PAGE_SIZE=24 + STORAGE_KEY), `src/data/types.ts` (TYPE_META 18 tipos + WEAKNESS_CHART), `src/services/pokeapi.ts` (4 endpoints + 3 caches + buildShareText exacto), `src/services/storage.ts` (favoritos con fallback), 20 assets en `src/assets/icons/`.
- **Notas técnicas**: caches module-level del servicio requieren claves únicas por test; `fetchPokemonPage(offset)` recibe el offset directo (no índice de página); assets importados estáticamente para URLs resolubles de Vite.
- **Pendiente**: PR 2 (Core state: store slices + composables) tras reiniciar opencode con MCP Playwright activo.
- **Archivos afectados**: `src/types/`, `src/data/`, `src/services/`, `src/assets/icons/`, `src/__tests__/`, `openspec/changes/pokemon-favorites/tasks.md` (1.1–1.5 marcadas).

### [decision] Reinicio opencode + registro Engram

- **Descripción**: Reinicio de opencode por el usuario (activa MCP Playwright + Engram). Proyecto registrado en Engram vía `.engram/config.json` (`{"project": "poke-global"}`, formato igual a rallytap); el MCP no auto-detecta por cwd (sesión corre desde `repos/`), se usa `project="poke-global"` explícito en las llamadas. Guardado verificado (#968, #969).
- **Archivos afectados**: `.engram/config.json` (commit `46f9c54`).

### [blocked] PR 2 (Core state) — fallo de transporte en sdd-apply

- **Descripción**: Intento de implementar la Fase 2 (store slices + 3 composables, tareas 2.1–2.9). El sub-agente `sdd-apply` devolvió `GENTLE_AI_SDD_FAILURE` con código `sdd_task_result_empty` **dos veces consecutivas** (resultado vacío de transporte, no fallo de implementación).
- **Contrato seguido**: no se reintentó automáticamente; se ejecutó la continuación (`gentle-ai sdd-status --json`) una vez; se verificó que el repo quedó intacto (árbol limpio, `src/stores/` solo con `counter.ts` demo, `composables/` inexistente, tasks 2.x sin marcar).
- **Causa probable**: el resultado del lanzamiento (9 tareas con evidencia TDD extensa) excede el límite del canal de transporte del sub-agente — el PR1 con 5 tareas pasó, este con 9 no.
- **Decisión del usuario**: **Parar** el apply. Pendiente decidir cómo implementar el PR2 (dividir en 3 lotes con sdd-apply, usar agente general, o revisar el harness).
- **Estado del repo**: `feature/pokemon-favorites` con 5 commits, 31/31 tests de Fase 1 pasando, type-check limpio.
- **Archivos afectados**: ninguno (sin cambios; pausa).

### [decision] Diagnóstico del fallo de transporte + cambio de canal

- **Descripción**: Tras 3 fallos consecutivos de `sdd-apply` con `sdd_task_result_empty` (incluido un lote reducido de 3 tareas), se descartó la hipótesis de tamaño del resultado. El problema es sistémico del canal de transporte del agente `sdd-apply` en esta sesión.
- **Decisión técnica**: mantener intactos los artefactos SDD (verificados sanos: proposal 137 líneas, 8 specs, design 231 líneas, tasks 94 líneas) y **cambiar de canal de implementación al agente `general`** (misma ruta SDD/openspec, delegación directa, canal distinto) — sin reiniciar el SDD.
- **Resultado**: Lote A (tasks 2.1–2.3: store catalog + filter + search + nav) implementado con TDD estricto vía agente general: `src/stores/pokemon.ts` + `src/__tests__/pokemon-store.spec.ts` (22 tests nuevos). Suite completa **53/53**, type-check limpio. Commit `a3c06b4`.
- **Archivos afectados**: `src/stores/pokemon.ts`, `src/__tests__/pokemon-store.spec.ts`, `openspec/changes/pokemon-favorites/tasks.md` (2.1–2.3 marcadas).

### [feature] PR 2 completado — Core state (store + composables)

- **Descripción**: Fase 2 implementada en 3 lotes vía agente `general` (canal que sí funciona; `sdd-apply` falló 3 veces por transporte y quedó descartado para esta sesión).
- **Lote A** (`a3c06b4`): store slices catalog/filter/search/nav — 22 tests nuevos, suite 53/53.
- **Lote B** (`c7d2339`): store slices detail+species/favorites/type-preload — `nameToTypes` compartido con `applyTypeFilter` (cero red al aplicar), preload ≤6 en vuelo; 22 tests nuevos, suite 75/75.
- **Lote C** (`97e3a0e`): composables `useInfiniteScroll`, `useDebouncedRef`, `useClipboard` — 17 tests nuevos, suite **92/92**, type-check limpio.
- **Riesgo anotado**: la spec de pokemon-detail lista 4 chips de debilidades para Bulbasaur pero la cláusula normativa exige union WEAKNESS_CHART (7 para grass+poison) — se siguió la normativa.
- **Archivos afectados**: `src/stores/pokemon.ts`, `src/composables/{useInfiniteScroll,useDebouncedRef,useClipboard}.ts`, `src/__tests__/{pokemon-store,composables}.spec.ts`, `tasks.md` (2.1–2.9 marcadas).

### [feature] PR 3 — Shell y navegación

- **Descripción**: Router con guard cold-load `flowComplete` (Splash→Onboarding→shell, deep-link preservado), TabBar 4 items con a11y completa, App shell con header + TabBar + `<KeepAlive>` (Pokedex/Favoritos). Views como stubs mínimos (las reales en PR5). 17 tests nuevos → **108/108**, type-check limpio. Commit `42c4346`.
- **Verificación visual (Playwright headless)**: navegó a `/splash` correctamente (guard activo), sin errores de consola. Capturas guardadas en `design-reference/verify-pr3-splash.png` y `verify-pr3-onboarding.png` (390×844). Nota: el MCP de Playwright no quedó expuesto en esta sesión; se usó el Playwright del proyecto directamente.
- **Archivos afectados**: `src/router/index.ts`, `src/components/TabBar.vue`, `src/App.vue`, `src/main.ts`, `src/views/*` (stubs), `src/styles/main.css` (provisional), `src/__tests__/{router,components,App}.spec.ts`, `tasks.md` (3.1–3.3).

### [feature] PR 4 — Componentes + estilos (13 componentes, tokens reales)

- **Descripción**: Implementado en 2 lotes vía agente general.
- **Lote A** (`1cc8386`): `src/styles/tokens.css` (paleta Figma, radius, shadow-top, spacing, type scale) + `main.css` real (keyframes pokeball/shimmer, transitions fade/slide/sheet, prefers-reduced-motion, grid 2-col ≥640px) + 9 componentes base (TypeBadge, SearchBar, EmptyState, ErrorState, ConstructionState, Magikarp, PokeballLoader, FavoriteButton, ShareButton). 23 tests nuevos → 131/131.
- **Lote B** (`c60034d`): 3 componentes complejos — PokemonCard (Nº padded, tipos desde `nameToTypes`, fondo por tipo), TypeFilterSheet (dialog multi-checkbox, focus trap, apply atómico, retry solo tipos fallidos), PokemonDetailPanel (todos los campos Figma, tipos por slot, hosts FavoriteButton+ShareButton). Export menor `deriveSpecies` añadido al store (reutilizado por el panel). 30 tests nuevos → **161/161**, type-check limpio.
- **Archivos afectados**: `src/styles/{tokens,main}.css`, `src/components/*` (13), `src/stores/pokemon.ts` (export deriveSpecies), `src/__tests__/*`, `tasks.md` (5.1–5.12, 6.1–6.2).

### [feature] PR 5 — Vistas reales (app funcional) + verificación visual

- **Descripción**: Implementado en 2 lotes vía agente general. Reemplazo de los stubs por vistas funcionales completas.
- **Lote A** (`4824013`): SplashView (pokebola CSS, auto-avance 1500ms, reduced-motion), OnboardingView (copy exacto Figma, dots accesibles, Transition, sin skip/localStorage), ConstructionView (thin wrapper). 12 tests → 173/173.
- **Lote B** (`fb281cd`): PokedexListView (loadFirstPage, infinite scroll catálogo/filtro, SearchBar + contador, TypeFilterSheet, Borrar filtro, ErrorState + sentinel error, grid 2-col), PokemonDetailView (openDetail por param, species degrada a —, Próximo/Anterior indexado, 404, focus heading), FavoritesView (snapshots sin red, trash, empty state exacto). Cambios menores: flag `detailNotFound` en store, `TabBar.isActive` marca Pokedex en `/pokemon/*`. 24 tests → **197/197**, type-check limpio.
- **Verificación visual (Playwright headless)**: journey completo sin errores — splash → onboarding 01/02 → lista (120 cards cargadas, 5 páginas) → detalle `/pokemon/bulbasaur` → back. Input de búsqueda con placeholder correcto, TabBar 4 items exactos. Capturas `design-reference/journey-*.png`.
- **Archivos afectados**: `src/views/*` (6 reales), `src/stores/pokemon.ts` (detailNotFound), `src/components/TabBar.vue` (isActive), `src/__tests__/*`, `tasks.md` (4.1–4.6).

### [bugfix] Verificación Figma vs implementación — preload de tipos huérfano

- **Descripción**: Al medir la implementación contra los valores exactos del Figma (colores/radios/sombras/tipografías), se detectó que **6 de 7 mediciones coincidían** pero las cards NO pintaban el fondo por tipo (Bulbasaur salía `#fafafa` en vez de `#8bc34a` grass) y no mostraban chips de tipo.
- **Causa raíz**: `preloadTypes()` existía en el store (bien implementado, ≤6 en vuelo, cache compartido) pero **nadie lo llamaba** — ni la vista, ni el router, ni App. La función estaba huérfana.
- **Fix**: `PokedexListView.onMounted` ahora dispara `store.preloadTypes()` en paralelo con `loadFirstPage()`. Commit `9644d2c`.
- **Verificado en browser**: card 1 = Bulbasaur con fondo `rgb(139,195,74)` (`#8bc34a` grass), chips `Planta | Veneno`, radius 16, zero errores. Suite 197/197 + type-check limpio.
- **Lección**: la verificación visual contra el Figma no es opcional — atrapó un bug de integración que los unit tests no cubrían (ningún test montaba la vista y disparaba el preload real).
- **Archivos afectados**: `src/views/PokedexListView.vue`, `design-reference/journey-04-pokedex-list.png` (captura corregida).

### [bugfix] Verificación Figma completa — toolbar sticky + pointer-events + layout detalle

- **Descripción**: Revisión exhaustiva del layout contra el Figma a petición del usuario (que detectó UI superpuesta y desalineada). Dos bugs de UI reales encontrados por verificación programática:
  1. **Toolbar no clickeable**: las imágenes de las cards interceptaban los clicks sobre el botón "Filtrar" (toolbar era `position: static` sin fondo). Fix: toolbar `sticky top:0`, `z-index:2`, `background: var(--bg)`.
  2. **Clicks en cards bloqueados**: los `<img>` decorativos (type badge icon y artwork) interceptaban el click sin propagarlo limpio. Fix: `pointer-events: none` en `.type-badge__icon` (main.css) y `.pokemon-card__image` (PokemonCard.vue).
- **Verificación**: audit completo del journey (splash→onboarding→lista→filtro→detalle→favoritos→construcción) → **18/18 PASS** + error state. Suite 197/197, type-check limpio.
- **Archivos afectados**: `src/views/PokedexListView.vue` (toolbar sticky), `src/styles/main.css` (pointer-events badge), `src/components/PokemonCard.vue` (pointer-events image).

### [architecture] Reconstrucción del detalle — geometría real del Figma (API)

- **Descripción**: El usuario reportó que la UI no seguía el Figma. El orquestador reconoció que NO puede ver imágenes y que la verificación previa midió tokens aislados, no composición. Se conectó a la API de Figma y extrajo la **geometría exacta** del detalle (node 10:6948): header 307px con círculo 498×498 del color del tipo, artwork 142×155, nav circular 48×48, chips junto al nombre, línea separadora, características en 2 columnas.
- **Reconstrucción** (commit `39727bf`): `PokemonDetailPanel.vue` reescrito con la estructura Figma exacta (círculo de color, artwork centrado, back + heart, nav circular, elementos, descripción + divider, 2 columnas, debilidades); `PokemonDetailView.vue` conecta emits (back→goBack, prev/next→goTo). `PokemonCard.vue` verificado y sin cambios (ya cumplía). **206/206 tests**, type-check limpio.
- **Verificación geométrica**: DOM medido contra el Figma — círculo 498×498 bg `#8bc34a`, artwork 142×155, back 38×38, nav 48×48 radius 50%, divider 1px, 2 columnas. Captura `design-reference/verify-detalle-rebuilt.png`.
- **Lección de proceso**: el orquestador no puede previsualizar imágenes; la verificación fiel requiere extraer geometría de la API de Figma y medir el DOM contra ella, y el USUARIO valida visualmente las capturas.
- **Archivos afectados**: `src/components/PokemonDetailPanel.vue`, `src/views/PokemonDetailView.vue`, tests, `figma-design-notes.md` (geometría añadida), `tasks.md`.

### [feature] PR 6 (final) — limpieza demo, README AI-First, gates

- **Descripción**: Commit `ceeef2e` — los 6 PRs del plan están completos.
- **Limpieza**: `src/stores/counter.ts` eliminado (sin referencias); test demo e2e "You did it!" reemplazado por 3 tests del flujo real (cold-load → onboarding → lista; deep-link `/favorites`).
- **README.md** reescrito (187 líneas, AI-First): stack con justificación, arquitectura por capas, 7 decisiones clave (4 endpoints + caches, preload `nameToTypes`, snapshot favoritos + cross-tab, flujo fijo sin flag, share exacto, animaciones CSS puras), scripts, estructura, trazabilidad SDD + Gentle-AI, y **Known Debt** (incluida la deuda visual pendiente de validación).
- **Gates**: lint PASS (54 errores de tests de PRs previos corregidos), type-check PASS, unit **206/206**, e2e **3/3 chromium PASS** (flujo completo). Firefox/webkit no probados localmente (browsers no instalados — documentado).
- **Archivos afectados**: `README.md`, `e2e/vue.spec.ts`, `src/stores/counter.ts` (eliminado), tests, `tasks.md` (7.1–7.3).

### [verify] Fase verify — PASS WITH WARNINGS

- **Descripción**: Fase `sdd-verify` ejecutada vía agente general (el canal sdd-* sigue roto por transporte). Verificación independiente: **43 requerimientos / 80 escenarios, 0 CRITICAL, 0 blockers**.
- **PASS confirmados**: regla de endpoints (solo 4 whitelisted en `pokeapi.ts`, artwork = CDN estático), contratos de datos, preload 18 tipos (≤6 en vuelo, cero red por card), atomicidad del filtro, caches de sesión (fallidos/404 nunca cacheados), favoritos + sync cross-tab, trazabilidad (tasks 40/40, CHANGELOG 6 PRs).
- **WARNINGS (6)**:
  - W-1: sin control de favorito en la card de la lista (solo en detalle) — gap vs spec "from both list card and detail".
  - W-2: TabBar sin iconos Figma (solo texto).
  - W-3: estado de lista sin test dedicado (KeepAlive implementado, verificado por inspección).
  - W-4: `<nav class="detail-nav">` duplicado en PokemonDetailView (la tarea 4.4 ordenaba eliminarlo; redundante con el nav circular del panel).
  - W-5: copy drift en subtítulos de ErrorState/ConstructionState (tests asertan el texto desviado).
  - W-6: drift spec/design documentado (preload vs mecanismo literal; imageUrl `string|null`).
- **Artefacto**: `openspec/changes/pokemon-favorites/verify-report.md` (181 líneas).
- **Recomendación del orquestador**: corregir W-4 y W-5 (rápidos y claros), decidir W-1/W-2 (fix o enmendar specs), tests W-3. Ninguno exige rework de arquitectura.

### [fix] Warnings verify RESUELTOS — commit `75a0cf7`

- **Descripción**: los 6 warnings del verify quedaron resueltos; gates **211/211 tests, type-check y lint PASS**.
- **W-1** ✅ FavoriteButton añadido a `PokemonCard.vue` (heart superior derecha, `aria-pressed`, stopPropagation para no navegar al tocar, focus-visible).
- **W-2** ✅ TabBar con iconos SVG inline por item (Pokedex=house, Regiones=globe, Favoritos=heart, Perfil=user) + texto; se mantiene `aria-current`.
- **W-3** ✅ Test de integración "keeps list state across tab switches (KeepAlive)": espía `loadFirstPage`/`fetchPokemonPage` — 1 sola llamada tras `/`→`/favorites`→`/`, 24 cards preservadas.
- **W-4** ✅ Eliminado `<nav class="detail-nav">` duplicado de `PokemonDetailView.vue`; queda solo el nav circular 48×48 del panel. El test aserta `.detail-nav` ausente.
- **W-5** ✅ Copy alineado al EXACTO de la spec: ErrorState `No pudimos cargar la información...`, ConstructionState `Estamos trabajando para traerte esta sección` (sufijos extendidos eliminados); tests actualizados.
- **W-6** ✅ Marcado RESUELTO/ACEPTADO (preload `nameToTypes` decisión aprobada; `imageUrl: string` con coerción `?? ''`).
- **Lección**: el lote inicial abortado dejó W-1/W-2 implementados sin commitear; la verificación independiente confirmó 210→211 tests con el cierre completo.

### [archive] Cambio pokemon-favorites ARCHIVADO — commit `d732d4b`

- **Descripción**: ciclo SDD completo cerrado. El dispatcher nativo pasó a `verify: all_done` / `archive: ready` tras corregir el total de escenarios del verify-report de 80 → **84** (las specs reales tienen 84 escenarios; el dispatcher compara los totales con las specs).
- **Sync de specs**: las 8 specs delta copiadas byte-idénticas a `openspec/specs/{pokemon-list,pokemon-detail,favorites,share,onboarding-flow,navigation-tabbar,type-filter,feedback-states}/spec.md` (verificado con diff).
- **Archive report**: `openspec/changes/pokemon-favorites/archive-report.md` — estado final, decisiones de diseño, Known Debt, trazabilidad (commits + CHANGELOG). El directorio del change se conservó por instrucción del usuario (trail de evaluación), desviación documentada.
- **Assets**: PNG/SVG sueltos de Figma en la raíz movidos a `design-reference/root-figures/`.
- **Lección de proceso**: el dispatcher nativo rechaza verify si los totales de requirements/scenarios del envelope no coinciden con el conteo real de las specs; el envelope debe usar los conteos AUTORITATIVOS (grep de `### Requirement` / `#### Scenario`).

### [fix] Alineación Figma del onboarding — imágenes, orden, botón y dots

- **Descripción**: Onboarding ajustado a los valores exactos del Figma en la sesión de pulido visual.
  1. **Imágenes por paso**: cada paso carga su ilustración (`Group 28.png` paso 1, `Frame 1000002626.png` paso 2), centrada y antes de los textos. Movidas de `design-reference/root-figures/` a `src/assets/images/` (los assets de la app deben vivir en `src/assets`, no en la raíz de referencia).
  2. **Orden vertical corregido**: imagen → título → subtítulo → dot indicator → botón (los dots estaban después del botón).
  3. **Botón a ancho completo**: el CTA llena el ancho del paso (override del `max-width: 328px` del componente vía `:deep`).
  4. **Dots con specs Figma**: seleccionado 28×9px `#173EA5` opacity 1; no seleccionado 9×9px `#4565B7` opacity 0.25; `border-radius: 11px` en ambos.
- **Verificación**: navegador midiendo el DOM — orden de los 5 elementos correcto en ambos pasos, botón 420px (ancho del paso), dots con las dimensiones exactas y cambio de estado al avanzar. Suite 211/211, type-check y lint PASS.
- **Archivos afectados**: `src/views/OnboardingView.vue`, `src/assets/images/*` (nuevos), `design-reference/root-figures/*` (movidos).

### [architecture] Componente reutilizable AppButton — variantes primary/secondary

- **Descripción**: Creado `src/components/AppButton.vue` con las especificaciones del CTA del Figma: ancho 100% (max 328px), alto 58px, `border-radius: 100px`, `gap: 8px`, padding 16px 24px (`--space-xl`), tipografía 18px/600.
- **Variantes**: `primary` (`var(--button-primary-default-bg, #1E88E5)`, texto blanco) y `secondary` (`var(--button-secondary-default-bg, #EEEEEE)`, texto oscuro); soporta `disabled` y `type`.
- **Tokens nuevos**: `--button-primary-default-bg`, `--button-secondary-default-bg`, `--space-xl` en `tokens.css`.
- **Reemplazo en toda la app** (9 CTA píldora): OnboardingView (Continuar/Empecemos), ErrorState (Reintentar), ShareButton (Compartir), TypeFilterSheet (Cancelar=secondary, Aplicar/Reintentar=primary con `flex:1` vía `:deep`), PokemonDetailView (Volver a la Pokédex), PokedexListView (Reintentar del sentinel). Eliminado el CSS duplicado muerto (`.onboarding__cta`, `.state__cta`, `.share-button__cta`, `.sheet__cta`, `.not-found__link`, `.sentinel-error__retry`).
- **Verificación**: navegador — primary `#1E88E5`/blanco, secondary `#EEEEEE`/oscuro, ambos 58px radius 100px; tests actualizados a los selectores nuevos. 211/211 + type-check + lint PASS.
- **Archivos afectados**: `src/components/AppButton.vue` (nuevo), 6 componentes/vistas, `tokens.css`, `main.css`, 4 archivos de tests.

### [fix] Pokeball loader a 155×155px + header global eliminado

- **Descripción**: Dos ajustes de la sesión de pulido.
  1. **Loader 155×155**: `.pokeball-loader` pasa de 64px a **155×155px** según la indicación del usuario (verificado midiendo el elemento en el navegador).
  2. **Header de App.vue eliminado**: el usuario había borrado `<header class="app-header">Pokédex</header>` y un test lo restauró por error en una iteración; se eliminó definitivamente junto con el CSS huérfano `.app-title`, y el test de shell (`App.spec.ts`) se actualizó para validar `nav` + `.pokedex-list-view` sin header.
- **Lección**: cuando un test falla porque el usuario eliminó UI a propósito, se actualiza el test al diseño real — nunca se restaura UI para satisfacer un test obsoleto.
- **Verificación**: 211/211 + type-check + lint PASS.
- **Archivos afectados**: `src/styles/main.css`, `src/App.vue`, `src/__tests__/App.spec.ts`.

## 2026-08-16

### [fix] Animación wobble de la pokebola del splash

- **Descripción**: El loader de la pantalla inicial ahora **oscila como una pokebola real** en lugar de girar: keyframes `pokeball-wobble` (desplazamiento vertical + rotación −22°/22° con asentamiento), `animation: pokeball-wobble 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite` y `transform-origin: bottom center` (pivota desde la base, no desde el centro).
- **Limpieza**: eliminados los keyframes muertos `pokeball-spin`/`pokeball-bounce` y la regla muerta `.pokeball-loader__img` (el componente renderiza un único `<img class="pokeball-loader">`).
- **Verificación**: navegador — animación `pokeball-wobble 1.2s` activa, `transform-origin` resuelto a 77.5px 155px (base centrada). Suite 211/211 + type-check + lint PASS.
- **Archivos afectados**: `src/styles/main.css`.

### [feature] Precarga en el splash — la pokebola solo en la pantalla inicial

- **Descripción**: La pokebola deja de aparecer duplicada (splash + lista) y ahora es el **preloader real de los primeros pokémon**: `SplashView.onMounted` dispara `store.loadFirstPage()` + `store.preloadTypes()` en paralelo con el timer de 1.5s, sin bloquear la navegación. Cuando el usuario llega a la lista, los datos ya están cargados (el onboarding da margen adicional de red).
- **Nuevo componente `LoadingSpinner.vue`**: spinner genérico (aro CSS giratorio, sin pokebola) que reemplaza a la pokebola en la lista (caso límite de red lenta mientras `loadingFirst`) y en el detalle (`detailLoading`). Es decorativo (`aria-hidden`); los contenedores conservan `aria-busy`.
- **Robustez**: `loadFirstPage()` y `preloadTypes()` ya eran idempotentes (`if length > 0 || loadingFirst return`), así que el `onMounted` de la lista queda como fallback sin duplicar requests; un fallo de precarga muestra el `ErrorState` existente con Reintentar.
- **Verificación**: navegador — la lista llega con 24 cards ya cargadas tras el flujo splash→onboarding; con la API bloqueada el error se muestra en la lista y en el detalle. Suite 211/211 + type-check + lint PASS.
- **Archivos afectados**: `src/components/LoadingSpinner.vue` (nuevo), `src/views/SplashView.vue`, `src/views/PokedexListView.vue`, `src/views/PokemonDetailView.vue`, `src/styles/main.css`, 2 archivos de tests.

### [architecture] FeedbackState.vue — estados compartidos DRY (error / favoritos vacío / construcción)

- **Descripción**: Las tres pantallas de estado tenían la misma estructura (imagen, título, subtítulo, botón opcional) y solo cambiaban textos; se creó un **único componente `FeedbackState.vue`** con props `image`, `title`, `subtitle`, `buttonLabel?` (renderiza `AppButton` y emite `retry`) y `alert?` (activa `role="alert"`). Orden Figma: **imagen → título → subtítulo → botón**.
- **Wrappers** que delegan en `FeedbackState`:
  - `ErrorState` — `Magikarp_Jump_Pattern_01 1.png`, "Algo salió mal...", subtítulo NUEVO ("No pudimos cargar la información en este momento. Verifica tu conexión o intenta nuevamente más tarde."), botón `Reintentar` primary, `role="alert"`.
  - `EmptyState` (favoritos vacío) — misma imagen, título/subtítulo de favoritos, sin botón.
  - `ConstructionState` — `Magikarp_Jump_Pattern_01 1-2.png`, "¡Muy pronto disponible!", subtítulo NUEVO ("Estamos trabajando para traerte esta sección. Vuelve más adelante para descubrir todas las novedades."), sin botón.
- **Limpieza**: eliminado `Magikarp.vue` (SVG inline) y su CSS muerto (`.magikarp`, keyframes `magikarp-bob`, entrada en `prefers-reduced-motion`); los PNG del Figma reemplazan al SVG.
- **Centrado**: `.state` ahora centra vertical y horizontalmente como el onboarding (`min-height: 100dvh` + `justify-content: center`, padding 16px). Ilustración a 160px de ancho con proporción automática.
- **Verificación**: navegador midiendo el DOM en `/` (error forzado), `/regions` y `/favorites` — orden imagen→título→subtítulo→botón en las tres, textos nuevos, botón solo en error, contenedor centrado (`centered: 0`). Suite 211/211 + type-check + lint PASS.
- **Archivos afectados**: `src/components/FeedbackState.vue` (nuevo), `ErrorState.vue`, `EmptyState.vue`, `ConstructionState.vue`, `src/styles/main.css`, `src/assets/images/Magikarp_Jump_Pattern_01 1.png` + `1-2.png`, 2 archivos de tests.

### [architecture] TabBar refinado al Figma + frame móvil 360px — todo en tokens

- **Descripción**: Menú inferior ajustado a las medidas exactas del Figma y la app enmarcada como dispositivo móvil, con todos los valores como tokens (estándar del proyecto).
- **TabBar**: height 77px (1 borde + 16 + 44 + 16), `justify-content: space-between`, radius superior 16px, `border-top: 1px solid var(--tapbar-border-top, #E0E0E0)`, padding 16px 12px, fondo `var(--tapbar-bg, #FAFAFA)`, `box-shadow: 0 -1px 3px rgba(0,0,0,0.12)`, ancho completo (sin `max-width`).
- **Items**: 62×44px, gap 4, contenedor de icono 62×24px radius 16 padding 4, label Poppins 12px/500/line-height 16px centrado; activo `#0d47a1`, inactivo `#424242`.
- **Iconos**: los 4 SVG del Figma (`house.svg`, `globe.svg`, `heart.svg`, `user.svg` — Pokedex, Regiones, Favoritos, Perfil) se renderizan como **CSS mask** (`--tab-icon` data URI por item sobre `currentColor`), lo que permite el tintado por estado usando los archivos reales, sin paths inline ni `<img>`.
- **Frame móvil**: `#app` → `width: 360px`, `min-height: 100dvh`, fondo `var(--surface-default, #FAFAFA)`, centrado con borde sutil; el body queda neutro. Las medidas del Figma (360×800) aplican a todas las pantallas a través del contenedor.
- **Tokens nuevos**: `--surface-default`, `--tapbar-bg`, `--tapbar-border-top`, escala **Spacing** (`none/xxs/xs/sm/md/lg/xl/2xl` — lg=16px fija el TabBar a 77), `--radius-lg`, `--font-size-xs`, `--line-height-xs`, `--font-family` (Poppins con fallback).
- **Gotchas resueltos**: (1) los imports de SVG resuelven a **data URI** en Vite, no al path — los tests verifican unicidad de iconos en lugar del nombre de archivo; (2) `url("...")` inline en el template attribute rompe el compiler de Vue (`Attribute name cannot contain U+0022`) → el style con custom property se construye en una función JS (`tabStyle`); (3) los data URI con comillas simples internas (`width='24'`) exigen comillas dobles en `url()` para que el navegador aplique la máscara (`maskImage` "none" sin ellas).
- **Verificación**: navegador midiendo computed styles — TabBar 77px full width, items 62×44, iconos con `mask-image` activo (fondo `#0d47a1` en el activo), `#app` 360px. Suite 211/211 + type-check + lint PASS.
- **Archivos afectados**: `src/components/TabBar.vue`, `src/styles/tokens.css`, `src/styles/main.css`, `src/assets/icons/house.svg` + `globe.svg` + `heart.svg` + `user.svg`, `src/__tests__/components.spec.ts`.

### [architecture] Tipos dinámicos — debilidades del API + fallback gris (sin localStorage)

- **Descripción**: Evaluado y descartado cachear `GET /type` en localStorage (la API trae 21 tipos pero `stellar`/`unknown`/`shadow` tienen **0 pokémons** — verificados por curl). Se eligió el **Nivel 1**: las debilidades ahora se derivan de `damage_relations.double_damage_from` de los catálogos que el preload ya trae (los 18), eliminando `WEAKNESS_CHART` estático.
- **Match API↔Figma**: `resolveEsLabel` prefiere `names[es]` del API y cae al `esLabel` del Figma; `resolveWeaknesses` deriva del catálogo; `TypeCatalogResponse` ahora incluye `names`. `TYPE_META.esLabel` se conserva como fallback de diseño (solo los 18 van al filtro).
- **Fallback gris (opción 2)**: `FALLBACK_TYPE_COLOR #9e9e9e` para tipos no mapeados en card, badge y detalle; el filtro sigue mostrando solo los 18 de `TYPE_META`.
- **Gotcha crítico**: en Vue 3 las refs NO se desenvuelven dentro de `computed(() => ...)` — `meta?.color` era undefined y el badge salía gris; fue `meta.value?.color`. Rompió 50 tests hasta diagnosticarlo.
- **Verificación**: navegador con la API real — Bulbasaur muestra debilidades del API (Volador/Veneno/Bicho/Fuego/Hielo + Tierra/Psíquico). Suite 215/215 + type-check + lint PASS.
- **Archivos afectados**: `src/data/types.ts`, `src/types/pokemon.ts`, `src/stores/pokemon.ts`, `TypeBadge.vue`, `PokemonCard.vue`, `PokemonDetailPanel.vue`, 4 archivos de tests.

### [feature] Fuentes oficiales del Figma + auditoría tipográfica contra la API

- **Descripción**: Se instalaron `@fontsource/poppins` y `@fontsource/montserrat` (400–700, self-hosted) — antes la app caía a system-ui. Se consultó la **API real del Figma** (token en `.env`, file `edU7Pms8bvosgSYW23yOds`) y se extrajo la tipografía por nodo.
- **Hallazgo**: el Figma usa **Poppins** (256 nodos) como fuente principal y **Montserrat** (32 nodos) solo en: "Se han encontrado N resultados" (14/500 `#9E9E9E`), "Borrar filtro" (14/500 `#1E88E5`), textos del BottomSheet y subtítulos.
- **Correcciones aplicadas** (9 desajustes): onboarding subtítulo 14/400; TabBar 10px (activo 700 / inactivo 500 — el Figma usa 10, no 12); chip tipo 11px; detalle Nº 16/500; detalle descripción 14/400; estados (error/construcción/vacío) título 20/600 `#333333` + subtítulo 14/400 `#4d4d4d` (tokens `--state-title`/`--state-subtitle`).
- **Tokens nuevos**: `--font-size-2xs` (10), `--font-size-sm` (14), `--font-size-lg` (20), `--font-family-montserrat`, `--state-title`, `--state-subtitle`.
- **Verificación**: `document.fonts` carga Poppins y Montserrat; computed styles confirman TabBar 10/700 activo, chip 11px, detalle Nº 16px, estados 20/600. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `package.json`, `src/main.ts`, `src/styles/tokens.css`, `main.css`, `OnboardingView.vue`, `PokemonDetailPanel.vue`.

### [architecture] PokemonCard reconstruida a la geometría exacta del Figma

- **Descripción**: La card se reconstruyó leyendo el componente **Card** de la página Components del Figma vía API (COMPONENT 318.6×102 r16 gap29 → Info + Image Container 126×102 r16). Estructura final: card 328×102 r16 `min-height` con padding-left 16; info-section column `space-between` (Nº arriba, tipos abajo gap 2); media-section 126×102 r16 padding 4/16 pegada a bordes sup/der/inf.
- **Elementos decorativos**: se exportaron los 18 SVGs del COMPONENT_SET **Elements** (id 6:206, variantes `Property 1={tipo}`) → `src/assets/images/element-{tipo}.svg` (hoja grass, llama fire...). `TypeMeta.element` nuevo; la card renderiza el element DETRÁS del sprite (absolute primero en el DOM).
- **Colores derivados**: la card usa `lightenColor(base, 0.5)` y la media `darkenColor(base, 0.08)` — helpers nuevos que derivan las variantes claro/oscuro del color base del tipo (el render del PNG difiere del color sólido de la API; solución dinámica sin hardcodear).
- **FavoriteButton**: ahora acepta prop `size` (36 card / 28 detalle), borde blanco, fondo translúcido `rgba(255,255,255,0.3)`.
- **Fixes de layout**: badges en columna → `flex-wrap: nowrap` + info sin padding lateral; gap 2px entre nombre y badges; sprite 94×94 centrado (dx/dy 0).
- **Verificación**: navegador midiendo rects — card 328×102 r16, media 126×103 pegada (top/right/bottom 0), element 126×103, sprite centrado, badges fila. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/components/PokemonCard.vue`, `FavoriteButton.vue`, `data/types.ts` (lightenColor/darkenColor + element), `types/pokemon.ts` (TypeMeta.element), 18 SVGs nuevos, tests.

### [feature] SearchBar completo — input + filtros + resultados integrados

- **Descripción**: El componente de búsqueda quedó completo: fila con input (48px, r30, borde 1.5px `--border-default`, icono `search.svg` 20×20 dentro a la izquierda, placeholder Poppins 14/400 `--text-disabled #9E9E9E`) + botón filtros circular (52×48 r30); padding-top 48px sin laterales (el frame da los 16px).
- **Fila de resultados** integrada en el componente: "Se han encontrado **N resultados**" (Montserrat 14/500 `#9E9E9E`, el "N resultados" en bold 700) + link "Borrar filtro" (Montserrat 14/500 `#1E88E5` subrayado) — visible con búsqueda/filtro activo. La vista ya no maneja count/clear-filter.
- **Tokens nuevos**: `--border-default`, `--text-disabled`, `--text-link`.
- **Gotchas**: Vue colapsa el whitespace entre spans en el render — el espacio entre "encontrado" y el número se perdió; fix con `{{ ' ' + resultCount }}`.
- **Verificación**: navegador — input 264×48 r30, botón 52×48, resultados con strong 700, "Borrar filtro" subrayado `#1E88E5`. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/components/SearchBar.vue`, `src/styles/main.css`, `src/styles/tokens.css`, `src/views/PokedexListView.vue`, 2 archivos de tests.

### [refactor] Assets reorganizados por propósito

- **Descripción**: `src/assets` se reorganizó en 4 grupos por propósito (no por formato): `icons/tab/` (house, globe, heart, user, search), `icons/heart/` (corazón outline/solid), `types/badges/` (18 PNG de chips) y `screens/` (onboarding, magikarp, loader). Se eliminaron las reglas globales muertas de `.pokemon-card` en `main.css` (el scoped es la única fuente de verdad).
- **Verificación**: git detectó 49 renames; suite 216/216 + type-check + lint PASS; 0 rutas viejas.
- **Archivos afectados**: `src/assets/*` (movidos), imports en 7 componentes/vistas, `main.css`.

### [architecture] Element decorativo de la card — CSS mask con gradiente blanco

- **Descripción**: El elemento detrás del sprite pasó de SVG externo (17/18 — faltaba fire por rate limit de la API de Figma) a técnica de **CSS mask**: un span con `background: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.15) 100%)` + `mask-image: url(type-{tipo}.png)`. La máscara usa solo el canal ALPHA del PNG (la forma del icono) y el gradiente pinta el blanco degradado.
- **Hallazgos**: los PNG de badges tienen **ratios de aspecto distintos** por tipo (water 0.65, grass 0.897, ice 1.137) — forzar `mask-size` fijo los deformaba; fix con `contain`. El rate limit de la API de Figma (~30 req/min) y las URLs S3 que expiran hicieron inviable completar el SVG fire — la máscara con PNG resolvió los 18 sin dependencia.
- **Verificación**: navegador — Bulbasaur→hoja grass, Charmander→llama fire, gradiente 0.85→0.15, sprite encima. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/components/PokemonCard.vue`, `src/data/types.ts` (element desde badges PNG).

### [feature] Corazón favorito activo en rojo (mask tintada)

- **Descripción**: El `FavoriteButton` cambió de `<img>` a un span con **CSS mask** (mismo patrón del TabBar): el corazón se tiñe vía `currentColor` — **rojo `#E53935`** (token `--favorite-active`) cuando está activo, claro cuando no. El fondo del botón NO cambia (se mantiene translúcido con borde blanco).
- **Gotcha**: el `url("...")` inline en el template attribute rompe el compiler de Vue → el style se construye en funciones JS (`buttonStyle`/`iconStyle`).
- **Verificación**: navegador — no-favorito `aria-pressed=false` corazón claro; favorito `true` corazón `rgb(229,57,53)` con fondo intacto. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/components/FavoriteButton.vue`, `main.css`, test actualizado.

### [refactor] Margen 4px en la imagen + auditoría de valores quemados → tokens

- **Descripción**: Margen de 4px a la imagen de la card (`--space-xxs`). Auditoría completa de valores hardcodeados: tokens nuevos `--color-white` (`#ffffff`), `--favorite-active` (`#e53935`), `--space-2xs` (2px). Reemplazados: `#fafafa`→`--surface-default` (TypeBadge, main.css), `#fff`→`--color-white` (card, nav buttons, search inputs), `#cd3131`→`--danger` (trash), gaps 2/8→`--space-2xs`/`--space-xs`, radius 16→`--radius-lg`, LoadingSpinner 32→`--space-2xl`.
- **Decisión**: la geometría Figma exacta NO se tokeniza (círculo 498×498, artwork 142×155, nav 48px, media 126×102, onboarding 342/251, search 48/30/52) — son medidas específicas del diseño, no reutilizables.
- **Verificación**: navegador — margen 4px, tokens resuelven al mismo valor (badge circle rgb(250,250,250), favorito rgb(229,57,53)). Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `tokens.css`, 7 componentes, `main.css`, 3 tests.

### [feature] Cabecera de favoritos — back + título centrado (Grid 3 columnas)

- **Descripción**: La lista de favoritos ahora tiene cabecera con botón de retorno (chevron-left) a la izquierda, título "Favoritos" **perfectamente centrado** (Grid 3 columnas `40px 1fr 40px` con spacer invisible — flex space-between habría desplazado el título) y sticky sobre la lista. Título Montserrat 20/600 line-height 28 (`--line-height-lg`), padding vertical `--space-2xl` (32px) según specs. El back usa `router.back()` con fallback a `/`.
- **Verificación**: navegador — título con desviación 0px del centro, header sticky top 0, chevron-left. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/views/FavoritesView.vue`, `src/assets/icons/tab/chevron-left.svg`, `tokens.css`.

### [architecture] TypeFilterSheet rediseñado al Figma — lista vertical + botones columna

- **Descripción**: El sheet de filtros se alineó al BottomSheet real del Figma (nodo Flow/Pokedex): lista vertical 1 columna (antes grid 2 col) con filas de 32px (icono 18 + label Montserrat 14/500 + check custom a la derecha), título Poppins 20/600, accordion "Tipo" Montserrat 16/600 + chevron, botón X de cerrar (close.svg), botones en flex column con el AppButton existente (Aplicar primary + Cancelar secondary).
- **Mejoras UI** (fuera del Figma pero aprobadas): transición suave (overlay fade + sheet slide-up con keyframes), acordeón colapsable con chevron rotando (abierto por defecto, `aria-expanded`), scrollbar de la lista oculta (mobile-first), sheet al 70% del viewport con lista scrolleable y botones fijos, ancho máximo 360px (consistente con el frame app).
- **Bug dvh resuelto**: `70dvh` → `70vh` — el device toolbar de Chrome encoge el viewport dinámico con la URL bar y la lista desaparecía (el flex la encogía a 0). `vh` estable lo arregla.
- **Verificación**: navegador — opciones verticales, check a la derecha, botones columna primary/secondary, 70% viewport, scroll interno. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/components/TypeFilterSheet.vue`, `main.css`, `src/assets/icons/tab/close.svg`, tests.

### [architecture] CustomCheckbox.vue — Figma Check (32×32 + 18×18 r4, checked #1F49B6)

- **Descripción**: Componente reutilizable con la geometría EXACTA del Figma (COMPONENT_SET Check 10:5823): círculo táctil 32×32 envolviendo cuadro 18×18 r4. Unchecked: fill `#fafafa` + stroke `#d6d6d6`; Checked: fill **`#1F49B6`** + stroke `#0d47a1` + check blanco. Input nativo oculto para accesibilidad; visual controlado por `input:checked + box`. Tokens: `--check-default`, `--check-border`. Usado en el TypeFilterSheet.
- **Gotchas**: (1) NO anidar `<label>` dentro de `<label>` (HTML inválido — el click no llega al input); el option es label y el checkbox usa span raíz. (2) El selector `input:checked + box` requiere que el input vaya ANTES del box en el DOM.
- **Verificación**: navegador — checked bg rgb(31,73,182)=#1F49B6 + check blanco; unchecked #fafafa. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/components/CustomCheckbox.vue` (nuevo), `TypeFilterSheet.vue`, `tokens.css`.

### [fix] App-shell: scroll interno en .app-main — fix touch scroll header/tabbar

- **Descripción**: El sticky del header y el TabBar se rompía con el **scroll táctil** (device toolbar de Chrome) en favoritos: el scroll ocurría en el BODY y el sticky del body es frágil con touch. Fix con el **patrón app-shell** (estándar mobile): `#app` con `height: 100vh` + `overflow: hidden`; `.app-main` con `overflow-y: auto` (el scroll vive en el contenido, no en la ventana); `.app-tab-bar` sin sticky (fijo por el layout flex column, fuera del scroll container); el header sticky pega dentro del main. También se corrigieron todos los `dvh` → `vh` del proyecto (#app, .state, SplashView, OnboardingView).
- **Verificación**: con 23 favoritos (lista 3094px) + gesture de arrastre: `windowScrollY: 0` (body no scrollea), `mainScrollTop: 2519`, `headerTop: 0`, `tabbarTop: 590` fijo. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/styles/main.css`, `SplashView.vue`, `OnboardingView.vue`.

### [chore] Directorios de desarrollo local fuera del repo

- **Descripción**: `design-reference/`, `.vscode/`, `.engram/`, `.atl/` y `openspec/` salieron de version control (`git rm --cached` — quedan en disco para el entorno local) y se ignoraron. Son artefactos del entorno de desarrollo, no parte de la entrega. `.playwright-mcp/` ya estaba ignorado. 0 referencias en código.
- **Archivos afectados**: `.gitignore`, 72 archivos removidos del índice.

### [fix] Scroll vertical en onboarding/estados + app-shell — el scroll vive en .app-main

- **Descripción**: El onboarding permitía scroll vertical y las páginas de error/construcción no centraban. Causa: las vistas usaban `min-height: 100vh` dentro de `.app-main` (que tenía `padding-bottom: 120px` del clearance del tab bar) → desborde. Fix con el **patrón app-shell**: `#app` con `height: 100vh` + `overflow: hidden`; `.app-main` con `overflow-y: auto` (el scroll interno, estándar mobile); `.app-tab-bar` sin sticky (fijo por el layout flex column, fuera del scroll); `.state` y wrappers (`construction-view`, `favorites-view`) con `flex: 1` para llenar y centrar; splash/onboarding con `flex: 1` + `min-height: 100%`.
- **Por qué app-shell**: el sticky del body es frágil con el **scroll táctil** (device toolbar de Chrome) — el usuario reportó que header y tab bar se movían con el gesto táctil pero no con el scrollbar. Con el scroll interno, header/tab bar quedan fijos por layout (touch-safe).
- **Verificación**: onboarding/construcción/error sin scroll (`scrollable: false`), contenido centrado en main, con 23 favoritos: `windowScrollY: 0`, `mainScrollTop: 2519`, headerTop 0, tabbarTop 590 fijo. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `main.css` (#app, .app-main, .state, .app-tab-bar), `SplashView.vue`, `OnboardingView.vue`, `ConstructionView.vue`, `FavoritesView.vue`, `App.vue`.

### [fix] Infinite scroll roto por el app-shell — IO root = .app-main + rootMargin

- **Descripción**: Al mover el scroll al `.app-main` interno, el IntersectionObserver seguía con `root: null` (ventana) → el sentinel nunca intersectaba y el infinite scroll dejó de cargar. Fix: `useInfiniteScroll` ahora acepta `root` (Element o getter, resuelto en `observe()`); `PokedexListView` pasa `root: () => document.querySelector('.app-main')` + `rootMargin: '200px 0px'` (precarga antes del borde — el sentinel de 1px quedaba ~16px fuera del área de scroll por el gap). También se quitó el `padding-bottom: 120px` del main (empujaba el sentinel fuera del área de intersección y ya no hacía falta con el tab bar fuera del scroll).
- **Verificación**: scroll gradual → 24 → 72 cards (3 páginas), scrollHeight 3140 → 9188. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/composables/useInfiniteScroll.ts`, `src/views/PokedexListView.vue`, `main.css`.

### [fix] Glitch de parpadeo en el onboarding — ambos pasos montados + crossfade CSS

- **Descripción**: Al cambiar de paso, el `v-if`/`v-else` + `mode="out-in"` desmontaba el paso viejo y montaba el nuevo — la imagen del paso 2 (52KB) se cargaba EN ESE MOMENTO → parpadeo (frame sin imagen + salto al llegar). Fix: ambos pasos **siempre montados** (las dos imágenes se precargan al entrar al onboarding), ocultando el inactivo con la clase `--hidden` (opacity 0 + visibility hidden, transicionable) para un **crossfade CSS puro**. `min-height: 515px` en el wrapper (el paso más alto) elimina el layout shift.
- **Gotchas**: `<Transition>` exige exactamente un hijo directo con v-if/v-show (lint `vue/require-toggle-inside-transition`) — con dos pasos montados se usó CSS puro en vez de Transition. VTU `isVisible()` no detecta `visibility: hidden` (solo display:none) — los tests verifican la clase `--hidden`.
- **Verificación**: navegador — ambas imágenes `complete: true` desde el inicio, crossfade suave (opacidades 0.32/0.68 a mitad), imagen del paso 2 ya cargada. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/views/OnboardingView.vue`, tests de `views.spec.ts`.

### [fix] Onboarding: desborde horizontal + scroll vertical en viewports pequeños

- **Descripción**: Tras el crossfade con pasos absolute, el paso se anclaba al **viewport** (no al wrapper) porque `.onboarding__steps` no tenía `position: relative` → el paso medía 375px (todo el viewport) y desbordaba el frame de 360px horizontalmente. Fix: `position: relative` en el wrapper + `left/right: 0` en el paso. Además, el `min-height: 515px` fijo desbordaba verticalmente en pantallas pequeñas → `min-height: min(515px, calc(100vh - 32px))` (nunca excede el viewport disponible).
- **Verificación**: navegador en 375×667 y 320×568 (iPhone SE) — paso 296px dentro del app (sin desborde horizontal), sin scroll en main/body/html, ambos pasos centrados y sin overflow. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/views/OnboardingView.vue`.

### [fix] Toolbar de la lista sticky — el search ya no se va de la pantalla

- **Descripción**: Al scrollear la lista larga, la cabecera con el search se salía de la pantalla. Causa: `.pokedex-list-view` con `flex: 1` + `min-height: 0` tenía `height: 590px` fija (igual al main) y el contenido (72 cards) lo desbordaba — el toolbar sticky se anclaba al list de altura fija, no al scrollport del `.app-main`. Fix: `flex: 1 0 auto` (basis auto — el list crece con su contenido) para que el sticky se pegue al scrollport real.
- **Verificación**: con 72 cards y scroll al fondo (5591px), `toolbarPinned: true` (top 0). Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/views/PokedexListView.vue`.

### [decision] Frame fluido hasta 480px — responsive evaluado (opción C)

- **Descripción**: Evaluación de si hacer la app responsive o dejarla fija a 360px. El Figma es un único frame mobile de 360px — hacer breakpoints/columnas **inventaría diseño** que no existe en el Figma y agregaría riesgo. El único problema real: móviles modernos (>360px, iPhone 14=390, Pro Max=430) mostraban margen gris lateral con el frame fijo. **Decisión C**: `#app` con `width: 100% + max-width: 480px` — llena el viewport móvil real (sin margen) y se centra a 480 en desktop. El diseño interno NO cambió (componentes fluyen con flex/%, medidas Figma intactas).
- **Verificación**: móvil 390/430 llenan la pantalla, desktop 900 centrado a 480, sin overflowX, 24 cards en todos. Suite 216/216 + type-check + lint PASS.
- **Archivos afectados**: `src/styles/main.css` (#app).

### [feature] Swipe-to-reveal en favoritos — trash al deslizar

- **Descripción**: La lista de favoritos reemplaza el botón de trash visible por un **swipe-to-reveal** (patrón clásico): una capa posterior roja con el icono de papelera y la card encima que se desliza horizontalmente. `useSwipeReveal` (composable con **Pointer Events** — funciona con mouse Y touch), `SwipeToReveal.vue` (componente de 2 capas superpuestas).
- **Detalles de gesto**: `MAX_SWIPE = -80`, `THRESHOLD = -40`, arrastre elástico a -100, solo a la izquierda; soltar bajo el umbral abre (`swiped=true`), sobre el umbral vuelve a 0. **Solo intercepta cuando el horizontal domina al vertical** (preserva el scroll del `.app-main`). El click tras soltar se bloquea (`@click.capture` con stopPropagation/preventDefault) para no navegar al detalle, pero **sin cerrar el swipe** (queda abierto hasta tocar la acción o arrastrar de nuevo).
- **A11y**: el action-layer es un botón real accesible (sin `aria-hidden`, el trash con `aria-label`).
- **Gotchas**: (1) `v-bind="{ onPointerDown }"` NO enlaza — Vue hipena la clave y `onPointerDown` → `pointer-down` que nunca matchea; usar `onPointerdown` (minúsculas). (2) El `reset()` en el click capture cerraba el swipe al primer click (el navegador sintetiza un click al soltar) — fix: bloquear sin reset.
- **Verificación**: navegador — swipe abre a translateX(-80px), click en trash elimina (cards 0), sin navegación (path /favorites). Suite **230/230** (14 tests nuevos) + type-check + lint PASS.
- **Archivos afectados**: `src/composables/useSwipeReveal.ts` (nuevo), `src/components/SwipeToReveal.vue` (nuevo), `FavoritesView.vue`, 3 archivos de tests.

### [fix] Header de favoritos a ancho completo del frame

- **Descripción**: El header quedaba 32px más angosto que el frame (dentro del padding lateral de 16px del `.app-main`). Fix: `margin-inline: calc(-1 * var(--space-card))` en `.page-header` — rompe el padding del main y el header toca los bordes del frame (como el TabBar). Título sigue centrado.
- **Verificación**: header 480px = frame, `headerFillsApp: true`, título centrado (offset 0), sin overflowX. Suite 230/230 + type-check + lint PASS.
- **Archivos afectados**: `src/views/FavoritesView.vue`.

### [docs] README actualizado + fix nit de vitest

- **README**: reescrito con el mapa de navegación (splash → onboarding → shell 4 tabs + deep links), arquitectura actual (debilidades del API, sin WEAKNESS_CHART), layout app-shell (frame fluido 480, scroll interno), 216→230 tests.
- **Nit vitest**: `vitest.config.ts` importaba `./vite.config` sin extensión (Vite 8 native loader lo exige). Fix: agregar `.ts` + `allowImportingTsExtensions: true` en `tsconfig.node.json` (válido con noEmit). Desapareció el warning de cada corrida.

### [fix] Swipe-to-reveal: transición suave al cerrar + icono de trash del Figma

- **Transición al cerrar**: el `onPointerUp` ponía `is-swiping = false` y cambiaba el `translateX` en el **mismo frame** → el navegador no tenía un estado intermedio con la transición activa y el cierre saltaba. Fix: restaurar la transición en el frame actual y aplicar el transform destino en el **siguiente rAF** (`requestAnimationFrame`). Ahora el cierre anima suave (0.25s cubic-bezier).
- **Icono de trash**: reemplazado el SVG inline por el icono oficial del Figma (`Icon/Interface, Essential/Group.svg` → `src/assets/icons/tab/trash.svg`, 38px, stroke blanco 2.11). El action-layer es `role="button"` con `aria-label="Eliminar de favoritos"` (accesible).
- **Tests**: actualizados para el flujo asíncrono del rAF (helper `settle()`/`advanceTimersByTime(16)` con fake timers). Suite **230/230** + type-check + lint PASS.
- **Verificación**: navegador — swipe abre a -80px, transición de cierre 0.25s aplicada (sin salto). Suite 230/230 + type-check + lint PASS.
- **Archivos afectados**: `src/composables/useSwipeReveal.ts`, `src/components/SwipeToReveal.vue`, `src/assets/icons/tab/trash.svg` (nuevo), 2 archivos de tests.

### [feature] Swipe-to-reveal al Figma — card 70%, contenedor full-width, radius dinámico

- **Descripción**: Refinamiento del swipe a las especificaciones del Figma: (1) la card viaja un **70% de su ancho** (`MAX_SWIPE_RATIO = 0.7`, `THRESHOLD_RATIO = 0.35` — dinámicos según `offsetWidth`) y su borde izquierdo **sobresale del frame** (recortado por overflow); (2) el contenedor `.swipe-container` **se expande a todo el ancho de la app** al deslizar (`margin-inline: calc(-1 * var(--space-card))`), rompiendo el padding del main; (3) al abrir, el contenedor **pierde el redondeo derecho** (`border-radius: 16px 0 0 16px`); (4) la franja roja es un **rectángulo full-bleed** (`border-radius: 0`, el padre recorta — no tarjeta flotante).
- **Transiciones suaves**: el contenedor transiciona `margin` + `border-radius` (mismo cubic-bezier que la card); durante el arrastre el contenedor sigue al dedo (`is-swiping` quita la transición), la expansión/radius suave se reproduce al soltar.
- **Gotcha clave**: el `--active` se basa en `translateX !== 0 || isSwiping` (estado persistente) — usar el `swiped` temporal (300ms) hacía que el contenedor **colapsara a los 300ms** mientras la card aún estaba abierta (desincronización/salto).
- **Verificación**: navegador — contenedor `--active` left 0/right 358 (full frame), radius `16px 0 0 16px`, card `translateX(-250.6px)` (70% de 358) a los 450ms (persistente). Suite **230/230** + type-check + lint PASS.
- **Archivos afectados**: `src/composables/useSwipeReveal.ts`, `src/components/SwipeToReveal.vue`, 3 archivos de tests.

### [architecture] Detalle al Figma — GenderBar nuevo, sin nav/stats, orden correcto

- **Descripción**: Refactor del detalle a las aclaraciones del usuario sobre el Figma real: se eliminaron los botones **Próximo/Anterior** (no están en el Figma) y la sección de **Estadísticas** (tampoco), y el campo Género salió de las características.
- **GenderBar.vue (nuevo)**: barra de género del Figma — label "Género" (12/500 `#424242`), barra 328×8 radius 9999 con segmento **`#2551c3`** proporcional al % macho (solo azul, no azul/rosa), iconos male/female 18px + % a los extremos; genderless muestra "Sin género". `PokemonDerivedSpecies.genderRate` nuevo (de `species.gender_rate`, -1 genderless).
- **Orden del detalle**: heading → types → descripción → características (Peso|Altura, Categoría|Habilidad) → **GenderBar** → **Debilidades** → ShareButton. Título Debilidades ajustado a **18/500** (antes 27px — el Figma usa 18/500).
- **Verificación**: navegador — orden `detail-heading → elements → description → characteristics → gender-bar → weaknesses`, sin nav/stats, segmento 87.5% (Bulbasaur), Debilidades 18px. Suite **230/230** + type-check + lint PASS.
- **Archivos afectados**: `src/components/GenderBar.vue` (nuevo), `PokemonDetailPanel.vue`, `PokemonDetailView.vue`, `stores/pokemon.ts` (genderRate), tests.

### [architecture] PokemonCard `navigateDisabled` — favoritos sin navegación por click

- **Descripción**: Con el swipe-to-reveal en favoritos, el click en una card ya no debe navegar al detalle (el swipe + trash manejan las acciones). `PokemonCard` acepta `navigateDisabled` — `activate()` se convierte en no-op y no emite `navigate`/`activate` — activado en `FavoritesView` (`navigate-disabled`), y se eliminó el handler `@navigate="goDetail"` (función borrada).
- **Verificación**: navegador — click en card de favoritos deja el path en `/favorites` (sin redirect). Suite **230/230** + type-check + lint PASS.
- **Archivos afectados**: `src/components/PokemonCard.vue` (prop + guard), `src/views/FavoritesView.vue`, test de favoritos (assert de no-navegación).

### [architecture] Detalle al Figma — GIF showdown, estructura tipo card, artwork independiente, chevron oficial

- **Descripción**: El sprite del header del detalle ahora es el **GIF animado** de la API (`sprites.other.showdown.front_default`, ~45×49) vía `getAnimatedSprite()` con fallback al official-artwork. El header adopta la **estructura tipo card** de la lista: contenedor grande → fondo de color **498×498** (`top -227px, left -63px`, radius 50%, saliendo ~50% por arriba) → elemento del tipo con **máscara en gradación** (gradiente blanco 0.85→0.15 + PNG del tipo como mask). La imagen del pokémon es **independiente del fondo** (hijo directo del header) con geometría exacta del Figma: **142.23×154.87, top 143.2, left 102**. El botón Volver usa el **chevron oficial** del Figma (9×16, stroke blanco 2.5) restaurado en `src/assets/icons/nav/chevron-left.svg`.
- **Verificación**: navegador — GIF anima (2 capturas a 450ms con hashes distintos), artwork 142.22×154.86 top 143.19, fondo 498×498 top −227, elemento con gradiente + mask `type-grass.png`, chevron 9×16. Suite **234/234** + type-check + lint PASS.
- **Archivos afectados**: `src/components/PokemonDetailPanel.vue`, `src/services/pokeapi.ts` (`getAnimatedSprite`), `src/types/pokemon.ts` (`sprites.other.showdown`), `src/assets/icons/nav/chevron-left.svg`, tests.

### [architecture] Detalle header centrado — fondo/wrap/artwork al centro, elemento tipo 181.76×196.49

- **Descripción**: El header del detalle queda **centrado horizontalmente**: el fondo 498×498 pasa de `left: -63px` (offset del Figma, que dejaba el centro 6px a la derecha) a `left: 50% + translateX(-50%)` → centro exacto. Nuevo `.detail-header__element-wrap` 204×204 (Figma "Elemento Outline", centrado a 1px) que contiene el vector del tipo con máscara en las dimensiones exactas del Figma: **181.76×196.49, top 4.16, left 9.64** (relativos al wrap). El artwork GIF pasa de `left: 102` a centrado (el Figma lo deja ~7px a la izquierda; el usuario pidió centrarlo).
- **Verificación**: navegador — centerOffset 0px en fondo, wrap y artwork; elemento 181.75×196.48, gradiente + máscara `type-grass.png`. Suite **234/234** + type-check + lint PASS.
- **Archivos afectados**: `src/components/PokemonDetailPanel.vue`, tests.

### [architecture] Simetría detalle — corazón a la misma distancia del borde que el chevron

- **Descripción**: El corazón (icono 14px centrado en botón 28px) quedaba más cerca del borde derecho que el chevron (icono 9px centrado en botón 38px). `.detail-header__favorite { margin-right: 7.5px }` compensa: ambos iconos quedan a **30.5px** de su borde respectivo (el Figma los mantiene simétricos: chevron 31.8, corazón 33.8).
- **Verificación**: navegador — chevron 30.5 vs corazón 30.5, diferencia **0px**. Suite **234/234** + type-check + lint PASS.
- **Archivos afectados**: `src/components/PokemonDetailPanel.vue`.

### [architecture] PropertyBox.vue — propiedades del detalle con caja bordeada

- **Descripción**: Nuevo componente para las propiedades del detalle (Peso, Altura, Categoría, Habilidad): contenedor **flex columna** — fila 1 con **icono** (prop `iconUrl` lista para los assets que pasará el usuario) + **label**; fila 2 con la **caja del valor** en la geometría del Figma: **154×43, border-radius 15px, border 1px solid `#E0E0E0`, gap 8px, padding 8px**, valor en el estilo actual. Reemplaza los `.detail-field` del panel; se mantiene el layout de 2 columnas por fila.
- **Verificación**: navegador — las 4 cajas con w 154, h 43, radius 15, border #E0E0E0, gap/padding 8, valores correctos. Suite **234/234** + type-check + lint PASS.
- **Archivos afectados**: `src/components/PropertyBox.vue` (nuevo), `src/components/PokemonDetailPanel.vue`, tests.

### [architecture] PropertyBox/GenderBar Figma — labels uppercase, iconos, colores por sexo, división recta

- **Descripción**: **PropertyBox**: labels en **uppercase** (text-transform), iconos del Figma conectados (`properties/weight|height|category|ability.svg`, 16px), valores **centrados** (justify-content + text-align center) con **line-height 1.15** para que los valores largos cortados ocupen menos vertical. **GenderBar**: label **GÉNERO** uppercase Poppins 500 12px, line-height 100%, letter-spacing 5%; iconos male/female del Figma (18px); **track 8px alto, radio 49px, rosa `#FF7596`** (porción hembra) y **segmento azul `#2551C3` sin border-radius** (división recta, no redondeada).
- **Verificación**: navegador — labels uppercase, iconos 18×18, valores centrados (centro texto = centro caja), line-height 20.7px, track 8px/49px/#FF7596, segmento #2551C3 radius 0. Suite **234/234** + type-check + lint PASS.
- **Archivos afectados**: `src/components/PropertyBox.vue`, `src/components/GenderBar.vue`, `src/components/PokemonDetailPanel.vue` (imports de iconos), `src/assets/icons/properties/*`, `src/assets/icons/gender/*`, tests.

### [architecture] Espaciado detalle — doble género→debilidades, triple badges, share separado+centrado

- **Descripción**: (1) Espacio entre la GenderBar y Debilidades duplicado a **32px** (`margin-top: 16px` en `.detail-weaknesses` + el gap body de 16px); (2) gap entre las badges de debilidades triplicado a **12px** (antes 4px); (3) ShareButton separado **32px** de debilidades y **centrado horizontalmente** (`align-items: center` sobre el flex column del share — el AppButton de 328px queda con offset 0).
- **Verificación**: navegador — género→debilidades 32, chips 12, share→debilidades 32, share centerOffset 0. Suite **234/234** + type-check + lint PASS.
- **Archivos afectados**: `src/components/PokemonDetailPanel.vue`.

## Pendiente / Próximos pasos

- [ ] **Lista de pokémon (`/`)**: search bar y cards refinados; infinite scroll arreglado; toolbar sticky OK; queda revisar resultado de búsqueda/filtro.
- [ ] **Detalle de pokémon (`/pokemon/:name`)**: alineado al Figma — header círculo + imagen, chips, características, GenderBar, Debilidades, sin nav/stats. Pendiente: revisar estados de carga con `LoadingSpinner`.
- [ ] **Favoritos con datos**: swipe-to-reveal implementado; falta revisar snapshot localStorage + sync cross-tab a fondo (el estado vacío y cabecera ya OK).
- [ ] **README** AI-First: actualizado con mapa de navegación, arquitectura y layout.

---



## Entregado — commit `a5cae26` (push a `origin/main`)

Sesión del 2026-08-17 (octava tanda): swipe-to-reveal en favoritos (Pointer Events), header de favoritos a ancho completo, README actualizado (mapa de navegación + arquitectura + layout), fix nit de vitest. Commits previos: `88632b2`, `38c08f0`, `b23db63`, `448ad65`, `322bbe1`, `a81e7c5`, `c41be4c`. Rama `main` limpia.
