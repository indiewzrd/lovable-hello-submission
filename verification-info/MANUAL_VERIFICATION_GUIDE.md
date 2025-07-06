# Manual Contract Verification Guide for Base Sepolia

## Overview
This guide will help you manually verify the Poll contracts on Base Sepolia BlockScout/BaseScan.

## Poll Contracts to Verify

1. **Poll 1**: `0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc`
2. **Poll 2**: `0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43`
3. **Poll 3**: `0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3`
4. **Poll 4**: `0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C`
5. **Poll 5**: `0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677`

## Step-by-Step Verification Process

### Method 1: Using BaseScan Web Interface

1. **Navigate to BaseScan Verification Page**
   - Go to: https://sepolia.basescan.org/verifyContract

2. **Enter Contract Details**
   - Contract Address: Enter one of the poll addresses above
   - Contract Name: `Poll`
   - Compiler Version: `v0.8.24+commit.e11b9ed9`
   - Optimization: `Yes`
   - Runs: `200`

3. **Source Code**
   - Copy the entire contents of `Poll-Flattened-Manual.sol`
   - Paste into the source code field

4. **Constructor Arguments**
   - For the latest poll (0x824B...4677), use:
   ```
   000000000000000000000000bad1412e9f40ec01055f2cf7439c1391df4373b60000000000000000000000008982f9b71640adf1f491f6bf0d12cc40d42991e300000000000000000000000000000000000000000000000000000000677b604700000000000000000000000000000000000000000000000000000000677b617300000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000036cbd53842c5426634e7929541ec2318f3dcf7e
   ```

5. **Complete Verification**
   - Solve the captcha
   - Click "Verify and Publish"

### Method 2: Using Remix IDE

1. **Open Remix**
   - Go to: https://remix.ethereum.org

2. **Create New File**
   - Create `Poll.sol` in contracts folder
   - Paste contents of `Poll-Flattened-Manual.sol`

3. **Compile**
   - Select compiler version: 0.8.24
   - Enable optimization: 200 runs
   - Compile the contract

4. **Use Etherscan Plugin**
   - Install "ETHERSCAN - CONTRACT VERIFICATION" plugin
   - Select Base Sepolia network
   - Enter contract address
   - Verify

### Method 3: Using BlockScout API

1. **Prepare JSON Request**
   ```json
   {
     "addressHash": "0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677",
     "compilerVersion": "v0.8.24+commit.e11b9ed9",
     "contractSourceCode": "[Contents of Poll-Flattened-Manual.sol]",
     "name": "Poll",
     "optimization": true,
     "optimizationRuns": 200
   }
   ```

2. **Send Verification Request**
   ```bash
   curl -X POST https://base-sepolia.blockscout.com/api/v2/smart-contracts/verification/via/flattened-code
   ```

## Troubleshooting

### Common Issues:

1. **"Contract source code doesn't match deployed bytecode"**
   - Ensure compiler version is exactly v0.8.24+commit.e11b9ed9
   - Check optimization is enabled with 200 runs
   - Verify constructor arguments are correct

2. **"Contract already verified"**
   - Contract may have been auto-verified by BlockScout
   - Check contract page to see if it's already verified

3. **"Similar match found"**
   - BlockScout may have found a similar contract
   - This is good - it means the bytecode matches a known pattern

## All Contract Methods

Once verified, these methods will be visible:

### Read Methods:
- `creatorClaimed()`: Check if creator claimed funds
- `endTime()`: Poll end timestamp
- `factory()`: PollFactory address
- `feeAmount()`: Calculated fee amount
- `feeClaimed()`: Check if fee was claimed
- `getVotingResults()`: Get all voting results
- `getWinningOptions()`: Get winning option numbers
- `hasClaimedRefund(address)`: Check if voter claimed refund
- `hasVoted(address)`: Check if address voted
- `isWinningOption(uint256)`: Check if option won
- `optionVotes(uint256)`: Get votes for option
- `pollCreator()`: Poll creator address
- `startTime()`: Poll start timestamp
- `tokensPerVote()`: USDC per vote
- `totalOptionsCount()`: Total number of options
- `totalVotes()`: Total USDC voted
- `voterChoice(address)`: Get voter's choice
- `votingToken()`: USDC token address
- `winnersCalculated()`: Check if winners calculated
- `winningAmount()`: Total winning amount
- `winningOptions(uint256)`: Get winning option by index
- `winningOptionsCount()`: Number of winners

### Write Methods:
- `calculateWinners()`: Calculate winners after poll ends
- `cancelVote()`: Cancel vote and get refund
- `claimFee()`: Fee wallet claims fee
- `claimNonWinningRefund()`: Claim refund for losing vote
- `claimWinningFunds()`: Creator claims winning funds
- `rescueFunds()`: Admin rescues all funds
- `vote(uint256)`: Vote for an option

## Direct Links

Verify each contract:
- [Poll 1](https://sepolia.basescan.org/verifyContract?a=0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc)
- [Poll 2](https://sepolia.basescan.org/verifyContract?a=0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43)
- [Poll 3](https://sepolia.basescan.org/verifyContract?a=0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3)
- [Poll 4](https://sepolia.basescan.org/verifyContract?a=0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C)
- [Poll 5](https://sepolia.basescan.org/verifyContract?a=0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677)