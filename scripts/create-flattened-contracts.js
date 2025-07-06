const fs = require('fs');
const path = require('path');

// Create a flattened version suitable for BaseScan verification
function createFlattenedPoll() {
  const content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/IERC20Permit.sol)
interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

// OpenZeppelin Contracts (last updated v5.0.0) (utils/Address.sol)
library Address {
    error AddressInsufficientBalance(address account);
    error AddressEmptyCode(address target);
    error FailedInnerCall();

    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert AddressInsufficientBalance(address(this));
        }

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert FailedInnerCall();
        }
    }

    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        if (address(this).balance < value) {
            revert AddressInsufficientBalance(address(this));
        }
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) internal view returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            if (returndata.length == 0 && target.code.length == 0) {
                revert AddressEmptyCode(target);
            }
            return returndata;
        }
    }

    function verifyCallResult(bool success, bytes memory returndata) internal pure returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            return returndata;
        }
    }

    function _revert(bytes memory returndata) private pure {
        if (returndata.length > 0) {
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert FailedInnerCall();
        }
    }
}

// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/utils/SafeERC20.sol)
library SafeERC20 {
    using Address for address;

    error SafeERC20FailedOperation(address token);
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(data);
        if (returndata.length != 0 && !abi.decode(returndata, (bool))) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        (bool success, bytes memory returndata) = address(token).call(data);
        return success && (returndata.length == 0 || abi.decode(returndata, (bool))) && address(token).code.length > 0;
    }
}

// OpenZeppelin Contracts (last updated v5.0.0) (utils/ReentrancyGuard.sol)
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// Minimal PollFactory interface
interface IPollFactory {
    function feePercentage() external view returns (uint256);
    function feeWallet() external view returns (address);
    function rescueWallet() external view returns (address);
    function admin() external view returns (address);
}

/**
 * @title Poll
 * @dev Individual poll contract deployed by PollFactory
 */
contract Poll is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Immutable poll parameters
    address public immutable pollCreator;
    uint256 public immutable startTime;
    uint256 public immutable endTime;
    uint256 public immutable tokensPerVote;
    uint256 public immutable winningOptionsCount;
    uint256 public immutable totalOptionsCount;
    address public immutable votingToken;
    address public immutable factory;
    
    // Voting data
    mapping(uint256 => uint256) public optionVotes; // option number => total tokens
    mapping(address => uint256) public voterChoice; // voter => option number (0 means no vote)
    mapping(address => bool) public hasVoted;
    
    // Winning options (determined after poll ends)
    uint256[] public winningOptions;
    bool public winnersCalculated;
    
    // Claim tracking
    mapping(address => bool) public hasClaimedRefund;
    bool public creatorClaimed;
    bool public feeClaimed;
    
    // Total amounts
    uint256 public totalVotes;
    uint256 public winningAmount;
    uint256 public feeAmount;
    
    // Events
    event Voted(address indexed voter, uint256 indexed option, uint256 amount);
    event VoteCancelled(address indexed voter, uint256 indexed option, uint256 amount);
    event WinnersCalculated(uint256[] winners, uint256 totalWinningAmount);
    event CreatorClaimed(address indexed creator, uint256 amount);
    event FeeClaimed(address indexed feeWallet, uint256 amount);
    event RefundClaimed(address indexed voter, uint256 amount);
    event FundsRescued(address indexed rescueWallet, uint256 amount);
    
    // Modifiers
    modifier onlyDuringVoting() {
        require(block.timestamp >= startTime, "Voting not started");
        require(block.timestamp < endTime, "Voting ended");
        _;
    }
    
    modifier onlyAfterVoting() {
        require(block.timestamp >= endTime, "Voting not ended");
        _;
    }
    
    modifier onlyGlobalAdmin() {
        require(msg.sender == IPollFactory(factory).admin(), "Only global admin");
        _;
    }
    
    constructor(
        address _factory,
        address _creator,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokensPerVote,
        uint256 _winningOptionsCount,
        uint256 _totalOptionsCount,
        address _tokenAddress
    ) {
        factory = _factory;
        pollCreator = _creator;
        startTime = _startTime;
        endTime = _endTime;
        tokensPerVote = _tokensPerVote;
        winningOptionsCount = _winningOptionsCount;
        totalOptionsCount = _totalOptionsCount;
        votingToken = _tokenAddress;
    }
    
    /**
     * @dev Vote for an option
     */
    function vote(uint256 _option) external nonReentrant onlyDuringVoting {
        require(_option > 0 && _option <= totalOptionsCount, "Invalid option");
        require(!hasVoted[msg.sender], "Already voted");
        
        // Transfer tokens from voter to this contract
        IERC20(votingToken).safeTransferFrom(msg.sender, address(this), tokensPerVote);
        
        // Record vote
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _option;
        optionVotes[_option] += tokensPerVote;
        totalVotes += tokensPerVote;
        
        emit Voted(msg.sender, _option, tokensPerVote);
    }
    
    /**
     * @dev Cancel vote and get refund
     */
    function cancelVote() external nonReentrant onlyDuringVoting {
        require(hasVoted[msg.sender], "Not voted");
        require(!hasClaimedRefund[msg.sender], "Already claimed");
        
        uint256 option = voterChoice[msg.sender];
        
        // Update state
        hasVoted[msg.sender] = false;
        voterChoice[msg.sender] = 0;
        optionVotes[option] -= tokensPerVote;
        totalVotes -= tokensPerVote;
        hasClaimedRefund[msg.sender] = true;
        
        // Refund tokens
        IERC20(votingToken).safeTransfer(msg.sender, tokensPerVote);
        
        emit VoteCancelled(msg.sender, option, tokensPerVote);
    }
    
    /**
     * @dev Calculate winning options after poll ends
     */
    function calculateWinners() external onlyAfterVoting {
        require(!winnersCalculated, "Winners already calculated");
        
        // Create array of options with their vote counts
        uint256[] memory options = new uint256[](totalOptionsCount);
        uint256[] memory votes = new uint256[](totalOptionsCount);
        
        for (uint256 i = 0; i < totalOptionsCount; i++) {
            options[i] = i + 1;
            votes[i] = optionVotes[i + 1];
        }
        
        // Sort options by vote count (descending)
        for (uint256 i = 0; i < totalOptionsCount - 1; i++) {
            for (uint256 j = 0; j < totalOptionsCount - i - 1; j++) {
                if (votes[j] < votes[j + 1]) {
                    // Swap votes
                    uint256 tempVotes = votes[j];
                    votes[j] = votes[j + 1];
                    votes[j + 1] = tempVotes;
                    
                    // Swap options
                    uint256 tempOption = options[j];
                    options[j] = options[j + 1];
                    options[j + 1] = tempOption;
                }
            }
        }
        
        // Select winning options
        for (uint256 i = 0; i < winningOptionsCount && i < totalOptionsCount; i++) {
            if (votes[i] > 0) {
                winningOptions.push(options[i]);
                winningAmount += votes[i];
            }
        }
        
        // Calculate fee
        if (winningAmount > 0) {
            uint256 feePercentage = IPollFactory(factory).feePercentage();
            feeAmount = (winningAmount * feePercentage) / 10000;
        }
        
        winnersCalculated = true;
        emit WinnersCalculated(winningOptions, winningAmount);
    }
    
    /**
     * @dev Claim winning funds (creator only)
     */
    function claimWinningFunds() external nonReentrant {
        require(msg.sender == pollCreator, "Only creator");
        require(winnersCalculated, "Winners not calculated");
        require(!creatorClaimed, "Already claimed");
        require(winningAmount > 0, "No winning funds");
        
        creatorClaimed = true;
        uint256 claimAmount = winningAmount - feeAmount;
        
        IERC20(votingToken).safeTransfer(pollCreator, claimAmount);
        
        emit CreatorClaimed(pollCreator, claimAmount);
    }
    
    /**
     * @dev Claim fee (fee wallet only)
     */
    function claimFee() external nonReentrant {
        address feeWallet = IPollFactory(factory).feeWallet();
        require(msg.sender == feeWallet, "Only fee wallet");
        require(winnersCalculated, "Winners not calculated");
        require(!feeClaimed, "Already claimed");
        require(feeAmount > 0, "No fee to claim");
        
        feeClaimed = true;
        
        IERC20(votingToken).safeTransfer(feeWallet, feeAmount);
        
        emit FeeClaimed(feeWallet, feeAmount);
    }
    
    /**
     * @dev Claim refund for non-winning votes
     */
    function claimNonWinningRefund() external nonReentrant {
        require(winnersCalculated, "Winners not calculated");
        require(hasVoted[msg.sender], "Not voted");
        require(!hasClaimedRefund[msg.sender], "Already claimed");
        
        uint256 votedOption = voterChoice[msg.sender];
        bool isWinner = false;
        
        // Check if voted option is a winner
        for (uint256 i = 0; i < winningOptions.length; i++) {
            if (winningOptions[i] == votedOption) {
                isWinner = true;
                break;
            }
        }
        
        require(!isWinner, "Cannot claim refund for winning option");
        
        hasClaimedRefund[msg.sender] = true;
        
        IERC20(votingToken).safeTransfer(msg.sender, tokensPerVote);
        
        emit RefundClaimed(msg.sender, tokensPerVote);
    }
    
    /**
     * @dev Rescue funds (admin only)
     */
    function rescueFunds() external nonReentrant onlyGlobalAdmin {
        address rescueWallet = IPollFactory(factory).rescueWallet();
        uint256 balance = IERC20(votingToken).balanceOf(address(this));
        require(balance > 0, "No funds to rescue");
        
        IERC20(votingToken).safeTransfer(rescueWallet, balance);
        
        emit FundsRescued(rescueWallet, balance);
    }
    
    /**
     * @dev Get voting results
     */
    function getVotingResults() external view returns (uint256[] memory options, uint256[] memory votes) {
        options = new uint256[](totalOptionsCount);
        votes = new uint256[](totalOptionsCount);
        
        for (uint256 i = 0; i < totalOptionsCount; i++) {
            options[i] = i + 1;
            votes[i] = optionVotes[i + 1];
        }
        
        return (options, votes);
    }
    
    /**
     * @dev Get winning options
     */
    function getWinningOptions() external view returns (uint256[] memory) {
        return winningOptions;
    }
    
    /**
     * @dev Check if an option is winning
     */
    function isWinningOption(uint256 _option) external view returns (bool) {
        for (uint256 i = 0; i < winningOptions.length; i++) {
            if (winningOptions[i] == _option) {
                return true;
            }
        }
        return false;
    }
}`;

  // Save the flattened contract
  const verifyDir = path.join(__dirname, '../verification-info');
  if (!fs.existsSync(verifyDir)) {
    fs.mkdirSync(verifyDir);
  }
  
  fs.writeFileSync(path.join(verifyDir, 'Poll-Flattened-Manual.sol'), content);
  console.log('✅ Created Poll-Flattened-Manual.sol');
  
  // Create constructor arguments for each poll
  const pollConstructorArgs = {
    "0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677": [
      "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6", // factory
      "0x8982f9B71640aDf1F491F6Bf0D12CC40d42991E3", // creator
      "1736138823", // startTime (example, needs actual value)
      "1736139123", // endTime (example, needs actual value)
      "1000000", // tokensPerVote (1 USDC)
      "2", // winningOptionsCount
      "4", // totalOptionsCount
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // USDC address
    ]
  };
  
  // Encode constructor arguments
  const ethers = require('ethers');
  const abiCoder = new ethers.AbiCoder();
  
  for (const [address, args] of Object.entries(pollConstructorArgs)) {
    const encoded = abiCoder.encode(
      ["address", "address", "uint256", "uint256", "uint256", "uint256", "uint256", "address"],
      args
    );
    
    console.log(`\nConstructor args for ${address}:`);
    console.log(encoded.slice(2)); // Remove 0x prefix
  }
}

// Create verification instructions
function createVerificationInstructions() {
  const instructions = `# Manual Verification Steps for Poll Contracts

## BaseScan Verification Process

### Step 1: Prepare Information
- Contract: Poll.sol
- Compiler: v0.8.24+commit.e11b9ed9
- Optimization: Yes, 200 runs
- License: MIT

### Step 2: For Each Poll Contract

1. Go to: https://sepolia.basescan.org/verifyContract
2. Enter the poll contract address
3. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.24+commit.e11b9ed9
   - Open Source License Type: MIT License (MIT)
4. Copy and paste the contents of \`Poll-Flattened-Manual.sol\`
5. Set Optimization: Yes with 200 runs
6. For Constructor Arguments, use the encoded values provided below

### Constructor Arguments (ABI-encoded)

These are the constructor arguments for each poll contract, already ABI-encoded:

Poll 1 (0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc):
\`\`\`
[Constructor args will be generated by the script]
\`\`\`

Poll 2 (0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43):
\`\`\`
[Constructor args will be generated by the script]
\`\`\`

### Alternative: Using Remix

1. Open https://remix.ethereum.org
2. Create new file: Poll.sol
3. Paste the flattened contract
4. Compile with:
   - Compiler: 0.8.24
   - Optimization: 200 runs
5. Use the "Verify & Publish" plugin

### If Verification Fails

1. Check that the compiler version matches exactly
2. Ensure optimization settings are correct (200 runs)
3. Try using the Remix IDE verification plugin
4. Contact BaseScan support with deployment transaction hash
`;

  const verifyDir = path.join(__dirname, '../verification-info');
  fs.writeFileSync(path.join(verifyDir, 'VERIFICATION_INSTRUCTIONS.md'), instructions);
  console.log('✅ Created VERIFICATION_INSTRUCTIONS.md');
}

async function main() {
  console.log('📋 Creating flattened contracts for verification...\n');
  
  createFlattenedPoll();
  createVerificationInstructions();
  
  console.log('\n✅ Verification files created in /verification-info/');
  console.log('\n📁 Next steps:');
  console.log('1. Use Poll-Flattened-Manual.sol for verification');
  console.log('2. Follow VERIFICATION_INSTRUCTIONS.md');
  console.log('3. Visit https://sepolia.basescan.org/verifyContract');
}

main().catch(console.error);