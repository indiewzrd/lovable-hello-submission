const hre = require("hardhat");
const { formatUnits } = require("ethers");

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const WALLETS = [
  "0x8982f9B71640aDf1F491F6Bf0D12CC40d42991E3", // Deployer
  "0x9E60226D581dD96bB5241854647FDDacF91b68E4", // Voter 1
  "0xf350cdb6429a5aC0430210E6e48C86A6c4D988EE", // Voter 2
  "0x43c7Cc2bAd0AC151D71C8795197ffFAf2cDF0154"  // Voter 3
];

async function main() {
  console.log("=== Checking USDC Balances on Base Sepolia ===\n");
  
  const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS);
  
  console.log("USDC Contract:", USDC_ADDRESS);
  console.log("\nBalances:");
  
  for (let i = 0; i < WALLETS.length; i++) {
    const balance = await usdc.balanceOf(WALLETS[i]);
    console.log(`Wallet ${i}: ${WALLETS[i]}`);
    console.log(`  Balance: ${formatUnits(balance, 6)} USDC`);
    console.log(`  Raw: ${balance.toString()}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });