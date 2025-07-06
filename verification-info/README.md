# Contract Verification Instructions for Base Sepolia

## Overview
This directory contains all the information needed to verify the Stakedriven contracts on Base Sepolia.

## Contracts to Verify

### 1. PollFactory Contract
- **Address**: 0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6
- **Network**: Base Sepolia (Chain ID: 84532)
- **Compiler**: Solidity 0.8.20
- **Optimization**: Enabled (200 runs)
- **License**: MIT

### 2. Poll Contracts (Deployed via Factory)
- Poll 1: 0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc
- Poll 2: 0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43
- Poll 3: 0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3
- Poll 4: 0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C
- Poll 5: 0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677

## Manual Verification Steps

### For PollFactory:

1. Go to: https://sepolia.basescan.org/verifyContract
2. Enter contract address: 0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6
3. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.20+commit.a1b79de6
   - License: MIT License (MIT)
4. Optimization: Yes, 200 runs
5. Paste the contents of `PollFactory.sol`
6. Constructor Arguments: Leave empty (no constructor params)
7. Complete verification

### For Poll Contracts:

Poll contracts are deployed via the factory, so they need special handling:

1. Go to: https://sepolia.basescan.org/verifyContract
2. Enter any poll contract address
3. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.20+commit.a1b79de6
   - License: MIT License (MIT)
4. Optimization: Yes, 200 runs
5. Paste the contents of `Poll.sol`
6. Constructor Arguments: These contracts are created via factory
7. Select "Is this a proxy contract?" if prompted

## Alternative: Using Hardhat Verify

If you have a BaseScan API key:

1. Get API key from: https://basescan.org/myapikey
2. Add to .env: `BASESCAN_API_KEY=your_key_here`
3. Run: `npx hardhat verify --network baseSepolia CONTRACT_ADDRESS`

## Contract Source Files

The source files are included in this directory:
- `PollFactory.sol` - The factory contract
- `Poll.sol` - The poll contract template
- `PollFactory.abi.json` - Factory ABI
- `Poll.abi.json` - Poll ABI

## Deployed Bytecode

The deployed bytecode can be verified against the compiled artifacts in:
- `PollFactory.bytecode.txt`
- `Poll.bytecode.txt`
