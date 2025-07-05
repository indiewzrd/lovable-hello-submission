const hre = require("hardhat");

async function main() {
  console.log("Starting Base Sepolia deployment...");

  // Check network
  if (hre.network.name !== "baseSepolia") {
    throw new Error("This script should only be run on Base Sepolia network. Use: npx hardhat run scripts/deploy-base-sepolia.js --network baseSepolia");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("\nERROR: Your account has no ETH!");
    console.log("Get Base Sepolia ETH from: https://docs.base.org/docs/tools/network-faucets");
    process.exit(1);
  }

  // Use the official Base Sepolia USDC address
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  console.log("\nUsing Base Sepolia USDC:", USDC_ADDRESS);

  // Deploy PollFactory
  console.log("\nDeploying PollFactory...");
  const PollFactory = await hre.ethers.getContractFactory("PollFactory");
  const pollFactory = await PollFactory.deploy();
  await pollFactory.waitForDeployment();
  const factoryAddress = await pollFactory.getAddress();
  console.log("PollFactory deployed to:", factoryAddress);

  // Print summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("PollFactory Address:", factoryAddress);
  
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update your Vercel environment variables:");
  console.log(`   NEXT_PUBLIC_USDC_ADDRESS=${USDC_ADDRESS}`);
  console.log(`   NEXT_PUBLIC_POLL_FACTORY_ADDRESS=${factoryAddress}`);
  
  console.log("\n2. Verify the contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${factoryAddress}`);
  
  console.log("\n3. View on Basescan:");
  console.log(`   https://sepolia.basescan.org/address/${factoryAddress}`);

  // Wait for confirmations before verification
  console.log("\nWaiting for block confirmations...");
  await pollFactory.deploymentTransaction().wait(5);

  // Verify contract
  console.log("\nVerifying contract on Basescan...");
  try {
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("You can verify manually later with:");
      console.log(`npx hardhat verify --network baseSepolia ${factoryAddress}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });