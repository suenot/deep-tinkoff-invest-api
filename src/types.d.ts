export interface TinkoffNumber {
  currency?: string;
  units: number;
  nano: number;
}

export interface Position {
  pair?: string;
  base?: string;
  quote?: string;
  figi?: string;
  amount?: number;
  lotSize?: number;
  price?: TinkoffNumber;
  priceNumber?: number;
  lotPrice?: TinkoffNumber;
  lotPriceNumber?: number;
  minPriceIncrement?: TinkoffNumber;
  // minPriceIncrementNumber?: number;
  totalPrice?: TinkoffNumber;
  totalPriceNumber?: number;
  desiredAmountNumber?: number;
  canBuyBeforeTargetLots?: number;
  canBuyBeforeTargetNumber?: number;
  beforeDiffNumber?: number;
  toBuyLots?: number;
  toBuyNumber?: number;
}

export type Wallet = Position[];

export interface DesiredWallet {
  [key: string]: number;
}
