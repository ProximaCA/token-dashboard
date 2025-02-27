# Token Dashboard MVP  
> A comprehensive dashboard for ERC-20 token analytics  

---

## Project Concept

The **Token Dashboard MVP** is a cutting-edge analytical tool designed for the cryptocurrency community. It provides real-time insights into ERC-20 token dynamics, helping users understand token distribution, market potential, and the underlying financial mechanics. The project aims to bridge the gap between raw on-chain data and actionable intelligence, making it easier for investors, developers, and enthusiasts to gauge token health and market sentiment.

---

## Key Features

- **Token Overview**  
  - **Basic Token Metrics**: Display essential token details such as name, symbol, decimals, and total supply.  
  - **Market Analytics**: Calculate and show market capitalization and fully diluted market cap based on current price data.

- **Transaction Insights**  
  - **Transfer Analysis**: Index and analyze on-chain Transfer events to track token movements.  
  - **OTC Detection**: Identify large transfers (e.g., those exceeding 1% of the total supply) that may indicate off-market deals or significant insider activity.

- **Contract Verification**  
  - **ERC-20 Compliance Check**: Verify whether a given contract address adheres to the ERC-20 standard by reading methods like `name()`, `symbol()`, `decimals()`, and `totalSupply()`.  
  - **Confidence Indicators**: Provide a simple verification status to help users trust the token's integrity.

- **Modern User Interface**  
  - **Intuitive Design**: A sleek, user-friendly dashboard that presents complex data in a clear and visually appealing way.  
  - **Interactive Elements**: Dynamic charts and tables that allow users to explore large transfers, view trends, and interact with token metrics.

---

## Why This Project?

- **Transparency**: In an industry often obscured by opaque data and hidden token allocations, this dashboard provides a clear, on-chain view of token economics.  
- **Informed Decisions**: By aggregating and visualizing critical data, users can make better-informed investment decisions and identify potential risks or opportunities.  
- **Community Empowerment**: The tool is designed for the community—free and open source—so everyone can benefit from enhanced token analytics.  
- **Innovation**: Combining on-chain analytics with modern UI/UX delivers a product that not only looks great but also serves a practical purpose in the fast-evolving crypto landscape.

---

## Visual Overview

<div align="center">
  <img src="https://imgur.com/a/fwiDzAI" alt="Home Page" width="600"/>
  <br/>
  <i>Home Page</i>
</div>

<div align="center">
  <img src="https://imgur.com/a/NPXmqgR" alt="Dashboard Screenshot" width="600"/>
  <br/>
  <i>Dashboard view displaying token metrics and transaction analytics</i>
</div>

<div align="center">
  <img src="https://imgur.com/a/il9Arfg" alt="Contract Verification Screenshot" width="600"/>
  <br/>
  <i>Contract verification view for quick ERC-20 compliance checks</i>
</div>

---

## Future Vision

While the MVP focuses on core token analytics and contract verification, future enhancements may include:  
- **Advanced Charting**: Interactive visualizations of token distribution, historical price trends, and transaction volume.  
- **Multi-Network Support**: Extending analytics to tokens on other networks (e.g., Binance Smart Chain, Polygon).  
- **Enhanced OTC Detection**: More sophisticated algorithms to identify and classify off-market transactions.  
- **Community Features**: Integration with discussion boards or social metrics to gauge market sentiment further.

## Planned Improvements

In our next development phases, we are planning to implement:

- **Liquidity Pool Analysis**: Analyze DEX liquidity pools to provide insights on token liquidity, price impact, and trading volume.
- **Price Impact Simulation**: Simulate buying or selling a specific amount of tokens to estimate price impact.
- **Historical Data Tracking**: Track historical price and volume data to identify trends and patterns.
- **Wallet Profiling**: Analyze wallet behaviors to identify whales, active traders, and long-term holders.
- **Token Distribution Visualization**: Graphical representation of token holdings across different wallet categories.
- **Alert System**: Set up alerts for large transfers, significant price changes, or other important events.
- **Integration with DeFi Protocols**: Provide information about token presence in major DeFi protocols.
- **Mobile-Optimized Interface**: Enhance the mobile experience with dedicated layouts for smaller screens.

---

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- Bun, pnpm, or npm package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/ProximaCA/token-dashboard
   cd token-dashboard
   ```

2. Install dependencies
   ```bash
   # Using Bun (recommended for faster installation)
   bun install

   # Or using pnpm
   pnpm install
   ```

3. Start the development server
   ```bash
   # Using Bun
   bun run dev

   # Or using pnpm
   pnpm dev

   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Using the DApp



1. **Analyze a token**
   - Navigate to the Token Analyzer page
   - Enter an ERC-20 token contract address
     > **Note:** Always use the token contract address, not the liquidity pool (pair) address. This dashboard analyzes the token itself, not the trading pair.
   - Select the network where the token is deployed
   - Optionally enter the token price in USD to calculate market cap
   - Click "Analyze Token"

2. **Verify a contract**
   - Navigate to the Verify Contract page
   - Enter an ERC-20 token contract address
   - Select the network
   - Click "Analyze Token" to check ERC-20 compliance

---

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Interaction**: ethers.js
- **Wallet Integration**: Web3 provider

---

## Conclusion

The Token Dashboard MVP is more than just a tool—it's a step toward democratizing access to high-quality token analytics. By leveraging transparent on-chain data, it empowers users to see the full picture behind any ERC-20 token, fostering an environment of informed decision-making and trust.

---

Happy Analyzing! 🚀  
Feel free to contribute, fork, or enhance this project to push the boundaries of token analytics further.
