extends CharacterBody2D
class_name EnemyActor
## IA de enemigos según GDD sección 5.4:
## Estados: IDLE, CHASE, ATTACK (con telegrafía visual clara), RECOVERY, HIT, DEAD.

signal died(enemy: EnemyActor, pos: Vector2, gold_drop: int, iron_drop: int)
signal damaged(enemy: EnemyActor, amount: float)

enum AIState {
	IDLE,
	CHASE,
	ATTACK_WINDUP,
	CHARGING,
	RECOVERY,
	HIT,
	DEAD
}

enum SpriteLayout {
	SLIME_15X1,
	PUNY_24X8,
	## Tiras laterales (Legacy Fantasy: Boar Warrior / Wild Boar). Miran a la izquierda por defecto.
	SIDE_STRIPS
}

@export var display_name: String = "Slime"
@export var layout: SpriteLayout = SpriteLayout.SLIME_15X1
@export var max_hp: float = 28.0
@export var move_speed: float = 34.0
@export var contact_damage: float = 10.0
@export var attack_range: float = 20.0
@export var windup_duration: float = 0.42
@export var recovery_duration: float = 0.50
@export var gold_reward: int = 6
@export var iron_drop_chance: float = 0.35
@export var is_boss: bool = false
## Si es true, el ataque es una embestida en linea recta (Jabali Salvaje) en vez de un golpe en area.
@export var charge_attack: bool = false
@export var charge_speed: float = 230.0
@export var charge_duration: float = 0.55
@export var charge_trigger_range: float = 120.0
## Altura (negativa) de la barra de vida sobre el origen del enemigo.
@export var bar_offset_y: float = 0.0

## Animaciones para SIDE_STRIPS: { "idle"/"walk"/"attack"/"die": {tex, frames, fw, h, cx, fps} }
var side_anims: Dictionary = {}

var current_hp: float = 28.0
var ai_state: AIState = AIState.IDLE
var facing_dir: Vector2 = Vector2.DOWN

var _state_timer: float = 0.0
var _anim_clock: float = 0.0
var _attack_target_pos: Vector2 = Vector2.ZERO
var _charge_dir: Vector2 = Vector2.ZERO
var _charge_hit_done: bool = false
var _current_anim_key: String = ""

@onready var sprite: Sprite2D = $Sprite2D


func _ready() -> void:
	add_to_group("enemies")
	current_hp = max_hp
	_anim_clock = randf() * 3.0
	ai_state = AIState.CHASE


func is_dead() -> bool:
	return ai_state == AIState.DEAD


func _physics_process(delta: float) -> void:
	_anim_clock += delta
	var player := get_tree().get_first_node_in_group("player") as Node2D

	match ai_state:
		AIState.IDLE, AIState.CHASE:
			if is_instance_valid(player) and player.state != PlayerController.State.DEAD:
				var to_p := player.global_position - global_position
				var dist := to_p.length()
				if dist > 0.01:
					facing_dir = to_p.normalized()
				var trigger := charge_trigger_range if charge_attack else attack_range
				if dist <= trigger:
					ai_state = AIState.ATTACK_WINDUP
					_state_timer = windup_duration
					_attack_target_pos = player.global_position
					_charge_dir = facing_dir
					velocity = Vector2.ZERO
					queue_redraw()
				else:
					velocity = facing_dir * move_speed
			else:
				velocity = Vector2.ZERO

		AIState.ATTACK_WINDUP:
			_state_timer -= delta
			velocity = Vector2.ZERO
			# Durante la carga de la embestida sigue apuntando al jugador hasta el ultimo tercio
			if charge_attack and is_instance_valid(player) and _state_timer > windup_duration * 0.33:
				var to_p2 := player.global_position - global_position
				if to_p2.length() > 0.01:
					_charge_dir = to_p2.normalized()
					facing_dir = _charge_dir
			queue_redraw()
			if _state_timer <= 0.0:
				if charge_attack:
					ai_state = AIState.CHARGING
					_state_timer = charge_duration
					_charge_hit_done = false
				else:
					_execute_attack(player)

		AIState.CHARGING:
			_state_timer -= delta
			velocity = _charge_dir * charge_speed
			if not _charge_hit_done and is_instance_valid(player) and player.state != PlayerController.State.DEAD:
				if global_position.distance_to(player.global_position) <= attack_range:
					_charge_hit_done = true
					player.take_damage(contact_damage, _charge_dir * 140.0)
			if _state_timer <= 0.0 or get_slide_collision_count() > 0:
				# Chocar contra un muro lo deja aturdido mas tiempo (ventana de castigo)
				var stunned := get_slide_collision_count() > 0
				ai_state = AIState.RECOVERY
				_state_timer = recovery_duration * (1.8 if stunned else 1.0)
				velocity = -_charge_dir * (60.0 if stunned else 0.0)

		AIState.RECOVERY:
			_state_timer -= delta
			velocity = velocity.move_toward(Vector2.ZERO, 180.0 * delta)
			if _state_timer <= 0.0:
				ai_state = AIState.CHASE
				queue_redraw()

		AIState.HIT:
			_state_timer -= delta
			velocity = velocity.move_toward(Vector2.ZERO, 240.0 * delta)
			if _state_timer <= 0.0:
				ai_state = AIState.CHASE

		AIState.DEAD:
			_state_timer -= delta
			velocity = Vector2.ZERO
			if _state_timer <= 0.0:
				queue_free()

	move_and_slide()
	_update_sprite()
	queue_redraw()


func _execute_attack(player: Node2D) -> void:
	if is_instance_valid(player) and player.state != PlayerController.State.DEAD:
		var dist := global_position.distance_to(player.global_position)
		if dist <= attack_range + 10.0:
			var push := (player.global_position - global_position).normalized() * 85.0
			player.take_damage(contact_damage, push)
	ai_state = AIState.RECOVERY
	_state_timer = recovery_duration


func take_damage(amount: float, knockback: Vector2 = Vector2.ZERO) -> void:
	if ai_state == AIState.DEAD:
		return
	current_hp = maxf(0.0, current_hp - amount)
	damaged.emit(self, amount)

	if current_hp <= 0.0:
		ai_state = AIState.DEAD
		_state_timer = _death_duration()
		collision_layer = 0
		collision_mask = 0
		var iron := 1 if (is_boss or randf() <= iron_drop_chance) else 0
		if is_boss:
			iron = 3
		died.emit(self, global_position, gold_reward, iron)
		return

	# Los jefes no se interrumpen durante el windup ni la embestida para que su telegrafía sea peligrosa
	if not is_boss or ai_state not in [AIState.ATTACK_WINDUP, AIState.CHARGING]:
		ai_state = AIState.HIT
		_state_timer = 0.16
	velocity = knockback if not is_boss else knockback * 0.25


func _death_duration() -> float:
	return 0.9 if layout == SpriteLayout.SIDE_STRIPS else 0.38


func _direction_to_row(dir: Vector2) -> int:
	if dir.length_squared() < 0.001:
		return 0
	var angle := dir.angle()
	var octant := int(round(angle / (PI / 4.0)))
	match octant:
		2:
			return 0
		1:
			return 1
		0:
			return 2
		-1:
			return 3
		-2:
			return 4
		-3:
			return 5
		4, -4:
			return 6
		3:
			return 7
	return 0


func _update_sprite() -> void:
	if not is_instance_valid(sprite):
		return

	if layout == SpriteLayout.SIDE_STRIPS:
		_update_side_strip_sprite()
		return

	if layout == SpriteLayout.SLIME_15X1:
		match ai_state:
			AIState.DEAD:
				var p := clampf(1.0 - (_state_timer / 0.38), 0.0, 0.99)
				sprite.frame = 9 + int(p * 6.0)
			AIState.HIT:
				sprite.frame = 6 if _state_timer > 0.08 else 7
			AIState.ATTACK_WINDUP:
				sprite.frame = 2 + (int(_anim_clock * 14.0) % 2)
			_:
				sprite.frame = 2 + (int(_anim_clock * 7.0) % 4) if velocity.length() > 2.0 else (int(_anim_clock * 3.0) % 2)
	else:
		var row := _direction_to_row(facing_dir)
		var col := 0
		match ai_state:
			AIState.DEAD:
				col = 22 + (int(_anim_clock * 5.0) % 2)
			AIState.HIT:
				col = 19 if _state_timer > 0.08 else 20
			AIState.ATTACK_WINDUP:
				col = 4 + (int(_anim_clock * 10.0) % 2)
			AIState.RECOVERY:
				col = 6
			_:
				col = int(_anim_clock * 7.0) % 4 if velocity.length() > 2.0 else int(_anim_clock * 3.0) % 2
		sprite.frame_coords = Vector2i(col, row)


## Animacion de tiras laterales: elige tira segun estado, la alinea por los pies
## (cx = centro del cuerpo dentro del frame) y la espeja segun hacia donde mira.
func _update_side_strip_sprite() -> void:
	var key := "idle"
	var frame_idx := 0
	match ai_state:
		AIState.DEAD:
			key = "die"
			var d: Dictionary = side_anims.get(key, {})
			var p := clampf(1.0 - (_state_timer / _death_duration()), 0.0, 0.999)
			frame_idx = int(p * int(d.get("frames", 1)))
		AIState.ATTACK_WINDUP:
			key = "attack"
			var d: Dictionary = side_anims.get(key, {})
			var n := int(d.get("frames", 1))
			# Primera mitad de la tira = preparacion del golpe
			var p := clampf(1.0 - (_state_timer / maxf(0.01, windup_duration)), 0.0, 0.999)
			frame_idx = int(p * maxi(1, n / 2))
		AIState.CHARGING:
			key = "run" if side_anims.has("run") else "walk"
			var d: Dictionary = side_anims.get(key, {})
			frame_idx = int(_anim_clock * 16.0) % int(d.get("frames", 1))
		AIState.RECOVERY:
			if charge_attack:
				key = "idle"
				var d: Dictionary = side_anims.get(key, {})
				frame_idx = int(_anim_clock * 6.0) % int(d.get("frames", 1))
			else:
				key = "attack"
				var d: Dictionary = side_anims.get(key, {})
				var n := int(d.get("frames", 1))
				var p := clampf(1.0 - (_state_timer / maxf(0.01, recovery_duration)), 0.0, 0.999)
				frame_idx = n / 2 + int(p * (n - n / 2))
		AIState.HIT:
			key = "idle"
		_:
			key = "walk" if velocity.length() > 2.0 else "idle"
			var d: Dictionary = side_anims.get(key, {})
			var fps := float(d.get("fps", 8.0))
			frame_idx = int(_anim_clock * fps) % int(d.get("frames", 1))

	if not side_anims.has(key):
		return
	var anim: Dictionary = side_anims[key]
	if _current_anim_key != key:
		_current_anim_key = key
		sprite.texture = anim["tex"]
		sprite.hframes = int(anim["frames"])
		sprite.vframes = 1
		sprite.centered = false
	sprite.frame = clampi(frame_idx, 0, int(anim["frames"]) - 1)

	# Los sprites miran a la izquierda: espejar si el objetivo esta a la derecha
	var flip := facing_dir.x > 0.05
	if absf(facing_dir.x) <= 0.05:
		flip = sprite.flip_h
	sprite.flip_h = flip
	var fw := float(anim["fw"])
	var cx := float(anim["cx"])
	var anchor_x := (fw - cx) if flip else cx
	sprite.offset = Vector2(-anchor_x, -float(anim["h"]) + 6.0)
	sprite.modulate = Color(1.6, 1.6, 1.6) if ai_state == AIState.HIT else Color(1, 1, 1)


func _draw() -> void:
	if ai_state == AIState.DEAD:
		return
	# Barra de vida sobre el enemigo
	var bar_w := 24.0 if not is_boss else 46.0
	var bar_y := -14.0 if not is_boss else -22.0
	if bar_offset_y != 0.0:
		bar_y = bar_offset_y
	var ratio := clampf(current_hp / max_hp, 0.0, 1.0)
	draw_rect(Rect2(-bar_w * 0.5, bar_y, bar_w, 3.0), Color(0.08, 0.08, 0.1, 0.85))
	var hp_col := Color(0.9, 0.25, 0.25) if not is_boss else Color(0.95, 0.55, 0.15)
	draw_rect(Rect2(-bar_w * 0.5, bar_y, bar_w * ratio, 3.0), hp_col)

	# Telegrafia de la embestida: flecha en la direccion de carga
	if charge_attack and ai_state == AIState.ATTACK_WINDUP:
		var progress_c := clampf(1.0 - (_state_timer / maxf(0.01, windup_duration)), 0.0, 1.0)
		var tip := _charge_dir * (charge_speed * charge_duration * 0.55)
		draw_line(Vector2.ZERO, tip * progress_c, Color(1.0, 0.3, 0.2, 0.55), 6.0)
		draw_line(Vector2.ZERO, tip, Color(1.0, 0.35, 0.25, 0.85), 1.0)
		return

	# Señal visual clara antes de atacar (GDD 5.4 recomendación)
	if ai_state == AIState.ATTACK_WINDUP:
		var progress := clampf(1.0 - (_state_timer / maxf(0.01, windup_duration)), 0.0, 1.0)
		draw_circle(Vector2.ZERO, attack_range * progress, Color(1.0, 0.25, 0.2, 0.28))
		draw_arc(Vector2.ZERO, attack_range, 0.0, TAU, 24, Color(1.0, 0.3, 0.2, 0.85), 1.2)
