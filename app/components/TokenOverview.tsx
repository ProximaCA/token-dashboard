"use client";

import { ethers } from "ethers";
import type { TokenInfo, TokenMarketData } from "../types/token";
import { formatTokenAmount, formatAddress } from "../utils/tokenUtils";
import { getTokenExplorerUrl } from "../constants/networks";

interface TokenOverviewProps {
  tokenInfo: TokenInfo;
  marketData?: TokenMarketData;
  chainId: number;
}

export default function TokenOverview({
  tokenInfo,
  marketData,
  chainId,
}: TokenOverviewProps) {
  const {
    address,
    name,
    symbol,
    decimals,
    totalSupply,
    isERC20Compliant,
  } = tokenInfo;

  const formattedSupply = formatTokenAmount(totalSupply, decimals);
  const explorerUrl = getTokenExplorerUrl(chainId, address);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Token Overview</h2>
        {isERC20Compliant && (
          <span className="bg-green-700 text-white text-xs px-2 py-1 rounded">
            ERC-20 Compliant
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Details Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Token Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="font-medium">{name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Symbol</p>
              <p className="font-medium">{symbol}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Contract Address</p>
              <div className="flex items-center gap-2">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline truncate max-w-xs"
                >
                  {formatAddress(address)}
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Copy to clipboard"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                    <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Decimals</p>
              <p className="font-medium">{decimals}</p>
            </div>
          </div>
        </div>

        {/* Supply & Market Data Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Supply & Market Data</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Total Supply</p>
              <p className="font-medium">
                {formattedSupply} {symbol}
              </p>
            </div>
            
            {marketData ? (
              <>
                <div>
                  <p className="text-gray-400 text-sm">Price (USD)</p>
                  <p className="font-medium">
                    ${marketData.price.toLocaleString(undefined, {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                  </p>
                </div>
                
                {/* Market Cap Section with Visual Comparison */}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <h4 className="text-sm font-semibold mb-2">Market Capitalization Analysis</h4>
                  
                  <div className="mb-2">
                    <div className="flex justify-between">
                      <p className="text-gray-400 text-sm">Current Market Cap</p>
                      <p className="font-medium">
                        ${marketData.marketCap.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between">
                      <p className="text-gray-400 text-sm">Fully Diluted Valuation</p>
                      <p className="font-medium">
                        ${marketData.fullyDilutedCap?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    {marketData.fullyDilutedCap && marketData.marketCap && (
                      <div className="h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (marketData.fullyDilutedCap / marketData.marketCap) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Market Cap Difference with Alert */}
                  {marketData.marketCapDifference !== undefined && marketData.marketCapDifferencePercent !== undefined && (
                    <div className="mt-3 p-2 rounded bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">Dilution Impact</p>
                        <div className="flex items-center">
                          <span className={`text-sm ${marketData.marketCapDifferencePercent > 10 ? 'text-red-400' : 'text-yellow-400'}`}>
                            {marketData.marketCapDifferencePercent.toFixed(2)}%
                          </span>
                          {marketData.marketCapDifferencePercent > 0 && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-xs mt-1 text-gray-300">
                        {marketData.marketCapDifferencePercent > 20 ? (
                          <span className="text-red-400">High dilution risk. Large gap between current and fully diluted valuation may indicate significant future token releases.</span>
                        ) : marketData.marketCapDifferencePercent > 10 ? (
                          <span className="text-yellow-400">Moderate dilution. Gap between current and fully diluted valuation suggests potential for future token sales.</span>
                        ) : marketData.marketCapDifferencePercent > 0 ? (
                          <span>Low dilution. Small difference between current and fully diluted valuation indicates limited future token releases.</span>
                        ) : (
                          <span className="text-green-400">No dilution risk. Current market cap matches fully diluted valuation.</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Off-Market Sales Analysis */}
                {marketData.offMarketSalesPercentage !== undefined && marketData.offMarketSalesPercentage > 0 && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <h4 className="text-sm font-semibold mb-2">Off-Market Sales Analysis</h4>
                    
                    <div className="bg-gray-700/50 rounded p-2">
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <p className="text-xs text-gray-300">Total Off-Market Sales</p>
                          <p className="text-xs font-medium">
                            {marketData.offMarketSalesPercentage.toFixed(2)}% of Mcap
                          </p>
                        </div>
                        
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(100, marketData.offMarketSalesPercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-xs text-gray-300">Above Price</p>
                            <p className="text-xs font-medium text-green-400">
                              {marketData.offMarketSalesAbove?.toFixed(2)}%
                            </p>
                          </div>
                          
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${Math.min(100, marketData.offMarketSalesAbove || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-xs text-gray-300">Below Price</p>
                            <p className="text-xs font-medium text-red-400">
                              {marketData.offMarketSalesBelow?.toFixed(2)}%
                            </p>
                          </div>
                          
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full" 
                              style={{ width: `${Math.min(100, marketData.offMarketSalesBelow || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs mt-2 text-gray-300">
                        {marketData.offMarketSalesBelow && marketData.offMarketSalesAbove ? (
                          marketData.offMarketSalesBelow > marketData.offMarketSalesAbove ? (
                            <span className="text-yellow-400">More off-market sales below current price could indicate insider selling pressure.</span>
                          ) : (
                            <span>More off-market sales above current price suggests favorable OTC deals.</span>
                          )
                        ) : (
                          <span>Analyzing off-market sales patterns...</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-2 text-gray-400 italic">
                Enter a token price to view market data
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center"
        >
          <span>View on Blockchain Explorer</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
          </svg>
        </a>
      </div>
    </div>
  );
} 