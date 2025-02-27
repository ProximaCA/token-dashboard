"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { ERC20_ABI } from "../constants/abis";
import { getRpcUrl, getExplorerUrl } from "../constants/networks";
import LoadingSpinner from "../components/LoadingSpinner";
import ChainSelector from "../components/ChainSelector";
import { SUPPORTED_CHAINS } from "../constants/networks";
import { checkERC20Compliance } from "../utils/tokenUtils";
import Header from "../components/Header";

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  isERC20Compliant: boolean;
  chainId: number;
}

export default function VerifyPage() {
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [inputAddress, setInputAddress] = useState<string>(""); 
  const [chainId, setChainId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  const handleVerify = async () => {
    if (!inputAddress) {
      return;
    }

    setLoading(true);
    setError(null);
    setTokenInfo(null);
    
    try {
      const provider = new ethers.providers.JsonRpcProvider(getRpcUrl(chainId));
      
      // Check if address is valid
      if (!ethers.utils.isAddress(inputAddress)) {
        throw new Error("Invalid Ethereum address format");
      }
      
      // Check if contract is ERC-20 compliant
      const isERC20 = await checkERC20Compliance(inputAddress, provider);
      
      if (!isERC20) {
        setError("The contract at this address is not ERC-20 compliant");
        setLoading(false);
        return;
      }
      
      // Get token info
      const contract = new ethers.Contract(inputAddress, ERC20_ABI, provider);
      
      // Use Promise.allSettled to handle potential errors in individual calls
      const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await Promise.allSettled([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);
      
      // Extract values or provide defaults for failed calls
      const name = nameResult.status === "fulfilled" ? nameResult.value : "Unknown Name";
      const symbol = symbolResult.status === "fulfilled" ? symbolResult.value : "???";
      const decimals = decimalsResult.status === "fulfilled" ? decimalsResult.value : 18;
      const totalSupply = totalSupplyResult.status === "fulfilled" ? totalSupplyResult.value.toString() : "0";
      
      // Set token info
      setTokenAddress(inputAddress);
      setTokenInfo({
        address: inputAddress,
        name,
        symbol,
        decimals,
        totalSupply,
        isERC20Compliant: true,
        chainId,
      });
      
    } catch (err) {
      console.error("Error verifying token:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify token. Please check the address and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Token Verification</h1>
        
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">Enter Token Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Token Contract Address *
              </label>
              <input
                id="tokenAddress"
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="0x..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            
            <div>
              <label htmlFor="chainSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Network *
              </label>
              <ChainSelector
                id="chainSelector"
                selectedChainId={chainId}
                onChainChange={setChainId}
                supportedChains={SUPPORTED_CHAINS}
              />
            </div>
          </div>
          
          <button
            onClick={handleVerify}
            disabled={loading || !inputAddress}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Verifying..." : "Verify Token"}
          </button>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-md border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800">
            <h3 className="font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center items-center my-12">
            <LoadingSpinner size="large" />
            <span className="ml-3 text-lg">Verifying token...</span>
          </div>
        )}
        
        {tokenInfo && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">
                {tokenInfo.name} ({tokenInfo.symbol})
              </h2>
              
              <div className="flex items-center">
                {tokenInfo.isERC20Compliant ? (
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                    ERC-20 Compliant
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">
                    Not ERC-20 Compliant
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Contract Address</h3>
                <div className="flex items-center">
                  <span className="font-mono text-sm break-all">{tokenInfo.address}</span>
                  <a
                    href={`${getExplorerUrl(tokenInfo.chainId)}/address/${tokenInfo.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <span className="sr-only">View on Explorer</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Token Standard</h3>
                <p className="font-semibold">ERC-20</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</h3>
                <p className="font-semibold">{tokenInfo.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Symbol</h3>
                <p className="font-semibold">{tokenInfo.symbol}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Decimals</h3>
                <p className="font-semibold">{tokenInfo.decimals}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Supply</h3>
                <p className="font-semibold">
                  {ethers.utils.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals)} {tokenInfo.symbol}
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Compliance Verification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-700">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">ERC-20 Interface</h4>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="font-medium">Implements ERC-20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!tokenAddress && !loading && !error && (
          <div className="text-center mt-12 p-8 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Enter a token address to verify</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Paste any ERC-20 token contract address above and click "Verify Token" to see details and compliance status.
            </p>
          </div>
        )}
      </main>
    </>
  );
} 