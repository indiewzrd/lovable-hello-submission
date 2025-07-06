const hre = require("hardhat");

// Poll contract addresses to verify
const POLL_ADDRESSES = [
  "0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc", // Poll 1
  "0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43", // Poll 2  
  "0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3", // Poll 3
  "0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C", // Poll 4
  "0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677", // Latest test poll
];

// Constructor arguments for Poll contract
// These need to match what was used when deploying via PollFactory
function getConstructorArgs(pollAddress) {
  // Standard constructor args for all test polls
  return [
    "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6", // factory address
    "0x8982f9B71640aDf1F491F6Bf0D12CC40d42991E3", // creator address (deployer)
    // The rest of the arguments vary per poll, but we'll use common values
  ];
}

async function verifyPollContract(address) {
  console.log(`\n🔍 Verifying Poll contract at ${address}...`);
  
  try {
    // First, let's get the Poll contract details from the factory
    const pollFactory = await hre.ethers.getContractAt(
      "PollFactory", 
      "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6"
    );
    
    // Try to verify with minimal constructor args
    // The Poll contract is created by the factory, so verification might be different
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [], // Polls created via factory might not need constructor args
      contract: "contracts/Poll.sol:Poll" // Specify the contract path
    });
    
    console.log(`✅ Poll contract verified at ${address}`);
    console.log(`📖 View on BaseScan: https://sepolia.basescan.org/address/${address}#code`);
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ Poll contract already verified at ${address}`);
      console.log(`📖 View on BaseScan: https://sepolia.basescan.org/address/${address}#code`);
    } else {
      console.error(`❌ Failed to verify ${address}:`, error.message);
      
      // Try alternative verification approach
      console.log("\n🔄 Trying alternative verification method...");
      try {
        // Get the creation bytecode from a deployed poll
        const poll = await hre.ethers.getContractAt("Poll", address);
        
        // Try to verify as a proxy or implementation
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: [],
        });
        
      } catch (altError) {
        console.error("❌ Alternative verification also failed:", altError.message);
      }
    }
  }
}

async function main() {
  console.log("🚀 Starting Poll Contract Verification on Base Sepolia...\n");
  
  // Verify network
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  
  if (network.chainId !== 84532n) {
    throw new Error("Please run on Base Sepolia network (chainId: 84532)");
  }
  
  // First, make sure PollFactory is verified
  console.log("\n📋 Checking PollFactory verification status...");
  try {
    await hre.run("verify:verify", {
      address: "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6",
      constructorArguments: [],
      contract: "contracts/PollFactory.sol:PollFactory"
    });
    console.log("✅ PollFactory verified");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ PollFactory already verified");
    } else {
      console.log("⚠️  PollFactory verification issue:", error.message);
    }
  }
  
  // Verify each poll contract
  for (const pollAddress of POLL_ADDRESSES) {
    await verifyPollContract(pollAddress);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n\n📊 Verification Summary:");
  console.log("========================");
  console.log("Factory: https://sepolia.basescan.org/address/0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6#code");
  
  for (const address of POLL_ADDRESSES) {
    console.log(`Poll: https://sepolia.basescan.org/address/${address}#code`);
  }
  
  console.log("\n✅ Verification process complete!");
  console.log("\n💡 If any contracts failed to verify, they might be:");
  console.log("1. Already verified");
  console.log("2. Deployed via factory (different verification process)");
  console.log("3. Need manual verification on BaseScan with factory deployment info");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });