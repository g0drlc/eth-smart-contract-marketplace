pragma solidity ^0.4.18;

contract MarketPlaceInterface 
{
	function subscribe(bytes32 _dataSourceName) public returns (bool);
	function register(bytes32 _dataSourceName, uint _price, address _dataOwner) public returns (bool);
	function checkAddressSubscription(address _subscriber, bytes32 _dataSourceName) public returns (bool);
	
	event Subscribed(address indexed subscriber,bytes32 indexed dataSourceName, address indexed dataOwner, uint price, bool success);
	event Registered(address indexed dataOwner, bytes32 indexed dataSourceName, uint price, bool success);
	event SubscriptionPaid(address indexed from, address indexed to, uint256 value);
	/* test - delete*/
	event TestLog(address addr1,address addr2, string data);
}