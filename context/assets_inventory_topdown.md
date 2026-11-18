# Inventario de assets – Pixel Crawler Free Pack (top-down)

Ubicación: `assets/sprites/Pixel Crawler - Free Pack/` · 372 archivos · Autor: Anokolisa (mismo que Legacy Fantasy).
Esto **reemplaza como base visual** a Legacy Fantasy (`assets/sprites/Legacy Fantasy/`, side-view), que queda como complemento. Ver [assets_inventory.md](assets_inventory.md).

## Licencia
Idéntica a la de Legacy Fantasy: uso comercial permitido, atribución opcional, modificable, **no revendible ni redistribuible como pack**. Es una versión gratuita: lo más completo (más biomas, armas, enemigos, personajes) está en la versión de pago o Patreon.

## Personaje (modular, 64×64 por frame)

`Entities/Characters/Body_A/Animations/` — cuerpo base desnudo, con 3 direcciones (Down, Side, Up; el lado se espeja):

| Animación | Frames | Notas |
|---|---|---|
| Idle, Walk, Run | 4 / ? / 6 | Idle 256×64, Run 384×64 |
| Slice (tajo) | 8 | Ataque cuerpo a cuerpo con espada |
| Pierce (estocada) | 8 | Ataque cuerpo a cuerpo con lanza/daga |
| Hit | 4 | Recibir daño (aturdimiento) |
| Death | 8 | |
| Carry Idle/Walk/Run | — | Llevando objetos |
| Collect, Crush, Fishing, Watering | — | Útiles para el apartado idle |

Hay una carpeta `New_Version` pero solo con `.aseprite` (sin PNG exportados).

**Modularidad:** el cuerpo, las manos y las armas (`Weapons/`) son capas separadas, lo que encaja con tu sistema de equipamiento por piezas. **No incluye ropa ni armaduras**, así que botas, guantes y armadura no tienen sprite propio.

**Faltan:** esquiva/dash, habilidades/magia, ataque a distancia.

## Enemigos (32×32 por frame, solo Idle / Run / Death)

| Familia | Variantes |
|---|---|
| Esqueletos | Base, Mage, Rogue, Warrior |
| Orcos | Base, Rogue, Shaman, Warrior |

8 enemigos, **sin animación de ataque ni de golpe recibido**. Hay que usar Run + efecto, o crear esos frames. Estos sprites son de una sola dirección (sin Up/Down).

**Jefes:** ninguno (se puede escalar un orco o esqueleto, o usar el Boar Warrior de Legacy Fantasy, aunque es lateral).

## NPCs

Caballero, Pícaro, Mago (Idle/Run/Death) y aldeanos (Peasant, Tavern A/B con variantes de llevar objetos, Citizen). Pueden servir como los "trabajadores" y personajes de la base del idle.

## Armas (`Weapons/`)

Solo **3 sets**: Bone, Wood y Hands, con ~20 armas por set (espadas, hachas, martillos, lanzas, arcos, escudos, bastones). La versión gratuita solo trae madera y hueso, no hierro ni acero. Eso afecta a las evoluciones del equipamiento (hierro → acero): habría que recolorear los sprites de madera para crear los siguientes niveles.

## Entorno

| Carpeta | Contenido |
|---|---|
| Tilesets | Dungeon_Tiles, Floors, Wall_Tiles, Wall_Variations, Water (400×400, tiles de 16×16) |
| Props / Static | Dungeon_Props (antorchas, banderas), Esoteric, Farm, Furniture, Meat, Pan, Resources, Rocks, Tools, Vegetation, Shadows, 3 modelos de árboles |
| Props / Animated | 5 props animados (Pan_01–05) |
| Structures / Buildings | Muros, techos, interiores |
| Structures / Stations | Alchemy, Anvil, Bonfire, Cooking (Butchery, Cooker, Grill), Furnace, Sawmill, Workbench |
| MockUps | Tavern.png (referencia visual de interior) |

Alcanza para: un bioma de mazmorra de piedra (suelos, paredes, antorchas), exteriores de pueblo, interiores y estaciones de crafteo.
**Un único bioma de mazmorra** de momento. Los de cuevas, cloacas, castillo y cripta están en packs de pago.

## Recursos e iconos
- `Props/Static/Resources.png` tiene gemas, llaves, troncos y minerales **muy pequeños** (pocos elementos, sirven como pickups).
- `Icons/Resources.aseprite` existe pero **sin PNG**; hay que abrirlo en Aseprite y exportar.
- No hay monedas dedicadas, bombas, corazones, ni iconos de inventario/equipamiento.

## Matriz contra el GDD (top-down)

| Necesidad | Estado | Fuente |
|---|---|---|
| Vista top-down | ✅ | Pixel Crawler |
| Protagonista melee + hit + muerte | ✅ | Body_A (Slice/Pierce/Hit/Death) |
| Esquiva / habilidades | ❌ | Crear (se puede usar Run + efectos) |
| Equipamiento visual por pieza | 🟡 | Armas sí; armaduras/botas/guantes no |
| Enemigos básicos | ✅ | 8 variantes esqueleto/orco |
| Ataque y golpe de enemigos | ❌ | Crear |
| Jefes | ❌ | Crear o escalar un enemigo |
| Salas de mazmorra | 🟡 | 1 bioma |
| Pickups (llaves, gemas) | 🟡 | Resources.png (revisar) |
| Monedas, bombas, corazones | ❌ | Crear |
| Estaciones de crafteo | ✅ | Stations |
| NPCs / base idle | ✅ | NPCs + Tavern |
| UI | 🟡 | Usar el HUD de Legacy Fantasy (High Forest/HUD) |
| Efectos de combate | ❌ | Crear |

## Próximos pasos
1. Exportar a PNG lo que solo existe en `.aseprite` (Icons/Resources, New_Version).
2. Revisar si el pack de pago (cuevas, castillo, criptas, más armas y enemigos) cubre lo que falta, o crear esos sprites.
3. Actualizar el GDD: pasar a top-down, con 1 bioma de mazmorra y 8 enemigos para el MVP.

---

## Packs adicionales (iconos)

### Coins & Gems & Chests & More (`assets/sprites/Coins & Gmes & Chests & More/`)
Hoja 912×1040: monedas (4 colores), gemas, orbes, estrellas, corazones, llaves y candados, pociones, comida, bolsas de dinero, cofres animados, cajas y globos de diálogo. No hay bombas, materiales ni efectos. Estilo más brillante que Pixel Crawler: recolorear. Licencia: sin archivo, verificar (el autor suele usar CC0).

### 16x16 Fantasy Assets Pack (`assets/sprites/16x16 Fantasy Aseets Pack/RPG V1.0.png`)
Hoja única de 347×309, **iconos de inventario en 5 niveles de color** (marrón/cobre, gris/hierro, dorado, violeta, rosa/rubí):
- Armas: espadas, dagas, lanzas, hachas, mazas, picos, palas, arcos, flechas, bastones y mazas mágicas.
- Armaduras: yelmos, petos, hombreras, botas, sombreros de mago y pantalones/faldas.
- Complementos: anillos, collares/amuletos, escudos (5 formas), lingotes y monedas.
- Otros: pociones (5 colores, varias formas), llaves, corazones, números 0-9 y marcos/slots de inventario.
Uso directo para equipamiento por niveles (reemplaza la opción B de recolorear). No incluye guantes ni bombas. Licencia: sin archivo, verificar en la página del autor.

### Pixel RPG Items – 300 Icons (`assets/sprites/PixelRPGItems/PixelRPGItems/`)
300 iconos 16×16 en 15 categorías (20 c/u), mismo estilo: espadas, hachas/martillos, lanzas/dagas, arcos/ranged, bastones, escudos, cascos, armaduras (incluye botas y guantes), accesorios (anillos, amuletos), pociones, comida, **materiales** (piedra, carbón, minerales de cobre/hierro/oro/mythril, lingotes, madera, cuero, tela, hueso, pluma, hierbas, slime, colmillo, escama), tesoro (monedas, gemas, cofres, llaves), pergaminos/runas y herramientas (**bomba**, pico, yunque, antorcha). Incluye `items.json`, hojas por categoría y versión x4. **Licencia: CC0** (LICENSE.txt incluido, no revender el pack). Cubre equipamiento por niveles (madera → hierro → acero → oro → cristal), materiales de crafteo, bombas y llaves. **Reemplaza a 16x16 Fantasy Assets Pack como fuente principal de iconos** (que queda como respaldo). Trae guantes de cuero y de hierro, por lo que ya no hace falta usar el anillo en su lugar.

### Puny-Characters (`assets/sprites/Puny-Characters/Puny-Characters/`)
20 hojas de 768×256 (frames de 32×32, rejilla 24×8, sin verificar qué fila es cada animación/dirección): Character-Base (desnudo), Warrior, Soldier, Archer, Mage, Human Worker/Soldier, Orc Grunt/Peon/Soldier (variantes de color) y Slime (480×32). Cada hoja viene con su equipo ya dibujado (no es modular por capas); solo hay una base desnuda. Sin archivo de licencia en la carpeta. Estilo más "chibi", distinto de Pixel Crawler.

### Gold Mini RPG Pack (`assets/sprites/Gold Mini RPG Pack/`)
Pack pequeño (47 archivos), sin licencia incluida: 5 enemigos 16×16, caballero modular con espadas y escudos, **4 efectos de tajo** (128×192), proyectil, bomba y corazón de 8×8, monedas, cristales, llaves, cofre, tiles y paleta. Útil como efectos de combate y referencia.
