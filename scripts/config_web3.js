let EnigmaABI = require("../build/contracts/EnigmaToken.json");
let MarketPlaceABI = require ("../build/contracts/RecoverableMarketplace.json");
let contract = require('truffle-contract');
// contracts
let EnigmaContract = contract(EnigmaABI);
let MarketPlaceContract = contract(MarketPlaceABI);
// Web3
let Web3 = require('web3');
let provider = new Web3.providers.HttpProvider("http://localhost:9545"); //8545 // 9545
let web3 = new Web3(provider);
EnigmaContract.setProvider(provider);
MarketPlaceContract.setProvider(provider);

module.exports.enigma = function(){return EnigmaContract.deployed();}
module.exports.marketPlace = function(){return MarketPlaceContract.deployed();}
module.exports.web3= web3;
module.exports.EnigmaContract = EnigmaContract;
module.exports.MarketPlaceContract = MarketPlaceContract;