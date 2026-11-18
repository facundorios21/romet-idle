extends CharacterBody2D
class_name PlayerController
## Controlador y maquina de estados del personaje:
## - Movimiento libre en 8 direcciones con WASD / Flechas.
## - Ataque manual con Espada mediante Click Izquierdo hacia la direccion del cursor.
## - Esquiva con Espacio (i-frames) y Explosion Arcana con Q.
## - Textura dinamica por capas conectada al Armario (GameState.custom_player_texture).

signal hp_changed(current_hp: float, max_hp: float)
signal state_changed(state_name: String)
signal player_died()
signal ability_used(cooldown: float)
signal dodge_used(cooldown: float)
signal bomb_requested(pos: Vector2)

enum State {
	EXPLORATION,
	COMBAT,
	DODGING,
	ABILITY,
	HIT_STUN,
	ROOM_CLEARED,
	DEAD
}

const HIT_STUN_DURATION := 0.35
const POST_HIT_PROTECTION := 0.45
const DODGE_DURATION := 0.25
const DODGE_COOLDOWN := 1.10
const DODGE_SPEED_MULT := 2.65
const ABILITY_COOLDOWN := 4.50
const ABILITY_DURATION := 0.28
const ABILITY_RADIUS := 54.0
const MELEE_RANGE := 34.0

var state: State = State.EXPLORATION
var max_hp: float = 100.0
var current_hp: float = 100.0

var facing_dir: Vector2 = Vector2.DOWN
var current_target: Node2D = null
var exploration_waypoint: Vector2 = Vector2.ZERO
var has_exploration_waypoint: bool = false

# Timers internos
var _attack_cooldown_timer: float = 0.0
var _attack_anim_timer: float = 0.0
var _state_timer: float = 0.0
var _invuln_timer: float = 0.0
var _dodge_cd_timer: float = 0.0
var _ability_cd_timer: float = 0.0
var _anim_clock: float = 0.0
var _dodge_dir: Vector2 = Vector2.DOWN
var _ability_ring_alpha: float = 0.0
var _slash_alpha: float = 0.0
var _slash_dir: Vector2 = Vector2.RIGHT

@onready var sprite: Sprite2D = $Sprite2D


func _ready() -> void:
	add_to_group("player")
	GameState.equipment_changed.connect(_on_equipment_changed)
	GameState.appearance_changed.connect(_on_appearance_changed)
	_on_equipment_changed()
	if GameState.custom_player_texture != null and is_instance_valid(sprite):
		sprite.texture = GameState.custom_player_texture
	current_hp = max_hp
	hp_changed.emit(current_hp, max_hp)
	_change_state(State.EXPLORATION)


func _on_appearance_changed(tex: Texture2D) -> void:
	if is_instance_valid(sprite) and tex != null:
		sprite.texture = tex


func _on_equipment_changed() -> void:
	var old_max := max_hp
	max_hp = GameState.get_max_hp()
	if max_hp > old_max:
		current_hp += (max_hp - old_max)
	current_hp = minf(current_hp, max_hp)
	hp_changed.emit(current_hp, max_hp)


func heal(amount: float) -> void:
	if state == State.DEAD or amount <= 0.0:
		return
	max_hp = GameState.get_max_hp()
	current_hp = minf(max_hp, current_hp + amount)
	hp_changed.emit(current_hp, max_hp)


func reset_for_new_expedition(spawn_pos: Vector2) -> void:
	global_position = spawn_pos
	max_hp = GameState.get_max_hp()
	current_hp = max_hp
	_invuln_timer = 0.5
	_attack_cooldown_timer = 0.0
	_dodge_cd_timer = 0.0
	_ability_cd_timer = 0.0
	hp_changed.emit(current_hp, max_hp)
	_change_state(State.EXPLORATION)


func set_exploration_target(target_pos: Vector2) -> void:
	exploration_waypoint = target_pos
	has_exploration_waypoint = true


func notify_enemies_present(has_enemies: bool) -> void:
	if state == State.DEAD:
		return
	if has_enemies and state in [State.EXPLORATION, State.ROOM_CLEARED]:
		_change_state(State.COMBAT)
	elif not has_enemies and state == State.COMBAT:
		current_target = null
		_change_state(State.ROOM_CLEARED)


func _physics_process(delta: float) -> void:
	_anim_clock += delta
	_attack_cooldown_timer = maxf(0.0, _attack_cooldown_timer - delta)
	_attack_anim_timer = maxf(0.0, _attack_anim_timer - delta)
	_invuln_timer = maxf(0.0, _invuln_timer - delta)
	_dodge_cd_timer = maxf(0.0, _dodge_cd_timer - delta)
	_ability_cd_timer = maxf(0.0, _ability_cd_timer - delta)

	if _ability_ring_alpha > 0.0 or _slash_alpha > 0.0:
		_ability_ring_alpha = maxf(0.0, _ability_ring_alpha - delta * 3.2)
		_slash_alpha = maxf(0.0, _slash_alpha - delta * 5.0)
		queue_redraw()

	if state != State.DEAD and Input.is_action_just_pressed("interact"):
		bomb_requested.emit(global_position)

	match state:
		State.EXPLORATION, State.ROOM_CLEARED:
			_process_exploration(delta)
		State.COMBAT:
			_process_combat(delta)
		State.DODGING:
			_process_dodge(delta)
		State.ABILITY:
			_process_ability(delta)
		State.HIT_STUN:
			_process_hit_stun(delta)
		State.DEAD:
			velocity = Vector2.ZERO

	move_and_slide()
	_update_sprite_frame()


func _is_mouse_inside_arena() -> bool:
	# Arena ampliada para la resolucion 640x360 (ver ARENA_RECT en main_controller)
	var mp := get_viewport().get_mouse_position()
	return mp.x >= 12.0 and mp.x <= 436.0 and mp.y >= 40.0 and mp.y <= 344.0


func _process_exploration(_delta: float) -> void:
	var manual_input := _get_manual_input_vector()
	if manual_input.length_squared() > 0.01:
		has_exploration_waypoint = false
		velocity = manual_input * GameState.get_move_speed()
		if _attack_anim_timer <= 0.0:
			facing_dir = manual_input
	elif has_exploration_waypoint:
		var to_wp := exploration_waypoint - global_position
		if to_wp.length() > 6.0:
			var dir := to_wp.normalized()
			velocity = dir * GameState.get_move_speed()
			facing_dir = dir
		else:
			velocity = Vector2.ZERO
			has_exploration_waypoint = false
	else:
		velocity = Vector2.ZERO

	if Input.is_action_just_pressed("dodge") and _dodge_cd_timer <= 0.0:
		_start_dodge(manual_input)
		return
	if Input.is_action_pressed("attack_primary") and _attack_cooldown_timer <= 0.0 and _is_mouse_inside_arena():
		_perform_click_melee_attack()


func _process_combat(_delta: float) -> void:
	var input_vec := _get_manual_input_vector()
	velocity = input_vec * GameState.get_move_speed()
	if input_vec.length_squared() > 0.01 and _attack_anim_timer <= 0.0:
		facing_dir = input_vec

	if Input.is_action_just_pressed("dodge") and _dodge_cd_timer <= 0.0:
		_start_dodge(input_vec)
		return
	if Input.is_action_just_pressed("ability") and _ability_cd_timer <= 0.0:
		_start_ability()
		return

	# Ataque de espada manual con Click Izquierdo hacia el cursor
	if Input.is_action_pressed("attack_primary") and _attack_cooldown_timer <= 0.0 and _is_mouse_inside_arena():
		_perform_click_melee_attack()


func _perform_click_melee_attack() -> void:
	var aps := maxf(0.25, GameState.get_attacks_per_second())
	_attack_cooldown_timer = 1.0 / aps
	_attack_anim_timer = minf(0.26, _attack_cooldown_timer * 0.85)

	var to_mouse := get_global_mouse_position() - global_position
	var attack_dir := to_mouse.normalized() if to_mouse.length_squared() > 0.01 else facing_dir.normalized()
	if attack_dir.length_squared() < 0.01:
		attack_dir = Vector2.DOWN

	facing_dir = attack_dir
	_slash_dir = attack_dir
	_slash_alpha = 1.0

	var dmg := GameState.get_player_damage()
	for node in get_tree().get_nodes_in_group("enemies"):
		if is_instance_valid(node) and not node.is_dead():
			var to_enemy: Vector2 = node.global_position - global_position
			var dist := to_enemy.length()
			if dist <= MELEE_RANGE:
				var align := 1.0 if dist <= 13.0 else attack_dir.dot(to_enemy.normalized())
				if align >= 0.15:
					node.take_damage(dmg, attack_dir * 62.0)
	queue_redraw()


func _start_dodge(input_vec: Vector2) -> void:
	_dodge_dir = input_vec if input_vec.length_squared() > 0.01 else facing_dir.normalized()
	if _dodge_dir.length_squared() < 0.01:
		_dodge_dir = Vector2.DOWN
	_state_timer = DODGE_DURATION
	_invuln_timer = DODGE_DURATION
	_dodge_cd_timer = DODGE_COOLDOWN
	dodge_used.emit(DODGE_COOLDOWN)
	_change_state(State.DODGING)


func _process_dodge(delta: float) -> void:
	_state_timer -= delta
	velocity = _dodge_dir * GameState.get_move_speed() * DODGE_SPEED_MULT
	if _state_timer <= 0.0:
		_return_to_combat_or_exploration()


func _start_ability() -> void:
	_state_timer = ABILITY_DURATION
	var cd := ABILITY_COOLDOWN * GameState.get_ability_cooldown_multiplier()
	_ability_cd_timer = cd
	_ability_ring_alpha = 1.0
	ability_used.emit(cd)
	_change_state(State.ABILITY)
	var dmg := GameState.get_player_damage() * GameState.get_ability_damage_multiplier()
	for node in get_tree().get_nodes_in_group("enemies"):
		if is_instance_valid(node) and not node.is_dead():
			var d := global_position.distance_to(node.global_position)
			if d <= ABILITY_RADIUS:
				var push_dir: Vector2 = (node.global_position - global_position).normalized()
				node.take_damage(dmg, push_dir * 95.0)
	queue_redraw()


func _process_ability(delta: float) -> void:
	_state_timer -= delta
	velocity = Vector2.ZERO
	if _state_timer <= 0.0:
		_return_to_combat_or_exploration()


func _process_hit_stun(delta: float) -> void:
	_state_timer -= delta
	velocity = velocity.move_toward(Vector2.ZERO, 260.0 * delta)
	if _state_timer <= 0.0:
		_return_to_combat_or_exploration()


func _return_to_combat_or_exploration() -> void:
	if _has_alive_enemies():
		_change_state(State.COMBAT)
	else:
		_change_state(State.EXPLORATION)


func _has_alive_enemies() -> bool:
	for e in get_tree().get_nodes_in_group("enemies"):
		if is_instance_valid(e) and not e.is_dead():
			return true
	return false


func take_damage(raw_damage: float, knockback: Vector2 = Vector2.ZERO) -> void:
	if state == State.DEAD or _invuln_timer > 0.0:
		return
	var mitigated := maxf(1.0, raw_damage - GameState.get_defense())
	current_hp = maxf(0.0, current_hp - mitigated)
	hp_changed.emit(current_hp, max_hp)

	if current_hp <= 0.0:
		_change_state(State.DEAD)
		player_died.emit()
		return

	_state_timer = HIT_STUN_DURATION
	_invuln_timer = POST_HIT_PROTECTION
	velocity = knockback
	_change_state(State.HIT_STUN)


func _get_manual_input_vector() -> Vector2:
	var v := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	return v.normalized() if v.length() > 1.0 else v


func _change_state(new_state: State) -> void:
	state = new_state
	state_changed.emit(State.keys()[state])


func _direction_to_row(dir: Vector2) -> int:
	if dir.length_squared() < 0.001:
		return 0
	var angle := dir.angle()
	var octant := int(round(angle / (PI / 4.0)))
	match octant:
		2:
			return 0 # S
		1:
			return 1 # SE
		0:
			return 2 # E
		-1:
			return 3 # NE
		-2:
			return 4 # N
		-3:
			return 5 # NW
		4, -4:
			return 6 # W
		3:
			return 7 # SW
	return 0


func _update_sprite_frame() -> void:
	if not is_instance_valid(sprite):
		return
	var row := _direction_to_row(facing_dir)
	var col := 0

	match state:
		State.DEAD:
			col = 22 + (int(_anim_clock * 4.0) % 2)
		State.HIT_STUN:
			col = 19 if _state_timer > HIT_STUN_DURATION * 0.55 else 20
		State.ABILITY:
			col = 12 + clampi(int((1.0 - (_state_timer / ABILITY_DURATION)) * 4.0), 0, 3)
		State.DODGING:
			col = 2 + (int(_anim_clock * 16.0) % 2)
		_:
			if _attack_anim_timer > 0.0:
				var p := 1.0 - (_attack_anim_timer / 0.26)
				col = 4 + clampi(int(p * 4.0), 0, 3)
			elif velocity.length() > 4.0:
				col = int(_anim_clock * 8.0) % 4
			else:
				col = int(_anim_clock * 3.0) % 2

	sprite.frame_coords = Vector2i(col, row)
	if state == State.DODGING:
		sprite.modulate = Color(0.65, 0.9, 1.0, 0.85)
	elif _invuln_timer > 0.0 and state != State.HIT_STUN:
		sprite.modulate = Color(1, 1, 1, 0.65 if int(_anim_clock * 20.0) % 2 == 0 else 1.0)
	else:
		sprite.modulate = Color.WHITE


func _draw() -> void:
	# Arco de tajo de espada al atacar con Click Izquierdo
	if _slash_alpha > 0.0:
		var base_ang := _slash_dir.angle()
		draw_arc(Vector2.ZERO, MELEE_RANGE * 0.78, base_ang - 0.85, base_ang + 0.85, 16, Color(1.0, 0.95, 0.55, _slash_alpha * 0.9), 2.5)
		draw_arc(Vector2.ZERO, MELEE_RANGE * 0.55, base_ang - 0.65, base_ang + 0.65, 12, Color(1.0, 1.0, 1.0, _slash_alpha * 0.75), 1.5)
	if _ability_ring_alpha > 0.0:
		var r := lerpf(12.0, ABILITY_RADIUS, 1.0 - _ability_ring_alpha)
		draw_arc(Vector2.ZERO, r, 0.0, TAU, 36, Color(0.35, 0.8, 1.0, _ability_ring_alpha), 2.0)
		draw_circle(Vector2.ZERO, r, Color(0.35, 0.8, 1.0, _ability_ring_alpha * 0.18))
