extends Node
## Autoload que gestiona:
## - Progresión permanente y las 5 categorías de equipamiento (EQP-01..10).
## - Materiales de crafteo (Hierro, Madera, Cuero, Esencia) con desbloqueo progresivo.
## - Sistema de las 5 Misiones e Hitos Iniciales (GDD sección 3.2).
## - Las 8 mejoras temporales roguelite (GDD 6.3) y pickups de expedición (Llaves/Bombas).
## - Generador Idle del campamento, cálculo offline y guardado local.

signal currencies_changed(gold: int, iron: int)
signal materials_changed()
signal quests_changed()
signal quest_completed(quest_index: int, title: String, unlock_desc: String)
signal run_pickups_changed(keys: int, bombs: int)
signal temp_buffs_changed()
signal equipment_changed()
signal appearance_changed(tex: Texture2D)
signal idle_tick_applied(gold_amount: int, iron_amount: int)
signal offline_reward_claimed(gold_earned: int, seconds_away: int)

const SAVE_PATH := "user://savegame.json"
const MAX_OFFLINE_SECONDS := 8 * 3600 # 8 horas (GDD sección 8)
const EVOLUTION_INTERVAL := 5 # Cada 5 niveles pide evolucionar con materiales de mazmorra

const TIER_NAMES := ["Madera", "Hierro", "Acero", "Oro", "Cristal"]

# Las 5 primeras misiones del GDD (seccion 3.2) que desbloquean materiales, crafteo y evoluciones
const QUEST_CATALOG: Array[Dictionary] = [
	{
		"id": "q1_first_room",
		"title": "1. Primera expedición",
		"objective": "Completa 1 sala",
		"unlock_text": "Desbloquea Hierro y Madera en rocas y cofres",
		"reward_gold": 25,
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Scrolls_Books/QuestNotice.png"
	},
	{
		"id": "q2_iron_scraps",
		"title": "2. Restos de hierro",
		"objective": "Consigue 2 de Hierro",
		"unlock_text": "Enemigos sueltan Hierro y Madera",
		"reward_gold": 35,
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Materials/IronOre.png"
	},
	{
		"id": "q3_basic_tools",
		"title": "3. Herramientas básicas",
		"objective": "Reúne 3 Hierro y 2 Madera",
		"unlock_text": "Habilita Forja y Evolución de Espada",
		"reward_gold": 50,
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Tools/Anvil.png"
	},
	{
		"id": "q4_beast_leather",
		"title": "4. Cuero de bestia",
		"objective": "Derrota 6 enemigos",
		"unlock_text": "Habilita Cuero, Armadura, Guantes y Botas",
		"reward_gold": 65,
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Materials/Leather.png"
	},
	{
		"id": "q5_ancient_core",
		"title": "5. El núcleo antiguo",
		"objective": "Derrota al Jefe (Sala 4)",
		"unlock_text": "Habilita Esencias, Amuleto y Tiers Acero+",
		"reward_gold": 120,
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Treasure/Ruby.png"
	}
]

# Catalogo de 8 mejoras temporales (GDD secciones 6.3 y 9)
const TEMP_BUFF_CATALOG: Array[Dictionary] = [
	{
		"id": "sharp_edge",
		"name": "Filo Afilado",
		"desc": "+20% daño de ataque",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Swords/Broadsword.png"
	},
	{
		"id": "light_boots",
		"name": "Botas Ligeras",
		"desc": "+15% velocidad al moverse",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/SpeedBoots.png"
	},
	{
		"id": "ancient_heart",
		"name": "Corazón Antiguo",
		"desc": "+25% vida máx. y cura +25 HP",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/HeartLocket.png"
	},
	{
		"id": "war_gloves",
		"name": "Guantes de Guerra",
		"desc": "+20% velocidad de ataque",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/GoldenGauntlets.png"
	},
	{
		"id": "cursed_coin",
		"name": "Moneda Maldita",
		"desc": "+35% oro, -10% defensa",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/SkullRing.png"
	},
	{
		"id": "arcane_scroll",
		"name": "Pergamino Arcano",
		"desc": "+40% daño en Explosión (Q) y -25% CD",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Scrolls_Books/FireScroll.png"
	},
	{
		"id": "vampiric_fang",
		"name": "Colmillo Vampírico",
		"desc": "Cura +4 HP al derrotar enemigos",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Materials/Fang.png"
	},
	{
		"id": "prospectors_charm",
		"name": "Talismán Minero",
		"desc": "+25% drop de Hierro, Llaves y Bombas",
		"icon": "res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Tools/GoldPickaxe.png"
	}
]

# Moneda y Materiales permanentes (GDD sección 3.1)
var gold: int = 25
var iron_ore: int = 0
var wood: int = 0
var leather: int = 0
var essence: int = 0

var max_unlocked_depth: int = 1
var selected_depth: int = 1

# Estado de progreso de las 5 misiones (0 = primera misión activa, 5 = todas completadas)
var current_quest_index: int = 0
var stats_rooms_cleared: int = 0
var stats_iron_collected: int = 0
var stats_wood_collected: int = 0
var stats_enemies_killed: int = 0
var stats_bosses_killed: int = 0

# Pickups y mejoras temporales de la expedición actual
var run_keys: int = 1
var run_bombs: int = 1
var active_temp_buffs: Dictionary = {}

# Generador pasivo del Campamento Idle (GDD sección 3 y 8)
var idle_generator_level: int = 1
var base_idle_gold_per_min: float = 15.0
var _idle_accumulator: float = 0.0
var _idle_tick_count: int = 0

# 5 categorías independientes (GDD sección 7)
var equipment: Dictionary = {}

# ---------------- ARMARIO Y DESESTRUCTURACION POR CAPAS DE SPRITES PUNY ----------------
const ARCHETYPE_CATALOG: Array[Dictionary] = [
	{"id": "warrior", "name": "GUERRERO", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Warrior-Red.png"},
	{"id": "adventurer", "name": "AVENTURERO", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Human-Worker-Red.png"},
	{"id": "knight", "name": "CABALLERO", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Human-Soldier-Red.png"},
	{"id": "soldier", "name": "SOLDADO", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Soldier-Red.png"},
	{"id": "archer", "name": "ARQUERO", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Archer-Green.png"},
	{"id": "mage", "name": "MAGO", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Mage-Red.png"},
	{"id": "orc_warrior", "name": "ORCO GUERRERO", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Orc-Soldier-Red.png"},
	{"id": "orc_peon", "name": "ORCO EXPLORADOR", "path": "res://assets/sprites/Puny-Characters/Puny-Characters/Orc-Peon-Red.png"}
]

const SKIN_PALETTES: Array[Dictionary] = [
	{"name": "ORIGINAL", "ramp": []},
	{"name": "HUMANO CLARO", "ramp": ["fae7b5", "f7d099", "f6a954", "d97f40", "aa5a33", "84482a"]},
	{"name": "BRONCEADO", "ramp": ["f2c98a", "e0a863", "c6823f", "9e5c25", "784118", "542b0e"]},
	{"name": "EBANO", "ramp": ["b88662", "966442", "75492b", "57331c", "3d2211", "29150a"]},
	{"name": "ORCO VERDE", "ramp": ["e2e739", "a7cb35", "5ba60b", "347322", "214614", "142b09"]},
	{"name": "ELFO LUNAR", "ramp": ["f4f6ff", "dce2fc", "b8c4f0", "8fa0d6", "6778b0", "455382"]},
	{"name": "DEMONIO CARMESI", "ramp": ["ffb3a3", "f27463", "d63e34", "a32222", "731319", "4a0a10"]},
	{"name": "NO-MUERTO CENIZA", "ramp": ["d9e6e0", "b3c7be", "87a196", "60786e", "41544c", "293631"]}
]

const HAIR_PALETTES: Array[Dictionary] = [
	{"name": "ORIGINAL", "ramp": []},
	{"name": "ACERO REAL", "ramp": ["e0ded8", "bebbb5", "a29e96", "7d7b76", "4d4c4b", "363636", "1e1e1e"]},
	{"name": "RUBIO DORADO", "ramp": ["fff3a1", "f7d859", "deb028", "b58414", "875c0b", "5c3b05", "382202"]},
	{"name": "PELIRROJO FUEGO", "ramp": ["ffb085", "f27844", "d14b1f", "9e2f11", "701d09", "4a1105", "2e0902"]},
	{"name": "PLATA BLANCO", "ramp": ["ffffff", "e8eef5", "c5d1de", "98a7b8", "6d7b8c", "495463", "2b323b"]},
	{"name": "CASTANO", "ramp": ["b5724a", "8c4d2b", "754227", "51301e", "3b2316", "2f1e16", "201710"]},
	{"name": "AZUL COBALTO", "ramp": ["99d6ff", "5caef2", "2e81cf", "1b599e", "103b70", "092447", "041329"]},
	{"name": "VIOLETA ARCANO", "ramp": ["e5b8ff", "c27ef2", "964bd1", "6c2ba3", "491875", "2e0d4d", "1a062e"]}
]

const CLOTH_PALETTES: Array[Dictionary] = [
	{"name": "ORIGINAL", "ramp": []},
	{"name": "CARMESI REAL", "ramp": ["ff3b3b", "d80000", "b60000", "770000", "46000a"]},
	{"name": "CIAN TURQUESA", "ramp": ["2ee6cf", "00b49d", "007966", "004f43", "002e27"]},
	{"name": "VERDE BOSQUE", "ramp": ["a8bd1e", "8b9e0f", "627105", "455000", "303600"]},
	{"name": "ORO IMPERIAL", "ramp": ["ffe14d", "dec018", "b58e00", "7c5500", "422200"]},
	{"name": "PURPURA MISTICO", "ramp": ["e85ce3", "cc2ac7", "78277b", "4c1751", "2d0931"]},
	{"name": "AZUL NOCHE", "ramp": ["63a4ff", "2b72e6", "174cb3", "0d2f78", "061945"]},
	{"name": "SOMBRA OBSIDIANA", "ramp": ["737882", "525661", "373a42", "22242b", "121317"]},
	{"name": "BLANCO PALADIN", "ramp": ["ffffff", "e6ebf2", "bcc6d4", "8894a6", "556070"]}
]

const EYE_PALETTES: Array[Dictionary] = [
	{"name": "ONIX CLASICO", "pupil": "040404"},
	{"name": "AZUL CIELO", "pupil": "1982ff"},
	{"name": "ESMERALDA", "pupil": "14cc4e"},
	{"name": "ROJO RUBI", "pupil": "ff1f2d"},
	{"name": "AMBAR DORADO", "pupil": "ffaa00"},
	{"name": "VIOLETA", "pupil": "b833ff"},
	{"name": "BRILLO CIAN", "pupil": "00f0ff"}
]

var appearance: Dictionary = {
	"archetype_idx": 0,
	"skin_idx": 0,
	"hair_idx": 0,
	"cloth_idx": 0,
	"eye_idx": 0
}
var custom_player_texture: Texture2D = null


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_input_map()
	_reset_equipment_dictionary()
	load_game()
	rebuild_player_appearance_texture()


func _reset_equipment_dictionary() -> void:
	equipment = {
		"sword": {
			"name": "Espada",
			"stat_label": "Daño",
			"level": 1,
			"tier": 0,
			"base_cost": 10,
			"cost_mult": 1.35,
			"base_bonus": 5.0,
			"per_level": 3.0,
			"icons": [
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Swords/WoodenSword.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Swords/IronSword.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Swords/SteelLongsword.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Swords/GoldenSword.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Swords/CrystalSword.png",
			]
		},
		"gloves": {
			"name": "Guantes",
			"stat_label": "Vel. Ataque",
			"level": 1,
			"tier": 0,
			"base_cost": 12,
			"cost_mult": 1.38,
			"base_bonus": 0.0,
			"per_level": 0.08,
			"icons": [
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/LeatherGloves.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/IronGauntlets.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/IronGauntlets.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/GoldenGauntlets.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/MageGloves.png",
			]
		},
		"boots": {
			"name": "Botas",
			"stat_label": "Velocidad",
			"level": 1,
			"tier": 0,
			"base_cost": 12,
			"cost_mult": 1.35,
			"base_bonus": 0.0,
			"per_level": 4.0,
			"icons": [
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/LeatherBoots.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/IronBoots.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/IronBoots.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/GoldenBoots.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/WingedBoots.png",
			]
		},
		"armor": {
			"name": "Armadura",
			"stat_label": "Vida / Def.",
			"level": 1,
			"tier": 0,
			"base_cost": 15,
			"cost_mult": 1.36,
			"base_bonus": 0.0,
			"per_level": 12.0,
			"icons": [
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/ClothShirt.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/LeatherArmor.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/IronArmor.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/GoldenArmor.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/CrystalArmor.png",
			]
		},
		"amulet": {
			"name": "Amuleto",
			"stat_label": "+% Oro",
			"level": 1,
			"tier": 0,
			"base_cost": 18,
			"cost_mult": 1.42,
			"base_bonus": 0.0,
			"per_level": 0.12,
			"icons": [
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/ToothNecklace.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/EmeraldAmulet.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/SapphireAmulet.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/RubyAmulet.png",
				"res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/EyeAmulet.png",
			]
		}
	}


func _process(delta: float) -> void:
	if get_tree().paused:
		return
	var gold_per_sec := get_idle_gold_per_second()
	_idle_accumulator += gold_per_sec * delta
	if _idle_accumulator >= 1.0:
		var gained := int(floor(_idle_accumulator))
		_idle_accumulator -= float(gained)
		_idle_tick_count += 1
		add_gold(gained, false)

		var iron_gained := 0
		if idle_generator_level >= 5 and is_iron_drop_unlocked() and (_idle_tick_count % 4 == 0) and randf() < 0.06:
			iron_gained = 1
			add_iron(1)

		idle_tick_applied.emit(gained, iron_gained)


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()


func _setup_input_map() -> void:
	var bindings := {
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		"move_up": [KEY_W, KEY_UP],
		"move_down": [KEY_S, KEY_DOWN],
		"dodge": [KEY_SPACE],
		"ability": [KEY_Q],
		"interact": [KEY_E],
		"quests_log": [KEY_M],
		"wardrobe_toggle": [KEY_C],
		"map_toggle": [KEY_TAB],
		"pause_menu": [KEY_ESCAPE],
	}
	for action in bindings.keys():
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for keycode in bindings[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = keycode
			if not InputMap.action_has_event(action, ev):
				InputMap.action_add_event(action, ev)

	if not InputMap.has_action("attack_primary"):
		InputMap.add_action("attack_primary")
	var mouse_ev := InputEventMouseButton.new()
	mouse_ev.button_index = MOUSE_BUTTON_LEFT
	if not InputMap.action_has_event("attack_primary", mouse_ev):
		InputMap.action_add_event("attack_primary", mouse_ev)


# ---------------- GENERADOR DE TEXTURA POR CAPAS (OJOS, PELO/CASCO, ROPA, PIEL, ESPECIE) ----------------

func rebuild_player_appearance_texture() -> Texture2D:
	var a_idx := clampi(int(appearance.get("archetype_idx", 0)), 0, ARCHETYPE_CATALOG.size() - 1)
	var s_idx := clampi(int(appearance.get("skin_idx", 0)), 0, SKIN_PALETTES.size() - 1)
	var h_idx := clampi(int(appearance.get("hair_idx", 0)), 0, HAIR_PALETTES.size() - 1)
	var c_idx := clampi(int(appearance.get("cloth_idx", 0)), 0, CLOTH_PALETTES.size() - 1)
	var e_idx := clampi(int(appearance.get("eye_idx", 0)), 0, EYE_PALETTES.size() - 1)

	var base_tex: Texture2D = load(String(ARCHETYPE_CATALOG[a_idx]["path"]))
	if s_idx == 0 and h_idx == 0 and c_idx == 0 and e_idx == 0:
		custom_player_texture = base_tex
		appearance_changed.emit(custom_player_texture)
		return custom_player_texture

	var img := base_tex.get_image().duplicate() as Image
	var color_map: Dictionary = {}

	# 1. Capa de Especie / Piel (mapea tanto piel humana como piel de orco de los sheets Puny)
	if s_idx > 0:
		var s_ramp: Array = SKIN_PALETTES[s_idx]["ramp"]
		var src_skin_groups := [
			["fae7b5", "e2e739"],
			["f7d099", "a7cb35"],
			["f6a954", "e5b25e", "5ba60b"],
			["d97f40", "347322"],
			["aa5a33", "214614"],
			["84482a", "1c3012", "142b09"]
		]
		for g_i in range(src_skin_groups.size()):
			var target_col := Color.html(String(s_ramp[g_i]))
			for hex_key in src_skin_groups[g_i]:
				color_map[hex_key] = target_col

	# 2. Capa de Pelo / Casco / Capucha / Armadura secundaria
	if h_idx > 0:
		var h_ramp: Array = HAIR_PALETTES[h_idx]["ramp"]
		var src_hair_groups := [
			["d4cfc4"],
			["bebbb5", "bfb7a6", "c8c1b3", "8c4d2b"],
			["a29e96", "a8a59d", "754227"],
			["7d7b76", "6e6c68", "51301e"],
			["4d4c4b", "686662"],
			["363636", "2f1e16"],
			["1e1e1e", "201710"]
		]
		for g_i in range(src_hair_groups.size()):
			var target_col := Color.html(String(h_ramp[g_i]))
			for hex_key in src_hair_groups[g_i]:
				color_map[hex_key] = target_col

	# 3. Capa de Ropa / Tunica / Penacho
	if c_idx > 0:
		var c_ramp: Array = CLOTH_PALETTES[c_idx]["ramp"]
		var src_cloth_groups := [
			["ff1515", "ff2d2d", "8b9e0f", "cc2ac7", "00b49d"],
			["d80000", "b60000", "ae0000", "627105", "c6a900", "78277b", "007966", "007d89"],
			["770000", "455000", "7c5500", "4c1751", "004f43", "005355"],
			["520c0c", "46000a", "303600", "422200", "2d0931", "004b3f", "00332f"],
			["290505", "002e27"]
		]
		for g_i in range(src_cloth_groups.size()):
			var target_col := Color.html(String(c_ramp[g_i]))
			for hex_key in src_cloth_groups[g_i]:
				color_map[hex_key] = target_col

	var w := img.get_width()
	var h := img.get_height()
	var eye_col := Color.html(String(EYE_PALETTES[e_idx]["pupil"]))
	var sclera_coords: Array[Vector2i] = []

	for y in range(h):
		for x in range(w):
			var px := img.get_pixel(x, y)
			if px.a < 0.5:
				continue
			var hx := px.to_html(false)
			if e_idx > 0 and hx == "e8e8e8":
				sclera_coords.append(Vector2i(x, y))
			if color_map.has(hx):
				img.set_pixel(x, y, color_map[hx])

	# 4. Capa de Color de Ojos: recolorea el pixel de pupila/iris adyacente a cada esclerotica (#e8e8e8)
	if e_idx > 0:
		for sc: Vector2i in sclera_coords:
			var cell_y: int = sc.y % 32
			if cell_y >= 12 and cell_y <= 18:
				for dx: int in [-1, 1]:
					var nx: int = sc.x + dx
					if nx >= 0 and nx < w:
						var npx := img.get_pixel(nx, sc.y)
						if npx.a > 0.5 and npx.to_html(false) in ["040404", "000000"]:
							img.set_pixel(nx, sc.y, eye_col)

	custom_player_texture = ImageTexture.create_from_image(img)
	appearance_changed.emit(custom_player_texture)
	return custom_player_texture


func _normalize_appearance_key(key: String) -> String:
	match key:
		"archetype", "archetype_idx":
			return "archetype_idx"
		"skin", "skin_idx":
			return "skin_idx"
		"hair", "hair_idx":
			return "hair_idx"
		"cloth", "cloth_idx":
			return "cloth_idx"
		"eyes", "eye", "eye_idx":
			return "eye_idx"
	return key


func get_appearance_label(key: String) -> String:
	var nkey := _normalize_appearance_key(key)
	match nkey:
		"archetype_idx":
			var idx := clampi(int(appearance.get("archetype_idx", 0)), 0, ARCHETYPE_CATALOG.size() - 1)
			return String(ARCHETYPE_CATALOG[idx]["name"])
		"skin_idx":
			var idx := clampi(int(appearance.get("skin_idx", 0)), 0, SKIN_PALETTES.size() - 1)
			return String(SKIN_PALETTES[idx]["name"])
		"hair_idx":
			var idx := clampi(int(appearance.get("hair_idx", 0)), 0, HAIR_PALETTES.size() - 1)
			return String(HAIR_PALETTES[idx]["name"])
		"cloth_idx":
			var idx := clampi(int(appearance.get("cloth_idx", 0)), 0, CLOTH_PALETTES.size() - 1)
			return String(CLOTH_PALETTES[idx]["name"])
		"eye_idx":
			var idx := clampi(int(appearance.get("eye_idx", 0)), 0, EYE_PALETTES.size() - 1)
			return String(EYE_PALETTES[idx]["name"])
	return ""


func cycle_appearance_option(key: String, step: int) -> void:
	var nkey := _normalize_appearance_key(key)
	var max_len := 1
	match nkey:
		"archetype_idx":
			max_len = ARCHETYPE_CATALOG.size()
		"skin_idx":
			max_len = SKIN_PALETTES.size()
		"hair_idx":
			max_len = HAIR_PALETTES.size()
		"cloth_idx":
			max_len = CLOTH_PALETTES.size()
		"eye_idx":
			max_len = EYE_PALETTES.size()
	var cur := int(appearance.get(nkey, 0))
	appearance[nkey] = posmod(cur + step, max_len)
	rebuild_player_appearance_texture()
	save_game()


func randomize_appearance() -> void:
	appearance["archetype_idx"] = randi() % ARCHETYPE_CATALOG.size()
	appearance["skin_idx"] = randi() % SKIN_PALETTES.size()
	appearance["hair_idx"] = randi() % HAIR_PALETTES.size()
	appearance["cloth_idx"] = randi() % CLOTH_PALETTES.size()
	appearance["eye_idx"] = randi() % EYE_PALETTES.size()
	rebuild_player_appearance_texture()
	save_game()


# ---------------- SISTEMA DE MISIONES E HITOS DE DESBLOQUEO (GDD 3.2) ----------------

## Misión 1 completada (idx >= 1): aparece Hierro y Madera en rocas agrietadas y cofres.
func is_iron_drop_unlocked() -> bool:
	return current_quest_index >= 1


## Misión 2 completada (idx >= 2): los enemigos pueden soltar Hierro y Madera.
func is_enemy_material_drop_unlocked() -> bool:
	return current_quest_index >= 2


## Misión 3 completada (idx >= 3): desbloquea el sistema de evolución/forja (Espada).
func is_weapon_crafting_unlocked() -> bool:
	return current_quest_index >= 3


## Misión 4 completada (idx >= 4): desbloquea el drop de Cuero y la evolución de Armadura/Guantes/Botas.
func is_leather_and_armor_crafting_unlocked() -> bool:
	return current_quest_index >= 4


## Misión 5 completada (idx >= 5): desbloquea Esencias, evolución de Amuleto y Tiers Acero/Oro/Cristal.
func is_essence_and_high_tier_unlocked() -> bool:
	return current_quest_index >= 5


func is_slot_evolution_unlocked(slot: String, current_tier: int) -> bool:
	# Evolucionar a Acero/Oro/Cristal (tier >= 1) requiere haber completado la Misión 5
	if current_tier >= 1 and not is_essence_and_high_tier_unlocked():
		return false
	match slot:
		"sword":
			return is_weapon_crafting_unlocked()
		"armor", "gloves", "boots":
			return is_leather_and_armor_crafting_unlocked()
		"amulet":
			return is_essence_and_high_tier_unlocked()
	return false


func get_slot_evolution_lock_reason(slot: String, current_tier: int) -> String:
	if current_tier >= 1 and not is_essence_and_high_tier_unlocked():
		return "FALTA M.5"
	match slot:
		"sword":
			if not is_weapon_crafting_unlocked():
				return "FALTA M.3"
		"armor", "gloves", "boots":
			if not is_leather_and_armor_crafting_unlocked():
				return "FALTA M.4"
		"amulet":
			if not is_essence_and_high_tier_unlocked():
				return "FALTA M.5"
	return ""


func get_quest_progress_text(q_idx: int) -> String:
	if q_idx < current_quest_index:
		return "LISTA"
	match q_idx:
		0:
			return "%d/1 salas" % mini(1, stats_rooms_cleared)
		1:
			return "%d/2 Fe" % mini(2, stats_iron_collected)
		2:
			return "%d/3 Fe, %d/2 Mad" % [mini(3, iron_ore), mini(2, wood)]
		3:
			return "%d/6 enemigos" % mini(6, stats_enemies_killed)
		4:
			return "%d/1 Jefe" % mini(1, stats_bosses_killed)
	return ""


func is_current_quest_ready() -> bool:
	match current_quest_index:
		0:
			return stats_rooms_cleared >= 1
		1:
			return stats_iron_collected >= 2
		2:
			return iron_ore >= 3 and wood >= 2
		3:
			return stats_enemies_killed >= 6
		4:
			return stats_bosses_killed >= 1
	return false


func check_and_advance_quests() -> void:
	while current_quest_index < QUEST_CATALOG.size() and is_current_quest_ready():
		var completed_idx := current_quest_index
		var q_data: Dictionary = QUEST_CATALOG[completed_idx]
		current_quest_index += 1

		# Entrega recompensas iniciales de desbloqueo para que el jugador sienta el hito al instante
		var r_gold := int(q_data.get("reward_gold", 25))
		gold += r_gold
		match completed_idx:
			0:
				# Al completar Misión 1 recibe su primera muestra de Hierro
				iron_ore += 1
				stats_iron_collected += 1
			1:
				# Al completar Misión 2 recibe 1 Madera inicial
				wood += 1
				stats_wood_collected += 1
			3:
				# Al completar Misión 4 recibe 2 de Cuero
				leather += 2
			4:
				# Al completar Misión 5 recibe 1 Esencia Antigua
				essence += 1

		currencies_changed.emit(gold, iron_ore)
		materials_changed.emit()
		quests_changed.emit()
		equipment_changed.emit()
		quest_completed.emit(completed_idx, String(q_data["title"]), String(q_data["unlock_text"]))
		save_game()


func record_room_cleared() -> void:
	stats_rooms_cleared += 1
	quests_changed.emit()
	check_and_advance_quests()


func record_enemy_killed(was_boss: bool) -> void:
	stats_enemies_killed += 1
	if was_boss:
		stats_bosses_killed += 1
	quests_changed.emit()
	check_and_advance_quests()


# ---------------- MEJORAS TEMPORALES Y PICKUPS DE EXPEDICIÓN ----------------

func reset_expedition_temp_state() -> void:
	active_temp_buffs.clear()
	run_keys = 1
	run_bombs = 1
	run_pickups_changed.emit(run_keys, run_bombs)
	temp_buffs_changed.emit()
	equipment_changed.emit()


func get_temp_buff_stacks(buff_id: String) -> int:
	return int(active_temp_buffs.get(buff_id, 0))


func add_temp_buff(buff_id: String) -> void:
	active_temp_buffs[buff_id] = get_temp_buff_stacks(buff_id) + 1
	temp_buffs_changed.emit()
	equipment_changed.emit()


func pick_random_temp_buff_choices(count: int = 3) -> Array[Dictionary]:
	var pool: Array[Dictionary] = TEMP_BUFF_CATALOG.duplicate()
	pool.shuffle()
	return pool.slice(0, mini(count, pool.size()))


func add_run_key(amount: int = 1) -> void:
	run_keys = maxi(0, run_keys + amount)
	run_pickups_changed.emit(run_keys, run_bombs)


func use_run_key() -> bool:
	if run_keys <= 0:
		return false
	run_keys -= 1
	run_pickups_changed.emit(run_keys, run_bombs)
	return true


func add_run_bomb(amount: int = 1) -> void:
	run_bombs = maxi(0, run_bombs + amount)
	run_pickups_changed.emit(run_keys, run_bombs)


func use_run_bomb() -> bool:
	if run_bombs <= 0:
		return false
	run_bombs -= 1
	run_pickups_changed.emit(run_keys, run_bombs)
	return true


func get_bonus_drop_chance() -> float:
	return float(get_temp_buff_stacks("prospectors_charm")) * 0.25


func get_vampiric_heal_on_kill() -> float:
	return float(get_temp_buff_stacks("vampiric_fang")) * 4.0


func get_ability_damage_multiplier() -> float:
	return 1.85 * (1.0 + float(get_temp_buff_stacks("arcane_scroll")) * 0.40)


func get_ability_cooldown_multiplier() -> float:
	return pow(0.75, float(get_temp_buff_stacks("arcane_scroll")))


# ---------------- ESTADÍSTICAS Y EVOLUCIÓN POR MATERIALES (GDD 7) ----------------

func get_idle_gold_per_second() -> float:
	var gen_mult := 1.0 + float(idle_generator_level - 1) * 0.45
	return (base_idle_gold_per_min / 60.0) * gen_mult * get_gold_multiplier(false)


func get_idle_generator_upgrade_cost() -> int:
	return int(round(20.0 * pow(1.48, idle_generator_level - 1)))


func try_upgrade_idle_generator() -> bool:
	var cost := get_idle_generator_upgrade_cost()
	if gold < cost:
		return false
	gold -= cost
	idle_generator_level += 1
	currencies_changed.emit(gold, iron_ore)
	equipment_changed.emit()
	save_game()
	return true


func unlock_depth(new_depth: int) -> void:
	if new_depth > max_unlocked_depth:
		max_unlocked_depth = new_depth
		selected_depth = max_unlocked_depth
		save_game()


func get_gold_multiplier(include_temp: bool = true) -> float:
	var amu: Dictionary = equipment["amulet"]
	var tier_mult := 1.0 + float(amu["tier"]) * 0.20
	var base := (1.0 + float(amu["level"] - 1) * float(amu["per_level"])) * tier_mult
	if include_temp:
		base *= (1.0 + float(get_temp_buff_stacks("cursed_coin")) * 0.35)
	return base


func get_player_damage() -> float:
	var sw: Dictionary = equipment["sword"]
	var tier_mult := 1.0 + float(sw["tier"]) * 0.25
	var base := (10.0 + float(sw["base_bonus"]) + float(sw["level"] - 1) * float(sw["per_level"])) * tier_mult
	return base * (1.0 + float(get_temp_buff_stacks("sharp_edge")) * 0.20)


func get_attacks_per_second() -> float:
	var gl: Dictionary = equipment["gloves"]
	var tier_bonus := float(gl["tier"]) * 0.15
	var base := 1.2 + float(gl["level"] - 1) * float(gl["per_level"]) + tier_bonus
	return base * (1.0 + float(get_temp_buff_stacks("war_gloves")) * 0.20)


func get_move_speed() -> float:
	var bt: Dictionary = equipment["boots"]
	var tier_bonus := float(bt["tier"]) * 8.0
	var base := 68.0 + float(bt["level"] - 1) * float(bt["per_level"]) + tier_bonus
	return base * (1.0 + float(get_temp_buff_stacks("light_boots")) * 0.15)


func get_max_hp() -> float:
	var ar: Dictionary = equipment["armor"]
	var tier_bonus := float(ar["tier"]) * 25.0
	var base := 100.0 + float(ar["level"] - 1) * float(ar["per_level"]) + tier_bonus
	return base * (1.0 + float(get_temp_buff_stacks("ancient_heart")) * 0.25)


func get_defense() -> float:
	var ar: Dictionary = equipment["armor"]
	var base := float(ar["level"] - 1) * 0.5 + float(ar["tier"]) * 2.0
	var cursed_penalty := 1.0 - minf(0.5, float(get_temp_buff_stacks("cursed_coin")) * 0.10)
	return base * cursed_penalty


func needs_evolution(slot: String) -> bool:
	var item: Dictionary = equipment[slot]
	var max_level_for_tier := (int(item["tier"]) + 1) * EVOLUTION_INTERVAL
	return int(item["level"]) >= max_level_for_tier and int(item["tier"]) < TIER_NAMES.size() - 1


func get_upgrade_cost(slot: String) -> int:
	var item: Dictionary = equipment[slot]
	return int(round(float(item["base_cost"]) * pow(float(item["cost_mult"]), int(item["level"]) - 1)))


## Requisitos de materiales por pieza (GDD sección 7 / tabla de materiales):
## - Espada: Hierro + Madera
## - Armadura: Hierro
## - Guantes / Botas: Cuero
## - Amuleto: Esencia Antigua
func get_evolution_recipe(slot: String) -> Dictionary:
	var item: Dictionary = equipment[slot]
	var mult := int(item["tier"]) + 1
	match slot:
		"sword":
			return {"iron": 2 * mult, "wood": 1 * mult}
		"armor":
			return {"iron": 3 * mult}
		"gloves", "boots":
			return {"leather": 2 * mult}
		"amulet":
			return {"essence": 1 * mult}
	return {"iron": 2 * mult}


func get_evolution_recipe_short_text(slot: String) -> String:
	var rec := get_evolution_recipe(slot)
	var parts: Array[String] = []
	if rec.has("iron"):
		parts.append("%dFE" % int(rec["iron"]))
	if rec.has("wood"):
		parts.append("%dMAD" % int(rec["wood"]))
	if rec.has("leather"):
		parts.append("%dCUE" % int(rec["leather"]))
	if rec.has("essence"):
		parts.append("%dESE" % int(rec["essence"]))
	return " ".join(parts)


func can_afford_evolution_materials(slot: String) -> bool:
	var rec := get_evolution_recipe(slot)
	if iron_ore < int(rec.get("iron", 0)):
		return false
	if wood < int(rec.get("wood", 0)):
		return false
	if leather < int(rec.get("leather", 0)):
		return false
	if essence < int(rec.get("essence", 0)):
		return false
	return true


func get_slot_icon_path(slot: String) -> String:
	var item: Dictionary = equipment[slot]
	var icons: Array = item["icons"]
	var idx := clampi(int(item["tier"]), 0, icons.size() - 1)
	return String(icons[idx])


func get_slot_display_name(slot: String) -> String:
	var item: Dictionary = equipment[slot]
	var tier_idx := clampi(int(item["tier"]), 0, TIER_NAMES.size() - 1)
	return "%s de %s" % [item["name"], TIER_NAMES[tier_idx]]


func try_upgrade_or_evolve(slot: String) -> bool:
	if not equipment.has(slot):
		return false
	var item: Dictionary = equipment[slot]
	if needs_evolution(slot):
		var cur_tier := int(item["tier"])
		if not is_slot_evolution_unlocked(slot, cur_tier):
			return false
		var gold_cost := get_upgrade_cost(slot)
		if gold < gold_cost or not can_afford_evolution_materials(slot):
			return false
		var rec := get_evolution_recipe(slot)
		gold -= gold_cost
		iron_ore -= int(rec.get("iron", 0))
		wood -= int(rec.get("wood", 0))
		leather -= int(rec.get("leather", 0))
		essence -= int(rec.get("essence", 0))
		item["tier"] = cur_tier + 1
		item["level"] = int(item["level"]) + 1
	else:
		var cost := get_upgrade_cost(slot)
		if gold < cost:
			return false
		gold -= cost
		item["level"] = int(item["level"]) + 1
	currencies_changed.emit(gold, iron_ore)
	materials_changed.emit()
	equipment_changed.emit()
	save_game()
	return true


func add_gold(amount: int, apply_amulet_bonus: bool = true) -> int:
	var final_amount := amount
	if apply_amulet_bonus:
		final_amount = int(round(float(amount) * get_gold_multiplier(true)))
	gold += final_amount
	currencies_changed.emit(gold, iron_ore)
	return final_amount


func add_iron(amount: int) -> void:
	iron_ore += amount
	stats_iron_collected += amount
	currencies_changed.emit(gold, iron_ore)
	materials_changed.emit()
	quests_changed.emit()
	check_and_advance_quests()
	save_game()


func add_wood(amount: int) -> void:
	wood += amount
	stats_wood_collected += amount
	materials_changed.emit()
	quests_changed.emit()
	check_and_advance_quests()
	save_game()


func add_leather(amount: int) -> void:
	leather += amount
	materials_changed.emit()
	save_game()


func add_essence(amount: int) -> void:
	essence += amount
	materials_changed.emit()
	save_game()


func reset_save_data() -> void:
	gold = 25
	iron_ore = 0
	wood = 0
	leather = 0
	essence = 0
	max_unlocked_depth = 1
	selected_depth = 1
	idle_generator_level = 1
	current_quest_index = 0
	stats_rooms_cleared = 0
	stats_iron_collected = 0
	stats_wood_collected = 0
	stats_enemies_killed = 0
	stats_bosses_killed = 0
	_idle_accumulator = 0.0
	_reset_equipment_dictionary()
	reset_expedition_temp_state()
	save_game()
	currencies_changed.emit(gold, iron_ore)
	materials_changed.emit()
	quests_changed.emit()
	equipment_changed.emit()


func save_game() -> void:
	var eq_save := {}
	for k in equipment.keys():
		eq_save[k] = {
			"level": equipment[k]["level"],
			"tier": equipment[k]["tier"]
		}
	var data := {
		"gold": gold,
		"iron_ore": iron_ore,
		"wood": wood,
		"leather": leather,
		"essence": essence,
		"max_unlocked_depth": max_unlocked_depth,
		"selected_depth": selected_depth,
		"idle_generator_level": idle_generator_level,
		"current_quest_index": current_quest_index,
		"stats_rooms_cleared": stats_rooms_cleared,
		"stats_iron_collected": stats_iron_collected,
		"stats_wood_collected": stats_wood_collected,
		"stats_enemies_killed": stats_enemies_killed,
		"stats_bosses_killed": stats_bosses_killed,
		"equipment": eq_save,
		"appearance": appearance,
		"timestamp": int(Time.get_unix_time_from_system())
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))


func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	gold = int(parsed.get("gold", gold))
	iron_ore = int(parsed.get("iron_ore", iron_ore))
	wood = int(parsed.get("wood", wood))
	leather = int(parsed.get("leather", leather))
	essence = int(parsed.get("essence", essence))
	max_unlocked_depth = maxi(1, int(parsed.get("max_unlocked_depth", 1)))
	selected_depth = clampi(int(parsed.get("selected_depth", max_unlocked_depth)), 1, max_unlocked_depth)
	idle_generator_level = maxi(1, int(parsed.get("idle_generator_level", 1)))
	current_quest_index = clampi(int(parsed.get("current_quest_index", 0)), 0, QUEST_CATALOG.size())
	stats_rooms_cleared = int(parsed.get("stats_rooms_cleared", 0))
	stats_iron_collected = int(parsed.get("stats_iron_collected", iron_ore))
	stats_wood_collected = int(parsed.get("stats_wood_collected", wood))
	stats_enemies_killed = int(parsed.get("stats_enemies_killed", 0))
	stats_bosses_killed = int(parsed.get("stats_bosses_killed", 0))

	var eq_loaded: Dictionary = parsed.get("equipment", {})
	for k in eq_loaded.keys():
		if equipment.has(k):
			equipment[k]["level"] = int(eq_loaded[k].get("level", 1))
			equipment[k]["tier"] = int(eq_loaded[k].get("tier", 0))

	var app_loaded: Dictionary = parsed.get("appearance", {})
	for k in appearance.keys():
		if app_loaded.has(k):
			appearance[k] = int(app_loaded[k])
	var last_ts := int(parsed.get("timestamp", 0))
	if last_ts > 0:
		var now := int(Time.get_unix_time_from_system())
		var elapsed := clampi(now - last_ts, 0, MAX_OFFLINE_SECONDS)
		if elapsed >= 5:
			var offline_gold := int(floor(float(elapsed) * get_idle_gold_per_second()))
			if offline_gold > 0:
				gold += offline_gold
				offline_reward_claimed.emit(offline_gold, elapsed)
	currencies_changed.emit(gold, iron_ore)
	materials_changed.emit()
	quests_changed.emit()
	equipment_changed.emit()
