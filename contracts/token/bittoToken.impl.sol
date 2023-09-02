// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./bittoToken.storage.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract ERC20Impl is ERC20Upgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, OwnableUpgradeable, AccessControlUpgradeable, bittoTokenstorage {

    // ReentrancyGuardUpgradeable: 함수 호출 간에 다시 들어올 수 있는 재진입(reentrancy)을 방지하는 보안 기능, 해당 기능을 사용하려는 함수에 nonReentrant 한정자를 추가
    // PausableUpgradeable: 일시 중지 및 해제 기능을 제공, _pause() 및 _unpause() 내부 함수를 통해 해당 기능을 구현할 수 있으며, 함수는 컨트랙트 소유자만이 호출할 수 있다
    // OwnableUpgradeable: 컨트랙트 소유자를 설정하고 관리하는 기능을 제공. _transferOwnership(address) 함수를 사용하여 소유자를 변경할 수 있다. 소유자만 호출할 수 있는 함수에 'onlyOwner' 한정자를 추가.
    // AccessControlUpgradeable: 다양한 역할을 정의하고 역할별 권한을 관리. 역할 할당 및 위임을 위해 _setupRole(bytes32, address) 함수를 사용할 수 있다. 특정 역할이 있는 계정만 호출할 수 있는 함수에 'onlyRole(bytes32)' 한정자를 추가.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // 초기화 함수: 컨트랙트 생성 후 한 번만 호출되어야 한다.
    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _roleAdmin
    ) public initializer {
        __ERC20_init(name, symbol);          // ERC20 토큰 초기화
        __ReentrancyGuard_init();            // ReentrancyGuard 초기화
        __Pausable_init();                   // Pausable 초기화
        __Ownable_init();                    // Ownable 초기화
        __AccessControl_init();              // AccessControl 초기화

        _mint(_msgSender(), initialSupply);  // 발행자에게 초기 공급량 전송

        // 관리자 및 발행 권한을 부여합니다.
        _setupRole(DEFAULT_ADMIN_ROLE, _roleAdmin);
        _setupRole(MINTER_ROLE, _roleAdmin);
    }

    // 발행(mint) 함수: MINTER_ROLE 권한이 있는 계정만 호출할 수 있습니다.
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // 일시 중지(pause) 함수: 컨트랙트 소유자만 호출 가능합니다.
    function pause() public onlyOwner {
        _pause();
    }

    // 일시 중지 해제(unpause) 함수: 컨트랙트 소유자만 호출 가능합니다.
    function unpause() public onlyOwner {
        _unpause();
    }

    // 토큰 전송 전 호출되는 내부 훅(hook) 함수: Pausable의 paused 상태를 확인합니다.
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal whenNotPaused override {
        super._beforeTokenTransfer(from, to, amount);
    }
}
