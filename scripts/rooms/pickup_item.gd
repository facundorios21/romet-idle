extends Node2D
class_name PickupActor
## Objeto físico recolectable en el suelo de la mazmorra (GDD sección 3.1):
## - Monedas de oro (permanente)
## - Materiales de crafteo permanentes: Hierro, Madera, Cuero, Esencia Antigua
## - Pickups de expedición: Corazón (+HP), Llave y Bomba

signal collected(pickup_type: String, amount: int, pos: Vector2)

enum Type {
	GOLD,
	IRON,
	WOOD,
	LEATHER,
	ESSENCE,
	HEART,
	KEY,
	BOMB
}

var pickup_type: Type = Type.GOLD
var amount: int = 1
var is_collected: bool = false
var _velocity: Vector2 = Vector2.ZERO
var _clock: float = 0.0
var _pickup_delay: float = 0.22
var _sprite: Sprite2D

const MAGNET_RADIUS := 46.0
const COLLECT_RADIUS := 11.0


func setup(p_type: Type, p_amount: int, tex: Texture2D, burst: bool = true) -> void:
	pickup_type = p_type
	amount = p_amount
	_clock = randf() * TAU
	if burst:
		var angle := randf() * TAU
		var speed := randf_range(26.0, 56.0)
		_velocity = Vector2.from_angle(angle) * speed
		_pickup_delay = 0.22
	else:
		_velocity = Vector2.ZERO
		_pickup_delay = 0.08

	_sprite = Sprite2D.new()
	_sprite.texture = tex
	_sprite.scale = Vector2(0.85, 0.85)
	add_child(_sprite)


func _process(delta: float) -> void:
	_clock += delta * 6.0
	_pickup_delay = maxf(0.0, _pickup_delay - delta)
	_velocity = _velocity.move_toward(Vector2.ZERO, 160.0 * delta)

	var player := get_tree().get_first_node_in_group("player") as Node2D
	if _pickup_delay <= 0.0 and is_instance_valid(player) and player.state != PlayerController.State.DEAD:
		var to_p := player.global_position - global_position
		var dist := to_p.length()
		if dist <= COLLECT_RADIUS:
			_collect()
			return
		elif dist <= MAGNET_RADIUS:
			var pull_speed := lerpf(160.0, 68.0, dist / MAGNET_RADIUS)
			_velocity = to_p.normalized() * pull_speed

	position += _velocity * delta
	# Limites de la arena ampliada (ARENA_RECT = Rect2(16, 52, 416, 288) en main_controller)
	position.x = clampf(position.x, 24.0, 424.0)
	position.y = clampf(position.y, 68.0, 332.0)

	if is_instance_valid(_sprite):
		_sprite.position.y = -absf(sin(_clock)) * 3.0
		if pickup_type in [Type.GOLD, Type.KEY, Type.ESSENCE]:
			var pulse := 0.92 + 0.08 * sin(_clock * 1.6)
			_sprite.scale = Vector2(pulse, pulse)
	queue_redraw()


func _collect() -> void:
	if is_collected:
		return
	is_collected = true
	var type_key := "gold"
	match pickup_type:
		Type.GOLD:
			type_key = "gold"
		Type.IRON:
			type_key = "iron"
		Type.WOOD:
			type_key = "wood"
		Type.LEATHER:
			type_key = "leather"
		Type.ESSENCE:
			type_key = "essence"
		Type.HEART:
			type_key = "heart"
		Type.KEY:
			type_key = "key"
		Type.BOMB:
			type_key = "bomb"
	collected.emit(type_key, amount, global_position)
	queue_free()


func _draw() -> void:
	draw_circle(Vector2(0, 5), 4.0, Color(0, 0, 0, 0.35))
