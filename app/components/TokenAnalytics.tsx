import React, { useState } from "react";
import { ethers } from "ethers";
import type { TokenMetrics } from "../types/token";
import { getExplorerUrl, getTokenExplorerUrl } from "../constants/networks";
import { formatAddress } from "../utils/tokenUtils";

interface TokenAnalyticsProps {
  tokenMetrics: TokenMetrics;
  onRefresh: () => Promise<void>;
}

const TokenAnalytics: React.FC<TokenAnalyticsProps> = ({ tokenMetrics, onRefresh }) => {
  const { tokenInfo, marketData, recentTransfers, largeTransfers } = tokenMetrics;
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine if we had trouble getting transfer data
  const hasTransferData = recentTransfers.length > 0;
  const explorerUrl = getTokenExplorerUrl(tokenInfo.chainId, tokenInfo.address);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{tokenInfo.name} ({tokenInfo.symbol})</h2>
        <div className="flex space-x-3">
          <a 
            href={explorerUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
          >
            View on Explorer
          </a>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>
      </div>

      {/* Basic Token Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Contract Address</h3>
          <div className="flex items-center">
            <p className="font-mono text-sm break-all">{formatAddress(tokenInfo.address)}</p>
            <a
              href={getTokenExplorerUrl(tokenInfo.chainId, tokenInfo.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-400 hover:text-blue-300"
              title="View on Explorer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Total Supply</h3>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat().format(
              parseFloat(ethers.utils.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals))
            )} {tokenInfo.symbol}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Decimals</h3>
          <p className="text-2xl font-bold">{tokenInfo.decimals}</p>
        </div>
      </div>

      {/* Market Data (if available) */}
      {marketData && (
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Market Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Price</p>
              <p className="text-xl font-semibold">${marketData.price.toFixed(marketData.price < 0.01 ? 8 : 2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Market Cap</p>
              <p className="text-xl font-semibold">${new Intl.NumberFormat().format(Math.round(marketData.marketCap))}</p>
            </div>
            {marketData.fullyDilutedCap && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Fully Diluted Cap</p>
                <p className="text-xl font-semibold">${new Intl.NumberFormat().format(Math.round(marketData.fullyDilutedCap))}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Status */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Compliance Status</h3>
        <div className="flex items-center">
          <div className="mr-4">
            <p className="text-gray-400 text-sm mb-1">ERC-20 Compliant</p>
            {tokenInfo.isERC20Compliant ? (
              <div className="flex items-center text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Yes</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-semibold">No</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Analysis */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Transfer Analysis</h3>
        
        {!hasTransferData && (
          <div className="bg-blue-900/30 border border-blue-800 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-blue-300 mb-1">Limited Transfer Data</p>
                <p className="text-sm text-blue-200">
                  We couldn't retrieve recent transfer data for this token. This could be due to network limitations
                  or the token having little to no transfer activity in the analyzed timeframe.
                </p>
                <div className="mt-3">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    View complete transfer history on the block explorer
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Large Transfers Section */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Large Transfers (&gt;0.5% of supply)</h4>
          {largeTransfers.length === 0 ? (
            <p className="text-gray-400 py-3">No large transfers detected in the analyzed timeframe.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left border-b border-gray-700">
                  <tr>
                    <th className="px-2 py-2">Tx Hash</th>
                    <th className="px-2 py-2">From</th>
                    <th className="px-2 py-2">To</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {largeTransfers.slice(0, 5).map((transfer, index) => (
                    <tr key={`large-${transfer.transactionHash}-${index}`} className="hover:bg-gray-700/20">
                      <td className="px-2 py-2">
                        <a
                          href={`${getExplorerUrl(tokenInfo.chainId)}/tx/${transfer.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {formatAddress(transfer.transactionHash)}
                        </a>
                      </td>
                      <td className="px-2 py-2">{formatAddress(transfer.from)}</td>
                      <td className="px-2 py-2">{formatAddress(transfer.to)}</td>
                      <td className="px-2 py-2 text-right">
                        {parseFloat(ethers.utils.formatUnits(transfer.value, tokenInfo.decimals)).toLocaleString()} {tokenInfo.symbol}
                      </td>
                      <td className="px-2 py-2 text-right">{new Date(transfer.timestamp * 1000).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {largeTransfers.length > 5 && (
                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-400">Showing 5 of {largeTransfers.length} large transfers</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Recent Transfers Section */}
        <div>
          <h4 className="text-md font-medium mb-2">Recent Transfers</h4>
          {recentTransfers.length === 0 ? (
            <p className="text-gray-400 py-3">No recent transfers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left border-b border-gray-700">
                  <tr>
                    <th className="px-2 py-2">Tx Hash</th>
                    <th className="px-2 py-2">From</th>
                    <th className="px-2 py-2">To</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentTransfers.slice(0, 10).map((transfer, index) => (
                    <tr key={`recent-${transfer.transactionHash}-${index}`} className="hover:bg-gray-700/20">
                      <td className="px-2 py-2">
                        <a
                          href={`${getExplorerUrl(tokenInfo.chainId)}/tx/${transfer.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {formatAddress(transfer.transactionHash)}
                        </a>
                      </td>
                      <td className="px-2 py-2">{formatAddress(transfer.from)}</td>
                      <td className="px-2 py-2">{formatAddress(transfer.to)}</td>
                      <td className="px-2 py-2 text-right">
                        {parseFloat(ethers.utils.formatUnits(transfer.value, tokenInfo.decimals)).toLocaleString()} {tokenInfo.symbol}
                      </td>
                      <td className="px-2 py-2 text-right">{new Date(transfer.timestamp * 1000).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentTransfers.length > 10 && (
                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-400">Showing 10 of {recentTransfers.length} recent transfers</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenAnalytics; 