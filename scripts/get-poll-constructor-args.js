const hre = require("hardhat");

const POLL_ADDRESS = "0xb31884603CF999a1ddce23Ef8E76c76b9d7D0048";
const TX_HASH = "0x5afc342bdc234064391ddfabcea2f59ed70aecd1d24811edb4ddcdc54c4a2271";

async function main() {
  console.log("🔍 Getting exact constructor arguments from blockchain...\n");
  
  // Get the Poll contract
  const poll = await hre.ethers.getContractAt("Poll", POLL_ADDRESS);
  
  // Read all immutable values from the contract
  console.log("Reading contract state:");
  
  const creator = await poll.pollCreator();
  console.log("- Creator:", creator);
  
  const startTime = await poll.startTime();
  console.log("- Start Time:", startTime.toString());
  
  const endTime = await poll.endTime();
  console.log("- End Time:", endTime.toString());
  
  const tokensPerVote = await poll.tokensPerVote();
  console.log("- Tokens Per Vote:", tokensPerVote.toString());
  
  const winningOptionsCount = await poll.winningOptionsCount();
  console.log("- Winning Options Count:", winningOptionsCount.toString());
  
  const totalOptionsCount = await poll.totalOptionsCount();
  console.log("- Total Options Count:", totalOptionsCount.toString());
  
  const votingToken = await poll.votingToken();
  console.log("- Voting Token:", votingToken);
  
  const factory = await poll.factory();
  console.log("- Factory:", factory);
  
  // Get transaction details
  console.log("\nGetting deployment transaction...");
  const tx = await hre.ethers.provider.getTransaction(TX_HASH);
  console.log("- From:", tx.from);
  console.log("- To:", tx.to);
  
  // Create constructor arguments array
  console.log("\n📋 Constructor Arguments Array:");
  const constructorArgs = [
    creator,
    startTime.toString(),
    endTime.toString(),
    tokensPerVote.toString(),
    winningOptionsCount.toString(),
    totalOptionsCount.toString(),
    votingToken,
    factory
  ];
  
  console.log("[\n  " + constructorArgs.map(arg => `"${arg}"`).join(",\n  ") + "\n]");
  
  // Encode constructor arguments
  const abiCoder = new hre.ethers.AbiCoder();
  const encoded = abiCoder.encode(
    ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "address", "address"],
    constructorArgs
  );
  
  console.log("\n📝 Encoded Constructor Arguments:");
  console.log(encoded.slice(2)); // Remove 0x prefix
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });