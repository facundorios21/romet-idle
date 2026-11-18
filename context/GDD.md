# GDD – Idle Roguelite RPG (v0.5)

Documento consolidado a partir de `previouscontext.md` (GDD v0.1–v0.4 + sistema de progresión), actualizado con las decisiones de arte y alcance tomadas después. Los inventarios de assets están en [assets_inventory_topdown.md](assets_inventory_topdown.md) y [assets_inventory.md](assets_inventory.md).

**Leyenda de estado:** ✅ decidido · 🟡 propuesta pendiente de confirmar · ❓ abierto · ⏭️ fuera del MVP

---

## 1. Visión

Un RPG incremental de fantasía medieval, **top-down 2D**, para **PC (Windows)**, desarrollado en solitario. El jugador mejora su equipamiento con sistemas idle y se aventura en expediciones roguelite con combate híbrido, salas, oleadas y recompensas.

| Característica | Definición | Estado |
|---|---|---|
| Género | Idle RPG + Roguelite | ✅ |
| Perspectiva | Top-down 2D, 8 direcciones | ✅ |
| Interacción | Baja | ✅ |
| Offline | Limitado (máx. 8 h, a confirmar) | ✅ / 🟡 |
| Plataforma | Windows | ✅ |
| Desarrollo | Individual | ✅ |
| Guardado | Local | ✅ |
| Motor | **Godot 4 (GDScript)** | ✅ |

**Referencias:** Idle Slayer (progresión incremental, equipo con niveles), The Binding of Isaac (variedad y mejoras temporales), Enter the Gungeon (salas, combate, mazmorra). Se busca simpleza: pocos objetos y pocas sinergias.

### Pilares
1. **Progresión permanente:** siempre hay algo que mejorar, independiente de las expediciones.
2. **Expediciones roguelite:** salas, enemigos y recompensas parcialmente aleatorias; morir reinicia la expedición.
3. **Automatización:** el juego progresa aunque el jugador no interactúe constantemente.
4. **Variedad controlada:** decisiones y sorpresas sin cientos de ítems ni combinaciones complejas.

---

## 2. Core loop

1. **Preparación:** equipar, mejorar equipamiento, elegir expedición.
2. **Expedición:** avanzar por salas, combatir, encontrar recompensas.
3. **Recompensas:** oro, materiales, experiencia, mejoras temporales.
4. **Progresión:** subir niveles de equipo, desbloquear mejoras.
5. **Nueva expedición:** desafíos más difíciles, mejores recompensas.

El progreso idle continúa entre expediciones y mientras el jugador está ausente. La expedición no es requisito para todo el progreso, pero da recompensas exclusivas.

---

## 3. Dos apartados: Idle y RPG/Mazmorra

| Apartado | Función | Estado |
|---|---|---|
| **Idle** | Genera oro de forma pasiva (inicialmente ~1 oro por minuto/segundo, sin balancear). Mejoras de producción y offline limitado. | ✅ concepto, 🟡 cifras |
| **RPG / Mazmorra** | Exploración y combate. Da oro, **materiales** y **pickups**. Aquí están jefes, misiones y desbloqueos. | ✅ |

✅ **Decisión confirmada:** en el MVP el modo idle produce únicamente oro. A medida que avanza el progreso del jugador, podrá desbloquear la generación o caída ocasional de materiales/objetos de mayor calidad, pero siempre con límites estrictos para no reemplazar la exploración de la mazmorra.

### 3.1 Categorías de recursos
| Categoría | Ejemplos | Persistencia |
|---|---|---|
| Moneda | Oro | Permanente |
| Materiales de crafteo | Hierro, cuero, madera, hierbas, esencias | Permanente (se acreditan al obtenerlos) |
| Pickups de expedición | Llaves, bombas, pociones, corazones | Se pierden al terminar la expedición |

### 3.2 Misiones como sistema de desbloqueo 🟡
Las primeras misiones amplían lo que el mundo puede dar (no solo recompensan):

| Misión | Objetivo | Desbloquea |
|---|---|---|
| Primera expedición | Completar la primera sala | Mazmorra y oro |
| Restos de hierro | Conseguir mineral de hierro | Hierro en las recompensas |
| Herramientas básicas | Recolectar hierro y madera | Crafteo |
| Cuero de bestia | Derrotar ciertos enemigos | Cuero y recetas de armadura |
| El núcleo antiguo | Derrotar al primer jefe | Esencias y evoluciones especiales |

Antes de completar una misión, el material correspondiente no aparece en las tablas de recompensas.

---

## 4. Personaje y control

**Modelo híbrido avanzado.** ✅ Dos estados principales y transiciones automáticas:

- **Exploración:** movimiento automático hacia la salida o el siguiente punto de interés.
- **Combate:** movimiento **manual** (WASD) + ataque automático + esquiva + habilidad.
- **Sala despejada:** reanuda la exploración automática.

Regla: si el jugador no se mueve durante el combate, el personaje **no** se desplaza solo hacia los enemigos (importa el posicionamiento).

### 4.1 Requerimientos de movimiento
| ID | Requerimiento | Prioridad |
|---|---|---|
| MOV-01 | Movimiento en ocho direcciones | Alta |
| MOV-02 | Exploración automática hacia el siguiente destino | Alta |
| MOV-03 | Control manual del movimiento en combate | Alta |
| MOV-04 | Movimiento diagonal normalizado | Alta |
| MOV-05 | Colisiones con paredes y obstáculos | Alta |
| MOV-06 | Detenerse al llegar al destino de exploración | Alta |
| MOV-07 | Velocidad modificable por estadísticas y equipo | Media |
| MOV-08 | Transición automática exploración ↔ combate | Alta |

### 4.2 Selección de objetivos (enemigo más cercano) ✅
| ID | Requerimiento | Prioridad |
|---|---|---|
| OBJ-01 | Detectar enemigos dentro de un radio configurable | Alta |
| OBJ-02 | Seleccionar al enemigo válido más cercano | Alta |
| OBJ-03 | Excluir enemigos muertos, inactivos o fuera de alcance | Alta |
| OBJ-04 | Cambiar de objetivo cuando el actual deja de ser válido | Alta |
| OBJ-05 | Atacar sin botón de ataque | Alta |
| OBJ-06 | Respetar alcance y enfriamiento del arma | Alta |
| OBJ-07 | Las habilidades pueden modificar el comportamiento automático | Media |

Se aplica una **tolerancia** de distancia para no alternar entre dos enemigos casi equidistantes.

### 4.3 Ataque automático (melee)
| ID | Requerimiento | Prioridad |
|---|---|---|
| ATA-01 | Atacar automáticamente con un objetivo válido | Alta |
| ATA-02 | Respetar la velocidad de ataque del equipo | Alta |
| ATA-03 | Daño según estadísticas del personaje y del arma | Alta |
| ATA-04 | Animaciones y efectos visuales de ataque | Alta |
| ATA-05 | Distintos tipos de ataque según el arma | Media |
| ATA-06 | Detener el ataque sin objetivos válidos | Alta |

### 4.4 Esquiva
| ID | Requerimiento | Prioridad |
|---|---|---|
| ESK-01 | Esquiva manual | Alta |
| ESK-02 | Se desplaza en la dirección indicada | Alta |
| ESK-03 | Tiempo de reutilización | Alta |
| ESK-04 | Duración y distancia configurables | Alta |
| ESK-05 | Animación específica | Alta |
| ESK-06 | No atraviesa sólidos | Alta |
| ESK-07 | Invulnerabilidad temporal configurable (i-frames) | Media |

### 4.5 Habilidad activa
MVP: una sola (ejemplo: *Explosión arcana*, daño en área alrededor del personaje; es un ejemplo, no definitiva).

| ID | Requerimiento | Prioridad |
|---|---|---|
| HAB-01 | Activación manual | Alta |
| HAB-02 | Efecto definido | Alta |
| HAB-03 | Tiempo de reutilización | Alta |
| HAB-04 | Equipo o mejoras pueden modificar el efecto | Media |
| HAB-05 | UI con su disponibilidad | Alta |
| HAB-06 | Nuevas habilidades sin tocar el ataque básico | Media |

### 4.6 Controles (PC) 🟡
| Acción | Control |
|---|---|
| Movimiento manual | WASD |
| Esquiva | Espacio |
| Habilidad | Q |
| Interacción | E |
| Pausa | Esc |
| Ataque básico | Automático |

Reasignación de controles: deseable desde el inicio, no obligatoria para el MVP.

### 4.7 Máquina de estados del personaje
`EXPLORATION → COMBAT → (DODGING | ABILITY | HIT_STUN) → ROOM_CLEARED → EXPLORATION`, y `DEAD` desde cualquier estado.

| Estado actual | Condición | Siguiente |
|---|---|---|
| Exploración | Aparece un enemigo activo | Combate |
| Combate | Esquiva | Esquiva |
| Combate | Habilidad | Habilidad |
| Combate | Todos los enemigos mueren | Sala despejada |
| Sala despejada | Salida disponible | Exploración |
| Cualquiera | Vida = 0 | Muerte |

Las acciones deben tener prioridad definida (el ataque automático no genera acciones incompatibles durante una esquiva o habilidad).

---

## 5. Combate, daño y encuentros

### 5.1 Armas (MVP: solo melee)
Una espada básica en el MVP. Arquetipos para después: espada corta, espada larga, mandoble, daga, hacha (varían en daño, velocidad y alcance). Estadísticas del arma en el MVP: **daño, velocidad, alcance** (luego: área, multiplicador crítico).
Decisión de diseño: **tipo de arma ≠ nivel de mejora** (una espada corta nivel 20 y un mandoble nivel 1 pueden coexistir).

| ID | Requerimiento | Prioridad |
|---|---|---|
| ARM-01 | Arma melee equipada | Alta |
| ARM-02/03/04 | El arma determina daño, velocidad y alcance | Alta |
| ARM-05 | Detección correcta de colisión con enemigos | Alta |
| ARM-06 | Mejora mediante el sistema incremental | Alta |
| ARM-07 | Permitir nuevas familias de armas | Media |

### 5.2 Daño y aturdimiento (hit stun) ✅
Al recibir un golpe: se calcula el daño, se reduce la vida, se interrumpe la acción actual, se reproduce la animación de daño y se aplica un aturdimiento breve. Durante el aturdimiento no se puede mover, atacar, usar habilidad ni esquivar. Debe existir un breve período de protección tras el golpe para evitar cadenas inevitables.

Parámetros iniciales de prueba (no definitivos):

| Parámetro | Valor |
|---|---|
| Vida máxima | 100 |
| Daño enemigo común | 10 |
| Aturdimiento | 0,35 s |
| Duración de esquiva | 0,25 s |
| Invulnerabilidad en esquiva | 0,25 s |
| Regeneración de vida | No automática |

| ID | Requerimiento | Prioridad |
|---|---|---|
| DMG-01..03 | Vida máxima; ataques enemigos reducen vida; defensa influye | Alta |
| DMG-04..06 | Hit stun activo, interrumpe acciones, duración configurable | Alta |
| DMG-07 | La esquiva evita impactos en su ventana de invulnerabilidad | Alta |
| DMG-08/09 | Muerte a vida 0 y reinicio de la expedición | Alta |
| DMG-10 | La UI muestra vida actual y máxima | Alta |

### 5.3 Encuentros y salas ✅
- **Sala:** espacio físico. **Oleada:** grupo de enemigos. **Encuentro:** conjunto de oleadas que hay que completar.
- Al entrar: se activa el encuentro, se bloquean las salidas, aparecen los enemigos/oleada 1. Al derrotarlos a todos: sala despejada, salida desbloqueada, recompensas y reanudación de la exploración.
- Si aparecen enemigos durante la exploración, el personaje se detiene y combate.

| ID | Requerimiento | Prioridad |
|---|---|---|
| ENC-01..03 | Salas con encuentro; se activa al entrar; salidas bloqueadas | Alta |
| ENC-04..06 | Enemigos y oleadas por configuración | Alta |
| ENC-07/08 | Comprobar enemigos derrotados; desbloquear salidas | Alta |
| ENC-09/10 | Recompensas por completar; impedir avanzar con encuentro activo | Alta |

**Máquina de estados de la sala:** `UNEXPLORED → ENTERING → COMBAT → CLEARED → COMPLETED` (independiente de la del personaje).

### 5.4 IA de enemigos (MVP)
| Enemigo | Comportamiento | Función |
|---|---|---|
| Slime | Persigue y ataca por contacto | Básico |
| Esqueleto / soldado | Se aproxima y ataca cuerpo a cuerpo | Estándar |
| Bruto | Lento, ataques potentes | Mayor dificultad |

Estados: Idle, Chase, Attack, Recovery, Hit, Dead. Los ataques enemigos deben tener señales visuales claras antes de hacer daño (la habilidad del jugador está en leer patrones, esquivar y posicionarse). Un patrón de ataque por enemigo en el MVP.

| ID | Requerimiento | Prioridad |
|---|---|---|
| ENE-01 | Vida y estadísticas propias | Alta |
| ENE-02/03 | Detectar y perseguir al jugador | Alta |
| ENE-04/05 | Al menos un ataque, con preparación y recuperación identificables | Alta |
| ENE-06/07 | Reaccionan a impactos y mueren a vida 0 | Alta |
| ENE-08 | Los muertos no cuentan para el encuentro | Alta |
| ENE-10 | Pueden dar recompensas al morir | Alta |

---

## 6. Sistema roguelite

### 6.1 Expedición
Secuencia de salas con **bifurcaciones ocasionales** (ej.: sala de combate vs. sala de recompensa; la élite da más recompensa con más riesgo). Tipos de sala: **Combate, Recompensa, Élite, Descanso, Jefe**. MVP: salas de combate, recompensa y jefe (tiendas y eventos ⏭️).

### 6.2 Muerte y persistencia ✅
| Se conserva | Se pierde al morir |
|---|---|
| Niveles de equipamiento | Mejoras temporales |
| Oro y materiales (se acreditan al obtenerlos) | Progreso de salas de la expedición |
| Mejoras permanentes y desbloqueos | Pickups consumibles no usados |

### 6.3 Mejoras temporales (MVP: 8) 🟡
Ejemplos: Filo afilado (+20 % daño), Botas ligeras (+15 % velocidad), Corazón antiguo (+25 % vida), Guantes de guerra (+20 % vel. de ataque), Moneda maldita (+30 % oro, −10 % defensa).
**Sinergias:** ⏭️ fuera del MVP (después, 5–10 diseñadas a mano).

### 6.4 Recompensas
| ID | Requerimiento | Prioridad |
|---|---|---|
| REC-01/02 | Enemigos y encuentros pueden dar recompensas | Alta |
| REC-03 | Recompensas permanentes se acreditan de inmediato | Alta |
| REC-04 | Mejoras temporales se almacenan aparte | Alta |
| REC-06 | Sin entrega duplicada de la misma recompensa | Alta |

---

## 7. Progresión de equipamiento ✅

Cinco categorías, cada una con **nivel propio e independiente** y una estadística principal (una por pieza en el MVP):

| Pieza | Estadística principal | Secundaria (posterior) | Icono de referencia |
|---|---|---|---|
| Espada | Daño melee | Prob. crítica | Pixel RPG Items – Swords |
| Guantes | Velocidad de ataque | Daño crítico | Pixel RPG Items – Armor (Gloves/Gauntlets); el anillo queda de alternativa |
| Botas | Velocidad de movimiento | Distancia de esquiva | Pixel RPG Items – Armor (Boots) |
| Armadura | Defensa | Vida máxima | Pixel RPG Items – Armor |
| Amuleto | Oro obtenido | Experiencia obtenida | Pixel RPG Items – Accessories |

El poder del personaje se calcula sumando contribuciones (ej.: `Daño = DañoBase + BonusEspada`, `Velocidad = VelocidadBase + BonusBotas`). No hay nivel general.

Cada pieza: nivel propio, coste progresivo (oro), incremento por nivel, límite configurable, resumen de estadísticas visible. Ejemplo ilustrativo (no balanceado): espada nivel 1→5 = 5, 7, 10, 14, 19 de daño por 10, 20, 35, 60, 100 oro.

**Evolución por hitos (Modelo B)** ✅: además de subir de nivel con oro, cada hito (ej. cada 25 niveles) exige **materiales especiales de la mazmorra** para evolucionar la pieza (cambia nombre, icono y otorga bonificación). Cinco tiers visuales disponibles en Pixel RPG Items: **madera → hierro → acero → oro → cristal**. En el MVP, las mejoras de equipamiento se reflejan visualmente **solo en los iconos de la interfaz/inventario** (el sprite del personaje en el mundo se mantiene fijo).

| ID | Requerimiento |
|---|---|
| EQP-01..03 | Progresión independiente, nivel propio y estadísticas específicas por categoría |
| EQP-04..06 | Costes progresivos; las estadísticas se actualizan al mejorar |
| EQP-07 | Los niveles se conservan al morir |
| EQP-08 | El jugador puede consultar sus estadísticas |
| EQP-09/10 | Permitir nuevas categorías; valores configurables sin tocar la lógica |

Sin rarezas, sin loot aleatorio de equipo ni inventario de duplicados inicialmente.

---

## 8. Sistema idle y offline
| Actividad | Online | Offline |
|---|---|---|
| Producción pasiva (oro) | Sí | Sí |
| Combate automático (cuando se desbloquea) | Sí | Sí, simulado |
| Expediciones, jefes, recompensas especiales | Sí | No |
| Mejoras de equipamiento | Sí | No |

- Acumulación offline máxima: **8 horas** (preliminar).
- El combate offline **no simula golpes**: se calculan recursos según estadísticas y tiempo.
- Producción pasiva puede mostrarse como módulos en un menú (mina, tesorería, taller), sin ciudad completa.
- Combate automático: al principio exige participación; luego se desbloquea contra enemigos de zonas conocidas.

---

## 9. Alcance del MVP

| Sistema | MVP |
|---|---|
| Personaje | 1 |
| Equipamiento | 5 categorías |
| Esquiva | 1 |
| Habilidad activa | 1 |
| Recursos | Oro + 1 material |
| Enemigos | 3 arquetipos |
| Jefe | 1 (2–3 patrones) |
| Salas | 5 tipos / variantes |
| Expediciones | 1 zona |
| Mejoras temporales | 8 |
| Sinergias | ⏭️ |
| Producción pasiva | 1 fuente |
| Offline | Máx. 8 h, simulado |
| Guardado | Local |
| Armas | 1 espada básica |

---

## 10. Dirección artística y assets

**Decisión:** fantasía medieval, pixel art 16×16 (personajes Puny en frames de 32×32), top-down, usando un mismo conjunto de reglas: contorno oscuro, paleta apagada de la mazmorra, escalado nearest-neighbor.

| Elemento | Fuente | Estado |
|---|---|---|
| Personaje y enemigos | **Puny-Characters** (CC0) | ✅ |
| Mazmorra, props y estaciones | **Pixel Crawler – Free Pack** (tiles y props; **sin** usar sus personajes para no mezclar proporciones) | ✅ |
| Iconos (equipo, materiales, bombas, llaves, pociones) | **Pixel RPG Items – 300 Icons** (CC0) | ✅ |
| Monedas, gemas, corazones, cofres animados | Coins & Gems & Chests & More | ✅ (verificar licencia) |
| Efectos de tajo | Gold Mini RPG Pack | 🟡 (verificar licencia) |
| UI | HUD de Legacy Fantasy (High Forest) + marcos de 16x16 Fantasy Assets Pack | 🟡 |
| Referencia / respaldo | Legacy Fantasy (side-view, no se usa en el juego), 16x16 Fantasy Assets Pack | — |

Se probó la combinación Puny + tiles de Pixel Crawler ([scale_test.png](scale_test.png)): la escala y la paleta son compatibles.

### Mapeo enemigos MVP → Puny
| Arquetipo | Sprite sugerido |
|---|---|
| Slime | `Slime.png` |
| Estándar | Orc-Soldier o Human-Soldier (variantes de color) |
| Bruto | `Orc-Grunt.png` (posible versión escalada/recoloreada) |
| Jefe | ✅ Enemigo reescalado (ej. `Orc-Grunt` / `Orc-Soldier` de Puny o esqueleto/orco de Pixel Crawler escalado ×2 y recoloreado) |

### Puny: estructura de las hojas (verificada ✅)
768×256 px, celdas de 32×32 px, rejilla de **24 columnas × 8 filas**:
- **Filas (8 direcciones, antihorario desde abajo):** `R0` Sur (Down), `R1` SE, `R2` Este (Right), `R3` NE, `R4` Norte (Up), `R5` NO, `R6` Oeste (Left), `R7` SO.
- **Columnas (animaciones por fila):**
  - `0–1`: Idle (2 frames)
  - `2–3`: Walk / Run (2 frames; combinable `0–3` en ciclo de 4 frames)
  - `4–7`: Ataque con espada (4 frames: preparación `4–5`, tajo con destello `6`, recuperación `7`)
  - `8–11`: Ataque con arco (4 frames)
  - `12–15`: Ataque con bastón / magia (4 frames)
  - `16–18`: Acción / lanzamiento sin arma (3 frames)
  - `19–21`: Daño / Hit stun (`19` flash blanco, `20–21` retroceso/aturdido)
  - `22–23`: Muerte (2 frames)

### Hallazgos sobre assets
- Equipamiento visible en el personaje: las hojas de Puny traen el equipo dibujado (Warrior, Soldier, Archer, Mage); no es modular por capas. El nivel del equipo se verá sobre todo en el inventario (iconos) y, como mucho, en variantes de hoja por tramo.
- Faltan: esquiva y habilidad (hay que reutilizar frames de movimiento más efectos), jefe, biomas adicionales (el pack gratuito de Pixel Crawler tiene un único estilo de mazmorra), efectos de impacto y de explosión, UI completa.
- Packs de pago de Pixel Crawler (cuevas, cloacas, castillo, cripta) cubrirían más biomas; el *Complete Collection* ronda US$20 (dato a confirmar). No es necesario para el MVP.

### Licencias
| Pack | Licencia | Archivo en carpeta |
|---|---|---|
| Puny-Characters | CC0 (comercial, modificación y venta permitidas) | Texto aportado por el autor, **falta guardar en la carpeta** |
| Pixel RPG Items | CC0 | Sí |
| Pixel Crawler / Legacy Fantasy | Uso comercial y modificación permitidos; **no redistribuir ni revender los assets** | Sí |
| Coins & Gems, Gold Mini RPG, 16x16 Fantasy Assets | Sin verificar | No |

---

## 11. Requisitos técnicos (preliminares)

**Separación de responsabilidades** (cada sistema independiente): Player Controller, Player State Machine, Combat System, Enemy AI, Health System, Room Controller, Reward System, Expedition Manager.

**Datos configurables** (fuera de la lógica): estadísticas, enemigos, armas, oleadas, costes de mejora, tablas de recompensas y misiones. Agregar un enemigo debería requerir solo definir sus datos, animaciones y comportamiento.

Pendiente: motor, formato de guardado, simulación offline y estructura del proyecto. ❓

---

## 12. Criterios de aceptación del combate
- [ ] Movimiento en 8 direcciones sin diferencia de velocidad en diagonales.
- [ ] El personaje explora automáticamente sin enemigos; al entrar un enemigo en el área, se detiene.
- [ ] Las puertas se bloquean durante el encuentro.
- [ ] Selecciona al enemigo válido más cercano y ataca sin intervención.
- [ ] El jugador mueve y esquiva durante los ataques automáticos.
- [ ] La esquiva evita ataques dentro de su ventana de invulnerabilidad.
- [ ] Recibir daño activa el aturdimiento.
- [ ] Los enemigos tienen comportamientos y ataques diferenciados.
- [ ] Las oleadas se ejecutan en orden; al derrotar a todos se desbloquea la salida y se reanuda la exploración.
- [ ] El personaje no atraviesa paredes ni al moverse ni al esquivar.
- [ ] Las habilidades respetan su enfriamiento.
- [ ] La muerte reinicia la expedición y conserva las recompensas permanentes.

---

## 13. Decisiones abiertas

1. ✅ ~~**Motor de juego**~~ → **Godot 4 (GDScript)**.
2. ✅ ~~¿El idle produce solo oro en el MVP o también materiales?~~ → Solo oro al inicio; con el progreso puede dropear objetos de mayor calidad de forma limitada.
3. ✅ ~~Evolución del equipo: ¿hitos automáticos o con materiales de mazmorra?~~ → Con materiales de mazmorra.
4. ✅ ~~Jefe: ¿orco escalado, enemigo de otro pack o sprite propio?~~ → Enemigo reescalado de los packs disponibles.
5. ✅ ~~Cómo mostrar la mejora del equipo en el personaje~~ → Solo mediante iconos en la UI por ahora.
6. ✅ ~~Verificar columnas de animación de Puny y exportar los frames necesarios.~~ → Rejilla 24×8 verificada y documentada en la sección 10 (Godot lee directamente el spritesheet con `hframes = 24, vframes = 8`, sin necesidad de recortar archivos sueltos).
7. 🟡 Guardar las licencias de Puny, Coins & Gems, Gold Mini y 16x16 Fantasy Assets en sus carpetas.
8. 🟡 Cifras del balance (costes, daño, producción idle, límite offline).
9. 🟡 Comprar o no los packs de pago de Pixel Crawler para más biomas.

## 14. Próximos pasos sugeridos
1. Confirmar las decisiones abiertas 2, 3 y 4.
2. Elegir el motor.
3. Verificar y recortar los frames de Puny; armar un prototipo: personaje que se mueve, ataca automáticamente a un slime y esquiva, en una sala con tiles de Pixel Crawler.
4. Implementar un bucle mínimo: una sala con oleadas → recompensa de oro → mejora de la espada.
