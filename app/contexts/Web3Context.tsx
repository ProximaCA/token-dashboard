"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { ethers } from "ethers";
import { DEFAULT_CHAIN_ID, getRpcUrl } from "../constants/networks";

// Define Ethereum window type
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextProps {
  provider: ethers.providers.Provider | null;
  chainId: number;
  account: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (newChainId: number) => Promise<void>;
}

// Default values for the context
const defaultContextValue: Web3ContextProps = {
  provider: null,
  chainId: DEFAULT_CHAIN_ID,
  account: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
};

const Web3Context = createContext<Web3ContextProps>(defaultContextValue);

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null);
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [account, setAccount] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Lazy initialize provider to avoid render blocking
  useEffect(() => {
    if (initialized) return;
    
    // Initialize with an IIFE that has error handling
    (async () => {
      try {
        const defaultProvider = new ethers.providers.JsonRpcProvider(
          getRpcUrl(DEFAULT_CHAIN_ID)
        );
        
        // Test the provider with a simple call to make sure it works
        await defaultProvider.getNetwork()
          .then(() => {
            setProvider(defaultProvider);
            console.log("Default provider initialized successfully");
          })
          .catch(error => {
            console.warn("Error testing default provider:", error);
            // Set a fallback provider
            const fallbackProvider = ethers.getDefaultProvider();
            setProvider(fallbackProvider);
          });
      } catch (error) {
        console.error("Failed to initialize Web3 provider:", error);
        // Default to ethers fallback provider as a last resort
        try {
          setProvider(ethers.getDefaultProvider());
        } catch (fallbackError) {
          console.error("Could not even create fallback provider:", fallbackError);
        }
      } finally {
        setInitialized(true);
      }
    })();
  }, [initialized]);

  // Handle wallet connection
  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert("Ethereum wallet not detected. Please install MetaMask or another Web3 wallet.");
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);

      // Get chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      setChainId(chainId);

      // Create a Web3Provider from the browser's ethereum object
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      // Set up event listeners
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      });
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  // Handle wallet disconnection
  const disconnect = () => {
    setAccount(null);
    
    // Don't create a new provider immediately to reduce load time
    // Just revert the chainId
    setChainId(DEFAULT_CHAIN_ID);
    
    // If we're already initialized, create a new provider
    if (initialized) {
      try {
        const defaultProvider = new ethers.providers.JsonRpcProvider(
          getRpcUrl(DEFAULT_CHAIN_ID)
        );
        setProvider(defaultProvider);
      } catch (error) {
        console.error("Error creating provider during disconnect:", error);
        setProvider(null);
      }
    }
  };

  // Handle chain switching
  const switchChain = async (newChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${newChainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    provider,
    chainId,
    account,
    isConnected: !!account,
    connect,
    disconnect,
    switchChain,
  }), [provider, chainId, account]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}; 