export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string; // represented as a string due to BigInt values
  isERC20Compliant: boolean;
  chainId: number;
}

export interface TokenMarketData {
  price: number;
  marketCap: number;
  fullyDilutedCap?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCapDifference?: number;
  marketCapDifferencePercent?: number;
  offMarketSalesAbove?: number;
  offMarketSalesBelow?: number;
  offMarketSalesPercentage?: number;
}

export interface TokenTransfer {
  transactionHash: string;
  from: string;
  to: string;
  value: string; // represented as a string due to BigInt values
  timestamp: number;
  isLargeTransfer: boolean; // transfers > 1% of total supply
}

export interface TokenMetrics {
  tokenInfo: TokenInfo;
  marketData?: TokenMarketData;
  recentTransfers: TokenTransfer[];
  largeTransfers: TokenTransfer[];
} 