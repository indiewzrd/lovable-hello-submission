# Stakedriven Smart Contract Methods Documentation

## PollFactory Contract
**Address:** `0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6`

### Read Methods (View Functions)

#### Administrative Getters
- **`admin()`** → `address`
  - Returns the current admin address
  - Default: Contract deployer

- **`rescueWallet()`** → `address`
  - Returns the rescue wallet address for emergency fund recovery
  - Default: Contract deployer

- **`feeWallet()`** → `address`
  - Returns the fee collection wallet address
  - Default: Contract deployer

- **`feePercentage()`** → `uint256`
  - Returns the platform fee percentage (in basis points)
  - Default: 500 (5%)
  - Example: 500 = 5%, 1000 = 10%

#### Poll Tracking
- **`deployedPolls(uint256 index)`** → `address`
  - Returns poll address at the given index
  - Reverts if index is out of bounds

- **`getDeployedPolls()`** → `address[]`
  - Returns array of all deployed poll addresses

- **`getDeployedPollsCount()`** → `uint256`
  - Returns the total number of polls deployed

### Write Methods (State-Changing Functions)

#### Poll Deployment
- **`deployPoll(uint256 _startTime, uint256 _endTime, uint256 _tokensPerVote, uint256 _winningOptionsCount, uint256 _totalOptionsCount, address _tokenAddress)`** → `address`
  - Deploys a new poll contract
  - Parameters:
    - `_startTime`: Unix timestamp when voting starts
    - `_endTime`: Unix timestamp when voting ends
    - `_tokensPerVote`: Amount of tokens (with decimals) required per vote
    - `_winningOptionsCount`: Number of options that will win
    - `_totalOptionsCount`: Total number of voting options
    - `_tokenAddress`: Address of the voting token (USDC on Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
  - Returns: Address of the deployed poll
  - Emits: `PollDeployed` event

#### Administrative Functions (Admin Only)
- **`setAdmin(address _newAdmin)`**
  - Changes the admin address
  - Only callable by current admin
  - Emits: `AdminChanged` event

- **`setRescueWallet(address _newRescueWallet)`**
  - Changes the rescue wallet address
  - Only callable by admin
  - Emits: `RescueWalletChanged` event

- **`setFeeWallet(address _newFeeWallet)`**
  - Changes the fee wallet address
  - Only callable by admin
  - Emits: `FeeWalletChanged` event

- **`setFeePercentage(uint256 _newFeePercentage)`**
  - Changes the platform fee percentage
  - Only callable by admin
  - Maximum: 1000 (10%)
  - Emits: `FeePercentageChanged` event

### Events
- **`PollDeployed(address indexed pollAddress, address indexed creator, uint256 startTime, uint256 endTime)`**
- **`AdminChanged(address indexed oldAdmin, address indexed newAdmin)`**
- **`RescueWalletChanged(address indexed oldWallet, address indexed newWallet)`**
- **`FeeWalletChanged(address indexed oldWallet, address indexed newWallet)`**
- **`FeePercentageChanged(uint256 oldFee, uint256 newFee)`**

---

## Poll Contract
**Deployed by PollFactory for each poll**

### Read Methods (View Functions)

#### Poll Information
- **`pollCreator()`** → `address`
  - Returns the address that created this poll

- **`startTime()`** → `uint256`
  - Returns Unix timestamp when voting starts

- **`endTime()`** → `uint256`
  - Returns Unix timestamp when voting ends

- **`tokensPerVote()`** → `uint256`
  - Returns amount of tokens required per vote

- **`tokenAddress()`** → `address`
  - Returns the voting token address (USDC)

- **`tokenDecimals()`** → `uint8`
  - Returns token decimals (6 for USDC)

- **`winningOptionsCount()`** → `uint256`
  - Returns number of options that will win

- **`totalOptionsCount()`** → `uint256`
  - Returns total number of voting options

#### Voting Results
- **`optionVotes(uint256 option)`** → `uint256`
  - Returns total votes for a specific option

- **`voterAmounts(address voter)`** → `uint256`
  - Returns total amount a voter has staked

- **`voterChoices(address voter)`** → `uint256`
  - Returns which option a voter chose

- **`totalVoters()`** → `uint256`
  - Returns total number of unique voters

- **`totalVotesAmount()`** → `uint256`
  - Returns total amount of tokens staked

- **`getWinningOptions()`** → `uint256[]`
  - Returns array of winning option indices (after voting ends)

- **`isWinningOption(uint256 _option)`** → `bool`
  - Checks if an option is among the winners

#### User Status
- **`userHasVoted(address _user)`** → `bool`
  - Checks if a user has voted

- **`hasClaimed(address user)`** → `bool`
  - Checks if a user has claimed their funds/refund

- **`winningFundsClaimed()`** → `bool`
  - Checks if poll creator has claimed winning funds

### Write Methods (State-Changing Functions)

#### Voting
- **`vote(uint256 _option)`**
  - Cast a vote for the specified option
  - Requirements:
    - Voting must be active (between startTime and endTime)
    - User must not have voted before
    - Option must be valid (< totalOptionsCount)
    - User must have approved token spending
  - Emits: `Voted` event

#### Claiming (After Voting Ends)
- **`claimWinningFunds()`**
  - For poll creator to claim funds from winning options
  - Deducts platform fee before transfer
  - Only callable once after voting ends
  - Emits: `WinningFundsClaimed` event

- **`claimNonWinningRefund()`**
  - For voters who voted for non-winning options to get refund
  - Returns full amount (no fee deduction)
  - Only callable if user voted for a non-winning option
  - Emits: `NonWinningRefundClaimed` event

#### Emergency Functions
- **`rescueFunds()`**
  - Emergency function to rescue all funds
  - Only callable by rescue wallet (set in factory)
  - Can only be called 30 days after voting ends
  - Emits: `FundsRescued` event

### Events
- **`Voted(address indexed voter, uint256 indexed option, uint256 amount)`**
- **`WinningFundsClaimed(address indexed creator, uint256 amount, uint256 feeAmount)`**
- **`NonWinningRefundClaimed(address indexed voter, uint256 amount)`**
- **`FundsRescued(address indexed rescueWallet, uint256 amount)`**

---

## Usage Examples

### Creating a Poll (JavaScript/TypeScript)
```javascript
// Connect to PollFactory
const pollFactory = new ethers.Contract(
  "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6",
  POLL_FACTORY_ABI,
  signer
);

// Deploy a new poll
const startTime = Math.floor(Date.now() / 1000) + 300; // Start in 5 minutes
const endTime = startTime + 86400; // 24 hours duration
const tokensPerVote = ethers.parseUnits("100", 6); // 100 USDC per vote
const winningOptions = 2; // Top 2 options win
const totalOptions = 4; // 4 options total
const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const tx = await pollFactory.deployPoll(
  startTime,
  endTime,
  tokensPerVote,
  winningOptions,
  totalOptions,
  usdcAddress
);

const receipt = await tx.wait();
// Get poll address from event logs
```

### Voting in a Poll
```javascript
// First approve USDC spending
const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
await usdc.approve(pollAddress, tokensPerVote);

// Then vote
const poll = new ethers.Contract(pollAddress, POLL_ABI, signer);
await poll.vote(1); // Vote for option 1
```

### Claiming Funds
```javascript
// For poll creator (after voting ends)
await poll.claimWinningFunds();

// For voters who voted for non-winning options
await poll.claimNonWinningRefund();
```