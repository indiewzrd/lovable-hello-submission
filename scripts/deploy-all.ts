import hre from "hardhat";

async function main() {
  console.log("Starting deployment process...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy MockUSDC
  console.log("\n1. Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // 2. Deploy PollFactory
  console.log("\n2. Deploying PollFactory...");
  const PollFactory = await hre.ethers.getContractFactory("PollFactory");
  const pollFactory = await PollFactory.deploy();
  await pollFactory.waitForDeployment();
  const factoryAddress = await pollFactory.getAddress();
  console.log("PollFactory deployed to:", factoryAddress);

  // 3. Get some test USDC from faucet
  console.log("\n3. Getting test USDC from faucet...");
  const faucetAmount = hre.ethers.parseUnits("10000", 6); // 10,000 USDC
  await mockUSDC.faucet(faucetAmount);
  console.log("Received 10,000 USDC from faucet");

  // 4. Deploy a test poll
  console.log("\n4. Deploying a test poll...");
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300; // Start in 5 minutes
  const endTime = startTime + 86400; // 24 hours duration
  const tokensPerVote = hre.ethers.parseUnits("100", 6); // 100 USDC per vote
  const winningOptionsCount = 2;
  const totalOptionsCount = 4;

  const tx = await pollFactory.deployPoll(
    startTime,
    endTime,
    tokensPerVote,
    winningOptionsCount,
    totalOptionsCount,
    usdcAddress
  );

  const receipt = await tx.wait();
  const deployedPolls = await pollFactory.getDeployedPolls();
  const testPollAddress = deployedPolls[0];
  console.log("Test poll deployed to:", testPollAddress);

  // 5. Print summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("MockUSDC:", usdcAddress);
  console.log("PollFactory:", factoryAddress);
  console.log("Test Poll:", testPollAddress);
  console.log("\nAdd these to your .env.local file:");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_POLL_FACTORY_ADDRESS=${factoryAddress}`);
  
  // Verify contracts on Basescan if not on localhost
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    console.log("\nVerifying contracts on Basescan...");
    
    try {
      await hre.run("verify:verify", {
        address: usdcAddress,
        constructorArguments: [],
      });
      console.log("MockUSDC verified!");
    } catch (error) {
      console.error("MockUSDC verification failed:", error);
    }

    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [],
      });
      console.log("PollFactory verified!");
    } catch (error) {
      console.error("PollFactory verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });