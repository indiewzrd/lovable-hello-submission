# Stakedriven - Web3 Fundable Polls Platform

A web3 platform where communities can create polls to vote and fund features with on-chain funds. Voters use USDC to vote on options, and winning funds go to the poll creator.

## Overview

Stakedriven combines crowdsourcing, voting, community building, and product management into a web3-native platform. Teams can align their product development with user needs while getting funded directly by their community.

### Target Audience
- Web2 & web3 startups
- DAOs
- Memecoin projects
- NFT projects
- Communities

### Key Benefits
- Develop features your users are ready to pay for
- Increase community engagement through public building
- Let your community shape and fund the roadmap
- Reward users who provide valuable feedback

## Tech Stack

### Smart Contracts
- Solidity
- Hardhat
- Base Sepolia (testnet)
- USDC for voting tokens

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Framer Motion

### Backend & Infrastructure
- PostgreSQL (via Supabase)
- Drizzle ORM
- Server Actions
- Privy.io (wallet authentication)

### Development Tools
- ESLint
- Prettier
- Git

## Project Structure

```
/
├── contracts/          # Smart contracts
│   ├── PollFactory.sol
│   └── Poll.sol
├── test/              # Contract tests
├── scripts/           # Deployment scripts
├── app/               # Next.js app directory
├── components/        # React components
├── actions/           # Server actions
├── db/                # Database schema
├── lib/               # Utility functions
└── tasks/             # Project documentation
```

## Prerequisites

You will need accounts for the following services:

- [Supabase](https://supabase.com/) - Database
- [Privy](https://privy.io/) - Wallet authentication
- [Alchemy](https://alchemy.com/) or [Infura](https://infura.io/) - RPC provider

## Environment Variables

```bash
# Database
DATABASE_URL=

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# Blockchain RPC
NEXT_PUBLIC_RPC_URL=
PRIVATE_KEY=

# Contract Addresses (after deployment)
NEXT_PUBLIC_POLL_FACTORY_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
```

## Getting Started

### Smart Contract Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile contracts:
   ```bash
   npx hardhat compile
   ```

3. Run tests:
   ```bash
   npx hardhat test
   ```

4. Deploy to local network:
   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Frontend Development

1. Set up environment variables in `.env.local`

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Core Features

- **Poll Creation**: Create polls with custom questions and multiple options
- **Token Voting**: Vote using USDC tokens (1 vote per wallet)
- **Vote Cancellation**: Cancel and re-vote during active period
- **Automatic Distribution**: Winning funds transferred to poll creator
- **Fee System**: Platform fee deducted from winning options
- **Claim System**: Non-winning voters can reclaim their funds

## License

(To be determined)