# Inventario de assets – Legacy Fantasy (Anokolisa)

> **Actualización:** se decidió top-down y se incorporó Pixel Crawler. Ver [assets_inventory_topdown.md](assets_inventory_topdown.md). Este documento queda como referencia del pack side-view, ahora en `assets/sprites/Legacy Fantasy/`.

Fuente: `assets/sprites/Legacy Fantasy/` · 18 carpetas · 431 archivos (≈ 190 PNG útiles, 149 `.aseprite` editables, 20 GIF de preview).
Los tamaños de frame son inferidos (ancho de hoja ÷ nº de frames), no verificados uno por uno.

## ⚠️ Hallazgo principal: la colección es SIDE-VIEW (plataformas)

Todos los mockups y tilesets son de **vista lateral** (suelo/plataformas, fondos parallax). El personaje tiene animaciones de salto (`Jump`, `Jump-Start`, `Jump-End`) y **no existen sprites top-down**. Esto choca con la decisión del GDD v0.2 (top-down estilo Isaac/Gungeon). Opciones:

1. **Cambiar el juego a side-view** (vista lateral estilo Dead Cells / Idle Slayer). Usa los assets tal cual. *Recomendada*: coincide con la perspectiva original y con el pack comprado.
2. Mantener top-down: los tiles/personajes no sirven; habría que comprar otro pack o crear arte.
3. Híbrido: lateral para combate, UI/menús para el resto (idle, mapa de expediciones).

Hay que decidirlo antes de seguir con el GDD.

## Licencia (Terms.txt / Autor_note.txt)

- Uso comercial permitido; atribución opcional.
- Se pueden modificar (recolorear, editar).
- **No se pueden revender ni distribuir los assets** como producto, ni siquiera editados. Al publicar en Steam/itch, los PNG no deben quedar accesibles de forma extraíble como "pack" (lo normal en un juego empaquetado es aceptable, pero conviene tenerlo presente).
- Las carpetas `Social/` son material promocional (covers, mockups): no usar en el juego.
- Los 3 packs "VL.3" (Muddy Swamp, Purple Bay, Scarlet Monastery) indican que son gratuitos para uso comercial.
- Pendiente: Dusk Woods, Lonely Mine y otros solo tienen `Autor_note`; Forgotten Cemetery, Deep Cave, High Forest, Kingdom Fortress no incluyen texto de licencia en la carpeta.

## Personajes

| Qué | Dónde | Detalle |
|---|---|---|
| **Protagonista (único)** | High Forest 2.3 / `Character` | Idle, Run, Attack-01, Dead, Jump (start/loop/end). Frame ≈ 64×80. **Sin Walk, Hit, Dash/Dodge, ni habilidades.** |
| NPCs / aldeanos | — | **No hay.** |

Solo hay un personaje y un ataque. No hay variantes de clase ni equipamiento visible por capas (el sprite es único, no modular).

## Enemigos

| Enemigo | Pack | Animaciones | Notas |
|---|---|---|---|
| Jabalí (Boar) | High Forest | Idle, Walk, Run, Hit | 32×32 (pequeño) |
| Abeja pequeña | High Forest | Fly, Attack, Hit | Volador |
| Caracol | High Forest | Walk, Hide, Dead | |
| Jabalí salvaje (Wild Boar) | Legacy Enemy – Wild Boar | Idle, Walk, Run, Attack, Die | **3 variantes de color** |
| **Jabalí guerrero (Boar Warrior)** | Legacy Enemy – Boar Warrior | Idle, Walk, Attack, Die | Más grande (frame ≈ 112 px); candidato a mini-jefe. Versiones Black/White para efecto de golpe. |
| Esqueleto | Castle Prison | Idle, Walk, Run, Attack, Hit, Death | Hay `.aseprite` modular |
| Slime | Sewer Canals | Idle, Move, Down, Die | 32×32 |
| Cangrejo | Purple Bay | Idle, Walk, Attack, Death | |

**Jefes:** no hay ninguno dedicado. El Boar Warrior es lo más cercano. El arquero esqueleto del mockup de Castle Prison no aparece como sprite sheet.

## Entornos (tilesets + fondos parallax)

| Bioma | Pack | Contenido |
|---|---|---|
| Bosque | High Forest 2.3 | Tiles, 5 árboles de colores, edificios, colmena, interior, rocas, fondo |
| Bosque oscuro | Dusk Woods | Tiles normales y oscuros, casas, vegetación, 4 capas de fondo |
| Claros | Lost Glades | Tiles, árbol grande, 3 fondos |
| Pantano | Muddy Swamp | Tiles (sin fondo/props como PNG) |
| Bahía | Purple Bay | Tiles, 4 fondos |
| Calabozo / prisión | Castle Prison | Tiles, props, fondo |
| Cloacas | Sewer Canals | Tiles, props, paredes, fondos |
| Mansión | Blood Mansion | Tiles, props, fondo |
| Cementerio | Forgotten Cemetery | Tiles, props, fondo |
| Cueva | Deep Cave | Tiles, props, 3 fondos |
| Mina | Lonely Mine | Tiles, fondo y primer plano |
| Templo | Strange Temple | Tiles, props, 2 fondos |
| Desfiladero | Deadwind Pass | Tiles, props, huesos, 3 fondos |
| Monasterio | Scarlet Monastery | Tiles (falta fondo como PNG) |
| Fortaleza / ciudad | Kingdom Fortress | Tiles, props, vegetación, ciudad, 2 fondos |
| Mapa de prueba | Debug Map | Tiles de test |

Hay **16 biomas** distintos: de sobra para zonas de la mazmorra y progresión.

## Objetos, recursos y pickups

- Hay **props decorativos** (muebles, cofres/baúles de prisión, jarras, pociones, cadenas, armas de pared) dispersos en los `Props.png`. Las pociones y cálices de **Castle Prison/Props** se pueden recortar como pickups.
- **No hay**: monedas, gemas, llaves, bombas, corazones, minerales ni materiales de crafteo como iconos de inventario.
- **No hay iconos de equipamiento** (espada, botas, guantes, armadura, amuleto). Solo se ve la espada del protagonista animada.

## UI

- `High Forest/HUD/Base-01.png` (432×304): paneles beige, botones y barras de 5 colores, iconos pequeños (pausa, +, flechas, ?, calavera, casa, reloj, trofeo). Suficiente para menús básicos y barras de vida/progreso, pero no hay marcos de inventario ni iconos de objetos.

## Efectos

- Solo los sheets `-White`/`-Black` de algunos enemigos (flash de daño). **No hay** proyectiles, impactos, partículas ni números de daño.

## Matriz contra el GDD

| Necesidad del GDD | Estado | Comentario |
|---|---|---|
| Protagonista con ataque melee | 🟡 Parcial | 1 ataque; faltan esquiva, hit, walk, habilidades |
| Enemigos para 3 arquetipos | ✅ | 8 tipos; hay variantes de color |
| Jefe inicial | 🟡 | Boar Warrior servible; el resto, por crear |
| Salas / biomas | ✅ (side-view) / ❌ (top-down) | Ver hallazgo principal |
| Iconos de equipamiento y materiales | ❌ | Hay que crearlos |
| Monedas y pickups | ❌ | Hay que crearlos (o generarlos con el estilo del pack) |
| HUD / UI | 🟡 | Base utilizable, falta inventario/iconos |
| Efectos de combate | ❌ | Hay que crearlos |
| Trabajadores / NPC para idle | ❌ | No hay |

## Próximos pasos propuestos

1. **Decidir la perspectiva** (side-view vs top-down).
2. Elegir los biomas iniciales (sugerencia: High Forest → Dusk Woods → Castle Prison/Sewer → Deep Cave/Lonely Mine → jefe).
3. Hacer la lista de iconos que faltan (equipamiento, materiales, pickups, efectos) y definir cómo crearlos (a mano en Aseprite, o generarlos imitando el estilo del pack).
