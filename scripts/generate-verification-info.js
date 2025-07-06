const fs = require('fs');
const path = require('path');

// Contract addresses
const CONTRACTS = {
  PollFactory: "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6",
  Polls: [
    "0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc",
    "0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43",
    "0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3",
    "0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C",
    "0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677",
  ]
};

async function generateVerificationInfo() {
  console.log("📋 Generating Contract Verification Information...\n");
  
  // Read contract source files
  const pollFactorySource = fs.readFileSync(
    path.join(__dirname, '../contracts/PollFactory.sol'), 
    'utf8'
  );
  const pollSource = fs.readFileSync(
    path.join(__dirname, '../contracts/Poll.sol'), 
    'utf8'
  );
  
  // Read compiled artifacts
  const pollFactoryArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../artifacts/contracts/PollFactory.sol/PollFactory.json'),
      'utf8'
    )
  );
  const pollArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../artifacts/contracts/Poll.sol/Poll.json'),
      'utf8'
    )
  );
  
  // Create verification info directory
  const verifyDir = path.join(__dirname, '../verification-info');
  if (!fs.existsSync(verifyDir)) {
    fs.mkdirSync(verifyDir);
  }
  
  // Generate verification instructions
  const instructions = `# Contract Verification Instructions for Base Sepolia

## Overview
This directory contains all the information needed to verify the Stakedriven contracts on Base Sepolia.

## Contracts to Verify

### 1. PollFactory Contract
- **Address**: ${CONTRACTS.PollFactory}
- **Network**: Base Sepolia (Chain ID: 84532)
- **Compiler**: Solidity 0.8.20
- **Optimization**: Enabled (200 runs)
- **License**: MIT

### 2. Poll Contracts (Deployed via Factory)
${CONTRACTS.Polls.map((addr, i) => `- Poll ${i + 1}: ${addr}`).join('\n')}

## Manual Verification Steps

### For PollFactory:

1. Go to: https://sepolia.basescan.org/verifyContract
2. Enter contract address: ${CONTRACTS.PollFactory}
3. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.20+commit.a1b79de6
   - License: MIT License (MIT)
4. Optimization: Yes, 200 runs
5. Paste the contents of \`PollFactory.sol\`
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
5. Paste the contents of \`Poll.sol\`
6. Constructor Arguments: These contracts are created via factory
7. Select "Is this a proxy contract?" if prompted

## Alternative: Using Hardhat Verify

If you have a BaseScan API key:

1. Get API key from: https://basescan.org/myapikey
2. Add to .env: \`BASESCAN_API_KEY=your_key_here\`
3. Run: \`npx hardhat verify --network baseSepolia CONTRACT_ADDRESS\`

## Contract Source Files

The source files are included in this directory:
- \`PollFactory.sol\` - The factory contract
- \`Poll.sol\` - The poll contract template
- \`PollFactory.abi.json\` - Factory ABI
- \`Poll.abi.json\` - Poll ABI

## Deployed Bytecode

The deployed bytecode can be verified against the compiled artifacts in:
- \`PollFactory.bytecode.txt\`
- \`Poll.bytecode.txt\`
`;
  
  // Write files
  fs.writeFileSync(path.join(verifyDir, 'README.md'), instructions);
  fs.writeFileSync(path.join(verifyDir, 'PollFactory.sol'), pollFactorySource);
  fs.writeFileSync(path.join(verifyDir, 'Poll.sol'), pollSource);
  fs.writeFileSync(
    path.join(verifyDir, 'PollFactory.abi.json'), 
    JSON.stringify(pollFactoryArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(verifyDir, 'Poll.abi.json'), 
    JSON.stringify(pollArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(verifyDir, 'PollFactory.bytecode.txt'), 
    pollFactoryArtifact.deployedBytecode
  );
  fs.writeFileSync(
    path.join(verifyDir, 'Poll.bytecode.txt'), 
    pollArtifact.deployedBytecode
  );
  
  // Generate a combined flattened file for easier verification
  const flattened = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Contracts
${pollFactorySource.includes('import "@openzeppelin') ? '// OpenZeppelin imports would be auto-resolved by BaseScan' : ''}

// ==================== PollFactory.sol ====================
${pollFactorySource}

// ==================== Poll.sol ====================
${pollSource}
`;
  
  fs.writeFileSync(path.join(verifyDir, 'Flattened.sol'), flattened);
  
  console.log("✅ Verification files generated in /verification-info/");
  console.log("\n📁 Files created:");
  console.log("- README.md (instructions)");
  console.log("- PollFactory.sol");
  console.log("- Poll.sol"); 
  console.log("- PollFactory.abi.json");
  console.log("- Poll.abi.json");
  console.log("- PollFactory.bytecode.txt");
  console.log("- Poll.bytecode.txt");
  console.log("- Flattened.sol (combined source)");
  
  console.log("\n🌐 Direct Verification Links:");
  console.log(`\nPollFactory: https://sepolia.basescan.org/verifyContract?a=${CONTRACTS.PollFactory}`);
  CONTRACTS.Polls.forEach((addr, i) => {
    console.log(`Poll ${i + 1}: https://sepolia.basescan.org/verifyContract?a=${addr}`);
  });
  
  console.log("\n💡 Next Steps:");
  console.log("1. Visit the verification links above");
  console.log("2. Use the source files in /verification-info/");
  console.log("3. Follow the instructions in README.md");
  console.log("\nNote: Poll contracts are deployed via factory, so verification might require special handling.");
}

// Generate ABI documentation
function generateABIDocumentation() {
  const pollArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../artifacts/contracts/Poll.sol/Poll.json'),
      'utf8'
    )
  );
  
  console.log("\n📖 Poll Contract Methods (ABI):");
  console.log("================================\n");
  
  const methods = pollArtifact.abi.filter(item => item.type === 'function');
  const readMethods = methods.filter(m => m.stateMutability === 'view' || m.stateMutability === 'pure');
  const writeMethods = methods.filter(m => m.stateMutability !== 'view' && m.stateMutability !== 'pure');
  
  console.log("READ METHODS:");
  readMethods.forEach(method => {
    const params = method.inputs.map(i => `${i.type} ${i.name}`).join(', ');
    const returns = method.outputs.map(o => o.type).join(', ');
    console.log(`- ${method.name}(${params}) returns (${returns})`);
  });
  
  console.log("\nWRITE METHODS:");
  writeMethods.forEach(method => {
    const params = method.inputs.map(i => `${i.type} ${i.name}`).join(', ');
    console.log(`- ${method.name}(${params})`);
  });
  
  console.log("\nEVENTS:");
  const events = pollArtifact.abi.filter(item => item.type === 'event');
  events.forEach(event => {
    const params = event.inputs.map(i => `${i.indexed ? 'indexed ' : ''}${i.type} ${i.name}`).join(', ');
    console.log(`- ${event.name}(${params})`);
  });
}

async function main() {
  await generateVerificationInfo();
  generateABIDocumentation();
}

main().catch(console.error);