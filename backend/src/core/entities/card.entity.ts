export class Card {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly imageUrl: string,
    public readonly rarity: string, // COMMON, RARE, EPIC, LEGENDARY, MYTHIC
    public readonly power: number,
    public readonly element: string, // FIRE, WATER, EARTH, AIR, LIGHT, SHADOW
    public readonly set: string,
  ) {}
}
