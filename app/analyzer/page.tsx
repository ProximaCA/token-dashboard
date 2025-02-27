"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import TokenSearch from "../components/TokenSearch";
import TokenOverview from "../components/TokenOverview";
import TransfersList from "../components/TransfersList";
import TokenVerification from "../components/TokenVerification";
import { useTokenData } from "../hooks/useTokenData";
import type { TokenMetrics } from "../types/token";
import TokenAnalytics from "../components/TokenAnalytics";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChainSelector from "../components/ChainSelector";
import { SUPPORTED_CHAINS } from "../constants/networks";
import { ethers } from "ethers";

// Interface for progress logs
interface ProgressLog {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export default function Analyzer() {
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [inputAddress, setInputAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number>(1);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'connecting' | 'connected' | 'failed' | 'analyzing';
    network: string;
    attempts: number;
    error?: string;
  }>({
    status: 'idle',
    network: '',
    attempts: 0
  });
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  // Store reference to original console methods
  const originalConsole = useRef({
    log: console.log,
    warn: console.warn,
    error: console.error,
  });
  const isCapturing = useRef(false);
  
  // Static counter for the addLog function
  const logCounter = useRef(0);
  
  // Configure the hook with our logging function
  const { loading: hookLoading, error: hookError, tokenMetrics: hookTokenMetrics, refreshData: hookRefreshData } = useTokenData({
    tokenAddress,
    chainId,
    priceUsd: tokenPrice,
    skipInitialFetch: hasAnalyzed,
  });

  const addLog = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    // Create an even more robust unique ID
    // Use a combination of fixed prefix, high-precision timestamps, and a counter
    const timestampMs = Date.now();
    
    // Use a static counter to guarantee uniqueness even if timestamps collide
    logCounter.current += 1;
    
    // Capture nanoseconds for additional precision
    const timestampNs = typeof performance !== 'undefined'
      ? Math.floor(performance.now() * 1000000) // Microsecond precision
      : Date.now() * 1000; // Fallback with millisecond precision
      
    // Generate a content hash from the message and type
    const contentHash = message.split('').reduce(
      (acc, char) => (acc * 31 + char.charCodeAt(0)) & 0xFFFFFFFF, 0
    ).toString(36);
    
    // Combine everything into a truly unique ID that's stable across renders
    const id = `log_${timestampMs}_${timestampNs}_${logCounter.current}_${contentHash}`;
    
    // Add deduplication check directly in addLog
    setProgressLogs(prev => {
      // Check if we have a very similar message recently added (in the last 10 logs)
      const recentLogs = prev.slice(-10);
      const isDuplicate = recentLogs.some(log => 
        log.message === message && 
        log.type === type &&
        // Only consider logs in the last 2 seconds as duplicates
        (now.getTime() - new Date(log.time).getTime() < 2000)
      );
      
      // If duplicate, don't add it
      if (isDuplicate) {
        return prev;
      }
      
      return [...prev, { id, message, type, time: timeStr }];
    });
    
    // Update connection status based on log message content
    if (message.includes('Connecting to') && message.includes('network')) {
      setConnectionStatus(prev => ({
        status: 'connecting',
        network: message.split('Connecting to ')[1].split(' network')[0],
        attempts: prev.attempts + 1
      }));
    } 
    else if (message.includes('Connected to') && message.includes('network')) {
      setConnectionStatus(prev => ({
        status: 'connected',
        network: prev.network,
        attempts: prev.attempts
      }));
    }
    else if (message.includes('Fetching transfers')) {
      setConnectionStatus(prev => ({
        status: 'analyzing',
        network: prev.network,
        attempts: prev.attempts
      }));
    }
    else if (type === 'error' && message.includes('connect')) {
      setConnectionStatus(prev => ({
        status: 'failed',
        network: prev.network,
        attempts: prev.attempts,
        error: message
      }));
    }
  };
  
  // Override console.log to capture messages
  useEffect(() => {
    if (!isCapturing.current) {
      isCapturing.current = true;
    }
    
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    // Flag to completely disable capturing if needed (useful for debugging)
    const DISABLE_CAPTURING = false;
    
    // Keep track of recent log messages to prevent duplicates
    const recentMessages = new Set();
    const messageExpirationTime = 300; // ms
    
    // Helper function to check if message is a React key warning - make the detection more precise
    const isReactKeyWarning = (message: string): boolean => {
      if (!message) return false;
      
      // Comprehensive regex patterns to identify various key warnings
      if (
        /Warning.*key.*duplicate|duplicate.*key|unique.*key|key.*unique/i.test(message) ||
        /Each child.*unique|unique.*child/i.test(message) ||
        /Encountered two children with the same key/i.test(message) ||
        /key.*prop|prop.*key/i.test(message) ||
        // Add specific hash pattern detection - this will catch cases with specific transaction hashes
        /same key.*0x[a-f0-9]{64}/i.test(message) ||
        // Specific hashes we know have triggered errors
        message.includes('0xca8ad3064e0e76488590ea7554e15c72511149cc13f6337a3e1733a0c56736ae') ||
        message.includes('0x65394dce801e9e5a163beeb63fb9416f31e35a8fb73c06ad858f3ffdeac0faa0')
      ) {
        return true;
      }
      
      // Handle any other key-related warnings
      return (
        (message.includes('key') && 
         (
           message.includes('children') || 
           message.includes('duplicate') || 
           message.includes('unique') ||
           message.includes('identity') ||
           message.includes('maintained')
         ) && 
         message.includes('Warning')) ||
        message.includes('Encountered two children with the same key')
      );
    };
    
    // Helper to avoid adding duplicate messages
    const processMessage = (message: string, type: 'info' | 'warning' | 'error' | 'success'): void => {
      // Skip React key warnings entirely
      if (isReactKeyWarning(message)) {
        console.log("Filtered React key warning:", message.substring(0, 100) + "...");
        return;
      }
      
      // Use message + type as a compound key to prevent the same message being logged as different types
      const messageKey = `${message}|${type}`;
      
      // Skip if we've already logged this message recently
      if (recentMessages.has(messageKey)) {
        return;
      }
      
      // Add message to recent set and remove it after expiration time
      recentMessages.add(messageKey);
      setTimeout(() => {
        recentMessages.delete(messageKey);
      }, messageExpirationTime);
      
      // Add the log
      addLog(message, type);
    };
    
    // Use local variable to prevent recursive calls
    let isLocalCapturing = true;
    
    // Extra guard against recursive captures and internal React warnings
    const isSafeToCapture = (message: string): boolean => {
      // Skip capturing if globally disabled
      if (DISABLE_CAPTURING) return false;
      
      // Always skip React key warnings
      if (isReactKeyWarning(message)) return false;
      
      // Skip any internal React warnings or errors
      if (
        (message.includes('Warning:') && message.includes('React')) || 
        message.includes('ReactDOM.render') ||
        message.includes('useEffect') ||
        message.includes('useState') ||
        message.includes('forwardRef') ||
        message.includes('createContext') ||
        message.includes('memo') ||
        message.includes('0xca8ad3064e0e76488590ea7554e15c72511149cc13f6337a3e1733a0c56736ae') || // Specific hash in the warning
        /ReactDOM|reconciliation|component lifecycle|React DOM|memo|forwardRef|useEffect/i.test(message)
      ) return false;
      
      return true;
    };
    
    console.log = (...args) => {
      // Call original first to ensure it appears in dev tools
      originalConsoleLog(...args);
      
      if (isLocalCapturing) {
        // Temporarily disable capturing to prevent recursive calls
        isLocalCapturing = false;
        
        // Extract and format the message
        const message = args.join(' ');
        
        // Only process if safe to do so
        if (isSafeToCapture(message)) {
          processMessage(message, 'info');
        }
        
        // Re-enable capturing
        isLocalCapturing = true;
      }
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      
      if (isLocalCapturing) {
        isLocalCapturing = false;
        
        // Extract and format the message
        const message = args.join(' ');
        
        // Skip React key warnings entirely
        if (!isSafeToCapture(message)) {
          isLocalCapturing = true;
          return;
        }
        
        // Then handle other warnings as before
        if (message.includes('timeout') && message.includes('eth_getBlockByNumber')) {
          const blockMatch = message.match(/0x[0-9a-f]+/);
          const blockNum = blockMatch ? blockMatch[0] : 'unknown';
          const hexToDecimal = (hex: string) => parseInt(hex.substring(2), 16);
          const blockNumDecimal = blockNum !== 'unknown' ? hexToDecimal(blockNum).toLocaleString() : 'unknown';
          
          processMessage(`Block data request timed out for block ${blockNumDecimal} (${blockNum}). This is normal for busy networks - we'll retry or use an estimated timestamp.`, 'warning');
        }
        else if (message.includes('timeout') && message.includes('Transfer events')) {
          // More helpful message for transfer event timeouts
          processMessage(`Retrieving transfer events timed out. This typically happens with tokens that have many transactions. We'll continue with other blocks.`, 'warning');
        }
        else if (message.includes('rate limit') || message.includes('exceeded')) {
          // Rate limit messages
          processMessage(`The RPC provider is rate limiting our requests. Analysis may be incomplete - consider using a different network or try again later.`, 'warning');
        }
        else {
          processMessage(message, 'warning');
        }
        
        isLocalCapturing = true;
      }
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      
      if (isLocalCapturing) {
        isLocalCapturing = false;
        
        const message = args.join(' ');
        
        // Skip React key warnings and other React internal errors
        if (!isSafeToCapture(message)) {
          isLocalCapturing = true;
          return;
        }
        
        processMessage(message, 'error');
        
        isLocalCapturing = true;
      }
    };
    
    // Add initial logs
    addLog('Token analyzer ready. Enter a token address to begin.', 'info');
    
    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      isCapturing.current = false;
    };
  }, []);
  
  // Log errors from the hook
  useEffect(() => {
    if (hookError) {
      addLog(`Analysis failed: ${hookError}`, 'error');
    }
  }, [hookError]);
  
  // Log success when data is received
  useEffect(() => {
    if (hookTokenMetrics && !hookLoading) {
      const tokenName = hookTokenMetrics.tokenInfo.name;
      const tokenSymbol = hookTokenMetrics.tokenInfo.symbol;
      addLog(`Analysis complete for ${tokenName} (${tokenSymbol})`, 'success');
      
      if (hookTokenMetrics.recentTransfers.length === 0) {
        addLog('No transfer events were found. The token may have no activity or the RPC provider might have limited the response.', 'warning');
      } else {
        addLog(`Retrieved ${hookTokenMetrics.recentTransfers.length} transfers (${hookTokenMetrics.largeTransfers.length} large transfers)`, 'success');
      }
    }
  }, [hookTokenMetrics, hookLoading]);

  // Add an effect to synchronize hook state with local state
  useEffect(() => {
    // Update loading state from hook
    setLoading(hookLoading);
    
    // Update error state from hook if needed
    if (hookError) {
      setError(hookError);
    }
    
    // Update tokenMetrics if we have data and aren't loading
    if (hookTokenMetrics && !hookLoading) {
      setTokenMetrics(hookTokenMetrics);
    }
  }, [hookLoading, hookError, hookTokenMetrics]);

  // Remove or modify the existing useEffect that only sets hasAnalyzed
  // Replace it with this combined effect to handle both setting hasAnalyzed
  // and setting showResults when analysis completes
  useEffect(() => {
    if (tokenMetrics && !loading) {
      setHasAnalyzed(true);
      // Set showResults to true to display the analysis results
      setShowResults(true);
    }
  }, [tokenMetrics, loading]);

  const handleSearch = () => {
    if (!inputAddress) return;
    
    // Reset relevant states when starting a new search
    setTokenAddress(inputAddress);
    setTokenMetrics(null);
    setHasAnalyzed(false);
    setShowResults(false);
    
    // Clear previous logs and start with a fresh set
    setProgressLogs([]);
    addLog(`Starting analysis for token: ${inputAddress}`, 'info');
    
    // Update with correct properties as per the type definition
    setConnectionStatus({
      status: 'idle',
      network: '',
      attempts: 0
    });
    
    // Focus the page view to show the progress
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Token Analyzer</h1>
        
        <div className="mb-8 bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Enter Token Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="tokenAddress" className="block text-sm font-medium mb-1">
                Token Contract Address *
              </label>
              <input
                id="tokenAddress"
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="0x..."
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="chainSelector" className="block text-sm font-medium mb-1">
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
          
          <div className="mb-4">
            <label htmlFor="tokenPrice" className="block text-sm font-medium mb-1">
              Token Price (USD, optional)
              <span className="ml-1 text-xs text-gray-400">
                - Used to calculate market capitalization
              </span>
            </label>
            <input
              id="tokenPrice"
              type="number"
              value={tokenPrice}
              onChange={(e) => setTokenPrice(e.target.valueAsNumber)}
              placeholder="0.00"
              min="0"
              step="0.000000001"
              className="w-full md:w-1/3 p-2 bg-gray-700 border border-gray-600 rounded-md"
            />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={loading || !inputAddress}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze Token"}
          </button>
        </div>
        
        {/* Connection Status Indicator */}
        {loading && (
          <div className="mb-8 bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Connection Status</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium
                ${connectionStatus.status === 'connected' || connectionStatus.status === 'analyzing' ? 'bg-green-500/20 text-green-400' : 
                  connectionStatus.status === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
                  connectionStatus.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {connectionStatus.status === 'idle' ? 'Waiting' :
                 connectionStatus.status === 'connecting' ? 'Connecting...' :
                 connectionStatus.status === 'connected' ? 'Connected' :
                 connectionStatus.status === 'analyzing' ? 'Analyzing Data' : 'Connection Failed'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Network</p>
                <p className="font-medium">{connectionStatus.network || 'Not connected'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Connection Attempts</p>
                <p className="font-medium">{connectionStatus.attempts}</p>
              </div>
            </div>
            
            {connectionStatus.error && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                <p className="font-medium">Last Error:</p>
                <p>{connectionStatus.error}</p>
              </div>
            )}
            
            {connectionStatus.status === 'analyzing' && (
              <div className="mt-4">
                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm text-gray-400 mt-1">Processing transfer events and block data...</p>
              </div>
            )}
          </div>
        )}
        
        {/* Log Panel Section */}
        <div className="mb-8">
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-gray-700/50 px-4 py-2">
              <h3 className="font-medium">Analysis Progress Logs</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors"
                >
                  {showLogs ? 'Hide' : 'Show'} Logs
                </button>
                <button
                  onClick={() => setProgressLogs([])}
                  className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {showLogs && (
              <div className="max-h-96 overflow-y-auto p-4">
                <div className="font-mono text-xs space-y-1">
                  {progressLogs.slice(-100).map((log, index) => {
                    // Create an even more robust key for log items
                    // Use multiple layers of uniqueness to prevent collisions:
                    // 1. Use log.id as primary key source
                    // 2. Use absolute index within all logs
                    // 3. Create a unique hash from content with added uniqueness factors
                    
                    const stableIndex = progressLogs.length - 100 + index; // Absolute position in the list
                    
                    // Generate a more unique content hash including all log properties
                    // and ensure we separate values properly to avoid hash collisions
                    const logContentHash = `${log.time}::${log.type}::${log.message}::${stableIndex}`.split('').reduce(
                      (acc, char) => ((acc * 31) ^ char.charCodeAt(0)) & 0xFFFFFFFF, 0
                    ).toString(36);
                    
                    // Make the key completely deterministic and guarantee uniqueness
                    // by combining log.id (if available) with the absolute index and content hash
                    const safeLogId = log.id 
                      ? `${log.id}-${stableIndex}` // Add index even when we have ID for complete uniqueness
                      : `log-${stableIndex}-${logContentHash}-${index}`; // Fallback with multiple uniqueness factors
                    
                    return (
                      <div 
                        key={safeLogId} 
                        className={`py-1 border-b border-gray-800/30 ${
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warning' ? 'text-yellow-400' :
                          log.type === 'success' ? 'text-green-400' :
                          'text-gray-300'
                        }`}
                      >
                        <span className="text-gray-500">[{log.time}]</span>{' '}
                        {log.type === 'error' && <span className="font-bold">Error: </span>}
                        {log.type === 'warning' && <span className="font-bold">Warning: </span>}
                        {log.type === 'success' && <span className="font-bold">Success: </span>}
                        {log.message}
                      </div>
                    );
                  })}
                </div>
                
                {loading && (
                  <div className="text-center py-2 mt-2 text-blue-400 animate-pulse">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Processing... Please wait</span>
                    </div>
                  </div>
                )}
                
                {progressLogs.length > 100 && (
                  <div className="text-center text-xs text-gray-500 mt-2">
                    Showing last 100 messages from {progressLogs.length}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {error && !loading && (
          <div className="mb-8 p-4 bg-red-900/30 text-red-300 rounded-md border border-red-800">
            <h3 className="font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center items-center my-12">
            <LoadingSpinner size="large" />
            <span className="ml-3 text-lg">Analyzing token data...</span>
          </div>
        )}
        
        {showResults && tokenMetrics && !loading && (
          <TokenAnalytics tokenMetrics={tokenMetrics} onRefresh={hookRefreshData} />
        )}

        {!tokenAddress && !loading && !error && (
          <div className="text-center mt-12 p-8 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Enter a token address to begin analysis</h3>
            <p className="text-gray-400">
              Paste any ERC-20 token contract address above and click "Analyze Token" to see detailed metrics and transfer analysis.
            </p>
          </div>
        )}
      </div>
    </>
  );
} 