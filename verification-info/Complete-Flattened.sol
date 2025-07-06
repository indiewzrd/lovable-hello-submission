// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// File: @openzeppelin/contracts/token/ERC20/IERC20.sol
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

// File: @openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol
interface IERC20Permit {
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

// File: @openzeppelin/contracts/utils/Address.sol
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

    function verifyCallResultFromTarget(address target, bool success, bytes memory returndata) internal view returns (bytes memory) {
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

// File: @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol
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

// File: @openzeppelin/contracts/utils/Context.sol
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol
abstract contract Ownable is Context {
    address private _owner;

    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: @openzeppelin/contracts/utils/ReentrancyGuard.sol
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

// File: contracts/Poll.sol
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
    mapping(uint256 => uint256) public optionVotes;
    mapping(address => uint256) public voterChoice;
    mapping(address => bool) public hasVoted;
    
    // Winning options
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
        require(msg.sender == PollFactory(factory).admin(), "Only global admin");
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
    
    function vote(uint256 _option) external nonReentrant onlyDuringVoting {
        require(_option > 0 && _option <= totalOptionsCount, "Invalid option");
        require(!hasVoted[msg.sender], "Already voted");
        
        IERC20(votingToken).safeTransferFrom(msg.sender, address(this), tokensPerVote);
        
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _option;
        optionVotes[_option] += tokensPerVote;
        totalVotes += tokensPerVote;
        
        emit Voted(msg.sender, _option, tokensPerVote);
    }
    
    function cancelVote() external nonReentrant onlyDuringVoting {
        require(hasVoted[msg.sender], "Not voted");
        require(!hasClaimedRefund[msg.sender], "Already claimed");
        
        uint256 option = voterChoice[msg.sender];
        
        hasVoted[msg.sender] = false;
        voterChoice[msg.sender] = 0;
        optionVotes[option] -= tokensPerVote;
        totalVotes -= tokensPerVote;
        hasClaimedRefund[msg.sender] = true;
        
        IERC20(votingToken).safeTransfer(msg.sender, tokensPerVote);
        
        emit VoteCancelled(msg.sender, option, tokensPerVote);
    }
    
    function calculateWinners() external onlyAfterVoting {
        require(!winnersCalculated, "Winners already calculated");
        
        uint256[] memory options = new uint256[](totalOptionsCount);
        uint256[] memory votes = new uint256[](totalOptionsCount);
        
        for (uint256 i = 0; i < totalOptionsCount; i++) {
            options[i] = i + 1;
            votes[i] = optionVotes[i + 1];
        }
        
        // Sort by votes (bubble sort)
        for (uint256 i = 0; i < totalOptionsCount - 1; i++) {
            for (uint256 j = 0; j < totalOptionsCount - i - 1; j++) {
                if (votes[j] < votes[j + 1]) {
                    uint256 tempVotes = votes[j];
                    votes[j] = votes[j + 1];
                    votes[j + 1] = tempVotes;
                    
                    uint256 tempOption = options[j];
                    options[j] = options[j + 1];
                    options[j + 1] = tempOption;
                }
            }
        }
        
        for (uint256 i = 0; i < winningOptionsCount && i < totalOptionsCount; i++) {
            if (votes[i] > 0) {
                winningOptions.push(options[i]);
                winningAmount += votes[i];
            }
        }
        
        if (winningAmount > 0) {
            uint256 feePercentage = PollFactory(factory).feePercentage();
            feeAmount = (winningAmount * feePercentage) / 10000;
        }
        
        winnersCalculated = true;
        emit WinnersCalculated(winningOptions, winningAmount);
    }
    
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
    
    function claimFee() external nonReentrant {
        address feeWallet = PollFactory(factory).feeWallet();
        require(msg.sender == feeWallet, "Only fee wallet");
        require(winnersCalculated, "Winners not calculated");
        require(!feeClaimed, "Already claimed");
        require(feeAmount > 0, "No fee to claim");
        
        feeClaimed = true;
        
        IERC20(votingToken).safeTransfer(feeWallet, feeAmount);
        
        emit FeeClaimed(feeWallet, feeAmount);
    }
    
    function claimNonWinningRefund() external nonReentrant {
        require(winnersCalculated, "Winners not calculated");
        require(hasVoted[msg.sender], "Not voted");
        require(!hasClaimedRefund[msg.sender], "Already claimed");
        
        uint256 votedOption = voterChoice[msg.sender];
        bool isWinner = false;
        
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
    
    function rescueFunds() external nonReentrant onlyGlobalAdmin {
        address rescueWallet = PollFactory(factory).rescueWallet();
        uint256 balance = IERC20(votingToken).balanceOf(address(this));
        require(balance > 0, "No funds to rescue");
        
        IERC20(votingToken).safeTransfer(rescueWallet, balance);
        
        emit FundsRescued(rescueWallet, balance);
    }
    
    function getVotingResults() external view returns (uint256[] memory options, uint256[] memory votes) {
        options = new uint256[](totalOptionsCount);
        votes = new uint256[](totalOptionsCount);
        
        for (uint256 i = 0; i < totalOptionsCount; i++) {
            options[i] = i + 1;
            votes[i] = optionVotes[i + 1];
        }
        
        return (options, votes);
    }
    
    function getWinningOptions() external view returns (uint256[] memory) {
        return winningOptions;
    }
    
    function isWinningOption(uint256 _option) external view returns (bool) {
        for (uint256 i = 0; i < winningOptions.length; i++) {
            if (winningOptions[i] == _option) {
                return true;
            }
        }
        return false;
    }
}

// File: contracts/PollFactory.sol
contract PollFactory is Ownable {
    // Global settings
    address public globalAdmin;
    address public rescueWallet;
    address public feeWallet;
    uint256 public feePercentage; // Basis points (10000 = 100%)
    
    // Tracking
    address[] public deployedPolls;
    mapping(address => address[]) public creatorPolls;
    mapping(address => bool) public isPoll;
    
    // Renamed admin to globalAdmin for clarity
    function admin() external view returns (address) {
        return globalAdmin;
    }
    
    // Events
    event PollCreated(
        address indexed poll,
        address indexed creator,
        uint256 startTime,
        uint256 endTime
    );
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event RescueWalletChanged(address indexed oldWallet, address indexed newWallet);
    event FeeWalletChanged(address indexed oldWallet, address indexed newWallet);
    event FeePercentageChanged(uint256 oldFee, uint256 newFee);
    
    modifier onlyGlobalAdmin() {
        require(msg.sender == globalAdmin, "Only global admin");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        globalAdmin = msg.sender;
        rescueWallet = msg.sender;
        feeWallet = msg.sender;
        feePercentage = 500; // Default 5% fee
    }
    
    function deployPoll(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokensPerVote,
        uint256 _winningOptionsCount,
        uint256 _totalOptionsCount,
        address _tokenAddress
    ) external returns (address) {
        require(_startTime > block.timestamp, "Start time must be in future");
        require(_endTime > _startTime, "End time must be after start time");
        require(_tokensPerVote > 0, "Tokens per vote must be greater than 0");
        require(_winningOptionsCount > 0 && _winningOptionsCount <= _totalOptionsCount, "Invalid winning options count");
        require(_totalOptionsCount > 0, "Total options must be greater than 0");
        require(_tokenAddress != address(0), "Invalid token address");
        
        Poll newPoll = new Poll(
            address(this),
            msg.sender,
            _startTime,
            _endTime,
            _tokensPerVote,
            _winningOptionsCount,
            _totalOptionsCount,
            _tokenAddress
        );
        
        address pollAddress = address(newPoll);
        deployedPolls.push(pollAddress);
        creatorPolls[msg.sender].push(pollAddress);
        isPoll[pollAddress] = true;
        
        emit PollCreated(pollAddress, msg.sender, _startTime, _endTime);
        
        return pollAddress;
    }
    
    function setAdmin(address _newAdmin) external onlyGlobalAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        address oldAdmin = globalAdmin;
        globalAdmin = _newAdmin;
        emit AdminChanged(oldAdmin, _newAdmin);
    }
    
    function setRescueWallet(address _newWallet) external onlyGlobalAdmin {
        require(_newWallet != address(0), "Invalid rescue wallet");
        address oldWallet = rescueWallet;
        rescueWallet = _newWallet;
        emit RescueWalletChanged(oldWallet, _newWallet);
    }
    
    function setFeeWallet(address _newWallet) external onlyGlobalAdmin {
        require(_newWallet != address(0), "Invalid fee wallet");
        address oldWallet = feeWallet;
        feeWallet = _newWallet;
        emit FeeWalletChanged(oldWallet, _newWallet);
    }
    
    function setFeePercentage(uint256 _newFee) external onlyGlobalAdmin {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = feePercentage;
        feePercentage = _newFee;
        emit FeePercentageChanged(oldFee, _newFee);
    }
    
    function getDeployedPolls() external view returns (address[] memory) {
        return deployedPolls;
    }
    
    function getPollsByCreator(address _creator) external view returns (address[] memory) {
        return creatorPolls[_creator];
    }
}