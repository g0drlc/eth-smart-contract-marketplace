# Enigma Data Marketplace Smart Contract

The documentation for the Enigma Data Marketplace Smart Contract is available at https://enigmampc.github.io/marketplace/smart-contract.html.

The contract is made out of few smaller contracts. The api is split between 3 interfaces with full documentation:

1. https://github.com/enigmampc/smart_contract_marketplace/blob/master/contracts/IBasicMarketplace.sol
2. https://github.com/enigmampc/smart_contract_marketplace/blob/master/contracts/IMarketplace.sol
3. https://github.com/enigmampc/smart_contract_marketplace/blob/master/contracts/IRecoverableMarketplace.sol

## Getting Started

### Prerequisites

- Ganache test network (optional)
- Unix supporting OS.
- solc compiler 
- nodeJS
- Truffle

### Installing

NodeJS

```
sudo apt-get update && sudo apt-get -y upgrade
sudo apt-get -y install curl git vim build-essential
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g express
```

Truffle

```
sudo npm install -g truffle
```


## Running the tests

The tests has to be deployed with an ERC20 Token, the original implementation is in /contracts/token.
Due to that, the tokens are deployed as well in the migration file.
There are 2 different tests:

1. Marketplace_Basic.js

2. Marketplace_System_Test.js

Each of the tests can be set to run with the Mock contract (i.e TestableMock.sol) or with the original.

To run Truffle tests


```
$ truffle develop
truffle(develop)> test
```


## Deployment

Migration is made with /migrations/3_deploy_conracts.js

There is an example of the ABI and deployment with pure Web3 that can be found in /scripts/deploy_contract.js

### Compiling

```
truffle compile
```
### Migration

Use with --reset flag for restarting migrations.

```
truffle migrate 
```
### Examples:

Web3 connection:


```node

let EnigmaABI = require("../build/contracts/EnigmaToken.json");
let MarketPlaceABI = require ("../build/contracts/RecoverableMarketplace.json");
let contract = require('truffle-contract');
// contracts
let EnigmaContract = contract(EnigmaABI);
let MarketPlaceContract = contract(MarketPlaceABI);
// Web3
let Web3 = require('web3');
let provider = new Web3.providers.HttpProvider("http://localhost:8545"); //8545 // 9545
let web3 = new Web3(provider);
EnigmaContract.setProvider(provider);
MarketPlaceContract.setProvider(provider);

module.exports.web3= web3;
module.exports.EnigmaContract = EnigmaContract;
module.exports.MarketPlaceContract = MarketPlaceContract;

```
Synchronous Example of Registration and then Subscription.
The initial balance transfer is only for the test.

```node

const utils = require("./utils");
const config = require("./config_web3");
const web3 = config.web3;
const EnigmaContract = config.EnigmaContract;
const MarketPlaceContract = config.MarketPlaceContract;

let gas = 740000; // some gas limit
let theOwner = web3.eth.accounts[0];

// provider 
var _provider = {};
_provider.address = web3.eth.accounts[1];
_provider.dataName = "Data1";
_provider.price = 1500;

//subscriber 
var _subscriber = {};
_subscriber.address = web3.eth.accounts[2];

async function transfer(from,to,amount){
	let enigma = await EnigmaContract.deployed();
	let tx = await enigma.transfer(to,amount,{from:from});
	return tx;
}

async function register(provider){
	let marketPlace = await MarketPlaceContract.deployed();	
	let enigma = await EnigmaContract.deployed();
	let version = await marketPlace.MARKETPLACE_VERSION.call();
	// register probider 
	let reg_tx = await marketPlace.register(provider.dataName,provider.price,provider.address,{from:provider.address,gas:gas});
	// validate
	let providerInfo = await marketPlace.getDataProviderInfo.call(provider.dataName);
	return providerInfo;
}

async function subscribe(provider,subscriber){
	let marketPlace = await MarketPlaceContract.deployed();	
	let enigma = await EnigmaContract.deployed();
	// #1 approve the marketPlace as a spender in EnigmaToken 
	let tx_app = await enigma.approve(marketPlace.address,provider.price,{from:subscriber.address,gas:gas});
	// validate allowed amount 
	let allowed = await enigma.allowance.call(subscriber.address,marketPlace.address); 
	console.log(allowed.toNumber());
	// #2 subscribe to marketPlace
	let tx_sub = await marketPlace.subscribe(provider.dataName,{from:subscriber.address,gas:gas});
	//validate subscription // subscriber,dataSourceName,price,startTime,endTime,isUnExpired,isPaid,isPunishedProvider,isOrder
	let subInfo = await marketPlace.checkAddressSubscription.call(subscriber.address,provider.dataName);
	
}

// registration + subscription
transfer(theOwner,_subscriber.address,_provider.price).then(tx=>{
	register(_provider).then(info=>{
		subscribe(_provider,_subscriber);
	});
});

```

In order to get all the providers list and their info one could use the following sample: 
(Note: the return param documentation can be found inside /IBasicMarketplace.sol or the documentation site mentioned above)

```node
// get all providers + their info (provider[0] = 0x0 just an indicator)
async function getAllProviders(){
	let providerInfo = [];
	let marketPlace = await MarketPlaceContract.deployed();	
	let providers = await marketPlace.getAllProviders.call();
	for(var i in providers){
		let info = await marketPlace.getDataProviderInfo.call(web3.toAscii(providers[i]));
		providerInfo.push({name: providers[i], info: info});
	}
	return providerInfo;
}

getAllProviders().then(providers=>{
	// full list with details provider data.
});
```


Asynchronous examples:

To register a data source.

```node
	var price = 100;
	var owner = web3.eth.accounts[0];
	var deployer = web3.eth.accounts[0];
	var gasLimit = 999999; // some gas limit
	marketPlace().then((instance)=>{
		contract = instance;
		return contract.register('data name',price,owner,{from:deployer,gas:gasLimit});
	});
```

Listen to Blockchain events:

```node
  marketPlace().then(instance=>{
	eventRegistered = instance.Registered(); // => add filters Registered({from:, price:})
	eventRegistered.watch((err,eventResult)=>{
		// handle events...
		// bytes to ascii
		var name = web3.toAscii(eventResult.args.dataSourceName);
		// stop watching for events.
		eventRegistered.stopWatching(); 
	});
  });
```
Approve the ERC20 token contract as a spender on behalf of X:
Trigers Approval() event.

```node
	var allowance = 100;
	var subscriber = web3.eth.accounts[0];
	var gas = 99999;
	marketPlace().
	then(instance=>{mp = instance;return enigma();}).
		then((instance)=>{ eng = instance; return eng.approve(mp.address,allowance,{from:subscriber,gas:gas})}).
			then(txRecipt=>{ // tx recipt ...});
```

allowance() and transferFrom() functions are encapsulated inside Marketplace, an internal safeTransfer() function 

will run the payment process and trigger a SubscriptionPaid() event. 


```node
    function safeToMarketPlaceTransfer(address _from, address _to, uint256 _amount) 
    internal
    validPrice(_amount)
    returns (bool){
         require(_from != address(0) && _to == address(this));
         require(mToken.allowance(_from,_to) >= _amount);
         require(mToken.transferFrom(_from,_to,_amount));
         SubscriptionDeposited(_from, _to, _amount);
         return true;
    }
```

### Recovery/Low gas Examples:

The following snippets are examples of how to work with loops outside the chain.
The examples are implemented synchronously for readability purposes. 

```node
// get the providers number
async function getProvidersSize(){
	let marketPlace = await marketPlace.deployed();
	let providersNumber = await marketPlace.getProviderNamesSize.call();
	return providersNumber.toNumber();
}
```

```node
// loop through all the providers name 
async function getAllNames(providersSize){
	var providersNames = [];
	let marketPlace = await marketPlace.deployed();
	for(var i=0; i<providersSize;i++){
		let name = await marketPlace.getNameAt.call(i);
		providersNames.push(name);
	}
	return providersNames;
}
```

```node
//loop through all the providers details
async function getAllProviders(providersNames){
	var providersDetails = [];
	let marketPlace = await marketPlace.deployed();
	for(var i=0; i< providersNames.length;i++){
		let provider = await marketPlace.getDataProviderInfo.call(providersNames[i]); 
		providersDetails.push({name:providersNames[i], info: provider});
	}
}
```

```node
// withdraw funds 
async function withdrawFunds(providerName, owner, gas){
	let marketPlace = await marketPlace.deployed();
	let subscriptionsNumber = await marketPlace.getSubscriptionsSize.call(providerName);
	for(var i=0;i<subscriptionsNumber.toNumber();i++){
		let withdraw = await marketPlace.getWithdrawAmountAt.call(providerName,i);
		if(withdraw.toNumber() > 0){
			let tx = await marketPlace.withrawProviderAt(providerName,i,{from:owner,gas:gas});
		}
	}
}
```

```node
// refund subscriber
async function refundSubscriber(providerName, subscriber, gas){
	let marketPlace = await marketPlace.deployed();
	let subscriptionsNumber = await marketPlace.getSubscriptionsSize.call(providerName);
	for(var i = subscriptionsNumber.toNumber(); i>=0 ; i--){
		let subscription = await marketPlace.checkSubscriptionAt.call(providerName,i);
		if(subscription[0] == subscriber){ //0 is the index of the subscriber address
			let refund = await marketPlace.getRefundAmountAt.call(providerName,i);
			if(refund > 0){
				let tx = await marketPlace.refundSubscriberAt(providerName,i,{from:subscriber,gas:gas});
			}
		}
	}
}
```

```node
// is expired subscription
async function isSubscriptionExpired(prodiverName, index){
	let marketPlace = await marketPlace.deployed();
	let isExpired = await marketPlace.isExpiredSubscriptionAt.call(providerName,index);
	return isExpired;
}
```

```node
// general function - traverse all orders and do something
async function forEachSubscription(providerName,callback){
	let marketPlace = await marketPlace.deployed();
	let subscriptionsNumber = await marketPlace.getSubscriptionsSize.call(providerName);
	for(var i = subscriptionsNumber.toNumber(); i>=0 ; i--){
		let subscription = await marketPlace.checkSubscriptionAt.call(providerName,i);
		callback(subscription);
	}
}
```

```node
// general function - traverse all providers and do something 
async function forEachProvider(callback){
	let marketPlace = await marketPlace.deployed();
	let size = await marketPlace.getProviderNamesSize.call();
	for(var i =0; i<size.toNumber();i++){
		let name = await marketPlace.getNameAt.call(i);
		let provider = await marketPlace.getDataProviderInfo.call(providersNames[i]); 
		callback({name:name, info:provider});
	}
}
```
## Built With

* [Ganache](http://truffleframework.com/ganache/) -Test network
* [Truffle](http://truffleframework.com/) - Testing and deployment.

## Troubleshooting

Right after cloning the repository, you may encounter an error like the following when launching truffle:
```
$ truffle develop
Error: dlopen(smart_contract_marketplace/node_modules/scrypt/build/Release/scrypt.node, 1): no suitable image found.  Did find:
    smart_contract_marketplace/node_modules/scrypt/build/Release/scrypt.node: unknown file type, first eight bytes: 0x7F 0x45 0x4C 0x46 0x02 0x01 0x01 0x00
    smart_contract_marketplace/node_modules/scrypt/build/Release/scrypt.node: unknown file type, first eight bytes: 0x7F 0x45 0x4C 0x46 0x02 0x01 0x01 0x00
   at Object.Module._extensions..node (module.js:664:18)
   at Module.load (module.js:554:32)
   at tryModuleLoad (module.js:497:12)
   at Function.Module._load (module.js:489:3)
   at Module.require (module.js:579:17)
   at require (internal/module.js:11:18)
   at Object.<anonymous> (/Users/adityapalepu/Startups/enigma/smart_contract_marketplace/node_modules/scrypt/index.js:3:20)
   at Module._compile (module.js:635:30)
   at Object.Module._extensions..js (module.js:646:10)
   at Module.load (module.js:554:32)
```

which can be fixed by removing and reinstalling the problematic node module:
```
$ rm -rf node_modules/scrypt
$ npm install
```
