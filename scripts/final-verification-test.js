const hre = require("hardhat");
const { parseUnits } = require("ethers");

const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const PRIVATE_KEY = "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766";

async function main() {
  console.log("🎯 Final Verification Test - Deploying new Poll...\n");
  
  const wallet = new hre.ethers.Wallet(PRIVATE_KEY, hre.ethers.provider);
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, wallet);
  
  // Deploy new poll with unique parameters
  const now = Math.floor(Date.now() / 1000);
  const tx = await pollFactory.deployPoll(
    now + 600,    // Start in 10 minutes
    now + 3600,   // End in 1 hour
    parseUnits("3", 6), // 3 USDC per vote (unique)
    3,  // 3 winning options
    7,  // 7 total options (unique)
    USDC_ADDRESS
  );
  
  console.log("⏳ Transaction submitted:", tx.hash);
  const receipt = await tx.wait();
  
  // Get poll address
  let pollAddress;
  const deployedPolls = await pollFactory.getDeployedPolls();
  pollAddress = deployedPolls[deployedPolls.length - 1];
  
  console.log("\n✅ New Poll deployed!");
  console.log("=======================");
  console.log("Address:", pollAddress);
  console.log("Transaction:", `https://sepolia.basescan.org/tx/${tx.hash}`);
  
  console.log("\n📋 Verification Check Links:");
  console.log("============================");
  console.log("\n1. Check this new Poll:");
  console.log(`   https://sepolia.basescan.org/address/${pollAddress}#code`);
  
  console.log("\n2. Compare with verified Poll:");
  console.log("   https://sepolia.basescan.org/address/0xb31884603CF999a1ddce23Ef8E76c76b9d7D0048#code");
  
  console.log("\n🔍 What to look for:");
  console.log("- 'Similar Match Source Code' badge");
  console.log("- 'Contract Source Code Verified' status");
  console.log("- Ability to read/write contract methods");
  
  console.log("\n✨ If you see 'Similar Match Source Code', then:");
  console.log("- ✅ All Poll contracts are automatically verified!");
  console.log("- ✅ Users can interact with contracts on BaseScan");
  console.log("- ✅ No manual verification needed!");
  
  // Also provide list of all polls to check
  console.log("\n📜 All Poll Contracts:");
  const allPolls = await pollFactory.getDeployedPolls();
  allPolls.slice(-5).forEach((poll, i) => {
    console.log(`${i + 1}. https://sepolia.basescan.org/address/${poll}#code`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });