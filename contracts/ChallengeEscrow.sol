// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract ChallengeEscrow {
    using SafeERC20 for IERC20;

    enum WagerStatus {
        None,
        Created,
        Accepted,
        Resolved,
        Refunded,
        Disputed
    }

    struct Wager {
        address creator;
        address opponent;
        address token;
        uint256 stake;
        uint64 createdAt;
        uint64 acceptedAt;
        uint64 responseWindow;
        WagerStatus status;
        string title;
        string details;
        address creatorWinnerVote;
        address opponentWinnerVote;
        bool creatorTieVote;
        bool opponentTieVote;
    }

    uint256 public wagerCount;
    mapping(uint256 => Wager) public wagers;

    event WagerCreated(uint256 indexed wagerId, address indexed creator, address indexed opponent, address token, uint256 stake, uint64 responseWindow, string title);
    event WagerAccepted(uint256 indexed wagerId, address indexed opponent);
    event WinnerConfirmed(uint256 indexed wagerId, address indexed participant, address indexed winner);
    event TieConfirmed(uint256 indexed wagerId, address indexed participant);
    event WagerResolved(uint256 indexed wagerId, address indexed winner, uint256 amount);
    event WagerRefunded(uint256 indexed wagerId);
    event WagerDisputed(uint256 indexed wagerId, address indexed triggeredBy);

    error InvalidStake();
    error InvalidParticipant();
    error InvalidStatus();
    error Unauthorized();
    error SameParticipant();
    error TransferFailed();
    error InvalidWinner();
    error TooEarly();
    error WagerNotFound();

    function createWager(
        address opponent,
        address token,
        uint256 stake,
        uint64 responseWindow,
        string calldata title,
        string calldata details
    ) external returns (uint256 wagerId) {
        if (stake == 0) revert InvalidStake();
        if (opponent == address(0) || token == address(0)) revert InvalidParticipant();
        if (opponent == msg.sender) revert SameParticipant();
        if (responseWindow < 1 hours) revert TooEarly();

        wagerId = ++wagerCount;
        Wager storage wager = wagers[wagerId];
        wager.creator = msg.sender;
        wager.opponent = opponent;
        wager.token = token;
        wager.stake = stake;
        wager.createdAt = uint64(block.timestamp);
        wager.responseWindow = responseWindow;
        wager.status = WagerStatus.Created;
        wager.title = title;
        wager.details = details;

        IERC20(token).safeTransferFrom(msg.sender, address(this), stake);

        emit WagerCreated(wagerId, msg.sender, opponent, token, stake, responseWindow, title);
    }

    function acceptWager(uint256 wagerId) external {
        Wager storage wager = _getExistingWager(wagerId);
        if (wager.status != WagerStatus.Created) revert InvalidStatus();
        if (msg.sender != wager.opponent) revert Unauthorized();
        if (block.timestamp > wager.createdAt + wager.responseWindow) revert TooEarly();

        wager.acceptedAt = uint64(block.timestamp);
        wager.status = WagerStatus.Accepted;

        IERC20(wager.token).safeTransferFrom(msg.sender, address(this), wager.stake);

        emit WagerAccepted(wagerId, msg.sender);
    }

    function confirmWinner(uint256 wagerId, address winner) external {
        Wager storage wager = _getExistingWager(wagerId);
        if (wager.status != WagerStatus.Accepted && wager.status != WagerStatus.Disputed) revert InvalidStatus();
        _requireParticipant(wager, msg.sender);
        if (winner != wager.creator && winner != wager.opponent) revert InvalidWinner();

        if (msg.sender == wager.creator) {
            wager.creatorWinnerVote = winner;
            wager.creatorTieVote = false;
        } else {
            wager.opponentWinnerVote = winner;
            wager.opponentTieVote = false;
        }

        if (wager.status != WagerStatus.Disputed) {
            wager.status = WagerStatus.Accepted;
        }

        emit WinnerConfirmed(wagerId, msg.sender, winner);

        if (wager.creatorWinnerVote != address(0) && wager.creatorWinnerVote == wager.opponentWinnerVote) {
            wager.status = WagerStatus.Resolved;
            IERC20(wager.token).safeTransfer(winner, wager.stake * 2);
            emit WagerResolved(wagerId, winner, wager.stake * 2);
            return;
        }

        if (
            wager.creatorWinnerVote != address(0) &&
            wager.opponentWinnerVote != address(0) &&
            wager.creatorWinnerVote != wager.opponentWinnerVote
        ) {
            wager.status = WagerStatus.Disputed;
            emit WagerDisputed(wagerId, msg.sender);
        }
    }

    function confirmTie(uint256 wagerId) external {
        Wager storage wager = _getExistingWager(wagerId);
        if (wager.status != WagerStatus.Accepted && wager.status != WagerStatus.Disputed) revert InvalidStatus();
        _requireParticipant(wager, msg.sender);

        if (msg.sender == wager.creator) {
            wager.creatorTieVote = true;
            wager.creatorWinnerVote = address(0);
        } else {
            wager.opponentTieVote = true;
            wager.opponentWinnerVote = address(0);
        }

        emit TieConfirmed(wagerId, msg.sender);

        if (wager.creatorTieVote && wager.opponentTieVote) {
            wager.status = WagerStatus.Refunded;
            IERC20(wager.token).safeTransfer(wager.creator, wager.stake);
            IERC20(wager.token).safeTransfer(wager.opponent, wager.stake);
            emit WagerRefunded(wagerId);
            return;
        }

        if (
            (wager.creatorTieVote && wager.opponentWinnerVote != address(0)) ||
            (wager.opponentTieVote && wager.creatorWinnerVote != address(0))
        ) {
            wager.status = WagerStatus.Disputed;
            emit WagerDisputed(wagerId, msg.sender);
        }
    }

    function claimTimeoutRefund(uint256 wagerId) external {
        Wager storage wager = _getExistingWager(wagerId);
        _requireParticipant(wager, msg.sender);

        if (wager.status == WagerStatus.Created) {
            if (block.timestamp <= wager.createdAt + wager.responseWindow) revert TooEarly();
            wager.status = WagerStatus.Refunded;
            IERC20(wager.token).safeTransfer(wager.creator, wager.stake);
            emit WagerRefunded(wagerId);
            return;
        }

        if (wager.status == WagerStatus.Accepted || wager.status == WagerStatus.Disputed) {
            if (block.timestamp <= wager.acceptedAt + wager.responseWindow) revert TooEarly();
            wager.status = WagerStatus.Refunded;
            IERC20(wager.token).safeTransfer(wager.creator, wager.stake);
            IERC20(wager.token).safeTransfer(wager.opponent, wager.stake);
            emit WagerRefunded(wagerId);
            return;
        }

        revert InvalidStatus();
    }

    function escalateDispute(uint256 wagerId) external {
        Wager storage wager = _getExistingWager(wagerId);
        if (wager.status != WagerStatus.Accepted) revert InvalidStatus();
        _requireParticipant(wager, msg.sender);
        if (block.timestamp <= wager.acceptedAt + wager.responseWindow) revert TooEarly();
        wager.status = WagerStatus.Disputed;
        emit WagerDisputed(wagerId, msg.sender);
    }

    function getWager(uint256 wagerId) external view returns (Wager memory) {
        return _getExistingWager(wagerId);
    }

    function _requireParticipant(Wager storage wager, address account) internal view {
        if (account != wager.creator && account != wager.opponent) revert Unauthorized();
    }

    function _getExistingWager(uint256 wagerId) internal view returns (Wager storage wager) {
        wager = wagers[wagerId];
        if (wager.creator == address(0)) revert WagerNotFound();
    }
}
