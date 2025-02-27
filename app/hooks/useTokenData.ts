import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import type { TokenInfo, TokenMetrics, TokenTransfer, TokenMarketData } from "../types/token";
import { ERC20_ABI } from "../constants/abis";
import { getRpcUrl } from "../constants/networks";
import { checkERC20Compliance, getTokenInfo, calculateMarketCap, calculateFullyDilutedCap, calculateMarketCapDifference, analyzeOffMarketSales } from "../utils/tokenUtils";

interface UseTokenDataProps {
  tokenAddress: string;
  chainId: number;
  priceUsd?: number;
  skipInitialFetch?: boolean; // New flag to control initial fetch
}

interface UseTokenDataResult {
  loading: boolean;
  error: string | null;
  tokenMetrics: TokenMetrics | null;
  refreshData: () => Promise<void>;
}

// Helper function to get chain name from chain ID
const getChainName = (chainId: number): string => {
  const chainNames: Record<number, string> = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
  };
  return chainNames[chainId] || `Chain ID ${chainId}`;
};

// Helper function to format token amounts with commas and decimals
const formatTokenAmount = (amount: string, decimals: number): string => {
  try {
    const bn = ethers.BigNumber.from(amount);
    const divisor = ethers.BigNumber.from(10).pow(decimals);
    const integerPart = bn.div(divisor);
    const formattedAmount = integerPart.toNumber().toLocaleString();
    return formattedAmount;
  } catch (error) {
    return amount;
  }
};

// Store successful RPC endpoints in memory to prioritize them in future connections
let lastSuccessfulRpcByChain: Record<number, string> = {};

/**
 * Attempt to connect with multiple fallback URLs, prioritizing recently successful connections
 */
const tryConnectToNetwork = async (chainId: number): Promise<ethers.providers.Provider> => {
  // Get primary RPC URL
  const primaryRpcUrl = getRpcUrl(chainId);
  
  // Define fallback RPC URLs for major networks
  const fallbackUrls: Record<number, string[]> = {
    1: [
      'https://rpc.ankr.com/eth', 
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com',
      'https://1rpc.io/eth'
    ],
    5: [
      'https://rpc.ankr.com/eth_goerli',
      'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
    ],
    11155111: [
      'https://rpc.sepolia.org',
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
    ]
  };
  
  // Get fallbacks for current chain (empty array if none defined)
  const fallbacks = fallbackUrls[chainId] || [];
  
  // Determine the order of RPC URLs to try
  let rpcUrls: string[] = [];
  
  // If we have a recently successful URL for this chain, try it first
  if (lastSuccessfulRpcByChain[chainId]) {
    console.log(`Using recently successful RPC endpoint for ${getChainName(chainId)}`);
    rpcUrls.push(lastSuccessfulRpcByChain[chainId]);
  }
  
  // Then try primary URL (if not already added)
  if (!rpcUrls.includes(primaryRpcUrl)) {
    rpcUrls.push(primaryRpcUrl);
  }
  
  // Then add all fallbacks that aren't already in the list
  for (const url of fallbacks) {
    if (!rpcUrls.includes(url)) {
      rpcUrls.push(url);
    }
  }
  
  // Try each RPC URL in sequence with detailed logging
  let lastError: unknown = null;
  
  for (let i = 0; i < rpcUrls.length; i++) {
    const url = rpcUrls[i];
    const isLast = i === rpcUrls.length - 1;
    
    try {
      console.log(`Attempting to connect to ${i === 0 ? 'preferred' : i === 1 ? 'primary' : 'fallback'} RPC: ${url}`);
      const provider = new ethers.providers.JsonRpcProvider(url);
      
      // Test connection with a simple call
      await withTimeout(provider.getBlockNumber(), 5000, 'RPC connection timeout');
      console.log(`✅ Successfully connected to ${url}`);
      
      // Store this successful connection for future use
      lastSuccessfulRpcByChain[chainId] = url;
      
      return provider;
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Format error message based on type of error
      let formattedError = errorMsg;
      if (errorMsg.includes('timeout')) {
        formattedError = `Connection timed out`;
      } else if (errorMsg.includes('noNetwork') || errorMsg.includes('NETWORK_ERROR')) {
        formattedError = `Network error`;
      } else if (errorMsg.includes('rate') || errorMsg.includes('limit')) {
        formattedError = `Rate limit exceeded`;
      }
      
      console.warn(`❌ Failed to connect to ${url}: ${formattedError}`);
      
      // If this is the last URL to try, we're out of options
      if (isLast) {
        console.error(`⛔ All RPC connection attempts failed for ${getChainName(chainId)}`);
        break;
      }
      
      // Otherwise continue to the next URL
      console.log(`Trying next RPC endpoint...`);
    }
  }
  
  // If we get here, all connections failed
  throw new Error(
    `Unable to connect to ${getChainName(chainId)}. ` +
    `We tried ${rpcUrls.length} different RPC endpoints but all failed. ` + 
    `Latest error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
};

/**
 * Helper function to execute any promise with timeout
 */
const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  errorMessage: string
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result as T;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
};

// Function to categorize and handle ethers errors
const categorizeEthersError = (error: unknown): string => {
  // Check for JSON-RPC errors
  if (typeof error === 'object' && error !== null) {
    const err = error as {code?: string; event?: string; message?: string; reason?: string};
    
    // Check for JSON-RPC errors
    if (err.code === 'SERVER_ERROR') {
      return 'The blockchain node reported an error. This may be due to congestion or rate limiting.';
    }
    
    // Check for network errors
    if (err.code === 'NETWORK_ERROR' || err.event === 'noNetwork') {
      return 'Network connection error. Unable to connect to the Ethereum network. Please check your internet connection or try a different RPC endpoint.';
    }
    
    // Check for timeout errors
    if (err.code === 'TIMEOUT' || (err.message && err.message.includes('timeout'))) {
      return 'The request to the blockchain timed out. The network may be congested or the RPC endpoint may be experiencing issues.';
    }
    
    // Check for call exceptions (contract errors)
    if (err.code === 'CALL_EXCEPTION') {
      return 'There was an error executing a function on the token contract. The token might not be fully ERC-20 compliant.';
    }
    
    // Return message or reason if available
    if (err.message) {
      return `Blockchain error: ${err.message}`;
    }
    
    if (err.reason) {
      return `Blockchain error: ${err.reason}`;
    }
  }
  
  // Unknown errors
  return 'Unknown blockchain error occurred';
};

/**
 * Check if a transfer is considered large (>0.5% of total supply)
 */
const isLargeTransferCheck = (value: string, totalSupply: string): boolean => {
  if (!value || !totalSupply) return false;

  try {
    // Parse the values
    const valueBN = ethers.BigNumber.from(value);
    const totalSupplyBN = ethers.BigNumber.from(totalSupply);
    
    // Don't perform calculation on zero total supply
    if (totalSupplyBN.isZero()) return false;
    
    // Define the threshold (0.5% of total supply)
    const threshold = 0.005; // 0.5%
    
    // Calculate percentage (with BigNumber to handle large values properly)
    const percentage = valueBN.mul(100).div(totalSupplyBN).toNumber() / 100;
    
    return percentage >= threshold;
  } catch (error) {
    console.warn(`Error determining if transfer is large: ${error}`);
    return false;
  }
};

// Define the threshold for reference
const LARGE_TRANSFER_THRESHOLD = 0.005; // 0.5%

// Add efficient block caching to reduce RPC calls
const blockCache = new Map<number, ethers.providers.Block>();

// Add a retry mechanism for block fetching
const getBlockWithRetries = async (
  provider: ethers.providers.Provider,
  blockNumber: number,
  maxRetries = 3
): Promise<ethers.providers.Block> => {
  // Check if block is already in cache
  if (blockCache.has(blockNumber)) {
    return blockCache.get(blockNumber)!;
  }
  
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Different timeout lengths for each retry
      const timeoutMs = attempt === 1 ? 10000 : 15000;
      
      // Show retry message if not first attempt
      if (attempt > 1) {
        console.log(`Retrying block ${blockNumber} fetch (attempt ${attempt}/${maxRetries})...`);
      }
      
      // Fetch the block with timeout
      const block = await withTimeout(
        provider.getBlock(blockNumber),
        timeoutMs,
        `Block data request timed out for block ${blockNumber}`
      );
      
      // Add to cache
      blockCache.set(blockNumber, block);
      return block;
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        console.warn(`Failed to get block ${blockNumber} after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  // If we reached here, all attempts failed - create a fallback block
  console.log(`Using estimated timestamp for block ${blockNumber} due to RPC timeout`);
  
  // If we can't get the block, create a minimal block with estimated timestamp
  // For Ethereum: ~13 seconds per block on average
  const SECONDS_PER_BLOCK = 13;
  
  // Get the current block if available, or use a fallback timestamp
  let estimatedTimestamp: number;
  try {
    const currentBlock = await provider.getBlock('latest');
    const blockDifference = currentBlock.number - blockNumber;
    estimatedTimestamp = currentBlock.timestamp - (blockDifference * SECONDS_PER_BLOCK);
  } catch (error) {
    // If we can't even get the current block, use current time minus estimation
    estimatedTimestamp = Math.floor(Date.now() / 1000) - (1000 * SECONDS_PER_BLOCK);
  }
  
  const fallbackBlock: ethers.providers.Block = {
    hash: `estimated-${blockNumber}`,
    parentHash: '',
    number: blockNumber,
    timestamp: estimatedTimestamp,
    nonce: '',
    difficulty: 0,
    _difficulty: ethers.BigNumber.from(0),
    gasLimit: ethers.BigNumber.from(0),
    gasUsed: ethers.BigNumber.from(0),
    miner: '',
    extraData: '',
    transactions: []
  };
  
  return fallbackBlock;
};

/**
 * Process transfer events in batches to optimize block data fetching
 * This dramatically reduces the number of RPC calls by grouping events by block
 */
const processTransferEvents = async (
  provider: ethers.providers.Provider,
  events: ethers.Event[],
  tokenInfo: TokenInfo
): Promise<TokenTransfer[]> => {
  console.log(`Processing ${events.length} transfer events efficiently...`);
  
  if (events.length === 0) {
    return [];
  }
  
  // Group events by block number to reduce RPC calls
  const eventsByBlock: Record<number, ethers.Event[]> = {};
  for (const event of events) {
    if (!eventsByBlock[event.blockNumber]) {
      eventsByBlock[event.blockNumber] = [];
    }
    eventsByBlock[event.blockNumber].push(event);
  }
  
  const blockNumbers = Object.keys(eventsByBlock).map(Number);
  console.log(`Events span ${blockNumbers.length} unique blocks`);
  
  // Pre-fetch blocks in smaller batches to avoid timeout
  const batchSize = 20;
  let processedBlocks = 0;
  
  for (let i = 0; i < blockNumbers.length; i += batchSize) {
    const batch = blockNumbers.slice(i, i + batchSize);
    processedBlocks += batch.length;
    
    // Log progress
    const progressPercent = Math.round((processedBlocks / blockNumbers.length) * 100);
    console.log(`Pre-fetching blocks ${processedBlocks}/${blockNumbers.length} (${progressPercent}%)...`);
    
    // Fetch blocks in parallel with individual timeouts
    await Promise.allSettled(
      batch.map(blockNumber => getBlockWithRetries(provider, blockNumber))
    );
  }
  
  // Process all events using cached block data
  const transfers: TokenTransfer[] = [];
  
  for (const event of events) {
    if (!event.args || event.args.length < 3) continue;
    
    const [from, to, value] = event.args;
    
    try {
      // Get block with retries instead of just cache
      const block = await getBlockWithRetries(provider, event.blockNumber);
      
      const transfer: TokenTransfer = {
        transactionHash: event.transactionHash,
        from: from,
        to: to,
        value: value.toString(),
        timestamp: block.timestamp,
        isLargeTransfer: isLargeTransferCheck(value.toString(), tokenInfo.totalSupply),
      };
      
      transfers.push(transfer);
    } catch (error) {
      console.warn(`Error processing transfer event in tx ${event.transactionHash}: ${error}`);
      // Continue with other events
    }
  }
  
  return transfers;
};

/**
 * Fetch token data with improved error handling and connection retry logic
 */
const fetchTokenData = async (
  tokenAddress: string, 
  chainId: number, 
  priceUsd?: number
): Promise<TokenMetrics> => {
  console.log(`Establishing connection to ${getChainName(chainId)}...`);
  const maxAttempts = 3;
  let provider: ethers.providers.Provider | null = null;
  
  // Try to connect to the network with retries
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Connection attempt ${attempt}/${maxAttempts}...`);
      provider = await tryConnectToNetwork(chainId);
      console.log('✅ Network connection established successfully');
      break;
    } catch (error) {
      console.warn(`Connection attempt ${attempt} failed`);
      if (attempt === maxAttempts) {
        console.error('All connection attempts failed');
        throw new Error(`Failed to connect to network after ${maxAttempts} attempts`);
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!provider) {
    throw new Error('Could not establish network connection');
  }
  
  // Get token information
  console.log('Retrieving basic token information...');
  let tokenInfo: TokenInfo;
  try {
    tokenInfo = await withTimeout(
      getTokenInfo(tokenAddress, provider),
      15000,
      'Token information request timed out'
    );
    console.log(`✅ Retrieved token information: ${tokenInfo.name} (${tokenInfo.symbol})`);
    console.log(`   Decimals: ${tokenInfo.decimals}, Total supply: ${formatTokenAmount(tokenInfo.totalSupply, tokenInfo.decimals)}`);
  } catch (error: any) {
    console.error(`Failed to get token information: ${error.message || error}`);
    throw new Error(`Failed to retrieve token information: ${error.message || error}`);
  }
  
  // Calculate market data if price is provided
  let marketData: TokenMarketData | undefined;
  if (priceUsd !== undefined && priceUsd > 0) {
    console.log('Calculating market data with provided price...');
    try {
      const marketCap = calculateMarketCap(
        tokenInfo.totalSupply,
        tokenInfo.decimals,
        priceUsd
      );
      
      // Calculate fully diluted market cap
      const fullyDilutedCap = calculateFullyDilutedCap(
        tokenInfo.totalSupply,
        tokenInfo.decimals,
        priceUsd
      );
      
      // Calculate market cap difference and percent
      const { difference: marketCapDifference, percentDifference: marketCapDifferencePercent } = 
        calculateMarketCapDifference(marketCap, fullyDilutedCap);
      
      marketData = {
        price: priceUsd,
        marketCap,
        fullyDilutedCap,
        marketCapDifference,
        marketCapDifferencePercent
      };
      
      console.log(`✅ Market cap calculated: $${marketCap.toLocaleString()}`);
      console.log(`✅ Fully diluted market cap: $${fullyDilutedCap.toLocaleString()}`);
      console.log(`✅ Market cap difference: $${marketCapDifference.toLocaleString()} (${marketCapDifferencePercent.toFixed(2)}%)`);
    } catch (error) {
      console.warn('Failed to calculate market data correctly');
    }
  } else {
    console.log('No price provided, skipping market data calculation');
  }
  
  // Get current block number
  console.log('Retrieving current block number...');
  let currentBlock: number;
  try {
    currentBlock = await withTimeout(
      provider.getBlockNumber(),
      5000,
      'Block number request timed out'
    );
    console.log(`✅ Current block: ${currentBlock}`);
  } catch (error: any) {
    console.error(`Failed to get current block: ${error.message || error}`);
    throw new Error(`Failed to get current block: ${error.message || error}`);
  }
  
  // Calculate block range - look back approximately 30 days
  // Ethereum: ~6500 blocks per day
  // (other chains may vary, but this is a reasonable starting point)
  const blocksPerDay = 6500;
  const daysToLookBack = 30;
  const blockRange = blocksPerDay * daysToLookBack;
  
  const fromBlock = Math.max(0, currentBlock - blockRange);
  console.log(`Analyzing token transfers from block ${fromBlock} to ${currentBlock} (approximately ${daysToLookBack} days)`);
  
  // Create contract instance
  const contract = new ethers.Contract(
    tokenAddress,
    ERC20_ABI,
    provider
  );
  
  // Get recent transfers - we'll try to get them in chunks to avoid timeouts
  console.log('Retrieving transfer events...');
  let recentTransfers: TokenTransfer[] = [];
  let largeTransfers: TokenTransfer[] = [];
  
  try {
    // Try to get transfers in manageable chunks
    const chunkSize = 10000; // Number of blocks per chunk
    let processedBlocks = 0;
    let totalEvents = 0;
    let allEvents: ethers.Event[] = [];
    
    // Process in chunks to avoid timeouts
    for (let chunkStart = fromBlock; chunkStart < currentBlock; chunkStart += chunkSize) {
      const chunkEnd = Math.min(currentBlock, chunkStart + chunkSize - 1);
      processedBlocks += (chunkEnd - chunkStart + 1);
      
      console.log(`Fetching transfers for blocks ${chunkStart} to ${chunkEnd} (${Math.round(processedBlocks / blockRange * 100)}% complete)...`);
      
      try {
        // Get Transfer events for this chunk with a timeout
        const filter = contract.filters.Transfer();
        const events = await withTimeout(
          contract.queryFilter(filter, chunkStart, chunkEnd),
          20000, // 20 second timeout for each chunk
          `Transfer events request timed out for blocks ${chunkStart}-${chunkEnd}`
        );
        
        console.log(`Retrieved ${events.length} transfer events for blocks ${chunkStart}-${chunkEnd}`);
        totalEvents += events.length;
        allEvents = [...allEvents, ...events];
        
        // If we have more than 2000 events already, stop to avoid overwhelming the UI
        if (allEvents.length > 2000) {
          console.log(`Reached 2000+ events, stopping retrieval to avoid performance issues`);
          break;
        }
      } catch (error: any) {
        let errorMessage = error.message || 'Unknown error';
        let userFriendlyMessage = errorMessage;
        
        // Format user-friendly message for common errors
        if (errorMessage.includes('timeout')) {
          userFriendlyMessage = `Block fetch timed out for blocks ${chunkStart}-${chunkEnd}. This is normal on busy networks and we will continue with other blocks.`;
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
          userFriendlyMessage = `RPC rate limit reached for blocks ${chunkStart}-${chunkEnd}. The provider is limiting our requests. We'll try different blocks.`;
        }
        
        console.warn(`Error fetching chunk ${chunkStart}-${chunkEnd}: ${userFriendlyMessage}. Continuing to next chunk.`);
        // Continue to next chunk despite errors
      }
    }
    
    console.log(`Retrieved a total of ${totalEvents} raw transfer events, processing...`);

    // Process all collected events efficiently
    if (allEvents.length > 0) {
      const processedTransfers = await processTransferEvents(provider, allEvents, tokenInfo);
      
      // Sort transfers by timestamp (most recent first)
      processedTransfers.sort((a, b) => b.timestamp - a.timestamp);
      
      // Separate large transfers
      recentTransfers = processedTransfers;
      largeTransfers = processedTransfers.filter(t => t.isLargeTransfer);
      
      console.log(`✅ Processed ${recentTransfers.length} transfers`);
      console.log(`   Found ${largeTransfers.length} large transfers (>${LARGE_TRANSFER_THRESHOLD * 100}% of supply)`);
    } else {
      console.log('No transfer events found for this token in the analyzed time period');
    }
  } catch (error: any) {
    console.error(`Failed to retrieve transfer events: ${error.message || error}`);
    // Don't throw here - we'll return what we have
    // Just log it as a warning
    console.warn('Unable to retrieve all transfer events. Results may be incomplete.');
  }

  console.log('Analysis complete! Preparing results...');

  // Analyze off-market sales if price is available
  if (marketData && priceUsd && priceUsd > 0 && largeTransfers.length > 0) {
    console.log('Analyzing off-market sales patterns...');
    try {
      const { abovePrice, belowPrice, percentage, volumeUSD } = 
        analyzeOffMarketSales(largeTransfers, tokenInfo, priceUsd);
      
      // Add off-market analysis to the market data
      marketData.offMarketSalesAbove = abovePrice;
      marketData.offMarketSalesBelow = belowPrice;
      marketData.offMarketSalesPercentage = percentage;
      
      console.log(`✅ Off-market sales identified: ${percentage.toFixed(2)}% of market cap`);
      console.log(`   Above price: ${abovePrice.toFixed(2)}%, Below price: ${belowPrice.toFixed(2)}%`);
      console.log(`   Total volume: $${volumeUSD.toLocaleString()}`);
    } catch (error) {
      console.warn('Failed to analyze off-market sales:', error);
    }
  }

  // Return the token metrics
  return {
    tokenInfo: {
      ...tokenInfo,
      chainId
    },
    marketData,
    recentTransfers,
    largeTransfers,
  };
};

export const useTokenData = ({
  tokenAddress,
  chainId,
  priceUsd = 0,
  skipInitialFetch = false, // Default to false for backward compatibility
}: UseTokenDataProps): UseTokenDataResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics | null>(null);

  // Function to fetch token data
  const fetchData = useCallback(async () => {
    if (!tokenAddress || !ethers.utils.isAddress(tokenAddress)) {
      setError("Please enter a valid token address");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Starting analysis for token address: ${tokenAddress} on chain ID: ${chainId}`);
      console.log('Connecting to blockchain network...');
      
      const metrics = await fetchTokenData(tokenAddress, chainId, priceUsd);
      setTokenMetrics(metrics);
      
      console.log('Analysis completed successfully');
    } catch (err: any) {
      console.error(`Failed to fetch token data: ${err.message || err}`);
      setError(err.message || 'Failed to fetch token data');
      
      // If we already have token metrics, keep them while showing the error
      if (!tokenMetrics) {
        setTokenMetrics(null);
      }
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, chainId, priceUsd, tokenMetrics]);

  // Initial data fetch
  useEffect(() => {
    if (tokenAddress && ethers.utils.isAddress(tokenAddress) && !skipInitialFetch) {
      fetchData();
    }
  }, [tokenAddress, skipInitialFetch, fetchData]);

  // Return loading state, error, data, and refresh function
  return {
    loading,
    error,
    tokenMetrics,
    refreshData: fetchData,
  };
};