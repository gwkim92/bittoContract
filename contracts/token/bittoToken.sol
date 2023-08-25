// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

// import "bitto-contract/node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "bitto-contract/node_modules/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";


contract ERC20Proxy is TransparentUpgradeableProxy {
    constructor(address _logic, address _admin, bytes memory _data) TransparentUpgradeableProxy(_logic, _admin, _data) {
    }
     function getAdmin() public view returns (address) {
        return _admin();
    }

    function getImplementation() public view returns (address) {
        return _implementation();
    }
}
