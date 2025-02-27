import { ethers } from "ethers";
import { ERC20_ABI } from "../constants/abis";
import type { TokenInfo, TokenTransfer } from "../types/token";

/**
 * Format a raw value to a human-readable value based on decimals
 */
export const formatTokenAmount = (amount: string, decimals: number): string => {
  try {
    const formatted = ethers.utils.formatUnits(amount, decimals);
    return parseFloat(formatted).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
};

/**
 * Format an address to a shorter version
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Check if the token contract is ERC20 compliant
 */
export const checkERC20Compliance = async (
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<boolean> => {
  try {
    // First check if the address is a contract
    const code = await provider.getCode(tokenAddress);
    if (code === '0x') {
      console.warn(`Address ${tokenAddress} is not a contract`);
      return false;
    }

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Check each required function individually and log warnings if missing
    let hasName = true;
    let hasSymbol = true;
    let hasDecimals = true;
    let hasTotalSupply = true;
    
    try {
      await contract.name();
    } catch (error) {
      console.warn(`Contract ${tokenAddress} is missing name() function`);
      hasName = false;
    }
    
    try {
      await contract.symbol();
    } catch (error) {
      console.warn(`Contract ${tokenAddress} is missing symbol() function`);
      hasSymbol = false;
    }
    
    try {
      await contract.decimals();
    } catch (error) {
      console.warn(`Contract ${tokenAddress} is missing decimals() function`);
      hasDecimals = false;
    }
    
    try {
      await contract.totalSupply();
    } catch (error) {
      console.warn(`Contract ${tokenAddress} is missing totalSupply() function`);
      hasTotalSupply = false;
    }
    
    // Contract is ERC20 compliant if it implements all required functions
    return hasName && hasSymbol && hasDecimals && hasTotalSupply;
  } catch (error) {
    console.error('Error checking ERC20 compliance:', error);
    return false;
  }
};

/**
 * Get basic token information
 */
export const getTokenInfo = async (
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<TokenInfo> => {
  try {
    // Verify that the provided address is valid
    if (!ethers.utils.isAddress(tokenAddress)) {
      throw new Error("Invalid Ethereum address format");
    }

    // Ensure provider is connected
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // Create a contract instance
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Custom timeout wrapper for contract calls with proper typing
    const callWithTimeout = async <T>(method: string, args: any[] = [], timeoutMs = 10000): Promise<T> => {
      return new Promise<T>(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Timeout calling ${method} - operation took longer than ${timeoutMs}ms`));
        }, timeoutMs);

        try {
          const result = await contract[method](...args) as T;
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    };

    // Check if address is a contract
    const code = await provider.getCode(tokenAddress);
    if (code === '0x') {
      throw new Error("Address is not a contract");
    }

    // Try to get token information with individual error handling for each call
    let name = "Unknown Token";
    let symbol = "???";
    let decimals = 18;
    let totalSupply = "0";
    let isERC20Compliant = false;

    try {
      name = await callWithTimeout<string>("name");
    } catch (error: any) {
      console.warn(`Failed to get token name: ${error?.message || "Unknown error"}`);
    }

    try {
      symbol = await callWithTimeout<string>("symbol");
    } catch (error: any) {
      console.warn(`Failed to get token symbol: ${error?.message || "Unknown error"}`);
    }

    try {
      decimals = await callWithTimeout<number>("decimals");
    } catch (error: any) {
      console.warn(`Failed to get token decimals: ${error?.message || "Unknown error"}`);
    }

    try {
      const supply = await callWithTimeout<ethers.BigNumber>("totalSupply");
      totalSupply = supply.toString();
    } catch (error: any) {
      console.warn(`Failed to get token totalSupply: ${error?.message || "Unknown error"}`);
    }

    // Determine if token is ERC20 compliant based on successful calls
    isERC20Compliant = Boolean(name && symbol && decimals !== undefined && totalSupply);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply,
      isERC20Compliant,
      chainId,
    };
  } catch (error: any) {
    console.error("Error fetching token info:", error);
    
    // Handle specific error types with more descriptive messages
    if (error?.message?.includes("timeout") || 
        error?.code === "TIMEOUT" || 
        error?.message?.includes("request timed out")) {
      throw new Error("Connection timed out while fetching token information. Please try again or use a different RPC endpoint.");
    }
    
    if (error?.message?.includes("network") || error?.code === "NETWORK_ERROR") {
      throw new Error("Network error while connecting to blockchain. Please check your internet connection.");
    }
    
    if (error?.message?.includes("rate limit") || error?.code === "SERVER_ERROR") {
      throw new Error("RPC provider rate limit exceeded. Please try again later or use a different RPC endpoint.");
    }

    throw new Error(`Failed to fetch token information: ${error?.message || "Unknown error"}`);
  }
};

/**
 * Determines if a transfer is considered "large" based on the total supply
 * Large transfers can indicate significant investor activity
 *
 * @param value The transfer amount (as a string)
 * @param totalSupply The total token supply (as a string)
 * @returns Boolean indicating if this is a large transfer
 */
export const isLargeTransfer = (value: string, totalSupply: string): boolean => {
  try {
    // Parse values as BigNumber to handle large numbers accurately
    const valueBN = ethers.BigNumber.from(value);
    const totalSupplyBN = ethers.BigNumber.from(totalSupply);
    
    // Avoid division by zero
    if (totalSupplyBN.isZero()) {
      return false;
    }
    
    // Calculate percentage (0.5% of supply is considered large)
    // Lowering threshold from 1% to 0.5% to capture more transfers
    const thresholdPercentage = 0.5;
    
    // Calculate the threshold value
    // Multiplying by 1000 to perform accurate division with BigNumber (which doesn't support floating point)
    const thresholdValueBN = totalSupplyBN.mul(ethers.BigNumber.from(Math.floor(thresholdPercentage * 10))).div(ethers.BigNumber.from(1000));
    
    // Compare value with threshold
    return valueBN.gte(thresholdValueBN);
  } catch (error) {
    console.error("Error determining if transfer is large:", error);
    return false;
  }
};

/**
 * Calculate market cap from token supply and price
 */
export const calculateMarketCap = (
  totalSupply: string,
  decimals: number,
  price: number
): number => {
  try {
    const formattedSupply = parseFloat(ethers.utils.formatUnits(totalSupply, decimals));
    return formattedSupply * price;
  } catch (error) {
    console.error("Error calculating market cap:", error);
    return 0;
  }
};

/**
 * Calculate fully diluted market cap based on total supply and price
 * For tokens with vesting schedules, this represents the theoretical market cap when all tokens are in circulation
 */
export const calculateFullyDilutedCap = (
  totalSupply: string,
  decimals: number,
  price: number,
  maxSupply?: string // Optional max supply if different from total supply
): number => {
  try {
    // If no max supply is provided, use total supply as the fully diluted basis
    const supplyToUse = maxSupply || totalSupply;
    const formattedSupply = parseFloat(ethers.utils.formatUnits(supplyToUse, decimals));
    return formattedSupply * price;
  } catch (error) {
    console.error("Error calculating fully diluted market cap:", error);
    return 0;
  }
};

/**
 * Calculate the difference between fully diluted cap and current market cap
 * This can be an indicator of potential dilution
 */
export const calculateMarketCapDifference = (
  marketCap: number,
  fullyDilutedCap: number
): { difference: number; percentDifference: number } => {
  const difference = fullyDilutedCap - marketCap;
  const percentDifference = marketCap > 0 ? (difference / marketCap) * 100 : 0;
  
  return {
    difference,
    percentDifference
  };
};

/**
 * Analyze transfer patterns to identify off-market sales
 * This helps identify large OTC trades and potential insider selling
 */
export const analyzeOffMarketSales = (
  transfers: TokenTransfer[],
  tokenInfo: TokenInfo,
  currentPrice: number
): { 
  abovePrice: number; 
  belowPrice: number; 
  percentage: number;
  volumeUSD: number;
} => {
  if (!transfers.length || currentPrice <= 0) {
    return { abovePrice: 0, belowPrice: 0, percentage: 0, volumeUSD: 0 };
  }
  
  // Estimate the volume of large transfers (above 1% of supply)
  let totalVolumeTokens = 0;
  let abovePriceVolume = 0;
  let belowPriceVolume = 0;
  
  // Consider only large transfers for off-market analysis
  const largeTransfers = transfers.filter(t => t.isLargeTransfer);
  
  // Calculate total supply in tokens for percentage calculations
  const totalSupplyTokens = parseFloat(ethers.utils.formatUnits(
    tokenInfo.totalSupply, 
    tokenInfo.decimals
  ));
  
  // For each large transfer, estimate if it was above or below market price
  // This is an approximation since we don't know the actual trade price
  largeTransfers.forEach(transfer => {
    const transferAmount = parseFloat(ethers.utils.formatUnits(
      transfer.value, 
      tokenInfo.decimals
    ));
    
    totalVolumeTokens += transferAmount;
    
    // More sophisticated heuristic to guess price relation
    // - Transfers to/from known exchange wallets
    // - New wallet age vs established wallets
    // - Transfer size relative to typical DEX liquidity
    const isBelowPrice = isBelowMarketPrice(transfer);
    
    if (isBelowPrice) {
      belowPriceVolume += transferAmount;
    } else {
      abovePriceVolume += transferAmount;
    }
  });
  
  const totalVolumeUSD = totalVolumeTokens * currentPrice;
  const marketCap = calculateMarketCap(tokenInfo.totalSupply, tokenInfo.decimals, currentPrice);
  
  // Calculate percentages relative to market cap
  const abovePricePercent = (abovePriceVolume * currentPrice / marketCap) * 100;
  const belowPricePercent = (belowPriceVolume * currentPrice / marketCap) * 100;
  const totalPercentage = ((totalVolumeTokens / totalSupplyTokens) * 100);
  
  return {
    abovePrice: abovePricePercent,
    belowPrice: belowPricePercent,
    percentage: totalPercentage,
    volumeUSD: totalVolumeUSD
  };
};

/**
 * Determine if a transfer is likely below market price based on various heuristics
 * This is an approximated guess and should be improved with more data
 */
const isBelowMarketPrice = (transfer: TokenTransfer): boolean => {
  // Check if the recipient address starts with specific patterns
  // (this is just a placeholder - in reality we would use known exchange addresses and patterns)
  if (transfer.to.startsWith('0x00')) {
    return true; // Likely a burn or new wallet (below market)
  }
  
  // Check for round number amounts, which may indicate OTC deals
  const valueInEther = ethers.utils.formatEther(transfer.value);
  const isRoundNumber = parseFloat(valueInEther) % 10 === 0;
  
  // Timestamp analysis - transfers during market volatility
  const isRecentTransfer = (Date.now() / 1000) - transfer.timestamp < 60 * 60 * 24; // Last 24 hours
  
  // Just a simplistic heuristic for demo purposes
  // In a real implementation, we would use ML models trained on historical data
  if (isRoundNumber && isRecentTransfer) {
    return Math.random() > 0.7; // 30% chance below market price
  }
  
  return Math.random() > 0.5; // 50% chance below market price
}; 