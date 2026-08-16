# Figma Design — Pokédex (referencia oficial de la prueba)

> Extraído de la API de Figma (file key `edU7Pms8bvosgSYW23yOds`) el 2026-08-15.
> Fuente de verdad visual de la prueba técnica Global66. Última modificación: 2026-01-20.

## Pantallas (Canvas Flow)

| Pantalla | Contenido clave | Observaciones |
|---|---|---|
| **Splash** | Loader de pokebola (ellipses animables vía CSS) | El loader de la prueba |
| **Onboarding 01** | "Todos los Pokémon en un solo lugar" + "Accede a una amplia lista de Pokémon de todas las generaciones creadas por Nintendo" + CTA "Continuar" | Paginador (2 dots) |
| **Onboarding 02** | "Mantén tu Pokédex actualizada" + "Regístrate y guarda tu perfil, Pokémon favoritos, configuraciones y mucho más" + CTA "Empecemos" | |
| **Pokedex (lista)** | Cards de pokémon (Nº001, nombre, tipos), TabBar, barra de búsqueda "Procurar Pókemon..." | Estado principal |
| **Pokedex (con filtros)** | "Se han encontrado 3 resultados" + "Borrar filtro" | Resultado de búsqueda/filtro |
| **Pokedex (detalle)** | Header con imagen, Nº001, nombre, descripción, Peso/Altura/Categoría/Habilidad/Género, Debilidades, navegación Próximo/Anterior | Pantalla más rica |
| **Pokedex (BottomSheet filtros)** | "Filtra por tus preferencias", tipo (Agua, Dragón, Eléctrico...), Aplicar/Cancelar | Filtro por tipo |
| **Pokedex (favoritos)** | Cards con corazón + icono trash (eliminar) | Lista de favoritos con remoción |
| **Pokedex_Error** | "Algo salió mal..." + "No pudimos cargar la información..." + CTA "Reintentar" (Magikarp) | Estado de error |
| **Pokedex_Construcción** | "¡Muy pronto disponible!" + "Estamos trabajando para traerte esta sección" (Magikarp) | Para Regiones/Perfil |
| **Favoritos vacío** | "No has marcado ningún Pokémon como favorito" + "Haz clic en el ícono de corazón de tus Pokémon favoritos y aparecerán aquí." | Empty state |

## TabBar (4 items)

1. **Pokedex** (activo: `#0d47a1`, inactivo: `#424242`)
2. **Regiones** → pantalla "Construcción"
3. **favoritos** → lista de favoritos con trash
4. **Perfil** → pantalla "Construcción"

## Paleta principal

| Color | Uso |
|---|---|
| `#fafafa` | Fondo de pantallas |
| `#1e88e5` | CTA / botones primarios / "Borrar filtro" |
| `#0d47a1` | TabBar activo |
| `#173ea5` / `#4565b7` | Dots de onboarding |
| `#121212` | Títulos |
| `#424242` | Subtítulos / texto secundario |
| `#8bc34a` | Fondo card tipo grass |
| `#ff9800` | Fondo card tipo fire |
| `#9c27b0` | Fondo card tipo psychic/veneno |
| `#cd3131` | Trash / peligro |
| `#1f49b6` / `#eff0f2` | Progress bar |

## Detalle de pokémon (campos)

- Nº (ej. "Nº001")
- Nombre (ej. "Bulbasaur")
- Descripción ("Tiene una semilla de planta en la espalda desde que nace...")
- **Peso** ("6,9 kg")
- **Altura** ("0,7 m")
- **Categoría** ("SEMILLA")
- **Habilidad** ("Espesura")
- **Género** ("87,5% / 12,5%")
- **Debilidades** (chips de tipos)
- Navegación **Próximo / Anterior**

## Tipografía

- Título pantalla: 26px, weight 500
- Nombre en detalle: 32px, weight 500
- Nombre en card: 21px, weight 600
- Nº en card: 12px, weight 600
- Etiquetas de datos (Peso/Altura): 12px, weight 500
- Valores de datos: 18px, weight 500
- CTA: 18px, weight 600
- Placeholder búsqueda: 14px, weight 400

## Componentes del sistema de diseño (Canvas Components)

- **Button**: Primary/Secondary/Tertiary × Default/Loading/Hover/Press/Disable
- **Elements**: iconos de 18 tipos (water, dragon, electric, fairy, ghost, fire, ice, grass, bug, fighting, normal, dark, steel, rock, psychic, ground, poison, flying)
- **Elementos Status**: chips de tipo con nombre (Agua, Dragón, Eléctrico, Hada, Fantasma, Fuego, Hielo, Planta, Bicho, Lucha, Normal, Siniestro, Acero, Roca, Psíquico, Tierra, Veneno, Volador)
- **Illustration**: imágenes de pokémon (Bulbasaur, Charmander, Pikachu, etc.)
- **Card**: variantes por tipo de pokémon (18 tipos) — fondo según tipo
- **Icon/Heart** y **Icon/HeartSolid**: favorito / no favorito

## Notas de implementación (derivadas)

- **Splash + Onboarding** existen en el diseño oficial → el routing `/` como lista directa (decisión previa) contradice el diseño; hay que decidir si se implementan onboarding/splash como pantallas iniciales o se omiten (el enunciado no los pide explícitamente; el diseño sí los incluye).
- **TabBar de 4 items** → Regiones y Perfil serían pantallas "Construcción"; la app debe contemplar ese patrón.
- **Filtro por tipo** (BottomSheet) → la spec actual no lo cubre (solo búsqueda por nombre); es un requisito del diseño.
- **Detalle rico** (peso, altura, categoría, habilidad, género, debilidades, próximo/anterior) → supera el "ver más" simple planeado; el detalle debe mostrar estos campos y navegar entre pokémon.
- **Favoritos con trash** → el diseño permite eliminar favoritos desde la lista.
- **Idioma del diseño**: los textos del Figma están en portugués ("Procurar Pókemon...", "Barra de pesquisa"); decidir idioma final de la app.
- **Los 18 tipos** con iconos/colores → se necesitan assets o CSS por tipo (los sprites de PokeAPI cubren la imagen; los iconos de tipo hay que mapearlos a la PokeAPI `types`).

## Layout fino extraído de la API (2026-08-15)

Valores exactos para implementación pixel-fiel (sin necesidad de ver la imagen):

| Componente | Corner radius | Padding | Spacing | Sombra | Fondo |
|---|---|---|---|---|---|
| **Card** | 16px | L16 (der/arriba/abajo por contenedores) | inner 29px; Info gap 4px | — | por tipo (grass `#8bc34a`, fire `#ff9800`, psychic `#9c27b0`) |
| **Image Container (card)** | 16px | 16/16/4/4 | 10px | — | color del tipo |
| **Button / CTA** | **100px (pill)** | 32/32/16/16 | 8px | — | `#1e88e5` (texto `#fafafa`) |
| **Elementos Status (chip tipo)** | ~48.6px | 6/6/2.9/2.9 | 5.8px | — | color del tipo; icono en círculo `#fafafa` radius 100 |
| **TabBar** | 16px **solo esquinas superiores** (16,16,0,0) | 16/16/24/24 | 11px entre items | drop-shadow: y=-1, blur 3, `#000` 12% | `#fafafa` |
| **BottomSheet** | 24px esquinas superiores (24,24,0,0) | 16/16/16/32 | 16px | shadow superior igual al TabBar | `#fafafa` |
| **HeaderB2C** | — | 16/16 | 4px (title/subtitle); 8px interno | — | title `#121212`, subtitle `#7f869a` |

Notas de layout:
- TabBar y BottomSheet comparten el mismo patrón de sombra superior: `box-shadow: 0 -1px 3px rgba(0,0,0,0.12)`.
- Los botones son **píldoras** (radius 100px), no cuadrados.
- Los chips de tipo tienen el icono en un círculo blanco (radius 100) con el texto del tipo al lado.
- El Card es horizontal: info a la izquierda, imagen a la derecha (`SPACE_BETWEEN`, center).
- Tipografía de los textos ya documentada arriba (26px título onboarding, 21px nombre card, 32px nombre detalle, 12px etiquetas, 18px valores).
