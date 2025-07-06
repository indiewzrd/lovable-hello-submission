https://x.com/indiewzrd - follow me on Twitter. Apart from launching a mainnet version of StakeDriven soon, I also plan to drop some nice read for builders/product managers/influencers.


# Stakedriven - Web3 Fundable Polls Platform

A web3 platform where communities can create polls to vote and fund features with on-chain funds. Voters use USDC to vote on options, and winning funds go to the poll creator.

🌐 **Live Demo**: [https://stakedriven.vercel.app](https://stakedriven.vercel.app)

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

**Deployed Contracts (Base Sepolia)**:
- PollFactory: `0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6`
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Wagmi & Viem

### Backend & Infrastructure
- PostgreSQL (via Supabase/Neon)
- Drizzle ORM
- Server Actions
- Privy.io (wallet authentication)

## Quick Start

### Prerequisites

1. **Node.js 18+** and npm
2. **PostgreSQL database** (Supabase, Neon, or any PostgreSQL provider)
3. **Privy account** for wallet authentication
4. **Base Sepolia ETH** for gas fees

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/indiewzrd/stakedriven.git
   cd stakedriven
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your `.env.local`:
   ```env
   # Required
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
   
   # Already configured for Base Sepolia
   NEXT_PUBLIC_POLL_FACTORY_ADDRESS=0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6
   NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
   ```

5. Push database schema:
   ```bash
   npx drizzle-kit push
   ```

6. Run development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. **Import to Vercel**: Connect your GitHub repository to Vercel

2. **Environment Variables**: Add the following in Vercel project settings:
   - `DATABASE_URL` (required)
   - `NEXT_PUBLIC_PRIVY_APP_ID` (required)
   - `NEXT_PUBLIC_POLL_FACTORY_ADDRESS` (already in code)
   - `NEXT_PUBLIC_USDC_ADDRESS` (already in code)

3. **Deploy**: Vercel will automatically deploy on push to main

### Database Setup

For quick setup with Supabase:
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add as `DATABASE_URL` in environment variables

## Core Features

### For Poll Creators
- **Create Polls**: Set questions, options, duration, and USDC per vote
- **Automatic Funding**: Receive funds from winning options automatically
- **Project Organization**: Group polls under projects

### For Voters
- **Token Voting**: Vote with USDC (1 vote per wallet)
- **Vote Cancellation**: Change your vote during active period
- **Claim Refunds**: Reclaim funds from non-winning options
- **Track History**: View voting history and outcomes

### Platform Features
- **Fee System**: Configurable platform fee (default 5%)
- **Admin Dashboard**: Manage platform settings
- **Real-time Updates**: Live poll status and results
- **Wallet Integration**: Support for multiple wallet providers

## Smart Contract Architecture

### PollFactory Contract
- Deploys new Poll contracts
- Manages platform fee percentage
- Tracks deployed polls

### Poll Contract
- Handles voting with USDC
- Enforces one vote per wallet
- Distributes funds to winners
- Manages refund claims

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run types        # TypeScript type checking
npm run format       # Format with Prettier

# Database
npx drizzle-kit push      # Push schema changes
npx drizzle-kit generate  # Generate migrations
npx drizzle-kit studio    # Open database studio

# Testing
npm run test         # Run tests
```

## Project Structure

```
/
├── app/                  # Next.js app router
│   ├── (unauthenticated)/ # Public routes
│   ├── (authenticated)/   # Protected routes
│   └── api/              # API routes
├── components/           # React components
├── lib/                  # Utilities and hooks
├── db/                   # Database schema
├── contracts/            # Smart contracts
├── scripts/              # Deployment scripts
└── public/               # Static assets
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Clear `.next` folder and rebuild
2. **Polls not showing**: Check DATABASE_URL is configured
3. **Wallet connection issues**: Ensure Privy app ID is correct
4. **Transaction failures**: Check wallet has Base Sepolia ETH

### Getting Help

- Open an issue on [GitHub](https://github.com/indiewzrd/stakedriven/issues)
- Follow updates on [Twitter/X](https://x.com/indiewzrd)

## Contributing

This project is currently under active development. Contributions, issues, and feature requests are welcome!

## License

© 2025 STAKEDRIVEN.COM. All rights reserved.

This project was created for ETHGlobal Bangkok 2024 hackathon. For licensing inquiries, please contact via Twitter/X.

---

Built with ❤️ by [@indiewzrd](https://x.com/indiewzrd)