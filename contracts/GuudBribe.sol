// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GuudBribe
 * @notice Contract for distributing ERC-20 tokens to leaderboard users
 * @dev Allows users to bribe single or multiple recipients with equal token distribution
 * 
 * Flow:
 * 1. User approves this contract to spend their tokens
 * 2. User calls bribeSingle() or bribeBatch() to distribute tokens
 * 3. Tokens are transferred from sender to recipients equally
 */
contract GuudBribe is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Events ============
    
    /// @notice Emitted when a single bribe is sent
    event BribeSent(
        address indexed sender,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        string message
    );

    /// @notice Emitted when a batch bribe is sent
    event BatchBribeSent(
        address indexed sender,
        address indexed token,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 amountPerRecipient,
        string message
    );

    /// @notice Emitted when a token is whitelisted/removed
    event TokenWhitelistUpdated(address indexed token, bool status);

    /// @notice Emitted when max recipients is updated
    event MaxRecipientsUpdated(uint256 oldMax, uint256 newMax);

    /// @notice Emitted when min amount per recipient is updated
    event MinAmountPerRecipientUpdated(uint256 oldMin, uint256 newMin);

    /// @notice Emitted when fee percentage is updated
    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when enforce whitelist is updated
    event EnforceWhitelistUpdated(bool oldValue, bool newValue);

    /// @notice Emitted when fee recipient is updated
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // ============ State Variables ============

    /// @notice Hard cap for maximum recipients (gas safety)
    uint256 public constant MAX_RECIPIENTS_HARD_CAP = 1000;

    /// @notice Maximum number of recipients in a single batch
    uint256 public maxRecipients;

    /// @notice Minimum amount per recipient (to prevent dust attacks)
    uint256 public minAmountPerRecipient;

    /// @notice Whitelisted tokens (optional - if empty, all tokens allowed)
    mapping(address => bool) public whitelistedTokens;

    /// @notice Whether token whitelist is enforced
    bool public enforceWhitelist;

    /// @notice Total bribes sent per token
    mapping(address => uint256) public totalBribesByToken;

    /// @notice Total bribes sent per sender
    mapping(address => uint256) public totalBribesBySender;

    /// @notice Fee percentage (in basis points, 100 = 1%)
    uint256 public feePercentage;

    /// @notice Fee recipient address
    address public feeRecipient;

    // ============ Errors ============

    error ZeroAddress();
    error ZeroAmount();
    error EmptyRecipients();
    error TooManyRecipients(uint256 provided, uint256 max);
    error TokenNotWhitelisted(address token);
    error InsufficientBalance(uint256 required, uint256 available);
    error InsufficientAllowance(uint256 required, uint256 available);
    error AmountPerRecipientTooLow(uint256 provided, uint256 minimum);
    error InvalidFeePercentage(uint256 provided);
    error DuplicateRecipient(address recipient);
    error CannotBribeSelf();
    error InvalidMaxRecipients(uint256 provided, uint256 max);

    // ============ Constructor ============

    constructor(
        uint256 _maxRecipients,
        uint256 _minAmountPerRecipient,
        address _feeRecipient,
        uint256 _feePercentage
    ) Ownable(msg.sender) {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        if (_feePercentage > 1000) revert InvalidFeePercentage(_feePercentage); // Max 10%
        if (_maxRecipients > MAX_RECIPIENTS_HARD_CAP) {
            revert InvalidMaxRecipients(_maxRecipients, MAX_RECIPIENTS_HARD_CAP);
        }

        maxRecipients = _maxRecipients;
        minAmountPerRecipient = _minAmountPerRecipient;
        feeRecipient = _feeRecipient;
        feePercentage = _feePercentage;
        enforceWhitelist = false;
    }

    // ============ External Functions ============

    /**
     * @notice Send bribe to a single recipient
     * @param token ERC-20 token address
     * @param recipient Recipient wallet address
     * @param amount Total amount to send
     * @param message Optional message for the bribe
     */
    function bribeSingle(
        address token,
        address recipient,
        uint256 amount,
        string calldata message
    ) external nonReentrant whenNotPaused {
        // Validations
        if (token == address(0)) revert ZeroAddress();
        if (recipient == address(0)) revert ZeroAddress();
        if (recipient == msg.sender) revert CannotBribeSelf();
        if (amount == 0) revert ZeroAmount();
        if (enforceWhitelist && !whitelistedTokens[token]) {
            revert TokenNotWhitelisted(token);
        }

        IERC20 tokenContract = IERC20(token);

        // Check balance and allowance
        uint256 senderBalance = tokenContract.balanceOf(msg.sender);
        if (senderBalance < amount) {
            revert InsufficientBalance(amount, senderBalance);
        }

        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert InsufficientAllowance(amount, allowance);
        }

        // Calculate fee
        uint256 fee = (amount * feePercentage) / 10000;
        uint256 amountAfterFee = amount - fee;

        // Transfer tokens
        tokenContract.safeTransferFrom(msg.sender, recipient, amountAfterFee);
        
        // Transfer fee if applicable
        if (fee > 0) {
            tokenContract.safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        // Update stats
        totalBribesByToken[token] += amount;
        totalBribesBySender[msg.sender] += amount;

        emit BribeSent(msg.sender, recipient, token, amountAfterFee, message);
    }

    /**
     * @notice Send bribe to multiple recipients with equal distribution
     * @param token ERC-20 token address
     * @param recipients Array of recipient wallet addresses
     * @param totalAmount Total amount to distribute equally
     * @param message Optional message for the bribe
     * 
     * @dev Example: 100 recipients, 100 tokens = 1 token each
     */
    function bribeBatch(
        address token,
        address[] calldata recipients,
        uint256 totalAmount,
        string calldata message
    ) external nonReentrant whenNotPaused {
        // Validations
        if (token == address(0)) revert ZeroAddress();
        if (recipients.length == 0) revert EmptyRecipients();
        if (recipients.length > maxRecipients) {
            revert TooManyRecipients(recipients.length, maxRecipients);
        }
        if (totalAmount == 0) revert ZeroAmount();
        if (enforceWhitelist && !whitelistedTokens[token]) {
            revert TokenNotWhitelisted(token);
        }

        // Check for duplicate recipients and validate addresses
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (recipients[i] == msg.sender) revert CannotBribeSelf();
            for (uint256 j = i + 1; j < recipients.length; j++) {
                if (recipients[i] == recipients[j]) {
                    revert DuplicateRecipient(recipients[i]);
                }
            }
        }

        // Calculate fee from total amount first (fixes rounding issue)
        uint256 totalFee = (totalAmount * feePercentage) / 10000;
        uint256 amountAfterFee = totalAmount - totalFee;
        
        // Calculate amount per recipient from remaining amount
        uint256 amountPerRecipient = amountAfterFee / recipients.length;
        if (amountPerRecipient < minAmountPerRecipient) {
            revert AmountPerRecipientTooLow(amountPerRecipient, minAmountPerRecipient);
        }

        // Recalculate actual amounts to avoid dust
        uint256 actualDistributed = amountPerRecipient * recipients.length;
        uint256 actualTotal = actualDistributed + totalFee;

        IERC20 tokenContract = IERC20(token);

        // Check balance and allowance
        uint256 senderBalance = tokenContract.balanceOf(msg.sender);
        if (senderBalance < actualTotal) {
            revert InsufficientBalance(actualTotal, senderBalance);
        }

        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        if (allowance < actualTotal) {
            revert InsufficientAllowance(actualTotal, allowance);
        }

        // Transfer to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenContract.safeTransferFrom(msg.sender, recipients[i], amountPerRecipient);
        }

        // Transfer total fee if applicable
        if (totalFee > 0) {
            tokenContract.safeTransferFrom(msg.sender, feeRecipient, totalFee);
        }

        // Update stats
        totalBribesByToken[token] += actualTotal;
        totalBribesBySender[msg.sender] += actualTotal;

        emit BatchBribeSent(
            msg.sender,
            token,
            actualTotal,
            recipients.length,
            amountPerRecipient,
            message
        );
    }

    /**
     * @notice Estimate bribe distribution
     * @param recipientCount Number of recipients
     * @param totalAmount Total amount to distribute
     * @return amountPerRecipient Amount each recipient will receive (after fee)
     * @return totalFee Total fee amount
     * @return actualTotal Actual total that will be spent
     */
    function estimateBribe(
        uint256 recipientCount,
        uint256 totalAmount
    ) external view returns (
        uint256 amountPerRecipient,
        uint256 totalFee,
        uint256 actualTotal
    ) {
        if (recipientCount == 0) return (0, 0, 0);
        
        // Calculate fee from total first
        totalFee = (totalAmount * feePercentage) / 10000;
        uint256 amountAfterFee = totalAmount - totalFee;
        
        // Calculate per recipient from remainder
        amountPerRecipient = amountAfterFee / recipientCount;
        uint256 actualDistributed = amountPerRecipient * recipientCount;
        actualTotal = actualDistributed + totalFee;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update maximum recipients allowed in batch
     */
    function setMaxRecipients(uint256 _maxRecipients) external onlyOwner {
        if (_maxRecipients > MAX_RECIPIENTS_HARD_CAP) {
            revert InvalidMaxRecipients(_maxRecipients, MAX_RECIPIENTS_HARD_CAP);
        }
        emit MaxRecipientsUpdated(maxRecipients, _maxRecipients);
        maxRecipients = _maxRecipients;
    }

    /**
     * @notice Update minimum amount per recipient
     */
    function setMinAmountPerRecipient(uint256 _minAmount) external onlyOwner {
        emit MinAmountPerRecipientUpdated(minAmountPerRecipient, _minAmount);
        minAmountPerRecipient = _minAmount;
    }

    /**
     * @notice Add/remove token from whitelist
     */
    function setTokenWhitelist(address token, bool status) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        whitelistedTokens[token] = status;
        emit TokenWhitelistUpdated(token, status);
    }

    /**
     * @notice Enable/disable whitelist enforcement
     */
    function setEnforceWhitelist(bool _enforce) external onlyOwner {
        emit EnforceWhitelistUpdated(enforceWhitelist, _enforce);
        enforceWhitelist = _enforce;
    }

    /**
     * @notice Update fee percentage (in basis points)
     * @param _feePercentage New fee percentage (100 = 1%, max 1000 = 10%)
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        if (_feePercentage > 1000) revert InvalidFeePercentage(_feePercentage);
        emit FeePercentageUpdated(feePercentage, _feePercentage);
        feePercentage = _feePercentage;
    }

    /**
     * @notice Update fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw stuck tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Check if user can bribe with given parameters
     */
    function canBribe(
        address sender,
        address token,
        uint256 amount
    ) external view returns (bool canExecute, string memory reason) {
        if (paused()) return (false, "Contract is paused");
        if (token == address(0)) return (false, "Invalid token address");
        if (amount == 0) return (false, "Amount must be greater than 0");
        if (enforceWhitelist && !whitelistedTokens[token]) {
            return (false, "Token not whitelisted");
        }

        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(sender);
        if (balance < amount) return (false, "Insufficient balance");

        uint256 allowance = tokenContract.allowance(sender, address(this));
        if (allowance < amount) return (false, "Insufficient allowance");

        return (true, "");
    }

    /**
     * @notice Get bribe stats
     */
    function getBribeStats(address token, address sender) external view returns (
        uint256 totalForToken,
        uint256 totalForSender
    ) {
        return (totalBribesByToken[token], totalBribesBySender[sender]);
    }
}
