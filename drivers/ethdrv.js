const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common');
const initapp = require('../initapp');
const BigNumber = require('bignumber.js');
const HDWalletProvider = require('@truffle/hdwallet-provider');


// let mode = process.argv.slice(2);
// let homepath = mode == 'dev' ? '/mnt/d/refs/script_home/nodejs' : '/home';

// const ethData = JSON.parse(fs.readFileSync(homepath + '/ethInfura/ethData.json'));

// let web3;

// let tokenbinPath = '/home/ethInfura/contract/token.bin';
// let hardfork = 'petersburg';
// let fromAddress;
// let fromPrivateKey;
// let privateKey;
// let toAddress;
// let sendAmount;
// let tokenName;
// let contractAbi; 
// let contractAddr;
// let contract;
// let txid;
// let web3;
// let chain;
// let chainId;//ropsten
// let data = {};
// let sync;

const   tokenbinPath = initapp.homepath + '/contract/nft.bin';
const   hardfork = 'petersburg';



class ethfuncs {

	// #web3;
	// #chain;
	// #chainId;

	// #contractAbi; 
	// #contractAddr;
	// #contract;    

	// fromAddress;
	// fromPrivateKey;
	// privateKey;
	// toAddress;
	// sendAmount;
	// tokenName;

	// txid;
	// data = {};
	// sync;

	// contractAbi = '';

	constructor(chain, id, pubkey) {
		// let url = 'https://:1b072c77e5bc468c9ba642a6eea0a691@' + chain + '.infura.io/v3/' + pubkey;
		// web3 = new	Web3('https://' + chain + '.infura.io/v3/5b72559c2fb641838bab583d3f8a7f94');

		// let url = 'https://' + chain + '.infura.io/v3/' + pubkey;
		// let url = 'https://' + chain + '.infura.io/v3/' + pubkey;
		
		// this.web3 = new Web3.HttpProvider('1f89ad4118dc9a0ed4b83caa4eb782d90c4ce9eb075bedbbf820a15797f69c47', `http://167.179.83.102:8545`),

		//let provider = new HDWalletProvider('1f89ad4118dc9a0ed4b83caa4eb782d90c4ce9eb075bedbbf820a15797f69c47', `http://13.125.218.17:8545`)
		
		// let provider = new HDWalletProvider('5db3b020bec4bd4e5f0404d1ef9583e8752be8e9a9ec4279528d982bcf083df9', `https://mainnet.infura.io/v3/5b72559c2fb641838bab583d3f8a7f94`)
		// this.web3 = new Web3(provider);
		// // this.web3 = new Web3(url);
		// this.chain = 'ETH'; 
		// this.chainId = 1;
		// this.contractAbi = '';
	}

	
	// constructor(chain, id, pubkey, mnemonic, addrNum) {

	// 	let url = 'https://' + chain + '.infura.io/v3/' + pubkey;
	// 	let provider = new HDWalletProvider(mnemonic, url, 0, addrNum),

	// 	this.web3 = new Web3(provider);
	// 	this.chain = chain;
	// 	this.chainId = id;

	// 	this.contractAbi = '';

	// }

	// async reset(chain, id, pubkey, mnemonic, addrNum) {

	// 	let url = 'https://' + chain + '.infura.io/v3/' + pubkey;
	// 	let provider = new HDWalletProvider(mnemonic, url, 0, addrNum),

	// 	this.web3.setProvider(provider);
	// 	this.chain = chain;
	// 	this.chainId = id;
	// }

	async getGasLimit() {
		
		let returnVal = await this.web3.eth.getBlock('latest');

		returnVal = returnVal.gasLimit;

		if (returnVal > 43000)
			returnVal = 42000;

		return returnVal;
	}

	async getGasPrice() {
		let returnVal = await this.web3.eth.getGasPrice();

		// if (returnVal > 10000000000)
		// 	returnVal = 10000000000;

		return returnVal;
	}

	async getNonce(fromAddress) {

		return await this.web3.eth.getTransactionCount(fromAddress, 'pending');
	}

	async getAccounts() {

		return await this.web3.eth.getAccounts();
	}

	async getBalance(address) {

		let weival = await this.web3.eth.getBalance(address);
		let ethval = await this.web3.utils.fromWei(weival, 'ether');

		console.log(weival);

		let balance = {
			address: address,
			ether: ethval,
			wei: weival
		};

		return balance;
	}

	async newAccount(password) {

		return await this.web3.eth.accounts.create(password);
	}

	async isAddress(address) {

		return await this.web3.utils.isAddress(address);
	}

	async getTransaction(txid) {
		let res;
		console.log(txid);

		try {
			res = await this.web3.eth.getTransaction(txid);
		}
		catch (exp) {
			// console.log(exp.message);
			res = exp.message;
		}

		console.log(res);
		return res;
	}

	async deploy(owner, passwd) {

		let bin = fs.readFileSync(tokenbinPath).toString();
		// let deployobj = { data: "0x" + bin };
		// let gas = await web3.eth.estimateGas(deployobj);
		// let privateKey = Buffer.from(passwd, 'hex');
		let privateKey = Buffer.from(passwd.slice(2), 'hex');
		let txid = '';
		let deployobj = { from: owner, gasPrice: this.web3.eth.gasPrice, data: "0x" + bin };
		// let gas = await this.web3.eth.estimateGas(deployobj);
		let gas = 8000000;

		// console.log(gas);

		try {
			let rawTx = {
				from: owner,
				chainId: this.web3.utils.toHex(this.chainId),
				nonce: this.web3.utils.toHex(await this.web3.eth.getTransactionCount(owner, 'pending')),
				gas: this.web3.utils.toHex(gas),
				gasPrice: this.web3.utils.toHex(await this.web3.eth.getGasPrice()),
				// gasLimit: this.web3.utils.toHex(await this.web3.eth.getBlock('latest').gasLimit),
				gasLimit: this.web3.utils.toHex(8000000),
				data: "0x" + bin
			};

			// let rawTx = {from: owner, gas: gas, gasPrice: web3.eth.gasPrice, data: "0x" + bin};
			
			
			let customCommon = Common.default.forCustomChain(
				'mainnet',
				{
					name: 'mpando',
					// networkId: 55,
					chainId: 55,
				},
				// 'istanbul'
				// 'petersburg',
				'byzantium'
				// 'constantinople'
				// 'spuriousDragon'
				// 'tangerineWhistle'
			);
			
			let tx = new Tx(rawTx, { common: customCommon });
			
			tx.sign(privateKey);
			let serializedTx = tx.serialize();
			this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function (hash) {
				console.log(hash);
				txid = hash;
				//  res.send(hash);
			}).on('error', function (error) {
				console.log(error);
				//  res.send('false');
			});

		} catch (error) {
				console.log(error);
				//  res.send('false');
		}
		// let txid = await web3.personal.sendTransaction(tx, passwd);	
		return txid;
	}

	async getContract(tokenName) {

		if(this.tokenName != tokenName) {
			this.tokenName != tokenName;
			this.contractAbi = JSON.parse(fs.readFileSync(initapp.homepath + '/TVS_abi.json'));
			this.contractAddr = initapp.ethdata[tokenName]['contractAddr'];
			this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddr);
			this.tokenName = tokenName;
		}

		let res = {
			name: this.tokenName,
			abi: this.contractAbi,
			addr: this.contractAddr,
			contract: this.contract
		};

		return res;
	}

	async getTokenBalance(address, contract) {

		let balance = await contract.methods.balanceOf(address).call(function(err, val){
			// fn_balance = web3.utils.fromWei(val, 'ether');
			console.log(val);

			return val;
		});
		
		return balance;
	}


	async getName(contract) {

		let name = await contract.methods.name().call(function(err, val){
			// fn_balance = web3.utils.fromWei(val, 'ether');
			console.log(val);

			return val;
		});
		
		return name;
	}


	async getSymbol(contract) {

		let symbol = await contract.methods.symbol().call(function(err, val){
			// fn_balance = web3.utils.fromWei(val, 'ether');
			console.log(val);
		
			return val;
		});
		
		return symbol;
	}


	async getTotalSupply(contract) {

		let total = await contract.methods.totalSupply().call(function(err, val){
			// fn_balance = web3.utils.fromWei(val, 'ether');
			console.log(val);

			return val;
		});
		
		return total;
	}

	
	async getDecimal(contract) {

		let decimals = await contract.methods.decimals().call(function(err, val){
			// fn_balance = web3.utils.fromWei(val, 'ether');
			console.log(val);

			return val;
		});
		
		return decimals;
	}
	
	async auction(contract, address) {
		
		// let res = await contract.methods.userPriceList(address).call(function(err, val){
		// 	// fn_balance = web3.utils.fromWei(val, 'ether');
		// 	console.log(err);

		// 	return val;
		// });
		
		// let res = await contract.methods.setFeeAddress(address).send({from: address});
		
		let res = await contract.methods.setCreateAuctionFee(1).send({from: address});
		
		// const createAuction = await contract.methods.createAuction(
		// 	'0x0f0872745947945227840959c90b9B098703D0a7',
		// 	'2',
		// 	new BigNumber(1)
    //       .times(new BigNumber(10).pow(18))
    //       .toNumber()
    //       .toFixed(0),
		// 	'title',
		// 	new BigNumber(100)
    //       .times(new BigNumber(10).pow(18))
    //       .toNumber()
    //       .toFixed(0),
		// 	'1646568508',
		// 	1,
		// 	1,
		// 	1,
		// )
		// .send({
		// 	from: address,
		// 	gas: 800000,
		// 	value: this.web3.utils.toWei('0.001',	'ether')
		// }, function(err, res) {
		// 		console.log(res);
		// 		console.log(err);

		// 	return res;
		// });
		
		// console.log(createAuction);
		// const result = await contract.methods.getOpenAuctions(0,0,'',0,10).call({gas: 800000});
		
		
		// const result = await contract.methods.getUserAuctions(address).call({gas: 800000});
		
		
		return res;
	}


	async getTokenTx(from, to, amount, caddr, contract, gas) {

		let rawTx = {

			from: from,
			chainId: this.web3.utils.toHex(this.chainId),
			nonce: this.web3.utils.toHex(await this.web3.eth.getTransactionCount(from, 'pending')),
			gas: this.web3.utils.toHex(gas),
			gasPrice: this.web3.utils.toHex(await this.web3.eth.getGasPrice()),
			gasLimit: this.web3.utils.toHex(await this.web3.eth.getBlock('latest').gasLimit),
			to: caddr,
			data: contract.methods.transfer(to, amount).encodeABI()
		};

		return rawTx;
	}
	
	async getEthTx(from, to, amount) {

		let rawTx = {
			chainId: this.web3.utils.toHex(this.chainId),
			nonce: this.web3.utils.toHex(await this.web3.eth.getTransactionCount(from, 'pending')),
			gasPrice: this.web3.utils.toHex(await this.web3.eth.getGasPrice()),
			gasLimit: this.web3.utils.toHex(await this.web3.eth.getBlock('latest').gasLimit),
			value: this.web3.utils.toHex(amount),
			to: to
		};

		return rawTx;
	}

	async sendSignedTransaction(tx) {

		let res;
		
		let serializedTx = tx.serialize();
		res = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function (tx) {
			console.log(tx);
			return tx;
		}).on('error', function (error) {
			error.result = -2;
			return error;
		});
		
		let block = await this.web3.eth.getBlock(res.blockHash);
		res.blockTime = block.timestamp;
		
		return res;
	}
	
	
	async createTransaction(fromAddr, toAddr, amount, passwd) {

		let res = null;

		let privateKey = Buffer.from(passwd.slice(2), 'hex');
		let nonce = await this.web3.eth.getTransactionCount(fromAddr, 'pending');
		let price = await this.web3.eth.getGasPrice();
		let latest = await this.web3.eth.getBlock('latest');
		let gas = 21000;

		try {
			let rawTx = {
				from: fromAddr,
				chainId: this.web3.utils.toHex(this.chainId),
				nonce: this.web3.utils.toHex(nonce),
				gas: this.web3.utils.toHex(gas),
				gasPrice: this.web3.utils.toHex(price),
				gasLimit: this.web3.utils.toHex(latest.gasLimit),
				to: toAddr,
				value: this.web3.utils.toHex(amount)
			};

			let tx = new Tx(rawTx, { chain: this.chain, hardfork: hardfork });
			tx.sign(privateKey);
			res = tx;
		}
		catch (error) {
				console.log(error);
				error.result = -3;
				res = error;
		}
		// let transaction = await this.web3.eth.getTransaction(res.transactionHash.toString());
		// console.log(transaction);
		// console.log(await this.web3.eth.getBlock(transaction.blockHash));

		return res;
			
		let serializedTx = tx.serialize();
		res = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function (tx) {
			console.log(tx);
			return tx;
			//  res.send(hash);
		}).on('error', function (error) {
			// console.log(error);
			error.result = -2;
			return error;
		});

		return res;
	}
	
	async getTransactionReceipt(txid) {
		return await this.web3.eth.getTransactionReceipt(txid.toString());
	}

	async transfer(fromAddr, toAddr, tokenContract, amount, passwd) {

		let res = null;

		if(tokenContract == null)
			return res;

		// console.log(tokenContract);

		let tkdata = await tokenContract.methods.transfer(toAddr, amount).encodeABI(); // make tx with txdata

		let privateKey = Buffer.from(passwd.slice(2), 'hex');
		// let privateKey = Buffer.from(passwd, 'hex');
		let nonce = await this.web3.eth.getTransactionCount(fromAddr, 'pending');
		let price = await this.web3.eth.getGasPrice();
		let latest = await this.web3.eth.getBlock('latest');

		let txobj = { from: fromAddr, to: this.contractAddr, gasPrice: this.web3.eth.gasPrice, data: tkdata };
		let gas = await this.web3.eth.estimateGas(txobj);

		try {
			let rawTx = {
				from: fromAddr,
				chainId: this.web3.utils.toHex(this.chainId),
				nonce: this.web3.utils.toHex(nonce),
				gas: this.web3.utils.toHex(gas),
				gasPrice: this.web3.utils.toHex(price),
				gasLimit: this.web3.utils.toHex(latest.gasLimit),
				to: this.contractAddr,
				data: tkdata
			};

			let tx = new Tx(rawTx, { chain: this.chain, hardfork: hardfork });
			tx.sign(privateKey);
			res = tx;
		}
		catch (error) {
				console.log(error);
				error.result = -3;
				res = error;
		}
		
		return res;
	}	
	
	
	async transferByOwner(fromAddr, toAddr, tokenContract, amount, masterAddr, passwd) {

		let res = null;

		if(tokenContract == null)
			return res;

		// console.log(tokenContract);

		let tkdata = await tokenContract.methods.transferByOwner(fromAddr, toAddr, amount).encodeABI(); // make tx with txdata

		let privateKey = Buffer.from(passwd.slice(2), 'hex');
		let nonce = await this.web3.eth.getTransactionCount(fromAddr, 'pending');
		let price = await this.web3.eth.getGasPrice();
		let latest = await this.web3.eth.getBlock('latest');

		let txobj = { from: masterAddr, to: this.contractAddr, gasPrice: this.web3.eth.gasPrice, data: tkdata };
		let gas = await this.web3.eth.estimateGas(txobj);

		try {
			let rawTx = {
				from: masterAddr,
				chainId: this.web3.utils.toHex(this.chainId),
				nonce: this.web3.utils.toHex(nonce),
				gas: this.web3.utils.toHex(gas),
				gasPrice: this.web3.utils.toHex(price),
				gasLimit: this.web3.utils.toHex(latest.gasLimit),
				to: this.contractAddr,
				data: tkdata
			};

			let tx = new Tx(rawTx, { chain: this.chain, hardfork: hardfork });
			tx.sign(privateKey);
			let serializedTx = tx.serialize();
			res = await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on(function (tx) {
				console.log(tx);
				return tx;
				//  res.send(hash);
			}).on('error', function (error) {
				// console.log(error);
				error.result = -1;
				return error;
			});
		}
		catch (error) {
				console.log(error);
				error.result = -2;
				res = error;
		}

		return res;
	}	
	
	async mint(owner, tokenContract, target, amount, passwd) {

		let res = null;

		if(tokenContract == null)
			return res;

		let tkdata = await tokenContract.methods.mint(target, amount).encodeABI(); // make tx with txdata

		// let tkdata = web3.utils.toHex(await contract.mint(target, amount));	// make tx with txdata
		// let privateKey = Buffer.from(passwd, 'hex');
		let privateKey = Buffer.from(passwd.slice(2), 'hex');
		
		let mintobj = { from: owner, to: this.contractAddr, gasPrice: this.web3.eth.gasPrice, data: tkdata };
		// let gas = 3500000;
		let gas = await this.web3.eth.estimateGas(mintobj);
		// console.log(gas);

		try {
			let rawTx = {
				from: owner,
				chainId: this.web3.utils.toHex(this.chainId),
				nonce: this.web3.utils.toHex(await this.web3.eth.getTransactionCount(owner, 'pending')),
				gas: this.web3.utils.toHex(gas),
				gasPrice: this.web3.utils.toHex(await this.web3.eth.getGasPrice()),
				gasLimit: this.web3.utils.toHex(await this.web3.eth.getBlock('latest').gasLimit),
				to: this.contractAddr,
				data: tkdata
			};

			// let rawTx = {from: owner, gas: gas, gasPrice: this.web3.eth.gasPrice, data: "0x" + bin};
			let tx = new Tx(rawTx, { chain: this.chain, hardfork: hardfork });
			tx.sign(privateKey);
			let serializedTx = tx.serialize();
			await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function (hash) {
				console.log(hash);
				res = hash;
				//  res.send(hash);
			}).on('error', function (error) {
				console.log(error);
				//  res.send('false');
			});
		}
		catch (error) {
				console.log(error);
				//  res.send('false');
		}

		return res;
	}

	async burn(owner, passwd, tokenContract, target, amount) {

		let res = null;

		if(tokenContract == null)
				return res;

		let tkdata = await tokenContract.methods.burn(target, amount).encodeABI(); // make tx with txdata

		// let tkdata = web3.utils.toHex(await contract.mint(target, amount));	// make tx with txdata
		let privateKey = Buffer.from(passwd, 'hex');

		let mintobj = { from: owner, to: this.contractAddr, gasPrice: this.web3.eth.gasPrice, data: tkdata };
		let gas = await this.web3.eth.estimateGas(mintobj);
		// console.log(gas);

		try {
			let rawTx = {
				from: owner,
				chainId: web3.utils.toHex(this.chainId),
				nonce: this.web3.utils.toHex(await this.web3.eth.getTransactionCount(owner, 'pending')),
				gas: this.web3.utils.toHex(gas),
				gasPrice: this.web3.utils.toHex(await this.web3.eth.getGasPrice()),
				gasLimit: this.web3.utils.toHex(await this.web3.eth.getBlock('latest').gasLimit),
				to: this.contractAddr,
				data: tkdata
			};

			// let rawTx = {from: owner, gas: gas, gasPrice: this.web3.eth.gasPrice, data: "0x" + bin};
			let tx = new Tx(rawTx, { chain: this.chain, hardfork: hardfork });
			tx.sign(privateKey);
			let serializedTx = tx.serialize();
			await this.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function (hash) {
				console.log(hash);
				res = hash;
				//  res.send(hash);
			}).on('error', function (error) {
				console.log(error);
				//  res.send('false');
			});
		}
		catch (error) {
			console.log(error);
			//  res.send('false');
		}

		return res;
	}

};


















module.exports = ethfuncs;