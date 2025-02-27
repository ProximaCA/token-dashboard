import React from 'react';
import { Chain } from '../types/chain';

interface ChainSelectorProps {
  id?: string;
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
  supportedChains: Chain[];
  className?: string;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({
  id,
  selectedChainId,
  onChainChange,
  supportedChains,
  className = '',
}) => {
  return (
    <select
      id={id}
      value={selectedChainId}
      onChange={(e) => onChainChange(Number(e.target.value))}
      className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 ${className}`}
    >
      {supportedChains.map((chain) => (
        <option key={chain.id} value={chain.id}>
          {chain.name}
        </option>
      ))}
    </select>
  );
};

export default ChainSelector; 