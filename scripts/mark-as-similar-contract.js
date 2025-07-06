const axios = require('axios');

const BASESCAN_API_KEY = "2R816CA48QH7HNYI93QH1EJCJ5Z3H1WX2I";
const VERIFIED_POLL = "0xb31884603CF999a1ddce23Ef8E76c76b9d7D0048";
const NEW_POLL = "0xb9Be10635235487396e4fc8A9Cc68b0aC807768C";

async function markAsSimilar() {
  console.log("🔄 Attempting to mark new Poll as similar to verified Poll...\n");
  
  console.log("Verified Poll:", VERIFIED_POLL);
  console.log("New Poll:", NEW_POLL);
  
  // First, let's check if BaseScan recognizes them as similar
  try {
    const checkUrl = `https://api-sepolia.basescan.org/api?module=contract&action=getsourcecode&address=${NEW_POLL}&apikey=${BASESCAN_API_KEY}`;
    
    const response = await axios.get(checkUrl);
    const data = response.data;
    
    if (data.status === "1" && data.result[0].SourceCode) {
      console.log("\n✅ Contract is already verified!");
      console.log("Contract Name:", data.result[0].ContractName);
      console.log("Compiler:", data.result[0].CompilerVersion);
    } else {
      console.log("\n❌ Contract is not verified");
      console.log("Status:", data.message);
      
      // Try to verify as proxy/similar
      console.log("\n📝 Instructions for manual similar contract verification:");
      console.log("1. Go to: https://sepolia.basescan.org/address/" + NEW_POLL + "#code");
      console.log("2. Click 'Verify & Publish'");
      console.log("3. Select 'Via similar contract'");
      console.log("4. Enter verified contract: " + VERIFIED_POLL);
      console.log("5. Submit verification");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
  
  console.log("\n💡 Alternative: Verify all existing Polls as similar contracts");
  const ALL_POLLS = [
    "0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc",
    "0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43",
    "0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3",
    "0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C",
    "0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677",
    NEW_POLL
  ];
  
  console.log("\nUnverified Polls that can be marked as similar:");
  for (const poll of ALL_POLLS) {
    if (poll.toLowerCase() !== VERIFIED_POLL.toLowerCase()) {
      console.log(`- ${poll}`);
    }
  }
}

markAsSimilar().catch(console.error);