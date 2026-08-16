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

## Pendiente / Próximos pasos

- [ ] **Reanudar SDD**: incorporar diseño Figma oficial a la spec/design (fuente de verdad visual).
- [ ] **Decidir entrega**: PRs encadenados (5 work units) vs. size:exception (~1300 líneas, riesgo High).
- [ ] **Aplicar** tareas de implementación (22 tareas en 6 fases TDD-first) — `openspec/changes/pokemon-favorites/tasks.md`.
- [ ] **Verificar** contra specs (unit + type-check + lint; e2e si hay browsers).
- [ ] **Archivar** el cambio y sincronizar specs delta al nivel superior.
- [ ] **README** AI-First: qué es, cómo se desarrolla, cómo se prueba, decisiones.
- [ ] Fix del nit de `vitest.config.ts` (extensión en el import).
