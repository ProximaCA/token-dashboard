"use client";

import type { TokenInfo } from "../types/token";

interface TokenVerificationProps {
  tokenInfo: TokenInfo;
}

export default function TokenVerification({ tokenInfo }: TokenVerificationProps) {
  const { isERC20Compliant, name, symbol, decimals, totalSupply } = tokenInfo;

  // Define verification checks
  const verificationChecks = [
    {
      title: "ERC-20 Standard",
      description: "Implements the ERC-20 token standard",
      status: isERC20Compliant,
    },
    {
      title: "Name",
      description: "Has a valid name property",
      status: name !== undefined && name !== "",
    },
    {
      title: "Symbol",
      description: "Has a valid symbol property",
      status: symbol !== undefined && symbol !== "",
    },
    {
      title: "Decimals",
      description: "Has a valid decimals property (0-18)",
      status: decimals !== undefined && decimals >= 0 && decimals <= 18,
    },
    {
      title: "Total Supply",
      description: "Has a valid total supply",
      status: totalSupply !== undefined && totalSupply !== "",
    },
  ];

  const passedChecks = verificationChecks.filter((check) => check.status).length;
  const totalChecks = verificationChecks.length;
  const percentComplete = Math.round((passedChecks / totalChecks) * 100);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-2">Contract Verification</h2>
      <p className="text-gray-400 mb-6">
        Verifying that the token contract follows ERC-20 standard and has all required functionality.
      </p>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span>Verification Progress</span>
          <span className="font-medium">
            {passedChecks}/{totalChecks} checks passed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              percentComplete === 100
                ? "bg-green-600"
                : percentComplete > 50
                ? "bg-yellow-500"
                : "bg-red-600"
            }`}
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-4">
        {verificationChecks.map((check, index) => (
          <div key={index} className="flex items-start">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                check.status ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {check.status ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-medium">{check.title}</h3>
              <p className="text-gray-400 text-sm">{check.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
        <h3 className="font-medium mb-2">What does this mean?</h3>
        {percentComplete === 100 ? (
          <p className="text-sm">
            This token contract implements all required ERC-20 functions and is compliant with the standard.
            It should be compatible with wallets, exchanges, and other services that support ERC-20 tokens.
          </p>
        ) : percentComplete >= 80 ? (
          <p className="text-sm">
            This token implements most of the ERC-20 standard but may have some minor issues.
            It should work with most wallets and services, but some functionality might be limited.
          </p>
        ) : (
          <p className="text-sm">
            This token has significant compliance issues with the ERC-20 standard.
            It may not work correctly with wallets, exchanges, or other services that expect standard ERC-20 behavior.
            Use with caution.
          </p>
        )}
      </div>
    </div>
  );
} 