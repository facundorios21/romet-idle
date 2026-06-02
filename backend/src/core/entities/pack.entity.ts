export class Pack {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly cost: number,
    public readonly cardsCount: number,
    public readonly probCommon: number,
    public readonly probRare: number,
    public readonly probEpic: number,
    public readonly probLegendary: number,
    public readonly probMythic: number,
  ) {}
}
