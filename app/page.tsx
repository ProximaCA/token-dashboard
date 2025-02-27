import Link from "next/link";
import Header from "./components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-primary">Token Analytics</span> Dashboard
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            A comprehensive tool for analyzing ERC-20 token economics, tracking large transfers, and verifying token compliance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/analyzer"
              className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg text-white font-medium transition-colors"
            >
              Analyze Token
            </Link>
            <Link
              href="/verify"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              Verify Contract
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Token Overview</h2>
            <p className="text-gray-300 mb-4">
              View basic token metrics including name, symbol, decimals, and total supply. Calculate market capitalization based on current price.
            </p>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Transfer Analysis</h2>
            <p className="text-gray-300 mb-4">
              Track on-chain transfers to identify large movements that might indicate OTC deals, insider selling, or other significant events.
            </p>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Contract Verification</h2>
            <p className="text-gray-300 mb-4">
              Verify if a token contract is ERC-20 compliant and check for potential issues or red flags in the implementation.
            </p>
          </div>
        </div>

        <div className="bg-gray-800/30 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-xl font-bold">1</div>
              <h3 className="text-lg font-medium mb-2">Enter Token Address</h3>
              <p className="text-gray-400">
                Provide an ERC-20 token contract address and select the network (Ethereum, Goerli, Sepolia).
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-xl font-bold">2</div>
              <h3 className="text-lg font-medium mb-2">Analyze On-Chain Data</h3>
              <p className="text-gray-400">
                Our system fetches token data and recent transfer events from the blockchain for analysis.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-xl font-bold">3</div>
              <h3 className="text-lg font-medium mb-2">Review Insights</h3>
              <p className="text-gray-400">
                Explore token metrics, verify compliance, and identify large transfers to make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 