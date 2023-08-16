// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


// 3. ERC20TokenStorage - 구조체와 상태 변수를 정의
contract bittoTokenStorage {
    string public name;
    string public symbol;

    address public owner;
    address public implementation;

    mapping(address => uint) public balances;
    mapping(address => mapping(address => uint)) public allowances;
}