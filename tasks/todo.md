# Web3 Fundable Polls Platform - MVP Todo List

## Overview
I want to build a web3 platform to launch polls where voters vote with their onchain funds. At the end of the voting period funds of the winning options of a poll are transferred to the poll creator.

The main use case is that product users (or community members) can vote and fund the features (or initiatives) they want to see implemented by the team. So this web3 platform will combine crowdsourcing, voting, community building, and product management. 

Here are several short descriptions of this web3 platform:
Fundable polls that you give to your clients before each product development sprint. 
Web3 native way to align your product development with client needs and get funded.

What is the target audience of this web3 platform?
Web2 & web3 startups, DAOs, memecoin projects, NFT projects, communities.

What are the benefits of using this web3 platform?
Develop products and features that your clients are ready to pay for right now. 
Get more community engagement by building in public. 
Let your community shape and fund the roadmap. 
Giveback to users that provide staked feedback.


The web2 part of this platform is very similar to typeform.com (a platform for creating polls), and consists of following modules:
Admin account
Project account
Voter account 
Poll creating functionality (similar to typeform.com but with only 1 question per poll)
Poll page (voters vote and fund the options they like)
Project page with all polls (upcoming/active/ended)
Login by wallet connection (implemented using Privy.io - https://docs.privy.io/recipes/overview)
Other modules that might be required.


The web3 part of this platform consists of several contracts on the blockchain (I plan to first test it locally using Hardhat, and then to deploy smart contracts on Base Sepolia blockchain). It consists of a factory contract for specifying poll parameters and deploying a contract instance (a poll smart contract). And a poll smart contract that has the functionality needed after deploying a poll smart contract.

Here is a list of methods of a factory contract. 

Write methods:
deploy poll smart contract
- set start time of poll parameter
- set end time of poll parameter
- set number of tokens for 1 vote parameter
- set number of winning options parameter
- set total number of options parameter
set global admin wallet address (global admin only)
set rescue wallet address (global admin only)
set fee (global admin only)
set fee wallet address (global admin only)

Read methods:
global admin wallet address
rescue wallet address
fee
fee wallet address

Here is a list of methods of a contract instance (a poll smart contract).  

Write methods:
vote (active from the start until the end of poll)
- voting option number parameter
cancel vote (active from the start until the end of poll, works also as a claim method for a voter’s address during the poll)
claim funds of a non-winning vote (active after the end of poll)
claim winning options funds (poll creator only, active after the end of poll)
rescue funds (global admin only, active after the start of poll)
claim fee (fee wallet address only)

Read methods:
current voting results
voting option number of a wallet address
start time of poll
end time of poll
voting token contract address (USDC only)
number of tokens for 1 vote
number of winning options
total number of options

When a voter picks an option of a poll in a UI, the system calls a ‘vote’ method with a voting option number parameter. A user submits a transaction with the required amount of tokens for 1 vote. The funds are transferred to a poll smart contract address.
A wallet address can give only 1 vote in a poll, but can cancel the vote and claim the funds associated with this vote, and then vote again. 
When a poll ends, the logic of a poll smart contract calculates the amount of tokens of winning options, and the platform fee. The platform fee is calculated as a percent of winning options funds. The platform fee is deducted from winning option funds. Winning options funds and the platform fee become claimable. Funds of non-winning options become claimable for relevant voters using a ‘claim funds of a non-winning vote’ write method. 
There is also a ‘rescue funds’ write method in a poll smart contract. It gets active after the start of poll. It is needed for the cases when the global admin needs for some reason to rescue funds from a poll smart contract to the rescue wallet address.



Winning options are determined based on the highest number of tokens received. In case of a tie, a poll smart contract logic randomly chooses between options with equal amount of received funds so that the resulting number of winning options is equal to the parameter value used for deploying this contract instance.

No timing constraint on how often a voter can cancel and re-vote within the active period of a poll.

The contracts must emit all events required for the stable functioning of this web3 platform.

No particular scenarios for rescue functionality. No additional checks for rescue functionality

The fee percentage and wallet address are global settings that do not change per poll instance.



## Smart Contracts (Priority: High)

### Setup & Infrastructure
- [ ] Set up development environment for smart contracts (Hardhat, dependencies)
- [ ] Set up local USDC mock token for testing

### Core Contracts
- [ ] Design and implement PollFactory smart contract with deployment and configuration methods
  - Deploy poll contract instances
  - Set poll parameters (start/end time, tokens per vote, winning options count, total options count)
  - Global admin functions (set admin, rescue wallet, fee, fee wallet)
- [ ] Implement PollFactory read methods (admin, rescue wallet, fee, fee wallet addresses)
- [ ] Add poll creator tracking in PollFactory and Poll contracts
- [ ] Design and implement Poll smart contract with voting, claiming, and rescue methods
  - Vote with USDC (one vote per wallet)
  - Cancel vote functionality
  - Claim non-winning vote funds
  - Claim winning funds (poll creator only)
  - Rescue funds (admin only)
  - Claim fee (fee wallet only)
- [ ] Implement Poll read methods (voting results, voter choices, poll parameters, token info)
- [ ] Implement proper access control (admin, poll creator, fee wallet restrictions)
- [ ] Add comprehensive event emissions for all state changes
- [ ] Implement tie-breaking logic with randomness for determining winning options

### Testing & Deployment
- [ ] Write comprehensive test suite for smart contracts
- [ ] Deploy and test contracts on local Hardhat network
- [ ] Deploy smart contracts to Base Sepolia testnet
- [ ] Set up contract verification on Basescan

## Web Application (Priority: High)

### Foundation
- [ ] Set up Next.js application with TypeScript and required dependencies
- [ ] Integrate Privy.io for wallet authentication
- [ ] Design database schema for users/voters, projects, polls, and voting data
- [ ] Add poll metadata storage (questions, option descriptions) to database schema
- [ ] Integrate smart contract interactions with web3 libraries (ethers.js/viem)

### Core Features
- [ ] Create admin account module with global settings management
- [ ] Create project account module with project management features
- [ ] Create voter account module with voting history and claim management
- [ ] Build poll creation interface (similar to Typeform with single question)
- [ ] Implement input validation for poll creation (dates, options, etc.)
- [ ] Implement poll page with voting and funding functionality
- [ ] Implement USDC approval flow before voting
- [ ] Create project page showing all polls (upcoming/active/ended)
- [ ] Implement poll status logic based on timestamps
- [ ] Implement transaction handling and status updates
- [ ] Add real-time voting results display with on-chain data
- [ ] Implement claim functionality UI for voters and poll creators
- [ ] Design giveback mechanism for users providing staked feedback (future enhancement)

## Documentation (Priority: Low)
- [ ] Create basic documentation for MVP usage

## Notes
- Smart contracts will be developed first as requested
- USDC will be the only supported token initially
- Platform fee is deducted from winning options funds
- Each wallet can only vote once per poll but can cancel and re-vote
- Tie-breaking uses randomness to ensure correct number of winners

## Review (Completed Implementation)

### Smart Contracts ✅
- **PollFactory Contract**: Deployed at `0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6` on Base Sepolia
  - Global admin controls for fee management
  - Poll deployment with customizable parameters
  - Event emissions for all state changes
- **Poll Contract**: Individual voting contracts with full functionality
  - Vote with USDC approval flow
  - Cancel and re-vote capability
  - Winner calculation with tie-breaking
  - Claim mechanisms for creators, voters, and fee wallet
- **Testing**: Comprehensive test suite with real USDC on Base Sepolia
  - Deployed multiple test polls
  - Verified all voting and claiming functionality
  - Minimal USDC usage (1-2 USDC per vote for testing)

### Web Application ✅
- **Authentication**: Privy.io integration with wallet connection
- **Poll Creation**: Full deployment flow with database persistence
- **Voting Interface**: 
  - Real-time results from blockchain
  - USDC approval and voting
  - Transaction status tracking
- **Claiming System**: Complete UI for all claim types
- **Admin Module**: Global settings management with access control
- **Project Management**: Project creation and poll organization
- **Account Module**: Voting history and statistics tracking
- **Database**: PostgreSQL with Drizzle ORM for metadata storage

### Key Achievements
1. **Full MVP Implementation**: All features from the todo list completed
2. **Real USDC Testing**: Successfully tested with 25 USDC per wallet on Base Sepolia
3. **Production-Ready UI**: Complete interface with loading states, error handling, and responsive design
4. **Comprehensive Documentation**: Implementation summary and test scripts
5. **Security**: Proper access controls, wallet validation, and safe contract interactions

### Deployed Test Contracts
- Poll 1: `0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc` (1 hour duration)
- Poll 2: `0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43` (1 hour duration, 5 USDC/vote)
- Poll 3: `0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3` (Minimal test, 1 USDC/vote)
- Poll 4: `0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C` (3 minute test)

### Files Created/Modified
- Smart Contracts: `PollFactory.sol`, `Poll.sol`, deployment scripts
- UI Components: Poll page, ClaimSection, TransactionStatus, PollSkeleton
- Pages: Admin dashboard, Account page, Project polls page
- API Routes: Enhanced with filtering and project support
- Test Scripts: Comprehensive testing with minimal USDC usage

The Stakedriven platform is now fully functional on Base Sepolia testnet with all MVP features implemented and tested.