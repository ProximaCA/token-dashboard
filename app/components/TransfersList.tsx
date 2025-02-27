"use client";

import { useState } from "react";
import type { TokenTransfer, TokenInfo } from "../types/token";
import { formatTokenAmount, formatAddress } from "../utils/tokenUtils";
import { getTransactionExplorerUrl, getAddressExplorerUrl } from "../constants/networks";

interface TransfersListProps {
  transfers: TokenTransfer[];
  tokenInfo: TokenInfo;
  chainId: number;
  title: string;
  emptyMessage: string;
}

export default function TransfersList({
  transfers,
  tokenInfo,
  chainId,
  title,
  emptyMessage,
}: TransfersListProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = transfers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transfers.length / itemsPerPage);
  
  // Format date from timestamp
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      {transfers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">{emptyMessage}</div>
          
          {/* Additional context about the empty state */}
          <div className="text-sm text-gray-500 max-w-xl mx-auto">
            <p className="mb-2">
              This could be because:
            </p>
            <ul className="list-disc pl-6 text-left inline-block">
              <li className="mb-1">The token has no transfer history</li>
              <li className="mb-1">Transfers occurred outside the analyzed timeframe (last 30 days)</li>
              <li className="mb-1">There were network issues retrieving the full transfer history</li>
              <li>The token contract may use a non-standard implementation of the Transfer event</li>
            </ul>
            
            <p className="mt-4">
              Try checking a block explorer like Etherscan for the complete transaction history.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-sm border-b border-gray-700">
                <tr>
                  <th className="pb-2 font-medium">Transaction</th>
                  <th className="pb-2 font-medium">From</th>
                  <th className="pb-2 font-medium">To</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentItems.map((transfer, index) => {
                  // Create a truly unique key combining all unique aspects of the transfer
                  // Including absolute position in original array for total uniqueness
                  const absoluteIndex = indexOfFirstItem + index;
                  
                  // Create a specific hash from the transfer data for added uniqueness
                  const transferDataHash = [
                    transfer.transactionHash,
                    transfer.from,
                    transfer.to,
                    transfer.value,
                    transfer.timestamp
                  ].join('::').split('').reduce(
                    (acc, char) => ((acc * 31) ^ char.charCodeAt(0)) & 0xFFFFFFFF, 0
                  ).toString(36);
                  
                  // Combine everything into a guaranteed unique key
                  const uniqueKey = `transfer-${transfer.transactionHash.slice(0, 10)}-${absoluteIndex}-${transferDataHash}`;
                  
                  return (
                    <tr key={uniqueKey} className="hover:bg-gray-700/30">
                      <td className="py-3 truncate max-w-[100px]">
                        <a
                          href={getTransactionExplorerUrl(chainId, transfer.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formatAddress(transfer.transactionHash)}
                        </a>
                      </td>
                      <td className="py-3">
                        <a
                          href={getAddressExplorerUrl(chainId, transfer.from)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formatAddress(transfer.from)}
                        </a>
                      </td>
                      <td className="py-3">
                        <a
                          href={getAddressExplorerUrl(chainId, transfer.to)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formatAddress(transfer.to)}
                        </a>
                      </td>
                      <td className="py-3 text-right">
                        {formatTokenAmount(transfer.value, tokenInfo.decimals)} {tokenInfo.symbol}
                        {transfer.isLargeTransfer && (
                          <span className="ml-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                            &gt;1%
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-300">
                        {formatDate(transfer.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstItem + 1}-
                {indexOfLastItem > transfers.length
                  ? transfers.length
                  : indexOfLastItem}{" "}
                of {transfers.length} transfers
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 