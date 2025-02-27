"use client";

import { useState } from "react";
import Link from "next/link";
import { useWeb3 } from "../contexts/Web3Context";
import { formatAddress } from "../utils/tokenUtils";

export default function Header() {
  const { account, isConnected, connect, disconnect } = useWeb3();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Function to show coming soon alert
  const showComingSoonAlert = () => {
    alert("Coming soon: Connect your wallet to analyze your portfolio, calculate potential profits, and get personalized insights.");
  };

  return (
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-primary flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Token Analytics
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Link href="/" className="px-3 py-2 hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/analyzer" className="px-3 py-2 hover:text-primary transition-colors">
            Token Analyzer
          </Link>
          <Link href="/verify" className="px-3 py-2 hover:text-primary transition-colors">
            Verify Contract
          </Link>
          
          {isConnected ? (
            <div className="flex items-center">
              <div className="px-4 py-2 rounded-l-md bg-gray-800 text-sm">
                {formatAddress(account || "")}
              </div>
              <button
                onClick={disconnect}
                className="rounded-r-md px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={showComingSoonAlert}
              className="rounded-md px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors group relative cursor-not-allowed"
            >
              Connect Wallet
              <span className="ml-1 text-gray-400">?</span>
              <div className="absolute bottom-full left-0 mb-2 w-60 bg-gray-900 p-2 rounded shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming soon: Connect your wallet to analyze your portfolio, calculate potential profits, and get personalized insights.
              </div>
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            className="p-2 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-background border-b border-gray-800">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/analyzer"
            className="block px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Token Analyzer
          </Link>
          <Link
            href="/verify"
            className="block px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Verify Contract
          </Link>
          <div className="mt-4">
            {isConnected ? (
              <div className="flex flex-col">
                <div className="px-4 py-2 rounded-t-md bg-gray-800 text-sm">
                  {formatAddress(account || "")}
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setIsMenuOpen(false);
                  }}
                  className="rounded-b-md px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={showComingSoonAlert}
                className="w-full rounded-md px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors group relative cursor-not-allowed"
              >
                Connect Wallet
                <span className="ml-1 text-gray-400">?</span>
                <div className="absolute bottom-full left-0 mb-2 w-60 bg-gray-900 p-2 rounded shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Coming soon: Connect your wallet to analyze your portfolio, calculate potential profits, and get personalized insights.
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 