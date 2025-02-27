"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { ethers } from "ethers";

interface TokenSearchProps {
  onSearch: (tokenAddress: string, chainId: number, price: number) => void;
  isLoading: boolean;
}

export default function TokenSearch({ onSearch, isLoading }: TokenSearchProps) {
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number>(1); // Default to Ethereum Mainnet
  const [tokenPrice, setTokenPrice] = useState<string>("0");
  const [addressError, setAddressError] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // Simulate progress when loading
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    
    if (isLoading) {
      // Reset progress when loading starts
      setLoadingProgress(0);
      
      // Simulate progress up to 90% (the last 10% will complete when data arrives)
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          // Gradually slow down as we approach 90%
          const increment = Math.max(1, Math.floor((90 - prev) / 10));
          return Math.min(90, prev + increment);
        });
      }, 500);
    } else if (loadingProgress > 0) {
      // Complete the progress when loading finishes
      setLoadingProgress(100);
      // Reset after animation completes
      const timeout = setTimeout(() => setLoadingProgress(0), 500);
      return () => clearTimeout(timeout);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadingProgress]);

  // Available networks
  const networks = [
    { id: 1, name: "Ethereum Mainnet" },
    { id: 5, name: "Goerli Testnet" },
    { id: 11155111, name: "Sepolia Testnet" },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setAddressError("");
    
    // Validate token address
    if (!tokenAddress) {
      setAddressError("Token address is required");
      return;
    }
    
    if (!ethers.utils.isAddress(tokenAddress)) {
      setAddressError("Invalid Ethereum address");
      return;
    }
    
    // Parse token price (default to 0 if not provided)
    const price = parseFloat(tokenPrice) || 0;
    
    // Call the search function
    onSearch(tokenAddress, chainId, price);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-lg p-4 mb-6">
      <div className="mb-4">
        <label htmlFor="tokenAddress" className="block mb-2 text-sm font-medium">
          Token Contract Address
        </label>
        <input
          type="text"
          id="tokenAddress"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value.trim())}
          className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="0x..."
          disabled={isLoading}
        />
        {addressError && <p className="mt-1 text-sm text-red-500">{addressError}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="network" className="block mb-2 text-sm font-medium">
            Network
          </label>
          <select
            id="network"
            value={chainId}
            onChange={(e) => setChainId(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          >
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="tokenPrice" className="block mb-2 text-sm font-medium">
            Token Price (USD, optional)
          </label>
          <input
            type="number"
            id="tokenPrice"
            value={tokenPrice}
            onChange={(e) => setTokenPrice(e.target.value)}
            step="0.000000001"
            min="0"
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="0.00"
            disabled={isLoading}
          />
        </div>
      </div>
      
      {/* New progress bar for loading state */}
      {isLoading && (
        <div className="mb-4">
          <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-400 flex justify-between">
            <span>Fetching token data...</span>
            <span>{loadingProgress < 100 ? 'Please wait' : 'Complete!'}</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        {isLoading && (
          <div className="text-sm text-gray-400">
            <ul className="list-disc pl-5">
              <li className="mb-1">Connecting to blockchain...</li>
              <li className="mb-1">Verifying ERC-20 compliance...</li>
              <li className="mb-1">Fetching token transactions...</li>
              <li>Analyzing transfer patterns...</li>
            </ul>
          </div>
        )}
        
        <div className={isLoading ? "ml-auto" : "w-full flex justify-end"}>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 rounded-md font-medium ${
              isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-primary hover:bg-primary/80"
            } transition-colors text-white`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </div>
            ) : (
              "Analyze Token"
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 