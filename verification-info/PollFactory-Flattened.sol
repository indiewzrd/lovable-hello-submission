// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

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

// Poll contract (imported by PollFactory)
import "./Poll.sol";

/**
 * @title PollFactory
 * @dev Factory contract for deploying Poll contracts
 */
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
    
    // Modifiers
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
    
    /**
     * @dev Deploy a new poll contract
     */
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
    
    /**
     * @dev Set global admin
     */
    function setAdmin(address _newAdmin) external onlyGlobalAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        address oldAdmin = globalAdmin;
        globalAdmin = _newAdmin;
        emit AdminChanged(oldAdmin, _newAdmin);
    }
    
    /**
     * @dev Set rescue wallet
     */
    function setRescueWallet(address _newWallet) external onlyGlobalAdmin {
        require(_newWallet != address(0), "Invalid rescue wallet");
        address oldWallet = rescueWallet;
        rescueWallet = _newWallet;
        emit RescueWalletChanged(oldWallet, _newWallet);
    }
    
    /**
     * @dev Set fee wallet
     */
    function setFeeWallet(address _newWallet) external onlyGlobalAdmin {
        require(_newWallet != address(0), "Invalid fee wallet");
        address oldWallet = feeWallet;
        feeWallet = _newWallet;
        emit FeeWalletChanged(oldWallet, _newWallet);
    }
    
    /**
     * @dev Set fee percentage
     */
    function setFeePercentage(uint256 _newFee) external onlyGlobalAdmin {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = feePercentage;
        feePercentage = _newFee;
        emit FeePercentageChanged(oldFee, _newFee);
    }
    
    /**
     * @dev Get all deployed polls
     */
    function getDeployedPolls() external view returns (address[] memory) {
        return deployedPolls;
    }
    
    /**
     * @dev Get polls by creator
     */
    function getPollsByCreator(address _creator) external view returns (address[] memory) {
        return creatorPolls[_creator];
    }
}