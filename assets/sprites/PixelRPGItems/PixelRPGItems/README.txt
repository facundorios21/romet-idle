PIXEL RPG ITEMS - 300 16x16 item icons
======================================

300 hand-crafted 16x16 pixel art RPG items in 15 categories (20 each), all in one consistent style:
dark selective outline, top-left lighting, 4-tone hue-shifted shading.

CONTENTS
  Items/<Category>/<Item>.png          16x16 PNG per item, transparent background
  Scaled_x4/<Category>/<Item>.png      the same icon at 64x64 (nearest neighbour) for UI/mockups
  RPG_Items_Sheet.png                  all 300 items, 20x15 grid of 16x16 (320x240), one category per row
  Scaled_x4/RPG_Items_Sheet_x2/_x4     the sheet upscaled x2 / x4
  Category_Sheets/<Category>_Sheet.png 20 items of one category in a row (320x16)
  items.json                           name, category, file and sheet offset of every item
  Preview_All.png                      labelled preview

CATEGORIES
  Swords:           Wooden Sword, Iron Sword, Steel Longsword, Golden Sword, Broadsword, Greatsword, Katana, Rapier, Scimitar, Cutlass, Crystal Sword, Flame Sword, Frost Sword, Shadow Sword, Holy Sword, Bone Sword, Serrated Sword, Rune Sword, Dragon Slayer, Royal Sword
  Axes & Hammers:   Hatchet, Iron Axe, Battle Axe, Double Axe, Golden Axe, Crystal Axe, Obsidian Axe, Wooden Club, Spiked Club, Bone Club, Iron Mace, Spiked Mace, Golden Mace, Crystal Mace, Morning Star, Mallet, War Hammer, Iron Hammer, Golden Hammer, Thunder Hammer
  Spears & Daggers: Wooden Spear, Iron Spear, Golden Spear, Crystal Spear, Bone Spear, Flame Spear, Trident, Halberd, Glaive, Scythe, Lance, Dagger, Golden Dagger, Crystal Dagger, Poison Dagger, Bone Knife, Wavy Dagger, Kunai, Sai, Sickle
  Bows & Ranged:    Short Bow, Long Bow, Hunting Bow, Elven Bow, Golden Bow, Crystal Bow, Bone Bow, Crossbow, Heavy Crossbow, Golden Crossbow, Arrow, Fire Arrow, Ice Arrow, Poison Arrow, Crossbow Bolt, Arrow Bundle, Quiver, Slingshot, Boomerang, Shuriken
  Staffs & Wands:   Wooden Staff, Apprentice Staff, Fire Staff, Ice Staff, Thunder Staff, Nature Staff, Shadow Staff, Holy Staff, Crystal Staff, Druid Staff, Wand, Star Wand, Fire Wand, Ice Wand, Heart Wand, Moon Wand, Bone Wand, Scepter, Arcane Orb, Fire Orb
  Shields:          Wooden Shield, Buckler, Iron Shield, Knight Shield, Crusader Shield, Royal Shield, Kite Shield, Tower Shield, Golden Shield, Crystal Shield, Dragon Shield, Spiked Shield, Skull Shield, Sun Shield, Moon Shield, Elven Shield, Bone Shield, Pot Lid, Star Shield, Leather Shield
  Helmets:          Leather Cap, Bandana, Hood, Wizard Hat, Witch Hat, Straw Hat, Pirate Hat, Feathered Cap, Chain Coif, Iron Helm, Knight Helm, Plumed Helm, Spartan Helm, Viking Helm, Golden Helm, Crystal Helm, Skull Helm, Dragon Helm, Samurai Helm, Miner Helmet
  Armor:            Cloth Shirt, Leather Armor, Chain Mail, Iron Armor, Golden Armor, Crystal Armor, Dragon Armor, Mage Robe, Dark Robe, Leather Pants, Iron Greaves, Leather Gloves, Iron Gauntlets, Golden Gauntlets, Mage Gloves, Leather Boots, Iron Boots, Golden Boots, Winged Boots, Speed Boots
  Accessories:      Gold Ring, Silver Ring, Ruby Ring, Sapphire Ring, Emerald Ring, Amethyst Ring, Skull Ring, Ruby Amulet, Sapphire Amulet, Emerald Amulet, Eye Amulet, Heart Locket, Tooth Necklace, Pearl Necklace, Gold Crown, Silver Tiara, Bracelet, Belt, Red Cape, Medal
  Potions:          Small Health Potion, Health Potion, Big Health Potion, Small Mana Potion, Mana Potion, Big Mana Potion, Stamina Potion, Poison Flask, Antidote, Speed Potion, Strength Potion, Defense Potion, Invisibility Potion, Fire Resist Potion, Love Potion, Luck Potion, Elixir, Exp Potion, Empty Bottle, Holy Water
  Food:             Apple, Grapes, Carrot, Mushroom, Bread, Cheese, Egg, Drumstick, Steak, Raw Fish, Cooked Fish, Pie, Cookie, Honey, Milk, Ale Mug, Stew, Watermelon Slice, Cake Slice, Cherries
  Materials:        Stone, Coal, Copper Ore, Iron Ore, Gold Ore, Mythril Ore, Copper Ingot, Iron Ingot, Gold Ingot, Log, Planks, Leather, Cloth, Thread, Bone, Feather, Herb, Slime, Fang, Dragon Scale
  Treasure:         Coin Stack, Coin Pouch, Chalice, Ruby, Sapphire, Emerald, Topaz, Diamond, Amethyst, Pearl, Gold Coin, Silver Coin, Copper Coin, Wooden Chest, Golden Chest, Open Chest, Iron Key, Gold Key, Crystal Key, Skull Key
  Scrolls & Books:  Scroll, Map, Letter, Quest Notice, Open Book, Quill Ink, Fire Scroll, Ice Scroll, Thunder Scroll, Heal Scroll, Red Book, Blue Book, Green Book, Grimoire, Holy Book, Journal, Fire Rune, Water Rune, Earth Rune, Wind Rune
  Tools:            Pickaxe, Gold Pickaxe, Shovel, Hoe, Watering Can, Fishing Rod, Saw, Torch, Lantern, Candle, Rope, Bomb, Compass, Hourglass, Spyglass, Backpack, Bucket, Lockpick, Bandage, Anvil

TIPS
  Use nearest-neighbour / "Point" filtering and integer scaling (x2, x3, x4...).
  Unity: Filter Mode = Point, Compression = None, Sprite Mode = Multiple, Grid By Cell Size 16x16.
  Godot: Texture Filter = Nearest; AtlasTexture regions from items.json (sheet_x, sheet_y, 16, 16).
  GameMaker / RPG Maker: import RPG_Items_Sheet.png as a 16x16 tile/icon set.
  Roblox: ResampleMode = Pixelated; ImageRectSize = 16x16, ImageRectOffset from items.json.

LICENSE
  CC0 1.0 - free for personal and commercial projects, no credit required (credit appreciated!).
  Please don't resell or redistribute the pack itself as an asset pack.
