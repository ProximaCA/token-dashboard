import type { Chain } from '../types/chain';

// Default chain ID to use when no specific chain is selected
export const DEFAULT_CHAIN_ID = 1; // Ethereum Mainnet

// Supported chains for the application
export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    network: 'mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Infura public endpoint
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
  {
    id: 5,
    name: 'Goerli Testnet',
    network: 'goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
  },
  {
    id: 11155111,
    name: 'Sepolia Testnet',
    network: 'sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Infura public endpoint
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
  },
  {
    id: 137,
    name: 'Polygon Mainnet',
    network: 'polygon',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    testnet: false,
  },
  {
    id: 80001,
    name: 'Mumbai Testnet',
    network: 'mumbai',
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/demo',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    testnet: true,
  },
  {
    id: 56,
    name: 'BNB Smart Chain',
    network: 'bsc',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    testnet: false,
  },
  {
    id: 43114,
    name: 'Avalanche C-Chain',
    network: 'avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    testnet: false,
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    network: 'arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
  {
    id: 10,
    name: 'Optimism',
    network: 'optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
];

// Function to get the correct RPC URL based on chain ID
export const getRpcUrl = (chainId: number): string => {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  return chain?.rpcUrl || 'https://rpc.ankr.com/eth';
};

// Function to get the explorer URL for a specific chain ID
export const getExplorerUrl = (chainId: number): string => {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  return chain?.explorerUrl || 'https://etherscan.io';
};

// Chain name lookup by ID
export const getChainName = (chainId: number): string => {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  return chain?.name || 'Unknown Network';
};

// Block explorers
export const getBlockExplorerUrl = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return "https://etherscan.io";
    case 5:
      return "https://goerli.etherscan.io";
    case 11155111:
      return "https://sepolia.etherscan.io";
    default:
      return "https://etherscan.io";
  }
};

// Function to get token explorer URL
export const getTokenExplorerUrl = (chainId: number, address: string): string => {
  const baseUrl = getBlockExplorerUrl(chainId);
  return `${baseUrl}/token/${address}`;
};

// Function to get transaction explorer URL
export const getTransactionExplorerUrl = (chainId: number, txHash: string): string => {
  const baseUrl = getBlockExplorerUrl(chainId);
  return `${baseUrl}/tx/${txHash}`;
};

// Function to get address explorer URL
export const getAddressExplorerUrl = (chainId: number, address: string): string => {
  const baseUrl = getBlockExplorerUrl(chainId);
  return `${baseUrl}/address/${address}`;
}; 