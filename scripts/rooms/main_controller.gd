extends Node2D
## Controlador principal con:
## 1. Tipografia dual: Blox2.ttf (titulos/encabezados) + Joystix Monospace joystix.otf (texto principal, HUD, botones y modales).
## 2. Mapa de Mazmorra estilo The Binding of Isaac:
##    - Generacion de piso en cuadricula 2D con salas conectadas en 4 direcciones (Norte, Sur, Este, Oeste).
##    - Persistencia total por habitacion (puedes volver por cualquier puerta o viajar rapido entre salas despejadas;
##      los pickups en el suelo, cofres, rocas y hogueras se conservan en cada sala).
##    - Minimapa en esquina + Mapa Detallado con TAB que muestra iconos e inventario exacto de objetos sin recolectar por sala.
## 3. Interfaz principal minimalista con botones "i" contextuales.
## 4. 8 mejoras temporales (1 de 3), Pickups fisicos y las 5 Misiones e Hitos Iniciales.

const PickupActor = preload("res://scripts/rooms/pickup_item.gd")

enum GameMode {
	MAIN_MENU,
	CAMP_IDLE,
	EXPEDITION
}

enum RoomState {
	UNEXPLORED,
	ENTERING,
	COMBAT,
	CLEARED,
	COMPLETED
}

enum RoomType {
	START,
	COMBAT,
	ELITE,
	TREASURE,
	REST,
	BOSS
}

const ARENA_RECT := Rect2(16, 52, 416, 288)
const SPAWN_POS := Vector2(224, 196)
const CAMP_SPAWN_POS := Vector2(180, 200)
const EXIT_SINGLE_POS := Vector2(416, 196)

# Posiciones de las 4 puertas cardinales en la arena
const DOOR_NORTH_POS := Vector2(224, 56)
const DOOR_SOUTH_POS := Vector2(224, 332)
const DOOR_WEST_POS := Vector2(20, 196)
const DOOR_EAST_POS := Vector2(428, 196)
const BOSS_PORTAL_POS := Vector2(224, 130)

const CARDINAL_DIRS: Array[Vector2i] = [
	Vector2i(0, -1), # Norte
	Vector2i(0, 1),  # Sur
	Vector2i(-1, 0), # Oeste
	Vector2i(1, 0)   # Este
]

# Las dos fuentes del proyecto: Blox2 para titulos y Joystix para texto principal
var font_display: FontFile = preload("res://assets/fonts/Blox2.ttf")
var font_ui: FontFile = preload("res://assets/fonts/joystix.otf")
var _ui_theme: Theme

var tex_floors: Texture2D = preload("res://assets/sprites/Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png")
var tex_dungeon: Texture2D = preload("res://assets/sprites/Pixel Crawler - Free Pack/Environment/Tilesets/Dungeon_Tiles.png")
var tex_bonfire_base: Texture2D = preload("res://assets/sprites/Pixel Crawler - Free Pack/Environment/Structures/Stations/Bonfire/Bonfire_01-Sheet.png")
var tex_bonfire_fire: Texture2D = preload("res://assets/sprites/Pixel Crawler - Free Pack/Environment/Structures/Stations/Bonfire/Fire_01-Sheet.png")
var tex_anvil: Texture2D = preload("res://assets/sprites/Pixel Crawler - Free Pack/Environment/Structures/Stations/Anvil/Anvil.png")
var tex_warrior: Texture2D = preload("res://assets/sprites/Puny-Characters/Puny-Characters/Warrior-Red.png")
var tex_worker: Texture2D = preload("res://assets/sprites/Puny-Characters/Puny-Characters/Human-Worker-Cyan.png")
var tex_slime: Texture2D = preload("res://assets/sprites/Puny-Characters/Puny-Characters/Slime.png")
var tex_orc_soldier: Texture2D = preload("res://assets/sprites/Puny-Characters/Puny-Characters/Orc-Soldier-Red.png")
var tex_orc_grunt: Texture2D = preload("res://assets/sprites/Puny-Characters/Puny-Characters/Orc-Grunt.png")
var tex_dungeon_props: Texture2D = preload("res://assets/sprites/Pixel Crawler - Free Pack/Environment/Props/Static/Dungeon_Props.png")

# Texturas de los nuevos jefes
var tex_boar_warrior_idle: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Boar Warrior/Idle/Idle-Sheet.png")
var tex_boar_warrior_walk: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Boar Warrior/Walk/Walk-Sheet.png")
var tex_boar_warrior_attack: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Boar Warrior/Attack/Attack-01-Sheet.png")
var tex_boar_warrior_die: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Boar Warrior/Die/Die-Sheet.png")

var tex_wild_boar_idle: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Wild Boar/Idle/Idle-Sheet - Color 1.png")
var tex_wild_boar_walk: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Wild Boar/Walk/Walk-Sheet - Color 1.png")
var tex_wild_boar_run: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Wild Boar/Run/Run-Sheet - Color 1.png")
var tex_wild_boar_attack: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Wild Boar/Attack/Attack - Color 1.png")
var tex_wild_boar_die: Texture2D = preload("res://assets/sprites/Legacy Fantasy/Legacy Enemy - Wild Boar/Die/Die-Sheet - Color 1.png")

var tex_gold_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Treasure/GoldCoin.png")
var tex_iron_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Materials/IronOre.png")
var tex_wood_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Materials/Log.png")
var tex_leather_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Materials/Leather.png")
var tex_essence_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Treasure/Ruby.png")
var tex_heart_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Potions/SmallHealthPotion.png")
var tex_key_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Treasure/GoldKey.png")
var tex_bomb_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Tools/Bomb.png")
var tex_rock_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Materials/Stone.png")
var tex_pickaxe_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Tools/Pickaxe.png")
var tex_quest_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Scrolls_Books/QuestNotice.png")
var tex_sword_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Swords/IronSword.png")
var tex_wardrobe_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Armor/GoldenArmor.png")
var tex_skull_icon: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Accessories/SkullRing.png")
var tex_chest_closed: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Treasure/GoldenChest.png")
var tex_chest_open: Texture2D = preload("res://assets/sprites/PixelRPGItems/PixelRPGItems/Items/Treasure/OpenChest.png")

var game_mode: GameMode = GameMode.MAIN_MENU
var room_state: RoomState = RoomState.UNEXPLORED
var current_room_type: RoomType = RoomType.START
var expedition_depth: int = 1
var current_wave: int = 0
var total_waves: int = 0
var active_enemies: int = 0

# Estructura del mapa del piso estilo Isaac: Vector2i -> Dictionary
var floor_rooms: Dictionary = {}
var current_room_coord: Vector2i = Vector2i.ZERO
var selected_map_coord: Vector2i = Vector2i.ZERO
var boss_defeated_on_floor: bool = false
var _door_cooldown: float = 0.0
var _room_transition_id: int = 0

var room_chests: Array[Dictionary] = []
var cracked_rocks: Array[Dictionary] = []
var placed_bombs: Array[Dictionary] = []
var rest_shrine_used: bool = false

# Botin acumulado durante la expedicion activa
var run_gold_earned: int = 0
var run_iron_earned: int = 0
var run_wood_earned: int = 0
var run_leather_earned: int = 0
var run_essence_earned: int = 0

# Animacion ambiental del campamento y temporizador de aviso corto
var _env_clock: float = 0.0
var _banner_timer: float = 0.0
var _worker_pos: Vector2 = Vector2(78, 92)
var _worker_going_to_mine: bool = true
var _worker_spr: Sprite2D

var player: PlayerController
var entities_root: Node2D
var pickups_root: Node2D
var floating_texts: Array[Dictionary] = []

# Referencias UI
var hud_root: Control
var lbl_hp: Label
var bar_hp: ProgressBar
var lbl_room: Label
var lbl_gold: Label
var lbl_iron: Label
var lbl_wood: Label
var lbl_leather: Label
var lbl_essence: Label
var lbl_keys: Label
var lbl_bombs: Label
var btn_active_quest: Button
var lbl_banner: Label
var lbl_gen_info: Label
var btn_gen_upgrade: Button
var btn_mode_action: Button
var btn_map_top: Button
var btn_depth_prev: Button
var btn_depth_next: Button
var lbl_depth_sel: Label

var main_menu_overlay: Control
var lbl_menu_summary: Label
var pause_overlay: Control
var btn_pause_retreat: Button
var summary_overlay: Control
var lbl_summary_title: Label
var lbl_summary_body: Label
var btn_summary_retry: Button

# Modal del Mapa Detallado (tecla TAB o boton MAPA)
var map_overlay: Control
var map_canvas: Control
var lbl_map_room_title: Label
var lbl_map_room_details: Label
var btn_map_travel: Button

# Modal de las 5 Misiones e Hitos (tecla M o clic en Mision)
var quests_overlay: Control
var quest_row_labels: Array[Label] = []

# Modal del Armario y Personalizacion por Capas (tecla C o boton SKIN)
var wardrobe_overlay: Control
var wardrobe_preview_ctrl: Control
var wardrobe_value_labels: Dictionary = {}

# Modal de Informacion contextual (botones "i")
var info_overlay: Control
var lbl_info_title: Label
var lbl_info_body: Label
var _info_return_to_menu: bool = false

# Modal de eleccion de Mejora Temporal (1 de 3)
var buff_choice_overlay: Control
var buff_choice_buttons: Array[Button] = []
var _current_buff_choices: Array[Dictionary] = []

var slot_buttons: Dictionary = {}
var slot_icons: Dictionary = {}
var slot_labels: Dictionary = {}


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_theme()
	_build_arena_walls()

	pickups_root = Node2D.new()
	pickups_root.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(pickups_root)

	entities_root = Node2D.new()
	entities_root.y_sort_enabled = true
	entities_root.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(entities_root)

	_spawn_camp_worker()
	_spawn_player()
	_build_ui()

	GameState.currencies_changed.connect(_on_currencies_changed)
	GameState.materials_changed.connect(_refresh_materials_ui)
	GameState.quests_changed.connect(_refresh_quests_ui)
	GameState.quest_completed.connect(_on_quest_completed)
	GameState.run_pickups_changed.connect(_on_run_pickups_changed)
	GameState.temp_buffs_changed.connect(_refresh_equipment_ui)
	GameState.equipment_changed.connect(_refresh_equipment_ui)
	GameState.appearance_changed.connect(func(_t: Texture2D):
		_refresh_wardrobe_ui()
		if is_instance_valid(wardrobe_preview_ctrl):
			wardrobe_preview_ctrl.queue_redraw()
	)
	GameState.idle_tick_applied.connect(_on_idle_tick)
	GameState.offline_reward_claimed.connect(_on_offline_claimed)

	_on_currencies_changed(GameState.gold, GameState.iron_ore)
	_refresh_materials_ui()
	_refresh_quests_ui()
	_on_run_pickups_changed(GameState.run_keys, GameState.run_bombs)
	_refresh_equipment_ui()
	_enter_main_menu()


func _build_theme() -> void:
	_ui_theme = Theme.new()
	_ui_theme.default_font = font_ui
	_ui_theme.default_font_size = 7

	var panel_box := StyleBoxFlat.new()
	panel_box.bg_color = Color(0.09, 0.10, 0.14, 0.94)
	panel_box.border_color = Color(0.28, 0.33, 0.44, 1.0)
	panel_box.set_border_width_all(1)
	panel_box.set_corner_radius_all(2)
	panel_box.content_margin_left = 4
	panel_box.content_margin_right = 4
	panel_box.content_margin_top = 3
	panel_box.content_margin_bottom = 3
	_ui_theme.set_stylebox("panel", "PanelContainer", panel_box)

	var btn_normal := StyleBoxFlat.new()
	btn_normal.bg_color = Color(0.16, 0.19, 0.27, 0.95)
	btn_normal.border_color = Color(0.38, 0.45, 0.60, 1.0)
	btn_normal.set_border_width_all(1)
	btn_normal.set_corner_radius_all(2)
	btn_normal.content_margin_left = 3
	btn_normal.content_margin_right = 3
	btn_normal.content_margin_top = 2
	btn_normal.content_margin_bottom = 2

	var btn_hover := btn_normal.duplicate()
	btn_hover.bg_color = Color(0.24, 0.29, 0.40, 1.0)
	btn_hover.border_color = Color(0.75, 0.82, 0.98, 1.0)

	var btn_pressed := btn_normal.duplicate()
	btn_pressed.bg_color = Color(0.12, 0.14, 0.20, 1.0)

	var btn_disabled := btn_normal.duplicate()
	btn_disabled.bg_color = Color(0.10, 0.11, 0.15, 0.70)
	btn_disabled.border_color = Color(0.22, 0.24, 0.30, 0.70)

	_ui_theme.set_stylebox("normal", "Button", btn_normal)
	_ui_theme.set_stylebox("hover", "Button", btn_hover)
	_ui_theme.set_stylebox("pressed", "Button", btn_pressed)
	_ui_theme.set_stylebox("disabled", "Button", btn_disabled)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("map_toggle"):
		if game_mode == GameMode.EXPEDITION and not summary_overlay.visible and not buff_choice_overlay.visible:
			if info_overlay.visible:
				_close_info_modal()
			if quests_overlay.visible:
				quests_overlay.visible = false
			if wardrobe_overlay.visible:
				wardrobe_overlay.visible = false
			_toggle_map_overlay()
			return
	if event.is_action_pressed("wardrobe_toggle"):
		if info_overlay.visible:
			_close_info_modal()
		if map_overlay.visible:
			map_overlay.visible = false
		if quests_overlay.visible:
			quests_overlay.visible = false
		if game_mode != GameMode.MAIN_MENU and not summary_overlay.visible and not buff_choice_overlay.visible:
			_toggle_wardrobe_overlay()
			return
	if event.is_action_pressed("quests_log"):
		if info_overlay.visible:
			_close_info_modal()
			return
		if map_overlay.visible:
			_toggle_map_overlay()
			return
		if wardrobe_overlay.visible:
			wardrobe_overlay.visible = false
		if game_mode != GameMode.MAIN_MENU and not summary_overlay.visible and not buff_choice_overlay.visible:
			_toggle_quests_overlay()
			return
	if event.is_action_pressed("pause_menu"):
		if info_overlay.visible:
			_close_info_modal()
			return
		if map_overlay.visible:
			_toggle_map_overlay()
			return
		if wardrobe_overlay.visible:
			_toggle_wardrobe_overlay()
			return
		if quests_overlay.visible:
			_toggle_quests_overlay()
			return
		if game_mode == GameMode.MAIN_MENU or summary_overlay.visible or buff_choice_overlay.visible:
			return
		_toggle_pause_menu()


func _build_arena_walls() -> void:
	var static_body := StaticBody2D.new()
	static_body.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(static_body)
	var thickness := 16.0
	var r := ARENA_RECT
	var rects := [
		Rect2(r.position.x - thickness, r.position.y - thickness, r.size.x + thickness * 2.0, thickness),
		Rect2(r.position.x - thickness, r.end.y, r.size.x + thickness * 2.0, thickness),
		Rect2(r.position.x - thickness, r.position.y, thickness, r.size.y),
		Rect2(r.end.x, r.position.y, thickness, r.size.y),
	]
	for wr in rects:
		var shape_node := CollisionShape2D.new()
		var rect_shape := RectangleShape2D.new()
		rect_shape.size = wr.size
		shape_node.shape = rect_shape
		shape_node.position = wr.position + wr.size * 0.5
		static_body.add_child(shape_node)


func _spawn_camp_worker() -> void:
	_worker_spr = Sprite2D.new()
	_worker_spr.texture = tex_worker
	_worker_spr.hframes = 24
	_worker_spr.vframes = 8
	_worker_spr.position = _worker_pos
	entities_root.add_child(_worker_spr)


func _spawn_player() -> void:
	player = PlayerController.new()
	player.position = CAMP_SPAWN_POS

	var spr := Sprite2D.new()
	spr.name = "Sprite2D"
	spr.texture = GameState.custom_player_texture if GameState.custom_player_texture else tex_warrior
	spr.hframes = 24
	spr.vframes = 8
	player.add_child(spr)

	var col := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 6.0
	col.shape = circle
	col.position = Vector2(0, 3)
	player.add_child(col)

	entities_root.add_child(player)
	player.hp_changed.connect(_on_player_hp_changed)
	player.player_died.connect(_on_player_died)
	player.bomb_requested.connect(_on_player_bomb_requested)


# ---------------- GENERACION DEL MAPA DE PISO ESTILO ISAAC Y PERSISTENCIA ----------------

func _clear_room_entities() -> void:
	for e in get_tree().get_nodes_in_group("enemies"):
		if is_instance_valid(e):
			e.queue_free()
	for p in pickups_root.get_children():
		p.queue_free()
	active_enemies = 0
	room_chests.clear()
	cracked_rocks.clear()
	placed_bombs.clear()
	rest_shrine_used = false


func _generate_floor_layout() -> void:
	floor_rooms.clear()
	boss_defeated_on_floor = false
	var target_count := 8

	# Generador estilo Isaac: crecimiento desde (0, 0) favoreciendo ramificaciones y hojas (dead-ends)
	var coords: Array[Vector2i] = [Vector2i.ZERO]
	var attempts := 0
	while coords.size() < target_count and attempts < 200:
		attempts += 1
		var base_c: Vector2i = coords[randi() % coords.size()]
		var dir: Vector2i = CARDINAL_DIRS[randi() % CARDINAL_DIRS.size()]
		var cand: Vector2i = base_c + dir
		if abs(cand.x) > 2 or abs(cand.y) > 2:
			continue
		if coords.has(cand):
			continue
		# Evitar cuadrados 2x2 densos para que queden pasillos y habitaciones especiales como en Isaac
		var neigh_count := 0
		for d in CARDINAL_DIRS:
			if coords.has(cand + d):
				neigh_count += 1
		if neigh_count > 1 and randf() < 0.78:
			continue
		coords.append(cand)

	# Calculamos distancias Manhattan y hojas para asignar Jefe, Tesoro, Descanso y Elite
	var furthest_coord := Vector2i.ZERO
	var max_dist := -1
	for c in coords:
		var d := absi(c.x) + absi(c.y)
		if d > max_dist:
			max_dist = d
			furthest_coord = c

	var leaves: Array[Vector2i] = []
	var others: Array[Vector2i] = []
	for c in coords:
		if c == Vector2i.ZERO or c == furthest_coord:
			continue
		var n_cnt := 0
		for d in CARDINAL_DIRS:
			if coords.has(c + d):
				n_cnt += 1
		if n_cnt == 1:
			leaves.append(c)
		else:
			others.append(c)
	leaves.shuffle()
	others.shuffle()

	var pool_order: Array[Vector2i] = []
	pool_order.append_array(leaves)
	pool_order.append_array(others)

	var treasure_coord := pool_order[0] if pool_order.size() > 0 else Vector2i(1, 0)
	var rest_coord := pool_order[1] if pool_order.size() > 1 else Vector2i(-1, 0)
	var elite_coord := pool_order[2] if pool_order.size() > 2 else Vector2i(0, 1)

	for c in coords:
		var r_type := RoomType.COMBAT
		if c == Vector2i.ZERO:
			r_type = RoomType.START
		elif c == furthest_coord:
			r_type = RoomType.BOSS
		elif c == treasure_coord:
			r_type = RoomType.TREASURE
		elif c == rest_coord:
			r_type = RoomType.REST
		elif c == elite_coord:
			r_type = RoomType.ELITE

		floor_rooms[c] = _create_initial_room_dict(c, r_type)


func _create_initial_room_dict(c: Vector2i, r_type: RoomType) -> Dictionary:
	var rocks: Array[Dictionary] = []
	var chests: Array[Dictionary] = []
	var pickups: Array[Dictionary] = []
	var is_start := (r_type == RoomType.START)

	if not is_start:
		rocks.append({"pos": Vector2(110, 105), "destroyed": false})
		rocks.append({"pos": Vector2(338, 275), "destroyed": false})

	match r_type:
		RoomType.COMBAT:
			if randf() < 0.45:
				chests.append({"pos": Vector2(120, 270), "locked": true, "opened": false})
		RoomType.ELITE:
			chests.append({"pos": Vector2(120, 110), "locked": true, "opened": false})
		RoomType.TREASURE:
			chests.append({"pos": Vector2(224, 196), "locked": true, "opened": false})
			rocks.append({"pos": Vector2(290, 150), "destroyed": false})
			rocks.append({"pos": Vector2(290, 240), "destroyed": false})
			pickups.append({"type": PickupActor.Type.GOLD, "amount": 8 * expedition_depth, "pos": Vector2(170, 160)})
			pickups.append({"type": PickupActor.Type.GOLD, "amount": 8 * expedition_depth, "pos": Vector2(170, 230)})
			pickups.append({"type": PickupActor.Type.KEY, "amount": 1, "pos": Vector2(140, 196)})
			if GameState.is_iron_drop_unlocked():
				pickups.append({"type": PickupActor.Type.WOOD, "amount": 1, "pos": Vector2(140, 150)})
		RoomType.REST:
			pickups.append({"type": PickupActor.Type.HEART, "amount": 18, "pos": Vector2(170, 160)})
			pickups.append({"type": PickupActor.Type.BOMB, "amount": 1, "pos": Vector2(170, 230)})

	return {
		"coord": c,
		"type": r_type,
		"visited": is_start,
		"discovered": is_start,
		"cleared": is_start,
		"shrine_used": false,
		"chests": chests,
		"rocks": rocks,
		"pickups": pickups
	}


func _save_current_room_state() -> void:
	if game_mode != GameMode.EXPEDITION or not floor_rooms.has(current_room_coord):
		return
	var r_data: Dictionary = floor_rooms[current_room_coord]
	r_data["chests"] = room_chests.duplicate(true)
	r_data["rocks"] = cracked_rocks.duplicate(true)
	r_data["shrine_used"] = rest_shrine_used

	var saved_pickups: Array[Dictionary] = []
	for child in pickups_root.get_children():
		if is_instance_valid(child) and not child.is_queued_for_deletion():
			var p := child as PickupActor
			if p and not p.is_collected:
				saved_pickups.append({
					"type": p.pickup_type,
					"amount": p.amount,
					"pos": p.position
				})
	r_data["pickups"] = saved_pickups


func _discover_neighbors_of(coord: Vector2i) -> void:
	if floor_rooms.has(coord):
		floor_rooms[coord]["visited"] = true
		floor_rooms[coord]["discovered"] = true
	for d in CARDINAL_DIRS:
		var n_coord: Vector2i = coord + d
		if floor_rooms.has(n_coord):
			floor_rooms[n_coord]["discovered"] = true


func _enter_room_at(target_coord: Vector2i, move_dir: Vector2i = Vector2i.ZERO) -> void:
	if not floor_rooms.has(target_coord):
		return
	if floor_rooms.has(current_room_coord) and current_room_coord != target_coord:
		_save_current_room_state()

	_room_transition_id += 1
	var my_transition_id := _room_transition_id
	_door_cooldown = 0.45

	current_room_coord = target_coord
	selected_map_coord = target_coord
	var r_data: Dictionary = floor_rooms[current_room_coord]
	var was_already_cleared := bool(r_data["cleared"])
	current_room_type = r_data["type"]
	_discover_neighbors_of(current_room_coord)

	_clear_room_entities()
	room_chests = r_data["chests"].duplicate(true)
	cracked_rocks = r_data["rocks"].duplicate(true)
	rest_shrine_used = bool(r_data["shrine_used"])

	# Restaurar todos los objetos fisicos que estaban en el suelo de esta sala
	var saved_pickups: Array = r_data["pickups"]
	for p_dict in saved_pickups:
		_spawn_pickup(p_dict["type"], int(p_dict["amount"]), p_dict["pos"], false)

	# Posicion de entrada segun la puerta por la que venimos
	if move_dir == Vector2i(0, -1): # Entramos caminando hacia el Norte -> aparecemos en puerta Sur
		player.global_position = DOOR_SOUTH_POS + Vector2(0, -20)
	elif move_dir == Vector2i(0, 1): # Entramos hacia el Sur -> aparecemos en puerta Norte
		player.global_position = DOOR_NORTH_POS + Vector2(0, 20)
	elif move_dir == Vector2i(-1, 0): # Entramos hacia el Oeste -> aparecemos en puerta Este
		player.global_position = DOOR_EAST_POS + Vector2(-20, 0)
	elif move_dir == Vector2i(1, 0): # Entramos hacia el Este -> aparecemos en puerta Oeste
		player.global_position = DOOR_WEST_POS + Vector2(20, 0)
	else:
		player.global_position = SPAWN_POS

	player.has_exploration_waypoint = false
	current_wave = 0

	if was_already_cleared or current_room_type in [RoomType.START, RoomType.TREASURE, RoomType.REST]:
		total_waves = 0
		room_state = RoomState.CLEARED
		if not was_already_cleared:
			r_data["cleared"] = true
			GameState.record_room_cleared()
			if current_room_type == RoomType.TREASURE:
				_show_banner("SALA DEL TESORO")
			elif current_room_type == RoomType.REST:
				_show_banner("SANTUARIO DE DESCANSO")
		else:
			_show_banner("%s (%d,%d)" % [_room_type_label(current_room_type), current_room_coord.x, current_room_coord.y])
		player.notify_enemies_present(false)
		_update_top_bar_controls()
		queue_redraw()
		return

	# Sala de combate/elite/jefe aun no despejada
	room_state = RoomState.ENTERING
	match current_room_type:
		RoomType.COMBAT, RoomType.ELITE:
			total_waves = 2
		RoomType.BOSS:
			total_waves = 1
		_:
			total_waves = 0

	_update_top_bar_controls()
	_show_banner("%s - EN COMBATE" % _room_type_label(current_room_type))

	get_tree().create_timer(0.45, false).timeout.connect(func():
		if not is_instance_valid(self) or game_mode != GameMode.EXPEDITION or _room_transition_id != my_transition_id:
			return
		_spawn_next_wave()
	)
	queue_redraw()


# ---------------- CAMBIOS DE MODO Y COMBATE EN SALAS ----------------

func _enter_main_menu() -> void:
	get_tree().paused = false
	game_mode = GameMode.MAIN_MENU
	room_state = RoomState.UNEXPLORED
	GameState.reset_expedition_temp_state()
	_clear_room_entities()
	_worker_spr.visible = true
	player.reset_for_new_expedition(CAMP_SPAWN_POS)
	player.has_exploration_waypoint = false
	hud_root.visible = false
	pause_overlay.visible = false
	summary_overlay.visible = false
	buff_choice_overlay.visible = false
	quests_overlay.visible = false
	wardrobe_overlay.visible = false
	info_overlay.visible = false
	map_overlay.visible = false
	main_menu_overlay.visible = true
	_refresh_menu_summary()
	queue_redraw()


func _enter_camp_idle() -> void:
	get_tree().paused = false
	game_mode = GameMode.CAMP_IDLE
	room_state = RoomState.UNEXPLORED
	GameState.reset_expedition_temp_state()
	_clear_room_entities()
	_worker_spr.visible = true
	player.reset_for_new_expedition(CAMP_SPAWN_POS)
	player.has_exploration_waypoint = false
	main_menu_overlay.visible = false
	pause_overlay.visible = false
	summary_overlay.visible = false
	buff_choice_overlay.visible = false
	quests_overlay.visible = false
	wardrobe_overlay.visible = false
	info_overlay.visible = false
	map_overlay.visible = false
	hud_root.visible = true
	_update_top_bar_controls()
	_show_banner("CAMPAMENTO BASE")
	queue_redraw()


func _start_expedition(depth: int) -> void:
	get_tree().paused = false
	game_mode = GameMode.EXPEDITION
	expedition_depth = maxi(1, depth)
	GameState.selected_depth = expedition_depth
	GameState.reset_expedition_temp_state()
	run_gold_earned = 0
	run_iron_earned = 0
	run_wood_earned = 0
	run_leather_earned = 0
	run_essence_earned = 0
	_worker_spr.visible = false
	main_menu_overlay.visible = false
	pause_overlay.visible = false
	summary_overlay.visible = false
	buff_choice_overlay.visible = false
	quests_overlay.visible = false
	wardrobe_overlay.visible = false
	info_overlay.visible = false
	map_overlay.visible = false
	hud_root.visible = true

	_generate_floor_layout()
	current_room_coord = Vector2i.ZERO
	player.reset_for_new_expedition(SPAWN_POS)
	_enter_room_at(Vector2i.ZERO, Vector2i.ZERO)
	_show_banner("PISO %d - USA PUERTAS O TAB PARA EL MAPA" % expedition_depth)


func _spawn_next_wave() -> void:
	if game_mode != GameMode.EXPEDITION:
		return
	current_wave += 1
	room_state = RoomState.COMBAT
	var dist_from_start := absi(current_room_coord.x) + absi(current_room_coord.y)
	var scale_mult := 1.0 + float(expedition_depth - 1) * 0.32 + float(dist_from_start) * 0.10

	match current_room_type:
		RoomType.COMBAT:
			if current_wave == 1:
				_spawn_enemy("slime", Vector2(140, 130), scale_mult)
				_spawn_enemy("slime", Vector2(300, 250), scale_mult)
			else:
				_spawn_enemy("slime", Vector2(130, 120), scale_mult)
				_spawn_enemy("orc_soldier", Vector2(310, 196), scale_mult)
				_spawn_enemy("slime", Vector2(260, 270), scale_mult)
		RoomType.ELITE:
			_show_banner("SALA ELITE - DOBLE BOTIN!")
			if current_wave == 1:
				_spawn_enemy("orc_soldier", Vector2(145, 130), scale_mult * 1.15)
				_spawn_enemy("orc_soldier", Vector2(295, 260), scale_mult * 1.15)
				_spawn_enemy("slime", Vector2(310, 160), scale_mult * 1.15)
			else:
				_spawn_enemy("orc_brute", Vector2(160, 150), scale_mult * 1.18)
				_spawn_enemy("orc_brute", Vector2(300, 230), scale_mult * 1.18)
		RoomType.BOSS:
			# Rotación de 3 Jefes con comportamientos únicos
			var boss_archetype := "orc_boss"
			var boss_title := "CAUDILLO ORCO"
			var boss_choice := expedition_depth % 3
			if boss_choice == 2:
				boss_archetype = "boar_warrior"
				boss_title = "GUERRERO JABALI"
			elif boss_choice == 0:
				boss_archetype = "wild_boar"
				boss_title = "JABALI SALVAJE COLOSAL"

			_show_banner("JEFE - %s!" % boss_title)
			_spawn_enemy(boss_archetype, Vector2(224, 150), scale_mult)
			_spawn_enemy("slime", Vector2(130, 120), scale_mult)
			_spawn_enemy("slime", Vector2(310, 260), scale_mult)
		_:
			pass

	_update_top_bar_controls()
	player.notify_enemies_present(true)
	queue_redraw()


func _spawn_enemy(archetype: String, pos: Vector2, mult: float) -> void:
	var enemy := EnemyActor.new()
	enemy.position = pos

	var spr := Sprite2D.new()
	spr.name = "Sprite2D"

	match archetype:
		"slime":
			enemy.display_name = "Slime"
			enemy.layout = EnemyActor.SpriteLayout.SLIME_15X1
			spr.texture = tex_slime
			spr.hframes = 15
			spr.vframes = 1
			enemy.max_hp = round(24.0 * mult)
			enemy.move_speed = 34.0
			enemy.contact_damage = round(8.0 * mult)
			enemy.attack_range = 18.0
			enemy.gold_reward = int(round(6.0 * mult))
			enemy.iron_drop_chance = 0.28
		"orc_soldier":
			enemy.display_name = "Soldado Orco"
			enemy.layout = EnemyActor.SpriteLayout.PUNY_24X8
			spr.texture = tex_orc_soldier
			spr.hframes = 24
			spr.vframes = 8
			enemy.max_hp = round(42.0 * mult)
			enemy.move_speed = 40.0
			enemy.contact_damage = round(12.0 * mult)
			enemy.attack_range = 22.0
			enemy.gold_reward = int(round(11.0 * mult))
			enemy.iron_drop_chance = 0.45
		"orc_brute":
			enemy.display_name = "Bruto Orco"
			enemy.layout = EnemyActor.SpriteLayout.PUNY_24X8
			spr.texture = tex_orc_grunt
			spr.hframes = 24
			spr.vframes = 8
			spr.scale = Vector2(1.25, 1.25)
			enemy.max_hp = round(75.0 * mult)
			enemy.move_speed = 26.0
			enemy.contact_damage = round(18.0 * mult)
			enemy.attack_range = 25.0
			enemy.windup_duration = 0.55
			enemy.gold_reward = int(round(18.0 * mult))
			enemy.iron_drop_chance = 0.75
		"orc_boss":
			enemy.display_name = "Caudillo Orco"
			enemy.layout = EnemyActor.SpriteLayout.PUNY_24X8
			spr.texture = tex_orc_grunt
			spr.hframes = 24
			spr.vframes = 8
			spr.scale = Vector2(1.85, 1.85)
			spr.modulate = Color(1.0, 0.78, 0.72)
			enemy.is_boss = true
			enemy.max_hp = round(165.0 * mult)
			enemy.move_speed = 30.0
			enemy.contact_damage = round(22.0 * mult)
			enemy.attack_range = 30.0
			enemy.windup_duration = 0.52
			enemy.gold_reward = int(round(45.0 * mult))
			enemy.iron_drop_chance = 1.0
		"boar_warrior":
			enemy.display_name = "Guerrero Jabali"
			enemy.layout = EnemyActor.SpriteLayout.SIDE_STRIPS
			enemy.side_anims = {
				"idle":   {"tex": tex_boar_warrior_idle,   "frames": 4, "fw": 96,  "h": 64,  "cx": 58, "fps": 5.0},
				"walk":   {"tex": tex_boar_warrior_walk,   "frames": 8, "fw": 80,  "h": 64,  "cx": 48, "fps": 8.0},
				"attack": {"tex": tex_boar_warrior_attack, "frames": 8, "fw": 160, "h": 112, "cx": 96, "fps": 9.0},
				"die":    {"tex": tex_boar_warrior_die,    "frames": 8, "fw": 144, "h": 96,  "cx": 70, "fps": 8.0},
			}
			enemy.is_boss = true
			enemy.max_hp = round(210.0 * mult)
			enemy.move_speed = 32.0
			enemy.contact_damage = round(26.0 * mult)
			enemy.attack_range = 38.0
			enemy.windup_duration = 0.58
			enemy.recovery_duration = 0.45
			enemy.bar_offset_y = -36.0
			enemy.gold_reward = int(round(55.0 * mult))
			enemy.iron_drop_chance = 1.0
		"wild_boar":
			enemy.display_name = "Jabali Salvaje"
			enemy.layout = EnemyActor.SpriteLayout.SIDE_STRIPS
			enemy.side_anims = {
				"idle":   {"tex": tex_wild_boar_idle,   "frames": 4, "fw": 64, "h": 48, "cx": 36, "fps": 6.0},
				"walk":   {"tex": tex_wild_boar_walk,   "frames": 8, "fw": 96, "h": 64, "cx": 52, "fps": 9.0},
				"run":    {"tex": tex_wild_boar_run,    "frames": 6, "fw": 96, "h": 64, "cx": 52, "fps": 14.0},
				"attack": {"tex": tex_wild_boar_attack, "frames": 6, "fw": 64, "h": 64, "cx": 34, "fps": 10.0},
				"die":    {"tex": tex_wild_boar_die,    "frames": 4, "fw": 96, "h": 48, "cx": 46, "fps": 7.0},
			}
			enemy.is_boss = true
			enemy.charge_attack = true
			enemy.charge_trigger_range = 140.0
			enemy.charge_speed = 240.0
			enemy.charge_duration = 0.60
			enemy.max_hp = round(175.0 * mult)
			enemy.move_speed = 36.0
			enemy.contact_damage = round(28.0 * mult)
			enemy.attack_range = 28.0
			enemy.windup_duration = 0.50
			enemy.recovery_duration = 0.65
			enemy.bar_offset_y = -26.0
			enemy.gold_reward = int(round(50.0 * mult))
			enemy.iron_drop_chance = 1.0

	enemy.add_child(spr)

	var col := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 6.0 if not enemy.is_boss else 10.0
	col.shape = circle
	col.position = Vector2(0, 3)
	enemy.add_child(col)

	entities_root.add_child(enemy)
	active_enemies += 1
	enemy.died.connect(_on_enemy_died)
	enemy.damaged.connect(_on_enemy_damaged)


func _on_enemy_damaged(enemy: EnemyActor, amount: float) -> void:
	_spawn_floating_text(enemy.global_position + Vector2(0, -10), "-%d" % int(round(amount)), Color(1.0, 0.92, 0.45))


func _on_enemy_died(enemy: EnemyActor, pos: Vector2, gold_drop: int, iron_drop: int) -> void:
	active_enemies = maxi(0, active_enemies - 1)
	var was_boss := enemy.is_boss
	GameState.record_enemy_killed(was_boss)

	var vamp_heal := GameState.get_vampiric_heal_on_kill()
	if vamp_heal > 0.0 and is_instance_valid(player):
		player.heal(vamp_heal)
		_spawn_floating_text(player.global_position + Vector2(0, -14), "+%d HP" % int(vamp_heal), Color(0.45, 1.0, 0.55))

	var elite_mult := 2 if current_room_type == RoomType.ELITE else 1
	_spawn_pickup(PickupActor.Type.GOLD, gold_drop * elite_mult, pos)

	var bonus_chance := GameState.get_bonus_drop_chance()

	if GameState.is_enemy_material_drop_unlocked() or (was_boss and GameState.is_iron_drop_unlocked()):
		var total_iron := iron_drop
		if current_room_type == RoomType.ELITE and total_iron == 0 and randf() < 0.65:
			total_iron = 1
		elif total_iron == 0 and randf() < bonus_chance:
			total_iron = 1
		for _i in range(total_iron):
			_spawn_pickup(PickupActor.Type.IRON, 1, pos + Vector2(randf_range(-8, 8), randf_range(-8, 8)))

		if randf() < 0.35 + bonus_chance * 0.4:
			_spawn_pickup(PickupActor.Type.WOOD, 1, pos + Vector2(randf_range(-10, 10), randf_range(-6, 6)))

	if GameState.is_leather_and_armor_crafting_unlocked():
		if was_boss or randf() < 0.40 + bonus_chance * 0.3:
			_spawn_pickup(PickupActor.Type.LEATHER, 1, pos + Vector2(randf_range(-8, 8), randf_range(-8, 8)))

	if was_boss or (GameState.is_essence_and_high_tier_unlocked() and current_room_type == RoomType.ELITE and randf() < 0.30):
		_spawn_pickup(PickupActor.Type.ESSENCE, 1, pos + Vector2(0, -6))

	var roll := randf()
	if roll < 0.16:
		_spawn_pickup(PickupActor.Type.HEART, 16, pos)
	elif roll < 0.26 + bonus_chance * 0.35:
		_spawn_pickup(PickupActor.Type.KEY, 1, pos)
	elif roll < 0.36 + bonus_chance * 0.35:
		_spawn_pickup(PickupActor.Type.BOMB, 1, pos)

	if active_enemies == 0 and room_state == RoomState.COMBAT and game_mode == GameMode.EXPEDITION:
		if current_wave < total_waves:
			_show_banner("OLEADA %d SUPERADA" % current_wave)
			var my_tid := _room_transition_id
			get_tree().create_timer(0.75, false).timeout.connect(func():
				if is_instance_valid(self) and game_mode == GameMode.EXPEDITION and room_state == RoomState.COMBAT and _room_transition_id == my_tid:
					_spawn_next_wave()
			)
		else:
			_on_room_cleared()


func _on_room_cleared() -> void:
	room_state = RoomState.CLEARED
	if floor_rooms.has(current_room_coord):
		floor_rooms[current_room_coord]["cleared"] = true
	GameState.record_room_cleared()

	_spawn_pickup(PickupActor.Type.GOLD, 10 * expedition_depth, ARENA_RECT.get_center())
	if GameState.is_iron_drop_unlocked():
		_spawn_pickup(PickupActor.Type.IRON, 1, ARENA_RECT.get_center() + Vector2(10, -6))
		if current_room_type == RoomType.ELITE or randf() < 0.55:
			_spawn_pickup(PickupActor.Type.WOOD, 1, ARENA_RECT.get_center() + Vector2(-10, 6))

	player.notify_enemies_present(false)
	player.has_exploration_waypoint = false

	if current_room_type == RoomType.BOSS:
		boss_defeated_on_floor = true
		GameState.unlock_depth(expedition_depth + 1)
		_show_banner("JEFE DERROTADO! PORTAL ABIERTO O EXPLORA EL MAPA")
	else:
		_show_banner("SALA DESPEJADA! PUERTAS ABIERTAS (TAB: MAPA)")

	_save_current_room_state()
	_update_top_bar_controls()
	if current_room_type in [RoomType.COMBAT, RoomType.ELITE]:
		_prompt_temp_buff_choice()
	queue_redraw()


func _room_type_label(rt: RoomType) -> String:
	match rt:
		RoomType.START:
			return "ENTRADA"
		RoomType.COMBAT:
			return "COMBATE"
		RoomType.ELITE:
			return "ELITE"
		RoomType.TREASURE:
			return "TESORO"
		RoomType.REST:
			return "DESCANSO"
		RoomType.BOSS:
			return "JEFE"
	return "SALA"


# ---------------- PICKUPS FISICOS, COFRES CON LLAVE Y BOMBAS (E) ----------------

func _spawn_pickup(p_type: PickupActor.Type, amount: int, pos: Vector2, burst: bool = true) -> void:
	var p := PickupActor.new()
	p.position = pos
	var tex := tex_gold_icon
	match p_type:
		PickupActor.Type.GOLD:
			tex = tex_gold_icon
		PickupActor.Type.IRON:
			tex = tex_iron_icon
		PickupActor.Type.WOOD:
			tex = tex_wood_icon
		PickupActor.Type.LEATHER:
			tex = tex_leather_icon
		PickupActor.Type.ESSENCE:
			tex = tex_essence_icon
		PickupActor.Type.HEART:
			tex = tex_heart_icon
		PickupActor.Type.KEY:
			tex = tex_key_icon
		PickupActor.Type.BOMB:
			tex = tex_bomb_icon
	p.setup(p_type, amount, tex, burst)
	p.collected.connect(_on_pickup_collected)
	pickups_root.add_child(p)


func _on_pickup_collected(type_key: String, amount: int, pos: Vector2) -> void:
	match type_key:
		"gold":
			var g := GameState.add_gold(amount, true)
			run_gold_earned += g
			_spawn_floating_text(pos + Vector2(0, -10), "+%d G" % g, Color(1.0, 0.88, 0.25))
		"iron":
			GameState.add_iron(amount)
			run_iron_earned += amount
			_spawn_floating_text(pos + Vector2(0, -10), "+%d FE" % amount, Color(0.75, 0.9, 1.0))
		"wood":
			GameState.add_wood(amount)
			run_wood_earned += amount
			_spawn_floating_text(pos + Vector2(0, -10), "+%d MAD" % amount, Color(0.88, 0.72, 0.45))
		"leather":
			GameState.add_leather(amount)
			run_leather_earned += amount
			_spawn_floating_text(pos + Vector2(0, -10), "+%d CUE" % amount, Color(0.95, 0.68, 0.42))
		"essence":
			GameState.add_essence(amount)
			run_essence_earned += amount
			_spawn_floating_text(pos + Vector2(0, -10), "+%d ESE" % amount, Color(1.0, 0.45, 0.85))
		"heart":
			if is_instance_valid(player):
				player.heal(float(amount))
			_spawn_floating_text(pos + Vector2(0, -10), "+%d HP" % amount, Color(0.45, 1.0, 0.55))
		"key":
			GameState.add_run_key(amount)
			_spawn_floating_text(pos + Vector2(0, -10), "+%d LLAVE" % amount, Color(1.0, 0.95, 0.45))
		"bomb":
			GameState.add_run_bomb(amount)
			_spawn_floating_text(pos + Vector2(0, -10), "+%d BOMBA" % amount, Color(1.0, 0.65, 0.35))
	_save_current_room_state()


func _on_player_bomb_requested(pos: Vector2) -> void:
	if game_mode != GameMode.EXPEDITION:
		return
	if not GameState.use_run_bomb():
		_spawn_floating_text(pos + Vector2(-14, -14), "SIN BOMBAS", Color(1.0, 0.45, 0.45))
		return
	placed_bombs.append({
		"pos": pos,
		"timer": 1.15,
		"exploded": false,
		"blast_alpha": 0.0
	})
	queue_redraw()


func _detonate_bomb(b: Dictionary) -> void:
	b["exploded"] = true
	b["blast_alpha"] = 1.0
	var b_pos: Vector2 = b["pos"]
	var blast_radius := 58.0

	var bomb_dmg := GameState.get_player_damage() * 2.8 + 25.0
	for node in get_tree().get_nodes_in_group("enemies"):
		if is_instance_valid(node) and not node.is_dead():
			if b_pos.distance_to(node.global_position) <= blast_radius:
				var push: Vector2 = (node.global_position - b_pos).normalized() * 120.0
				node.take_damage(bomb_dmg, push)

	for rock in cracked_rocks:
		if not rock["destroyed"] and b_pos.distance_to(rock["pos"]) <= blast_radius:
			rock["destroyed"] = true
			var r_pos: Vector2 = rock["pos"]
			_spawn_floating_text(r_pos + Vector2(-12, -12), "ROCA ROTA!", Color(0.95, 0.85, 0.45))
			_spawn_pickup(PickupActor.Type.GOLD, 8 * expedition_depth, r_pos + Vector2(6, 4))
			if GameState.is_iron_drop_unlocked():
				_spawn_pickup(PickupActor.Type.IRON, 1, r_pos)
				_spawn_pickup(PickupActor.Type.WOOD, 1, r_pos + Vector2(-6, -4))
			if randf() < 0.45:
				_spawn_pickup(PickupActor.Type.KEY, 1, r_pos + Vector2(-6, 4))
	_save_current_room_state()


func _check_room_interactables() -> void:
	if game_mode != GameMode.EXPEDITION or not is_instance_valid(player):
		return

	for chest in room_chests:
		if not chest["opened"] and player.global_position.distance_to(chest["pos"]) <= 18.0:
			if chest["locked"]:
				if GameState.use_run_key():
					chest["locked"] = false
					chest["opened"] = true
					_open_room_chest(chest["pos"])
			else:
				chest["opened"] = true
				_open_room_chest(chest["pos"])

	if current_room_type == RoomType.REST and not rest_shrine_used:
		var shrine_pos := Vector2(224, 196)
		if player.global_position.distance_to(shrine_pos) <= 24.0:
			rest_shrine_used = true
			var heal_amt: float = roundf(player.max_hp * 0.45)
			player.heal(heal_amt)
			_spawn_floating_text(shrine_pos + Vector2(-18, -18), "+%d HP" % int(heal_amt), Color(0.45, 1.0, 0.55))
			_save_current_room_state()


func _open_room_chest(c_pos: Vector2) -> void:
	_spawn_floating_text(c_pos + Vector2(-18, -16), "COFRE!", Color(1.0, 0.9, 0.35))
	_spawn_pickup(PickupActor.Type.GOLD, 14 * expedition_depth, c_pos + Vector2(-8, 6))
	if GameState.is_iron_drop_unlocked():
		_spawn_pickup(PickupActor.Type.IRON, 1, c_pos + Vector2(8, 6))
		_spawn_pickup(PickupActor.Type.WOOD, 1, c_pos + Vector2(0, -8))
	if GameState.is_leather_and_armor_crafting_unlocked() and randf() < 0.65:
		_spawn_pickup(PickupActor.Type.LEATHER, 1, c_pos + Vector2(10, -4))
	if randf() < 0.5:
		_spawn_pickup(PickupActor.Type.BOMB, 1, c_pos + Vector2(0, 10))
	_save_current_room_state()
	_prompt_temp_buff_choice()


# ---------------- ELECCION DE MEJORA TEMPORAL (1 DE 3) ----------------

func _prompt_temp_buff_choice() -> void:
	if buff_choice_overlay.visible or summary_overlay.visible:
		return
	_current_buff_choices = GameState.pick_random_temp_buff_choices(3)
	for i in range(buff_choice_buttons.size()):
		var btn := buff_choice_buttons[i]
		if i < _current_buff_choices.size():
			var b_info: Dictionary = _current_buff_choices[i]
			var stacks := GameState.get_temp_buff_stacks(String(b_info["id"]))
			btn.text = "%s (NV.%d)\n%s" % [b_info["name"], stacks + 1, b_info["desc"]]
			if ResourceLoader.exists(String(b_info["icon"])):
				btn.icon = load(String(b_info["icon"]))
			btn.visible = true
		else:
			btn.visible = false
	get_tree().paused = true
	buff_choice_overlay.visible = true


func _on_buff_choice_selected(index: int) -> void:
	if index >= 0 and index < _current_buff_choices.size():
		var chosen: Dictionary = _current_buff_choices[index]
		var buff_id := String(chosen["id"])
		GameState.add_temp_buff(buff_id)
		if buff_id == "ancient_heart" and is_instance_valid(player):
			player.heal(25.0)
		_show_banner("BENDICION - %s" % chosen["name"])
	buff_choice_overlay.visible = false
	get_tree().paused = false


# ---------------- BUCLE PRINCIPAL (_process) Y TRANSICION POR 4 PUERTAS ----------------

func _process(delta: float) -> void:
	if not get_tree().paused:
		_env_clock += delta
		_door_cooldown = maxf(0.0, _door_cooldown - delta)
		_update_camp_worker(delta)
		_update_placed_bombs(delta)
		_check_room_interactables()

	if _banner_timer > 0.0:
		_banner_timer -= delta
		if _banner_timer <= 0.0 and is_instance_valid(lbl_banner):
			lbl_banner.text = ""

	for i in range(floating_texts.size() - 1, -1, -1):
		floating_texts[i]["pos"] += Vector2(0, -18.0 * delta)
		floating_texts[i]["ttl"] -= delta
		if floating_texts[i]["ttl"] <= 0.0:
			floating_texts.remove_at(i)

	queue_redraw()
	if map_overlay.visible and is_instance_valid(map_canvas):
		map_canvas.queue_redraw()
	if wardrobe_overlay.visible and is_instance_valid(wardrobe_preview_ctrl):
		wardrobe_preview_ctrl.queue_redraw()

	if get_tree().paused or not is_instance_valid(player):
		return

	if game_mode == GameMode.CAMP_IDLE:
		if player.global_position.distance_to(EXIT_SINGLE_POS) <= 15.0:
			_start_expedition(GameState.selected_depth)
		return

	if game_mode == GameMode.EXPEDITION and room_state == RoomState.CLEARED and _door_cooldown <= 0.0:
		# Si estamos en la sala del jefe y ya fue derrotado, el portal central completa el piso
		if current_room_type == RoomType.BOSS and boss_defeated_on_floor:
			if player.global_position.distance_to(BOSS_PORTAL_POS) <= 16.0:
				_save_current_room_state()
				room_state = RoomState.COMPLETED
				_show_expedition_summary(true)
				return

		# Comprobar las 4 puertas cardinales (Norte, Sur, Oeste, Este) para avanzar o volver a salas previas
		var door_checks := [
			{"dir": Vector2i(0, -1), "pos": DOOR_NORTH_POS},
			{"dir": Vector2i(0, 1),  "pos": DOOR_SOUTH_POS},
			{"dir": Vector2i(-1, 0), "pos": DOOR_WEST_POS},
			{"dir": Vector2i(1, 0),  "pos": DOOR_EAST_POS},
		]
		for dc in door_checks:
			var n_coord: Vector2i = current_room_coord + dc["dir"]
			if floor_rooms.has(n_coord) and player.global_position.distance_to(dc["pos"]) <= 15.0:
				_enter_room_at(n_coord, dc["dir"])
				return


func _update_placed_bombs(delta: float) -> void:
	for i in range(placed_bombs.size() - 1, -1, -1):
		var b: Dictionary = placed_bombs[i]
		if not b["exploded"]:
			b["timer"] -= delta
			if b["timer"] <= 0.0:
				_detonate_bomb(b)
		else:
			b["blast_alpha"] -= delta * 2.8
			if b["blast_alpha"] <= 0.0:
				placed_bombs.remove_at(i)


func _update_camp_worker(delta: float) -> void:
	if not is_instance_valid(_worker_spr) or not _worker_spr.visible:
		return
	var mine_pos := Vector2(80, 116)
	var chest_pos := Vector2(170, 150)
	var target := mine_pos if _worker_going_to_mine else chest_pos
	var to_t := target - _worker_pos
	if to_t.length() <= 3.0:
		_worker_going_to_mine = not _worker_going_to_mine
	else:
		var dir := to_t.normalized()
		_worker_pos += dir * 24.0 * delta
		_worker_spr.position = _worker_pos
		var row := 3 if _worker_going_to_mine else 7
		var col := int(_env_clock * 6.0) % 4
		_worker_spr.frame_coords = Vector2i(col, row)


func _on_player_died() -> void:
	room_state = RoomState.UNEXPLORED
	_show_banner("CAISTE EN COMBATE")
	get_tree().create_timer(1.1, false).timeout.connect(func():
		if is_instance_valid(self) and game_mode == GameMode.EXPEDITION:
			_show_expedition_summary(false)
	)


func _show_expedition_summary(victory: bool) -> void:
	get_tree().paused = true
	summary_overlay.visible = true
	if victory:
		lbl_summary_title.text = "VICTORIA PISO %d!" % expedition_depth
		lbl_summary_title.modulate = Color(0.45, 1.0, 0.55)
		btn_summary_retry.text = "SIGUIENTE PISO %d" % GameState.selected_depth
	else:
		lbl_summary_title.text = "EXPEDICION FINALIZADA"
		lbl_summary_title.modulate = Color(1.0, 0.55, 0.45)
		btn_summary_retry.text = "REINTENTAR PISO %d" % expedition_depth

	lbl_summary_body.text = (
		"BOTIN PERMANENTE GUARDADO\n\n"
		+ "- ORO OBTENIDO   +%d G\n" % run_gold_earned
		+ "- HIERRO         +%d FE\n" % run_iron_earned
		+ "- MADERA         +%d MAD\n" % run_wood_earned
		+ "- CUERO          +%d CUE\n" % run_leather_earned
		+ "- ESENCIA        +%d ESE\n\n" % run_essence_earned
		+ "MISIONES COMPLETADAS  %d/5" % GameState.current_quest_index
	)


func _toggle_pause_menu() -> void:
	var new_paused := not get_tree().paused
	get_tree().paused = new_paused
	pause_overlay.visible = new_paused
	btn_pause_retreat.visible = (game_mode == GameMode.EXPEDITION)


func _toggle_quests_overlay() -> void:
	var open := not quests_overlay.visible
	quests_overlay.visible = open
	get_tree().paused = open
	if open:
		_refresh_quests_ui()


var _wardrobe_return_to_menu: bool = false

func _toggle_wardrobe_overlay(from_main_menu: bool = false) -> void:
	var open := not wardrobe_overlay.visible
	if open:
		_wardrobe_return_to_menu = from_main_menu
		if from_main_menu:
			main_menu_overlay.visible = false
		else:
			get_tree().paused = true
		wardrobe_overlay.visible = true
		_refresh_wardrobe_ui()
		if is_instance_valid(wardrobe_preview_ctrl):
			wardrobe_preview_ctrl.queue_redraw()
	else:
		wardrobe_overlay.visible = false
		if _wardrobe_return_to_menu:
			main_menu_overlay.visible = true
			_wardrobe_return_to_menu = false
		else:
			get_tree().paused = false


func _refresh_wardrobe_ui() -> void:
	for key in ["archetype", "skin", "hair", "cloth", "eyes"]:
		if wardrobe_value_labels.has(key) and is_instance_valid(wardrobe_value_labels[key]):
			var lbl: Label = wardrobe_value_labels[key]
			lbl.text = GameState.get_appearance_label(key)


func _draw_wardrobe_preview(ctrl: Control) -> void:
	var rect := Rect2(Vector2.ZERO, ctrl.size)
	ctrl.draw_rect(rect, Color(0.05, 0.06, 0.09, 0.96))
	ctrl.draw_rect(rect, Color(0.32, 0.39, 0.54, 1.0), false, 1.0)

	# Pedestal luminoso bajo el personaje
	var ped_center := Vector2(rect.size.x * 0.5, rect.size.y * 0.48)
	ctrl.draw_circle(ped_center + Vector2(0, 15), 22.0, Color(0.22, 0.38, 0.58, 0.38))
	ctrl.draw_arc(ped_center + Vector2(0, 15), 23.0, 0.0, TAU, 28, Color(0.45, 0.78, 1.0, 0.65), 1.5)

	var tex: Texture2D = GameState.custom_player_texture if GameState.custom_player_texture else tex_warrior
	if tex:
		var t_sec := float(Time.get_ticks_msec()) / 1000.0
		# Alterna entre caminata y ataque para ver como lucen todas las capas en accion
		var cycle := int(t_sec * 6.0) % 8
		var col := cycle % 4
		var dir_row := (int(t_sec * 0.65) % 4) * 2 # Filas cardinales 0, 2, 4, 6
		var src := Rect2(col * 32, dir_row * 32, 32, 32)
		var dst_sz := Vector2(96, 96)
		var dst := Rect2(ped_center - dst_sz * 0.5, dst_sz)
		ctrl.draw_texture_rect_region(tex, dst, src)

	ctrl.draw_string(
		font_ui,
		Vector2(8, 13),
		"VISTA EN VIVO",
		HORIZONTAL_ALIGNMENT_LEFT,
		-1,
		6,
		Color(0.70, 0.86, 1.0)
	)
	ctrl.draw_string(
		font_ui,
		Vector2(6, rect.size.y - 6),
		"CAPAS PIXEL-ART",
		HORIZONTAL_ALIGNMENT_LEFT,
		-1,
		6,
		Color(0.95, 0.85, 0.45)
	)


func _on_quest_completed(_q_idx: int, title: String, _unlock_desc: String) -> void:
	_show_banner("HITO COMPLETADO - %s!" % title)
	if is_instance_valid(player):
		_spawn_floating_text(player.global_position + Vector2(-28, -22), "HITO!", Color(0.45, 1.0, 0.65))


func _spawn_floating_text(pos: Vector2, text: String, col: Color) -> void:
	floating_texts.append({
		"pos": pos,
		"text": text,
		"color": col,
		"ttl": 0.80
	})
	queue_redraw()


# ---------------- MAPA DETALLADO CON TAB (ESTILO ISAAC) ----------------

func _toggle_map_overlay() -> void:
	if game_mode != GameMode.EXPEDITION:
		return
	_save_current_room_state()
	var open := not map_overlay.visible
	map_overlay.visible = open
	get_tree().paused = open
	if open:
		selected_map_coord = current_room_coord
		_refresh_map_detail_panel()
		map_canvas.queue_redraw()


func _get_room_uncollected_summary(c: Vector2i) -> Dictionary:
	var result := {
		"has_any": false,
		"locked_chests": 0,
		"gold": 0,
		"materials": 0,
		"hearts": 0,
		"keys": 0,
		"bombs": 0,
		"rocks": 0,
		"shrine_ready": false,
		"lines": []
	}
	if not floor_rooms.has(c):
		return result
	var r_data: Dictionary = floor_rooms[c]
	if not bool(r_data["visited"]):
		return result

	for ch in r_data["chests"]:
		if not bool(ch["opened"]):
			result["locked_chests"] += 1
	for rk in r_data["rocks"]:
		if not bool(rk["destroyed"]):
			result["rocks"] += 1
	if r_data["type"] == RoomType.REST and not bool(r_data["shrine_used"]):
		result["shrine_ready"] = true

	var iron_cnt := 0
	var wood_cnt := 0
	var leather_cnt := 0
	var essence_cnt := 0
	for p in r_data["pickups"]:
		var amt := int(p["amount"])
		match int(p["type"]):
			PickupActor.Type.GOLD:
				result["gold"] += amt
			PickupActor.Type.IRON:
				iron_cnt += amt
				result["materials"] += amt
			PickupActor.Type.WOOD:
				wood_cnt += amt
				result["materials"] += amt
			PickupActor.Type.LEATHER:
				leather_cnt += amt
				result["materials"] += amt
			PickupActor.Type.ESSENCE:
				essence_cnt += amt
				result["materials"] += amt
			PickupActor.Type.HEART:
				result["hearts"] += 1
			PickupActor.Type.KEY:
				result["keys"] += amt
			PickupActor.Type.BOMB:
				result["bombs"] += amt

	var lines: Array[String] = []
	if result["locked_chests"] > 0:
		lines.append("- %d COFRE DORADO SIN ABRIR" % result["locked_chests"])
	if result["shrine_ready"]:
		lines.append("- HOGUERA CURATIVA DISPONIBLE (+45% HP)")
	if result["gold"] > 0:
		lines.append("- %d ORO EN EL SUELO" % result["gold"])
	if iron_cnt > 0 or wood_cnt > 0 or leather_cnt > 0 or essence_cnt > 0:
		var m_parts: Array[String] = []
		if iron_cnt > 0:
			m_parts.append("%d FE" % iron_cnt)
		if wood_cnt > 0:
			m_parts.append("%d MAD" % wood_cnt)
		if leather_cnt > 0:
			m_parts.append("%d CUE" % leather_cnt)
		if essence_cnt > 0:
			m_parts.append("%d ESE" % essence_cnt)
		lines.append("- MATERIALES: " + ", ".join(m_parts))
	if result["hearts"] > 0:
		lines.append("- %d POCION/CORAZON EN EL SUELO" % result["hearts"])
	if result["keys"] > 0:
		lines.append("- %d LLAVE EN EL SUELO" % result["keys"])
	if result["bombs"] > 0:
		lines.append("- %d BOMBA EN EL SUELO" % result["bombs"])
	if result["rocks"] > 0:
		lines.append("- %d ROCAS AGRIETADAS (USA BOMBA E)" % result["rocks"])

	result["lines"] = lines
	result["has_any"] = (
		result["locked_chests"] > 0
		or result["shrine_ready"]
		or result["gold"] > 0
		or result["materials"] > 0
		or result["hearts"] > 0
		or result["keys"] > 0
		or result["bombs"] > 0
	)
	return result


func _refresh_map_detail_panel() -> void:
	if not floor_rooms.has(selected_map_coord):
		return
	var r_data: Dictionary = floor_rooms[selected_map_coord]
	var r_type: RoomType = r_data["type"]
	var visited := bool(r_data["visited"])
	var cleared := bool(r_data["cleared"])

	lbl_map_room_title.text = "SALA (%d,%d) - %s" % [
		selected_map_coord.x, selected_map_coord.y, _room_type_label(r_type)
	]

	if not visited:
		lbl_map_room_details.text = (
			"ESTADO: DESCUBIERTA (SIN VISITAR)\n\n"
			+ "ENTRA POR UNA SALA VECINA DESPEJADA\n"
			+ "PARA REVELAR SU CONTENIDO."
		)
	else:
		var summary := _get_room_uncollected_summary(selected_map_coord)
		var st_txt := "DESPEJADA" if cleared else "EN COMBATE"
		var body := "ESTADO: %s\n\nOBJETOS SIN RECOLECTAR:\n" % st_txt
		var lines: Array = summary["lines"]
		if lines.is_empty():
			body += "- SALA COMPLETAMENTE LIMPIA (NADA PENDIENTE)"
		else:
			body += "\n".join(lines)
		lbl_map_room_details.text = body

	var can_fast_travel := (
		room_state == RoomState.CLEARED
		and cleared
		and selected_map_coord != current_room_coord
	)
	btn_map_travel.disabled = not can_fast_travel
	if selected_map_coord == current_room_coord:
		btn_map_travel.text = "ESTAS EN ESTA SALA"
	elif can_fast_travel:
		btn_map_travel.text = "IR A ESTA SALA (%d,%d)" % [selected_map_coord.x, selected_map_coord.y]
	else:
		btn_map_travel.text = "DESPEJA PARA VIAJAR"


func _draw_detailed_map_canvas(ctrl: Control) -> void:
	var rect := Rect2(Vector2.ZERO, ctrl.size)
	ctrl.draw_rect(rect, Color(0.05, 0.06, 0.09, 0.96))
	ctrl.draw_rect(rect, Color(0.28, 0.34, 0.46, 1.0), false, 1.0)

	var center := rect.size * 0.5 + Vector2(0, -6)
	var cell_size := Vector2(32, 24)
	var step := Vector2(40, 32)

	# 1. Dibujar pasillos / puertas entre salas descubiertas
	for c in floor_rooms.keys():
		var r_data: Dictionary = floor_rooms[c]
		if not bool(r_data["discovered"]):
			continue
		var p1 := center + Vector2(c.x * step.x, c.y * step.y)
		for d in [Vector2i(1, 0), Vector2i(0, 1)]:
			var nc: Vector2i = c + d
			if floor_rooms.has(nc) and bool(floor_rooms[nc]["discovered"]):
				var p2 := center + Vector2(nc.x * step.x, nc.y * step.y)
				ctrl.draw_line(p1, p2, Color(0.50, 0.58, 0.72, 0.9), 3.0)

	# 2. Dibujar cada sala descubierta con sus iconos de tipo e iconos de objetos sin recolectar
	for c in floor_rooms.keys():
		var r_data: Dictionary = floor_rooms[c]
		if not bool(r_data["discovered"]):
			continue
		var pos := center + Vector2(c.x * step.x, c.y * step.y) - cell_size * 0.5
		var c_rect := Rect2(pos, cell_size)
		var visited := bool(r_data["visited"])
		var cleared := bool(r_data["cleared"])
		var r_type: RoomType = r_data["type"]

		var bg_col := Color(0.14, 0.16, 0.22, 0.95)
		if c == current_room_coord:
			bg_col = Color(0.32, 0.44, 0.65, 1.0)
		elif visited and cleared:
			bg_col = Color(0.22, 0.26, 0.34, 0.98)

		var border_col := Color(0.45, 0.52, 0.66, 1.0)
		if r_type == RoomType.BOSS:
			border_col = Color(1.0, 0.35, 0.35, 1.0)
		elif r_type == RoomType.TREASURE:
			border_col = Color(1.0, 0.85, 0.30, 1.0)
		elif r_type == RoomType.REST:
			border_col = Color(0.45, 0.95, 0.55, 1.0)
		elif r_type == RoomType.ELITE:
			border_col = Color(0.85, 0.45, 1.0, 1.0)

		if c == selected_map_coord:
			border_col = Color(1.0, 0.96, 0.55, 1.0)

		ctrl.draw_rect(c_rect, bg_col)
		ctrl.draw_rect(c_rect, border_col, false, 2.0 if c == selected_map_coord else 1.0)

		# Icono del tipo de sala (esquina superior izquierda de la celda)
		if r_type == RoomType.BOSS:
			ctrl.draw_texture_rect(tex_skull_icon, Rect2(pos + Vector2(2, 2), Vector2(9, 9)), false, Color(1.0, 0.45, 0.45))
		elif r_type == RoomType.TREASURE:
			ctrl.draw_texture_rect(tex_chest_closed, Rect2(pos + Vector2(2, 2), Vector2(9, 9)), false)
		elif r_type == RoomType.REST:
			ctrl.draw_texture_rect(tex_heart_icon, Rect2(pos + Vector2(2, 2), Vector2(9, 9)), false)
		elif r_type == RoomType.ELITE:
			ctrl.draw_texture_rect(tex_sword_icon, Rect2(pos + Vector2(2, 2), Vector2(9, 9)), false, Color(0.9, 0.55, 1.0))
		elif r_type == RoomType.START:
			ctrl.draw_string(font_ui, pos + Vector2(3, 9), "IN", HORIZONTAL_ALIGNMENT_LEFT, -1, 6, Color(0.75, 0.95, 1.0))

		if not visited:
			ctrl.draw_string(font_ui, pos + Vector2(13, 16), "?", HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color(0.75, 0.80, 0.90))
		else:
			# Dibujar mini-iconos de objetos sin recolectar dentro de la celda (estilo Isaac Tab Map)
			var summary := _get_room_uncollected_summary(c)
			var icon_list: Array[Texture2D] = []
			if summary["locked_chests"] > 0:
				icon_list.append(tex_chest_closed)
			if summary["gold"] > 0:
				icon_list.append(tex_gold_icon)
			if summary["materials"] > 0:
				icon_list.append(tex_iron_icon)
			if summary["hearts"] > 0 or summary["shrine_ready"]:
				icon_list.append(tex_heart_icon)
			if summary["keys"] > 0:
				icon_list.append(tex_key_icon)
			if summary["bombs"] > 0:
				icon_list.append(tex_bomb_icon)

			for idx in range(mini(3, icon_list.size())):
				ctrl.draw_texture_rect(icon_list[idx], Rect2(pos + Vector2(3 + idx * 9, 13), Vector2(8, 8)), false)

		if c == current_room_coord:
			ctrl.draw_circle(pos + Vector2(cell_size.x - 5, 5), 2.5, Color(0.45, 1.0, 0.55))

	ctrl.draw_string(
		font_ui,
		Vector2(6, rect.size.y - 5),
		"CLIC EN SALA: VER DETALLE / VIAJAR",
		HORIZONTAL_ALIGNMENT_LEFT,
		-1,
		6,
		Color(0.70, 0.82, 0.95)
	)


func _on_map_canvas_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var mb := event as InputEventMouseButton
		var center := map_canvas.size * 0.5 + Vector2(0, -6)
		var cell_size := Vector2(32, 24)
		var step := Vector2(40, 32)
		for c in floor_rooms.keys():
			if not bool(floor_rooms[c]["discovered"]):
				continue
			var pos := center + Vector2(c.x * step.x, c.y * step.y) - cell_size * 0.5
			var c_rect := Rect2(pos, cell_size)
			if c_rect.has_point(mb.position):
				if selected_map_coord == c and room_state == RoomState.CLEARED and bool(floor_rooms[c]["cleared"]) and c != current_room_coord:
					_toggle_map_overlay()
					_enter_room_at(c, Vector2i.ZERO)
					return
				selected_map_coord = c
				_refresh_map_detail_panel()
				map_canvas.queue_redraw()
				return


# ---------------- VENTANAS DE INFORMACION CONTEXTUAL (BOTONES "i") ----------------

func _open_info_modal(topic: String, from_main_menu: bool = false) -> void:
	_info_return_to_menu = from_main_menu
	if from_main_menu:
		main_menu_overlay.visible = false
	else:
		get_tree().paused = true
	info_overlay.visible = true

	match topic:
		"general":
			lbl_info_title.text = "GUIA DEL JUEGO"
			lbl_info_body.text = (
				"CONTROLES PRINCIPALES\n"
				+ "- WASD O FLECHAS   MOVER EN 8 DIRECCIONES\n"
				+ "- CLICK IZQUIERDO  ATACAR CON ESPADA AL CURSOR\n"
				+ "- ESPACIO          ESQUIVA CON I-FRAMES\n"
				+ "- TECLA Q          EXPLOSION EN AREA\n"
				+ "- TECLA E          PONER BOMBA EN EL SUELO\n"
				+ "- TECLA TAB        MAPA DETALLADO DEL PISO\n"
				+ "- TECLA C          ARMARIO Y CAPAS DE SKIN\n"
				+ "- TECLA M          REGISTRO DE 5 MISIONES\n\n"
				+ "MAPA Y EXPLORACION LIBRE\n"
				+ "- PUEDES VOLVER A CUALQUIER HABITACION POR LAS\n"
				+ "  4 PUERTAS O CON EL MAPA (TAB) PARA RECOGER\n"
				+ "  OBJETOS, COFRES O USAR HOGUERAS."
			)
		"combat":
			var buff_lines := "NINGUNA ACTIVA"
			if not GameState.active_temp_buffs.is_empty():
				var parts: Array[String] = []
				for b_info in GameState.TEMP_BUFF_CATALOG:
					var st := GameState.get_temp_buff_stacks(String(b_info["id"]))
					if st > 0:
						parts.append("%s X%d" % [b_info["name"], st])
				buff_lines = ", ".join(parts)
			lbl_info_title.text = "ESTADISTICAS Y RUN"
			lbl_info_body.text = (
				"ATRIBUTOS ACTUALES DEL GUERRERO\n"
				+ "- VIDA MAXIMA      %d HP\n" % int(round(GameState.get_max_hp()))
				+ "- DANO POR GOLPE   %d ATK\n" % int(round(GameState.get_player_damage()))
				+ "- VEL. DE ATAQUE   %.2f GOLPES/SEG\n" % GameState.get_attacks_per_second()
				+ "- VEL. MOVIMIENTO  %d\n" % int(round(GameState.get_move_speed()))
				+ "- DEFENSA          %.1f\n" % GameState.get_defense()
				+ "- BONO DE ORO      X%.2f\n\n" % GameState.get_gold_multiplier(true)
				+ "BENDICIONES DE ESTA EXPEDICION\n"
				+ "- %s" % buff_lines
			)
		"materials":
			lbl_info_title.text = "MATERIALES Y BOTIN"
			lbl_info_body.text = (
				"RECURSOS DE EXPEDICION\n"
				+ "- LLAVES   ABREN COFRES DORADOS DE SALA\n"
				+ "- BOMBAS   TECLA E. ROMPEN ROCAS Y DANAN\n\n"
				+ "DESBLOQUEO DE LOS 4 MATERIALES\n"
				+ "- HIERRO FE    MISION 1 EN ROCAS, M.2 ENEMIGOS\n"
				+ "- MADERA MAD   MISION 1 EN ROCAS, M.2 ENEMIGOS\n"
				+ "- CUERO CUE    MISION 4 AL DERROTAR BESTIAS\n"
				+ "- ESENCIA ESE  MISION 5 AL VENCER AL JEFE"
			)
		"idle":
			var rate_min := GameState.get_idle_gold_per_second() * 60.0
			var fe_status := "ACTIVO EN NV.5" if GameState.idle_generator_level >= 5 else "SE ACTIVA EN NV.5"
			lbl_info_title.text = "ECONOMIA IDLE"
			lbl_info_body.text = (
				"MINA Y HERRERIA DEL CAMPAMENTO\n"
				+ "- NIVEL ACTUAL     NV.%d\n" % GameState.idle_generator_level
				+ "- PRODUCCION       %.1f ORO POR MINUTO\n" % rate_min
				+ "- HIERRO PASIVO    %s\n\n" % fe_status
				+ "PROGRESO OFFLINE\n"
				+ "- AL CERRAR EL JUEGO ACUMULAS ORO HASTA\n"
				+ "  UN TOPE DE 8 HORAS.\n"
				+ "- MEJORAR EL AMULETO MULTIPLICA TANTO EL ORO\n"
				+ "  DE MAZMORRA COMO EL ORO PASIVO."
			)
		"equipment":
			var lines: Array[String] = ["ESTADO DETALLADO DE TUS 5 PIEZAS\n"]
			for slot in ["sword", "gloves", "boots", "armor", "amulet"]:
				var it: Dictionary = GameState.equipment[slot]
				var t_idx := clampi(int(it["tier"]), 0, GameState.TIER_NAMES.size() - 1)
				var t_name: String = String(GameState.TIER_NAMES[t_idx]).to_upper()
				var rec_txt := GameState.get_evolution_recipe_short_text(slot)
				lines.append("- %s %s NV.%d  EVO CADA 5 NV CON %s" % [
					String(it["name"]).to_upper(), t_name, int(it["level"]), rec_txt
				])
			lines.append("\nHITOS DE EVOLUCION")
			lines.append("- CADA 5 NIVELES LA PIEZA PIDE MATERIALES DE")
			lines.append("  MAZMORRA Y CAMBIA DE TIER E ICONO.")
			lines.append("- MISION 3 HABILITA ESPADA, M.4 ARMADURA Y")
			lines.append("  MISION 5 HABILITA AMULETO Y TIERS ALTOS.")
			lbl_info_title.text = "FORJA Y EVOLUCION"
			lbl_info_body.text = "\n".join(lines)


func _close_info_modal() -> void:
	info_overlay.visible = false
	if _info_return_to_menu:
		main_menu_overlay.visible = true
	else:
		get_tree().paused = false


# ---------------- DIBUJADO DEL MUNDO, 4 PUERTAS Y MINIMAPA ISAAC ----------------

func _draw() -> void:
	draw_rect(Rect2(0, 0, 640, 360), Color(0.06, 0.06, 0.08))

	var x0 := int(ARENA_RECT.position.x)
	var y0 := int(ARENA_RECT.position.y)
	var cols := int(ARENA_RECT.size.x / 16.0)
	var rows := int(ARENA_RECT.size.y / 16.0)

	if game_mode in [GameMode.CAMP_IDLE, GameMode.MAIN_MENU]:
		for cx in range(cols):
			for ry in range(rows):
				var dst := Rect2(x0 + cx * 16, y0 + ry * 16, 16, 16)
				var is_plaza := (cx >= 3 and cx <= 21 and ry >= 3 and ry <= 14)
				var src := Rect2(256, 16, 16, 16) if is_plaza else Rect2(16, 96, 16, 16)
				draw_texture_rect_region(tex_floors, dst, src)

		for cx in range(cols):
			draw_texture_rect_region(tex_dungeon, Rect2(x0 + cx * 16, y0 - 16, 16, 16), Rect2(80, 0, 16, 16))
			draw_texture_rect_region(tex_dungeon, Rect2(x0 + cx * 16, y0, 16, 16), Rect2(80, 16, 16, 16))
		draw_rect(ARENA_RECT, Color(0.32, 0.42, 0.28), false, 1.5)

		var anvil_src := Rect2(0, 20, 72, 64)
		if GameState.idle_generator_level >= 5:
			anvil_src = Rect2(172, 8, 98, 92)
		elif GameState.idle_generator_level >= 3:
			anvil_src = Rect2(76, 16, 88, 72)
		draw_texture_rect_region(tex_anvil, Rect2(48, 80, anvil_src.size.x, anvil_src.size.y), anvil_src)

		draw_texture_rect(tex_chest_open, Rect2(170, 140, 16, 16), false)
		var bf_frame := int(_env_clock * 6.0) % 4
		draw_texture_rect_region(tex_bonfire_base, Rect2(208, 170, 32, 32), Rect2(bf_frame * 32, 0, 32, 32))
		draw_texture_rect_region(tex_bonfire_fire, Rect2(208, 154, 32, 48), Rect2(bf_frame * 32, 0, 32, 48))

		# Tablero de Misiones limpio (solo icono + insignia corta M)
		draw_texture_rect(tex_quest_icon, Rect2(264, 136, 16, 16), false)
		draw_string(font_ui, Vector2(268, 132), "M", HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color(1.0, 0.92, 0.55))

		# Estacion del Armario en el campamento (icono + insignia corta C)
		draw_texture_rect(tex_wardrobe_icon, Rect2(264, 204, 16, 16), false)
		draw_string(font_ui, Vector2(268, 200), "C", HORIZONTAL_ALIGNMENT_LEFT, -1, 7, Color(0.65, 0.92, 1.0))

		# Portal a la mazmorra
		var portal_rect := Rect2(ARENA_RECT.end.x - 12, EXIT_SINGLE_POS.y - 20, 12, 40)
		draw_rect(portal_rect, Color(0.35, 0.75, 1.0, 0.85))
		draw_arc(EXIT_SINGLE_POS, 16.0 + sin(_env_clock * 4.0) * 2.0, 0.0, TAU, 24, Color(0.45, 0.85, 1.0, 0.75), 1.5)
	else:
		for cx in range(cols):
			for ry in range(rows):
				var dst := Rect2(x0 + cx * 16, y0 + ry * 16, 16, 16)
				draw_texture_rect_region(tex_floors, dst, Rect2(256, 16, 16, 16))
		for cx in range(cols):
			draw_texture_rect_region(tex_dungeon, Rect2(x0 + cx * 16, y0 - 16, 16, 16), Rect2(80, 0, 16, 16))
			draw_texture_rect_region(tex_dungeon, Rect2(x0 + cx * 16, y0, 16, 16), Rect2(80, 16, 16, 16))
		draw_rect(ARENA_RECT, Color(0.25, 0.28, 0.34), false, 1.5)

		if current_room_type == RoomType.REST:
			var bf_frame := int(_env_clock * 6.0) % 4
			draw_texture_rect_region(tex_bonfire_base, Rect2(208, 180, 32, 32), Rect2(bf_frame * 32, 0, 32, 32))
			if not rest_shrine_used:
				draw_texture_rect_region(tex_bonfire_fire, Rect2(208, 164, 32, 48), Rect2(bf_frame * 32, 0, 32, 48))
				draw_arc(Vector2(224, 196), 22.0, 0.0, TAU, 24, Color(0.4, 1.0, 0.55, 0.45), 1.2)

		for rock in cracked_rocks:
			if not rock["destroyed"]:
				var rp: Vector2 = rock["pos"]
				draw_texture_rect(tex_rock_icon, Rect2(rp.x - 8, rp.y - 8, 16, 16), false)
				draw_rect(Rect2(rp.x - 8, rp.y - 8, 16, 16), Color(1.0, 0.65, 0.3, 0.35), false, 1.0)

		for chest in room_chests:
			var cp: Vector2 = chest["pos"]
			var c_tex := tex_chest_open if chest["opened"] else tex_chest_closed
			draw_texture_rect(c_tex, Rect2(cp.x - 8, cp.y - 8, 16, 16), false)
			if not chest["opened"] and chest["locked"]:
				draw_texture_rect(tex_key_icon, Rect2(cp.x - 4, cp.y - 18, 8, 8), false)

		for b in placed_bombs:
			var bp: Vector2 = b["pos"]
			if not b["exploded"]:
				var flash := 1.0 if int(_env_clock * 14.0) % 2 == 0 else 0.45
				draw_texture_rect(tex_bomb_icon, Rect2(bp.x - 8, bp.y - 8, 16, 16), false, Color(1.0, flash, flash))
				draw_arc(bp, 58.0, 0.0, TAU, 28, Color(1.0, 0.4, 0.2, 0.25), 1.0)
			else:
				var alpha := clampf(float(b["blast_alpha"]), 0.0, 1.0)
				draw_circle(bp, 58.0 * (1.1 - alpha * 0.3), Color(1.0, 0.6, 0.2, alpha * 0.45))
				draw_arc(bp, 58.0, 0.0, TAU, 32, Color(1.0, 0.85, 0.35, alpha), 2.0)

		# Dibujar las 4 puertas cardinales con sprites detallados
		_draw_room_doors()

		# Si estamos en la sala del jefe y ya fue derrotado, dibujar el portal de salida del piso
		if current_room_type == RoomType.BOSS and boss_defeated_on_floor:
			draw_circle(BOSS_PORTAL_POS, 14.0 + sin(_env_clock * 5.0) * 2.0, Color(0.35, 0.85, 1.0, 0.45))
			draw_arc(BOSS_PORTAL_POS, 16.0, 0.0, TAU, 24, Color(0.55, 0.95, 1.0, 0.95), 2.0)
			draw_string(font_ui, BOSS_PORTAL_POS + Vector2(-30, -18), "FIN PISO", HORIZONTAL_ALIGNMENT_LEFT, -1, 6, Color(0.65, 0.98, 1.0))

		# Minimapa estilo Isaac en la esquina superior derecha de la arena
		_draw_isaac_minimap()

	for ft in floating_texts:
		draw_string(font_ui, ft["pos"], String(ft["text"]), HORIZONTAL_ALIGNMENT_LEFT, -1, 8, ft["color"])


func _draw_room_doors() -> void:
	var unlocked := (room_state == RoomState.CLEARED)
	var door_defs := [
		{"dir": Vector2i(0, -1), "side": "N", "center": DOOR_NORTH_POS, "lbl_pos": Vector2(DOOR_NORTH_POS.x - 22, ARENA_RECT.position.y + 36)},
		{"dir": Vector2i(0, 1),  "side": "S", "center": DOOR_SOUTH_POS, "lbl_pos": Vector2(DOOR_SOUTH_POS.x - 22, ARENA_RECT.end.y - 18)},
		{"dir": Vector2i(-1, 0), "side": "W", "center": DOOR_WEST_POS,  "lbl_pos": Vector2(ARENA_RECT.position.x + 14, DOOR_WEST_POS.y - 18)},
		{"dir": Vector2i(1, 0),  "side": "E", "center": DOOR_EAST_POS,  "lbl_pos": Vector2(ARENA_RECT.end.x - 60, DOOR_EAST_POS.y - 18)},
	]
	for dd in door_defs:
		var n_coord: Vector2i = current_room_coord + dd["dir"]
		if not floor_rooms.has(n_coord):
			continue
		var n_room: Dictionary = floor_rooms[n_coord]
		var n_type: RoomType = n_room["type"]
		var n_cleared := bool(n_room["cleared"])

		var d_col := Color(0.9, 0.3, 0.3)
		if unlocked:
			if n_type == RoomType.BOSS:
				d_col = Color(1.0, 0.35, 0.35)
			elif n_type == RoomType.TREASURE:
				d_col = Color(1.0, 0.88, 0.28)
			elif n_type == RoomType.REST:
				d_col = Color(0.35, 0.95, 0.55)
			elif n_cleared:
				d_col = Color(0.35, 0.78, 0.95)
			else:
				d_col = Color(0.40, 0.90, 0.45)

		var c_pos: Vector2 = dd["center"]
		var side: String = dd["side"]

		# Renderizar arco/puerta con sprites reales de Dungeon_Tiles / Dungeon_Props
		if side == "N":
			var arch_rect := Rect2(c_pos.x - 16, ARENA_RECT.position.y - 16, 32, 48)
			# Arco de piedra
			draw_texture_rect_region(tex_dungeon, arch_rect, Rect2(0, 96, 32, 48))
			if unlocked:
				# Pasaje abierto: portal o tiniebla interior
				draw_rect(Rect2(c_pos.x - 12, ARENA_RECT.position.y, 24, 18), Color(0.04, 0.05, 0.08, 0.95))
				draw_texture_rect_region(tex_dungeon_props, Rect2(c_pos.x - 8, ARENA_RECT.position.y - 2, 16, 20), Rect2(96, 0, 16, 20), d_col)
			else:
				# Rastrillo cerrado de hierro
				draw_texture_rect_region(tex_dungeon, Rect2(c_pos.x - 16, ARENA_RECT.position.y, 32, 32), Rect2(32, 96, 32, 32))
		elif side == "S":
			var base_rect := Rect2(c_pos.x - 16, ARENA_RECT.end.y - 12, 32, 12)
			draw_rect(base_rect, Color(0.12, 0.14, 0.18))
			if unlocked:
				draw_texture_rect_region(tex_dungeon_props, Rect2(c_pos.x - 8, ARENA_RECT.end.y - 18, 16, 20), Rect2(128, 0, 16, 20), d_col)
			else:
				draw_rect(Rect2(c_pos.x - 16, ARENA_RECT.end.y - 8, 32, 8), Color(0.4, 0.2, 0.2, 0.85))
				draw_rect(Rect2(c_pos.x - 16, ARENA_RECT.end.y - 8, 32, 8), Color(0.85, 0.25, 0.25), false, 1.0)
		else: # Puertas Oeste y Este
			var x_start := ARENA_RECT.position.x - 4 if side == "W" else ARENA_RECT.end.x - 12
			var door_r := Rect2(x_start, c_pos.y - 16, 16, 32)
			draw_rect(door_r, Color(0.12, 0.14, 0.18))
			if unlocked:
				draw_texture_rect_region(tex_dungeon_props, Rect2(x_start, c_pos.y - 10, 16, 20), Rect2(112, 0, 16, 20), d_col)
			else:
				draw_rect(door_r, Color(0.4, 0.2, 0.2, 0.85))
				draw_rect(door_r, Color(0.85, 0.25, 0.25), false, 1.0)

		# Icono indicador del tipo de sala sobre la puerta
		if unlocked:
			var tag := _room_type_label(n_type).substr(0, 4)
			draw_string(font_ui, dd["lbl_pos"], tag, HORIZONTAL_ALIGNMENT_LEFT, -1, 6, d_col.lightened(0.3))


func _draw_isaac_minimap() -> void:
	var map_box := Rect2(ARENA_RECT.end.x - 82, ARENA_RECT.position.y + 4, 78, 58)
	draw_rect(map_box, Color(0.04, 0.05, 0.08, 0.78))
	draw_rect(map_box, Color(0.38, 0.45, 0.62, 0.85), false, 1.0)

	var center := map_box.get_center() + Vector2(0, -3)
	var cell_sz := Vector2(11, 8)
	var step := Vector2(13, 10)

	for c in floor_rooms.keys():
		var r_data: Dictionary = floor_rooms[c]
		if not bool(r_data["discovered"]):
			continue
		var rel: Vector2i = c - current_room_coord
		if absi(rel.x) > 2 or absi(rel.y) > 2:
			continue
		var pos := center + Vector2(rel.x * step.x, rel.y * step.y) - cell_sz * 0.5
		var r_rect := Rect2(pos, cell_sz)
		var visited := bool(r_data["visited"])
		var r_type: RoomType = r_data["type"]

		var col := Color(0.20, 0.23, 0.30, 0.85)
		if c == current_room_coord:
			col = Color(0.95, 0.95, 1.0, 0.98)
		elif visited:
			col = Color(0.46, 0.52, 0.64, 0.92)

		if r_type == RoomType.BOSS and c != current_room_coord:
			col = Color(0.85, 0.25, 0.28, 0.92)
		elif r_type == RoomType.TREASURE and c != current_room_coord:
			col = Color(0.90, 0.75, 0.22, 0.92)
		elif r_type == RoomType.REST and c != current_room_coord:
			col = Color(0.28, 0.80, 0.45, 0.92)

		draw_rect(r_rect, col)

		# Punto indicador estilo Isaac si quedaron objetos/cofres sin recoger en esa habitacion
		if visited:
			var sum_info := _get_room_uncollected_summary(c)
			if bool(sum_info["has_any"]):
				draw_rect(Rect2(pos + Vector2(cell_sz.x - 3, 1), Vector2(2, 2)), Color(1.0, 0.92, 0.25))

	draw_string(font_ui, map_box.position + Vector2(5, map_box.size.y - 3), "TAB:MAPA", HORIZONTAL_ALIGNMENT_LEFT, -1, 6, Color(0.78, 0.88, 1.0))


# ---------------- CONSTRUCCION DE INTERFAZ Y MENUS ----------------

func _make_info_button(topic: String, from_menu: bool = false) -> Button:
	var b := Button.new()
	b.text = "i"
	b.custom_minimum_size = Vector2(15, 14)
	b.add_theme_font_override("font", font_ui)
	b.add_theme_font_size_override("font_size", 7)
	b.focus_mode = Control.FOCUS_NONE
	b.modulate = Color(0.60, 0.90, 1.0)
	b.pressed.connect(func():
		_open_info_modal(topic, from_menu)
	)
	return b


func _build_ui() -> void:
	var canvas := CanvasLayer.new()
	canvas.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(canvas)

	hud_root = Control.new()
	hud_root.theme = _ui_theme
	hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	canvas.add_child(hud_root)

	# Barra superior minimalista sobre la arena
	var top_bar := PanelContainer.new()
	top_bar.position = Vector2(16, 8)
	top_bar.size = Vector2(416, 32)
	hud_root.add_child(top_bar)

	var hbox_top := HBoxContainer.new()
	hbox_top.add_theme_constant_override("separation", 6)
	top_bar.add_child(hbox_top)

	# Titulo de sala/modo con la fuente Blox2
	lbl_room = Label.new()
	lbl_room.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lbl_room.add_theme_font_override("font", font_display)
	lbl_room.add_theme_font_size_override("font_size", 14)
	lbl_room.modulate = Color(1.0, 0.92, 0.55)
	hbox_top.add_child(lbl_room)

	btn_depth_prev = Button.new()
	btn_depth_prev.text = "<"
	btn_depth_prev.custom_minimum_size = Vector2(20, 20)
	btn_depth_prev.focus_mode = Control.FOCUS_NONE
	btn_depth_prev.pressed.connect(func():
		GameState.selected_depth = clampi(GameState.selected_depth - 1, 1, GameState.max_unlocked_depth)
		_update_top_bar_controls()
	)
	hbox_top.add_child(btn_depth_prev)

	lbl_depth_sel = Label.new()
	lbl_depth_sel.add_theme_font_size_override("font_size", 8)
	hbox_top.add_child(lbl_depth_sel)

	btn_depth_next = Button.new()
	btn_depth_next.text = ">"
	btn_depth_next.custom_minimum_size = Vector2(20, 20)
	btn_depth_next.focus_mode = Control.FOCUS_NONE
	btn_depth_next.pressed.connect(func():
		GameState.selected_depth = clampi(GameState.selected_depth + 1, 1, GameState.max_unlocked_depth)
		_update_top_bar_controls()
	)
	hbox_top.add_child(btn_depth_next)

	btn_map_top = Button.new()
	btn_map_top.text = "MAPA"
	btn_map_top.custom_minimum_size = Vector2(48, 20)
	btn_map_top.focus_mode = Control.FOCUS_NONE
	btn_map_top.modulate = Color(0.75, 0.95, 1.0)
	btn_map_top.pressed.connect(_toggle_map_overlay)
	hbox_top.add_child(btn_map_top)

	btn_mode_action = Button.new()
	btn_mode_action.custom_minimum_size = Vector2(80, 20)
	btn_mode_action.icon = tex_sword_icon
	btn_mode_action.expand_icon = true
	btn_mode_action.focus_mode = Control.FOCUS_NONE
	btn_mode_action.pressed.connect(_on_mode_action_pressed)
	hbox_top.add_child(btn_mode_action)

	var btn_wardrobe := Button.new()
	btn_wardrobe.text = "C"
	btn_wardrobe.icon = tex_wardrobe_icon
	btn_wardrobe.expand_icon = true
	btn_wardrobe.custom_minimum_size = Vector2(28, 20)
	btn_wardrobe.focus_mode = Control.FOCUS_NONE
	btn_wardrobe.modulate = Color(0.78, 0.94, 1.0)
	btn_wardrobe.pressed.connect(func():
		_toggle_wardrobe_overlay(false)
	)
	hbox_top.add_child(btn_wardrobe)

	var btn_quests := Button.new()
	btn_quests.text = "M"
	btn_quests.icon = tex_quest_icon
	btn_quests.expand_icon = true
	btn_quests.custom_minimum_size = Vector2(28, 20)
	btn_quests.focus_mode = Control.FOCUS_NONE
	btn_quests.pressed.connect(_toggle_quests_overlay)
	hbox_top.add_child(btn_quests)

	hbox_top.add_child(_make_info_button("general"))

	var btn_pause := Button.new()
	btn_pause.text = "II"
	btn_pause.custom_minimum_size = Vector2(24, 20)
	btn_pause.focus_mode = Control.FOCUS_NONE
	btn_pause.pressed.connect(_toggle_pause_menu)
	hbox_top.add_child(btn_pause)

	# Banner inferior temporal (se esconde tras 2.6 segundos)
	lbl_banner = Label.new()
	lbl_banner.position = Vector2(20, 342)
	lbl_banner.add_theme_font_override("font", font_display)
	lbl_banner.add_theme_font_size_override("font_size", 12)
	lbl_banner.modulate = Color(1.0, 0.9, 0.4)
	hud_root.add_child(lbl_banner)

	# Panel lateral derecho minimalista
	var side_panel := PanelContainer.new()
	side_panel.position = Vector2(444, 8)
	side_panel.size = Vector2(188, 344)
	hud_root.add_child(side_panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 5)
	side_panel.add_child(vbox)

	# 1. Cabecera de Vida + boton "i" de estadisticas/combate
	var hp_row := HBoxContainer.new()
	hp_row.add_theme_constant_override("separation", 4)
	vbox.add_child(hp_row)

	hp_row.add_child(_make_small_icon(tex_heart_icon, 12))
	lbl_hp = Label.new()
	lbl_hp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lbl_hp.add_theme_font_size_override("font_size", 8)
	hp_row.add_child(lbl_hp)
	hp_row.add_child(_make_info_button("combat"))

	bar_hp = ProgressBar.new()
	bar_hp.custom_minimum_size = Vector2(174, 7)
	bar_hp.show_percentage = false
	vbox.add_child(bar_hp)

	# 2. Fila de Recursos de Run (Oro, Llaves, Bombas)
	var res_row1 := HBoxContainer.new()
	res_row1.add_theme_constant_override("separation", 6)
	vbox.add_child(res_row1)

	res_row1.add_child(_make_small_icon(tex_gold_icon, 12))
	lbl_gold = _make_small_label()
	lbl_gold.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	res_row1.add_child(lbl_gold)

	res_row1.add_child(_make_small_icon(tex_key_icon, 12))
	lbl_keys = _make_small_label()
	res_row1.add_child(lbl_keys)

	res_row1.add_child(_make_small_icon(tex_bomb_icon, 12))
	lbl_bombs = _make_small_label()
	res_row1.add_child(lbl_bombs)

	# 3. Fila de los 4 Materiales + boton "i" de materiales
	var res_row2 := HBoxContainer.new()
	res_row2.add_theme_constant_override("separation", 4)
	vbox.add_child(res_row2)

	res_row2.add_child(_make_small_icon(tex_iron_icon, 11))
	lbl_iron = _make_small_label()
	res_row2.add_child(lbl_iron)

	res_row2.add_child(_make_small_icon(tex_wood_icon, 11))
	lbl_wood = _make_small_label()
	res_row2.add_child(lbl_wood)

	res_row2.add_child(_make_small_icon(tex_leather_icon, 11))
	lbl_leather = _make_small_label()
	res_row2.add_child(lbl_leather)

	res_row2.add_child(_make_small_icon(tex_essence_icon, 11))
	lbl_essence = _make_small_label()
	lbl_essence.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	res_row2.add_child(lbl_essence)

	res_row2.add_child(_make_info_button("materials"))

	# 4. Boton compacto de Mision Activa (1 sola linea limpia)
	btn_active_quest = Button.new()
	btn_active_quest.custom_minimum_size = Vector2(174, 20)
	btn_active_quest.icon = tex_quest_icon
	btn_active_quest.expand_icon = true
	btn_active_quest.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn_active_quest.add_theme_font_size_override("font_size", 7)
	btn_active_quest.focus_mode = Control.FOCUS_NONE
	btn_active_quest.modulate = Color(1.0, 0.95, 0.65)
	btn_active_quest.pressed.connect(_toggle_quests_overlay)
	vbox.add_child(btn_active_quest)

	# 5. Fila compacta de la Mina Idle + boton "i" de economia idle
	var gen_row := HBoxContainer.new()
	gen_row.add_theme_constant_override("separation", 4)
	vbox.add_child(gen_row)

	gen_row.add_child(_make_small_icon(tex_pickaxe_icon, 13))

	lbl_gen_info = Label.new()
	lbl_gen_info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lbl_gen_info.add_theme_font_size_override("font_size", 7)
	lbl_gen_info.modulate = Color(0.95, 0.88, 0.55)
	gen_row.add_child(lbl_gen_info)

	btn_gen_upgrade = Button.new()
	btn_gen_upgrade.custom_minimum_size = Vector2(56, 18)
	btn_gen_upgrade.add_theme_font_size_override("font_size", 7)
	btn_gen_upgrade.focus_mode = Control.FOCUS_NONE
	btn_gen_upgrade.pressed.connect(func():
		GameState.try_upgrade_idle_generator()
		queue_redraw()
	)
	gen_row.add_child(btn_gen_upgrade)
	gen_row.add_child(_make_info_button("idle"))

	# 6. Cabecera de Forja/Equipo con Blox2 + boton "i" de recetas/evolucion
	var eq_header := HBoxContainer.new()
	eq_header.add_theme_constant_override("separation", 4)
	vbox.add_child(eq_header)

	var lbl_eq_title := Label.new()
	lbl_eq_title.text = "EQUIPO"
	lbl_eq_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lbl_eq_title.add_theme_font_override("font", font_display)
	lbl_eq_title.add_theme_font_size_override("font_size", 12)
	lbl_eq_title.modulate = Color(0.85, 0.90, 1.0)
	eq_header.add_child(lbl_eq_title)
	eq_header.add_child(_make_info_button("equipment"))

	# 5 ranuras de equipamiento minimalistas: [Icono] + NV.X + [Boton Costo/Evo]
	for slot in ["sword", "gloves", "boots", "armor", "amulet"]:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 5)
		vbox.add_child(row)

		var icon_rect := _make_small_icon(null, 15)
		row.add_child(icon_rect)
		slot_icons[slot] = icon_rect

		var info_lbl := Label.new()
		info_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info_lbl.add_theme_font_size_override("font_size", 8)
		row.add_child(info_lbl)
		slot_labels[slot] = info_lbl

		var btn := Button.new()
		btn.custom_minimum_size = Vector2(76, 18)
		btn.add_theme_font_size_override("font_size", 7)
		btn.focus_mode = Control.FOCUS_NONE
		btn.pressed.connect(func():
			GameState.try_upgrade_or_evolve(slot)
		)
		row.add_child(btn)
		slot_buttons[slot] = btn

	_build_overlays(canvas)
	_on_player_hp_changed(player.current_hp, player.max_hp)


func _make_small_icon(tex: Texture2D, sz: int = 10) -> TextureRect:
	var ic := TextureRect.new()
	ic.texture = tex
	ic.custom_minimum_size = Vector2(sz, sz)
	ic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	return ic


func _make_small_label() -> Label:
	var l := Label.new()
	l.add_theme_font_size_override("font_size", 7)
	return l


func _build_overlays(canvas: CanvasLayer) -> void:
	# 1. Menu Principal Minimalista
	main_menu_overlay = ColorRect.new()
	main_menu_overlay.theme = _ui_theme
	main_menu_overlay.color = Color(0.04, 0.05, 0.08, 0.84)
	main_menu_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	canvas.add_child(main_menu_overlay)

	var menu_card := PanelContainer.new()
	menu_card.position = Vector2(170, 50)
	menu_card.size = Vector2(300, 260)
	main_menu_overlay.add_child(menu_card)

	var mv := VBoxContainer.new()
	mv.add_theme_constant_override("separation", 9)
	menu_card.add_child(mv)

	var title := Label.new()
	title.text = "CRIPTA Y FORJA"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_override("font", font_display)
	title.add_theme_font_size_override("font_size", 24)
	title.modulate = Color(1.0, 0.88, 0.4)
	mv.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "IDLE ROGUELITE RPG"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 9)
	subtitle.modulate = Color(0.75, 0.85, 0.98)
	mv.add_child(subtitle)

	lbl_menu_summary = Label.new()
	lbl_menu_summary.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl_menu_summary.add_theme_font_size_override("font_size", 8)
	lbl_menu_summary.modulate = Color(0.65, 0.95, 0.7)
	mv.add_child(lbl_menu_summary)

	var btn_play := Button.new()
	btn_play.text = "ENTRAR AL CAMPAMENTO"
	btn_play.custom_minimum_size = Vector2(240, 28)
	btn_play.add_theme_font_size_override("font_size", 9)
	btn_play.pressed.connect(_enter_camp_idle)
	mv.add_child(btn_play)

	var btn_quick_exp := Button.new()
	btn_quick_exp.text = "IR A MAZMORRA"
	btn_quick_exp.custom_minimum_size = Vector2(240, 26)
	btn_quick_exp.add_theme_font_size_override("font_size", 9)
	btn_quick_exp.pressed.connect(func():
		_start_expedition(GameState.selected_depth)
	)
	mv.add_child(btn_quick_exp)

	var bottom_menu_row := HBoxContainer.new()
	bottom_menu_row.alignment = BoxContainer.ALIGNMENT_CENTER
	bottom_menu_row.add_theme_constant_override("separation", 8)
	mv.add_child(bottom_menu_row)

	var btn_menu_skin := Button.new()
	btn_menu_skin.text = "SKIN"
	btn_menu_skin.custom_minimum_size = Vector2(60, 22)
	btn_menu_skin.modulate = Color(1.0, 0.90, 0.55)
	btn_menu_skin.pressed.connect(func():
		_toggle_wardrobe_overlay(true)
	)
	bottom_menu_row.add_child(btn_menu_skin)

	var btn_guide := Button.new()
	btn_guide.text = "i GUIA"
	btn_guide.custom_minimum_size = Vector2(64, 22)
	btn_guide.modulate = Color(0.65, 0.92, 1.0)
	btn_guide.pressed.connect(func():
		_open_info_modal("general", true)
	)
	bottom_menu_row.add_child(btn_guide)

	var btn_reset := Button.new()
	btn_reset.text = "RESET"
	btn_reset.custom_minimum_size = Vector2(64, 22)
	btn_reset.pressed.connect(func():
		GameState.reset_save_data()
		_refresh_menu_summary()
	)
	bottom_menu_row.add_child(btn_reset)

	var btn_quit := Button.new()
	btn_quit.text = "SALIR"
	btn_quit.custom_minimum_size = Vector2(60, 22)
	btn_quit.pressed.connect(func():
		GameState.save_game()
		get_tree().quit()
	)
	bottom_menu_row.add_child(btn_quit)

	# 1B. Modal del Armario y Personalizacion por Capas (Tecla C o boton SKIN)
	wardrobe_overlay = ColorRect.new()
	wardrobe_overlay.theme = _ui_theme
	wardrobe_overlay.color = Color(0.02, 0.03, 0.06, 0.90)
	wardrobe_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	wardrobe_overlay.visible = false
	canvas.add_child(wardrobe_overlay)

	var w_card := PanelContainer.new()
	w_card.position = Vector2(60, 24)
	w_card.size = Vector2(520, 312)
	wardrobe_overlay.add_child(w_card)

	var w_vbox := VBoxContainer.new()
	w_vbox.add_theme_constant_override("separation", 8)
	w_card.add_child(w_vbox)

	var w_title := Label.new()
	w_title.text = "ARMARIO Y CAPAS"
	w_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	w_title.add_theme_font_override("font", font_display)
	w_title.add_theme_font_size_override("font_size", 18)
	w_title.modulate = Color(1.0, 0.90, 0.45)
	w_vbox.add_child(w_title)

	var w_hbox := HBoxContainer.new()
	w_hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	w_hbox.add_theme_constant_override("separation", 14)
	w_vbox.add_child(w_hbox)

	wardrobe_preview_ctrl = Control.new()
	wardrobe_preview_ctrl.custom_minimum_size = Vector2(160, 210)
	wardrobe_preview_ctrl.draw.connect(func():
		_draw_wardrobe_preview(wardrobe_preview_ctrl)
	)
	w_hbox.add_child(wardrobe_preview_ctrl)

	var w_right := VBoxContainer.new()
	w_right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	w_right.alignment = BoxContainer.ALIGNMENT_CENTER
	w_right.add_theme_constant_override("separation", 8)
	w_hbox.add_child(w_right)

	wardrobe_value_labels.clear()
	var layer_rows := [
		{"key": "archetype", "title": "PERSONAJE"},
		{"key": "skin",      "title": "PIEL / ESPECIE"},
		{"key": "hair",      "title": "PELO / CASCO"},
		{"key": "cloth",     "title": "ROPA / TUNICA"},
		{"key": "eyes",      "title": "COLOR DE OJOS"},
	]
	for lr in layer_rows:
		var r_key := String(lr["key"])
		var row_box := HBoxContainer.new()
		row_box.add_theme_constant_override("separation", 6)
		w_right.add_child(row_box)

		var lbl_k := Label.new()
		lbl_k.text = String(lr["title"])
		lbl_k.custom_minimum_size = Vector2(130, 22)
		lbl_k.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		lbl_k.add_theme_font_size_override("font_size", 8)
		lbl_k.modulate = Color(0.78, 0.86, 0.98)
		row_box.add_child(lbl_k)

		var btn_prev := Button.new()
		btn_prev.text = "<"
		btn_prev.custom_minimum_size = Vector2(24, 22)
		btn_prev.focus_mode = Control.FOCUS_NONE
		btn_prev.pressed.connect(func():
			GameState.cycle_appearance_option(r_key, -1)
		)
		row_box.add_child(btn_prev)

		var lbl_val := Label.new()
		lbl_val.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		lbl_val.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl_val.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		lbl_val.add_theme_font_size_override("font_size", 8)
		lbl_val.modulate = Color(1.0, 0.92, 0.45)
		row_box.add_child(lbl_val)
		wardrobe_value_labels[r_key] = lbl_val

		var btn_next := Button.new()
		btn_next.text = ">"
		btn_next.custom_minimum_size = Vector2(24, 22)
		btn_next.focus_mode = Control.FOCUS_NONE
		btn_next.pressed.connect(func():
			GameState.cycle_appearance_option(r_key, 1)
		)
		row_box.add_child(btn_next)

	var w_bottom := HBoxContainer.new()
	w_bottom.alignment = BoxContainer.ALIGNMENT_CENTER
	w_bottom.add_theme_constant_override("separation", 14)
	w_vbox.add_child(w_bottom)

	var btn_rand_skin := Button.new()
	btn_rand_skin.text = "COMBINACION ALEATORIA"
	btn_rand_skin.custom_minimum_size = Vector2(200, 24)
	btn_rand_skin.add_theme_font_size_override("font_size", 8)
	btn_rand_skin.modulate = Color(0.68, 0.95, 1.0)
	btn_rand_skin.pressed.connect(func():
		GameState.randomize_appearance()
	)
	w_bottom.add_child(btn_rand_skin)

	var btn_close_w := Button.new()
	btn_close_w.text = "GUARDAR Y CERRAR (C / ESC)"
	btn_close_w.custom_minimum_size = Vector2(220, 24)
	btn_close_w.add_theme_font_size_override("font_size", 8)
	btn_close_w.pressed.connect(func():
		_toggle_wardrobe_overlay(false)
	)
	w_bottom.add_child(btn_close_w)
	_refresh_wardrobe_ui()

	# 2. Modal del Mapa Detallado (TAB) estilo Isaac
	map_overlay = ColorRect.new()
	map_overlay.theme = _ui_theme
	map_overlay.color = Color(0.02, 0.03, 0.06, 0.88)
	map_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	map_overlay.visible = false
	canvas.add_child(map_overlay)

	var map_card := PanelContainer.new()
	map_card.position = Vector2(40, 20)
	map_card.size = Vector2(560, 320)
	map_overlay.add_child(map_card)

	var map_vbox := VBoxContainer.new()
	map_vbox.add_theme_constant_override("separation", 6)
	map_card.add_child(map_vbox)

	var map_title := Label.new()
	map_title.text = "MAPA DE LA MAZMORRA"
	map_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	map_title.add_theme_font_override("font", font_display)
	map_title.add_theme_font_size_override("font_size", 18)
	map_title.modulate = Color(0.65, 0.92, 1.0)
	map_vbox.add_child(map_title)

	var map_hbox := HBoxContainer.new()
	map_hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	map_hbox.add_theme_constant_override("separation", 10)
	map_vbox.add_child(map_hbox)

	map_canvas = Control.new()
	map_canvas.custom_minimum_size = Vector2(280, 230)
	map_canvas.draw.connect(func():
		_draw_detailed_map_canvas(map_canvas)
	)
	map_canvas.gui_input.connect(_on_map_canvas_gui_input)
	map_hbox.add_child(map_canvas)

	var map_right := VBoxContainer.new()
	map_right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	map_right.add_theme_constant_override("separation", 6)
	map_hbox.add_child(map_right)

	lbl_map_room_title = Label.new()
	lbl_map_room_title.add_theme_font_size_override("font_size", 9)
	lbl_map_room_title.modulate = Color(1.0, 0.92, 0.45)
	map_right.add_child(lbl_map_room_title)

	lbl_map_room_details = Label.new()
	lbl_map_room_details.size_flags_vertical = Control.SIZE_EXPAND_FILL
	lbl_map_room_details.add_theme_font_size_override("font_size", 7)
	lbl_map_room_details.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	map_right.add_child(lbl_map_room_details)

	btn_map_travel = Button.new()
	btn_map_travel.custom_minimum_size = Vector2(240, 24)
	btn_map_travel.add_theme_font_size_override("font_size", 8)
	btn_map_travel.pressed.connect(func():
		if room_state == RoomState.CLEARED and floor_rooms.has(selected_map_coord) and bool(floor_rooms[selected_map_coord]["cleared"]) and selected_map_coord != current_room_coord:
			var target_c := selected_map_coord
			_toggle_map_overlay()
			_enter_room_at(target_c, Vector2i.ZERO)
	)
	map_right.add_child(btn_map_travel)

	var btn_close_map := Button.new()
	btn_close_map.text = "CERRAR MAPA (TAB / ESC)"
	btn_close_map.custom_minimum_size = Vector2(240, 24)
	btn_close_map.add_theme_font_size_override("font_size", 8)
	btn_close_map.pressed.connect(_toggle_map_overlay)
	map_right.add_child(btn_close_map)

	# 3. Modal de Informacion Detallada (botones "i")
	info_overlay = ColorRect.new()
	info_overlay.theme = _ui_theme
	info_overlay.color = Color(0.03, 0.04, 0.07, 0.88)
	info_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	info_overlay.visible = false
	canvas.add_child(info_overlay)

	var info_card := PanelContainer.new()
	info_card.position = Vector2(80, 30)
	info_card.size = Vector2(480, 300)
	info_overlay.add_child(info_card)

	var iv := VBoxContainer.new()
	iv.add_theme_constant_override("separation", 8)
	info_card.add_child(iv)

	lbl_info_title = Label.new()
	lbl_info_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl_info_title.add_theme_font_override("font", font_display)
	lbl_info_title.add_theme_font_size_override("font_size", 18)
	lbl_info_title.modulate = Color(0.60, 0.92, 1.0)
	iv.add_child(lbl_info_title)

	lbl_info_body = Label.new()
	lbl_info_body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	lbl_info_body.add_theme_font_size_override("font_size", 8)
	lbl_info_body.modulate = Color(0.92, 0.95, 1.0)
	iv.add_child(lbl_info_body)

	var btn_close_info := Button.new()
	btn_close_info.text = "ENTENDIDO - CERRAR"
	btn_close_info.custom_minimum_size = Vector2(200, 24)
	btn_close_info.add_theme_font_size_override("font_size", 8)
	btn_close_info.pressed.connect(_close_info_modal)
	iv.add_child(btn_close_info)

	# 4. Modal del Registro de las 5 Misiones e Hitos Iniciales
	quests_overlay = ColorRect.new()
	quests_overlay.theme = _ui_theme
	quests_overlay.color = Color(0.03, 0.04, 0.07, 0.86)
	quests_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	quests_overlay.visible = false
	canvas.add_child(quests_overlay)

	var q_card := PanelContainer.new()
	q_card.position = Vector2(60, 24)
	q_card.size = Vector2(520, 312)
	quests_overlay.add_child(q_card)

	var qv := VBoxContainer.new()
	qv.add_theme_constant_override("separation", 7)
	q_card.add_child(qv)

	var q_title := Label.new()
	q_title.text = "MISIONES E HITOS"
	q_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	q_title.add_theme_font_override("font", font_display)
	q_title.add_theme_font_size_override("font_size", 18)
	q_title.modulate = Color(1.0, 0.9, 0.45)
	qv.add_child(q_title)

	quest_row_labels.clear()
	for i in range(GameState.QUEST_CATALOG.size()):
		var q_info: Dictionary = GameState.QUEST_CATALOG[i]
		var r_box := HBoxContainer.new()
		r_box.add_theme_constant_override("separation", 6)
		qv.add_child(r_box)

		var q_ic := _make_small_icon(load(String(q_info["icon"])), 15)
		r_box.add_child(q_ic)

		var q_lbl := Label.new()
		q_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		q_lbl.add_theme_font_size_override("font_size", 7)
		r_box.add_child(q_lbl)
		quest_row_labels.append(q_lbl)

	var btn_close_q := Button.new()
	btn_close_q.text = "CERRAR MISIONES"
	btn_close_q.custom_minimum_size = Vector2(160, 20)
	btn_close_q.add_theme_font_size_override("font_size", 8)
	btn_close_q.pressed.connect(_toggle_quests_overlay)
	qv.add_child(btn_close_q)

	# 5. Modal de Eleccion de Mejora Temporal (1 de 3)
	buff_choice_overlay = ColorRect.new()
	buff_choice_overlay.theme = _ui_theme
	buff_choice_overlay.color = Color(0.03, 0.03, 0.07, 0.84)
	buff_choice_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	buff_choice_overlay.visible = false
	canvas.add_child(buff_choice_overlay)

	var buff_card := PanelContainer.new()
	buff_card.position = Vector2(56, 26)
	buff_card.size = Vector2(368, 216)
	buff_choice_overlay.add_child(buff_card)

	var bv := VBoxContainer.new()
	bv.add_theme_constant_override("separation", 6)
	buff_card.add_child(bv)

	var b_title := Label.new()
	b_title.text = "BENDICION DE EXPEDICION"
	b_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	b_title.add_theme_font_override("font", font_display)
	b_title.add_theme_font_size_override("font_size", 16)
	b_title.modulate = Color(0.95, 0.82, 1.0)
	bv.add_child(b_title)

	var b_sub := Label.new()
	b_sub.text = "ELIGE 1 MEJORA PARA ESTA EXPEDICION"
	b_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	b_sub.add_theme_font_size_override("font_size", 7)
	b_sub.modulate = Color(0.75, 0.8, 0.88)
	bv.add_child(b_sub)

	buff_choice_buttons.clear()
	for i in range(3):
		var b_btn := Button.new()
		b_btn.custom_minimum_size = Vector2(340, 42)
		b_btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b_btn.expand_icon = true
		b_btn.add_theme_font_size_override("font_size", 7)
		var idx := i
		b_btn.pressed.connect(func():
			_on_buff_choice_selected(idx)
		)
		bv.add_child(b_btn)
		buff_choice_buttons.append(b_btn)

	# 6. Modal de Pausa (Esc)
	pause_overlay = ColorRect.new()
	pause_overlay.theme = _ui_theme
	pause_overlay.color = Color(0.03, 0.04, 0.06, 0.82)
	pause_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	pause_overlay.visible = false
	canvas.add_child(pause_overlay)

	var pause_card := PanelContainer.new()
	pause_card.position = Vector2(140, 46)
	pause_card.size = Vector2(200, 174)
	pause_overlay.add_child(pause_card)

	var pv := VBoxContainer.new()
	pv.add_theme_constant_override("separation", 6)
	pause_card.add_child(pv)

	var p_title := Label.new()
	p_title.text = "PAUSA"
	p_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	p_title.add_theme_font_override("font", font_display)
	p_title.add_theme_font_size_override("font_size", 18)
	p_title.modulate = Color(1.0, 0.9, 0.45)
	pv.add_child(p_title)

	var btn_resume := Button.new()
	btn_resume.text = "REANUDAR"
	btn_resume.custom_minimum_size = Vector2(170, 22)
	btn_resume.add_theme_font_size_override("font_size", 8)
	btn_resume.pressed.connect(_toggle_pause_menu)
	pv.add_child(btn_resume)

	btn_pause_retreat = Button.new()
	btn_pause_retreat.text = "VOLVER AL CAMPAMENTO"
	btn_pause_retreat.custom_minimum_size = Vector2(170, 22)
	btn_pause_retreat.add_theme_font_size_override("font_size", 8)
	btn_pause_retreat.pressed.connect(_enter_camp_idle)
	pv.add_child(btn_pause_retreat)

	var btn_to_title := Button.new()
	btn_to_title.text = "MENU PRINCIPAL"
	btn_to_title.custom_minimum_size = Vector2(170, 22)
	btn_to_title.add_theme_font_size_override("font_size", 8)
	btn_to_title.pressed.connect(_enter_main_menu)
	pv.add_child(btn_to_title)

	var btn_pause_quit := Button.new()
	btn_pause_quit.text = "GUARDAR Y SALIR"
	btn_pause_quit.custom_minimum_size = Vector2(170, 20)
	btn_pause_quit.add_theme_font_size_override("font_size", 8)
	btn_pause_quit.pressed.connect(func():
		GameState.save_game()
		get_tree().quit()
	)
	pv.add_child(btn_pause_quit)

	# 7. Modal de Resumen de Expedicion
	summary_overlay = ColorRect.new()
	summary_overlay.theme = _ui_theme
	summary_overlay.color = Color(0.03, 0.04, 0.07, 0.86)
	summary_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	summary_overlay.visible = false
	canvas.add_child(summary_overlay)

	var sum_card := PanelContainer.new()
	sum_card.position = Vector2(96, 36)
	sum_card.size = Vector2(288, 196)
	summary_overlay.add_child(sum_card)

	var sv := VBoxContainer.new()
	sv.add_theme_constant_override("separation", 8)
	sum_card.add_child(sv)

	lbl_summary_title = Label.new()
	lbl_summary_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl_summary_title.add_theme_font_override("font", font_display)
	lbl_summary_title.add_theme_font_size_override("font_size", 16)
	sv.add_child(lbl_summary_title)

	lbl_summary_body = Label.new()
	lbl_summary_body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	lbl_summary_body.add_theme_font_size_override("font_size", 7)
	sv.add_child(lbl_summary_body)

	var sum_btns := HBoxContainer.new()
	sum_btns.alignment = BoxContainer.ALIGNMENT_CENTER
	sum_btns.add_theme_constant_override("separation", 8)
	sv.add_child(sum_btns)

	var btn_sum_camp := Button.new()
	btn_sum_camp.text = "CAMPAMENTO"
	btn_sum_camp.custom_minimum_size = Vector2(124, 22)
	btn_sum_camp.add_theme_font_size_override("font_size", 8)
	btn_sum_camp.pressed.connect(_enter_camp_idle)
	sum_btns.add_child(btn_sum_camp)

	btn_summary_retry = Button.new()
	btn_summary_retry.custom_minimum_size = Vector2(136, 22)
	btn_summary_retry.add_theme_font_size_override("font_size", 8)
	btn_summary_retry.pressed.connect(func():
		_start_expedition(GameState.selected_depth)
	)
	sum_btns.add_child(btn_summary_retry)


func _on_mode_action_pressed() -> void:
	if game_mode == GameMode.CAMP_IDLE:
		_start_expedition(GameState.selected_depth)
	elif game_mode == GameMode.EXPEDITION:
		_enter_camp_idle()


func _update_top_bar_controls() -> void:
	if not is_instance_valid(lbl_room):
		return
	var in_camp := (game_mode == GameMode.CAMP_IDLE)
	btn_depth_prev.visible = in_camp
	btn_depth_next.visible = in_camp
	lbl_depth_sel.visible = in_camp
	btn_map_top.visible = not in_camp

	if in_camp:
		lbl_room.text = "CAMPAMENTO"
		lbl_depth_sel.text = "P.%d" % GameState.selected_depth
		btn_depth_prev.disabled = (GameState.selected_depth <= 1)
		btn_depth_next.disabled = (GameState.selected_depth >= GameState.max_unlocked_depth)
		btn_mode_action.text = "EXPLORAR"
	else:
		lbl_room.text = "PISO %d  %s" % [
			expedition_depth, _room_type_label(current_room_type)
		]
		btn_mode_action.text = "SALIR"


func _refresh_menu_summary() -> void:
	if is_instance_valid(lbl_menu_summary):
		lbl_menu_summary.text = "%d ORO - MISIONES %d/5 - PISO %d" % [
			GameState.gold,
			GameState.current_quest_index,
			GameState.max_unlocked_depth
		]


func _on_player_hp_changed(cur: float, mx: float) -> void:
	if is_instance_valid(lbl_hp):
		lbl_hp.text = "%d/%d  ATK %d" % [int(round(cur)), int(round(mx)), int(round(GameState.get_player_damage()))]
	if is_instance_valid(bar_hp):
		bar_hp.max_value = mx
		bar_hp.value = cur


func _on_currencies_changed(gold_val: int, iron_val: int) -> void:
	if is_instance_valid(lbl_gold):
		lbl_gold.text = "%d" % gold_val
	if is_instance_valid(lbl_iron):
		lbl_iron.text = "%d" % iron_val
	_refresh_equipment_ui()
	_refresh_menu_summary()


func _refresh_materials_ui() -> void:
	if is_instance_valid(lbl_iron):
		lbl_iron.text = "%d" % GameState.iron_ore
	if is_instance_valid(lbl_wood):
		lbl_wood.text = "%d" % GameState.wood
	if is_instance_valid(lbl_leather):
		lbl_leather.text = "%d" % GameState.leather
	if is_instance_valid(lbl_essence):
		lbl_essence.text = "%d" % GameState.essence
	_refresh_equipment_ui()


func _refresh_quests_ui() -> void:
	if is_instance_valid(btn_active_quest):
		var q_idx := GameState.current_quest_index
		if q_idx < GameState.QUEST_CATALOG.size():
			btn_active_quest.text = "MISION %d - %s" % [
				q_idx + 1,
				GameState.get_quest_progress_text(q_idx)
			]
		else:
			btn_active_quest.text = "5 MISIONES COMPLETAS!"

	for i in range(quest_row_labels.size()):
		var q_info: Dictionary = GameState.QUEST_CATALOG[i]
		var lbl := quest_row_labels[i]
		var prog := GameState.get_quest_progress_text(i)
		var status_prefix := "OK " if i < GameState.current_quest_index else ("ACTIVA " if i == GameState.current_quest_index else "BLOQ ")
		lbl.text = "%s%s  - %s\n   %s . %s" % [
			status_prefix,
			String(q_info["title"]).to_upper(),
			prog.to_upper(),
			String(q_info["objective"]).to_upper(),
			String(q_info["unlock_text"]).to_upper()
		]
		if i < GameState.current_quest_index:
			lbl.modulate = Color(0.55, 0.95, 0.65)
		elif i == GameState.current_quest_index:
			lbl.modulate = Color(1.0, 0.92, 0.45)
		else:
			lbl.modulate = Color(0.65, 0.68, 0.75)


func _on_run_pickups_changed(keys_val: int, bombs_val: int) -> void:
	if is_instance_valid(lbl_keys):
		lbl_keys.text = "%d" % keys_val
	if is_instance_valid(lbl_bombs):
		lbl_bombs.text = "%d" % bombs_val


func _refresh_equipment_ui() -> void:
	if is_instance_valid(lbl_gen_info):
		lbl_gen_info.text = "MINA NV.%d" % GameState.idle_generator_level
	if is_instance_valid(btn_gen_upgrade):
		var gen_cost := GameState.get_idle_generator_upgrade_cost()
		btn_gen_upgrade.text = "%dG" % gen_cost
		btn_gen_upgrade.disabled = (GameState.gold < gen_cost)

	if is_instance_valid(lbl_hp) and is_instance_valid(player):
		lbl_hp.text = "%d/%d  ATK %d" % [
			int(round(player.current_hp)), int(round(player.max_hp)), int(round(GameState.get_player_damage()))
		]

	for slot in slot_buttons.keys():
		var item: Dictionary = GameState.equipment[slot]
		var icon_path := GameState.get_slot_icon_path(slot)
		if ResourceLoader.exists(icon_path):
			slot_icons[slot].texture = load(icon_path)

		slot_labels[slot].text = "NV.%d" % int(item["level"])
		var btn: Button = slot_buttons[slot]
		var g_cost := GameState.get_upgrade_cost(slot)

		if GameState.needs_evolution(slot):
			var cur_tier := int(item["tier"])
			if not GameState.is_slot_evolution_unlocked(slot, cur_tier):
				btn.text = GameState.get_slot_evolution_lock_reason(slot, cur_tier)
				btn.disabled = true
			else:
				btn.text = "EVO %dG" % g_cost
				btn.disabled = (GameState.gold < g_cost or not GameState.can_afford_evolution_materials(slot))
		else:
			btn.text = "%dG" % g_cost
			btn.disabled = (GameState.gold < g_cost)


func _on_idle_tick(gold_amount: int, iron_amount: int) -> void:
	var anchor := _worker_pos if game_mode == GameMode.CAMP_IDLE else (player.global_position if is_instance_valid(player) else Vector2(140, 120))
	var txt := "+%d G" % gold_amount
	if iron_amount > 0:
		txt += " +%d FE" % iron_amount
	_spawn_floating_text(anchor + Vector2(-10, -16), txt, Color(0.55, 1.0, 0.55))


func _on_offline_claimed(gold_earned: int, _seconds_away: int) -> void:
	_show_banner("OFFLINE +%d ORO" % gold_earned)


func _show_banner(msg: String) -> void:
	if is_instance_valid(lbl_banner):
		lbl_banner.text = msg
		_banner_timer = 2.6
