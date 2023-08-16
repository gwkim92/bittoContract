// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./bittoTokenStorage.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract bittoTokenLogic is bittoTokenStorage, IERC20, ReentrancyGuardUpgradeable, PausableUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    // 컨트랙트 초기화 함수
    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        __Ownable_init();
        __AccessControl_init();

        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply * 10**decimals;
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function balanceOf(address account)
        external
        view
        override
        returns (uint256)
    {
        return balances[account];
    }

    // 일시정지 상태에서 실행되지 않도록 whenNotPaused 추가
    function transfer(address recipient, uint256 amount)
        external
        override
        whenNotPaused
        returns (bool)
    {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender)
        external
        view
        override
        returns (uint256)
    {
        return allowances[owner][spender];
    }

    // 일시정지 상태에서 실행되지 않도록 whenNotPaused 추가
    function approve(address spender, uint256 amount)
        external
        override
        whenNotPaused
        returns (bool)
    {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    // 일시정지 상태에서 실행되지 않도록 whenNotPaused 추가
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override whenNotPaused returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            allowances[sender][_msgSender()] - amount
        );
        return true;
    }

    // 내부 전송 함수 구현
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        balances[sender] -= amount;
        balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
    }

    // 내부 승인 함수 구현
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    // msg.sender 반환하는 내부 함수 구현
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}
