#!/usr/bin/env node

let runmode = process.argv.slice(1)[0];

if(runmode === 'local')	
	require('dotenv').config({path: __dirname + '/config/.env_local'});
else if(runmode === 'dev')	
	require('dotenv').config({path: __dirname + '/config/.env_dev'});
else if(runmode === 'prod')	
	require('dotenv').config({path: __dirname + '/config/.env_prod'});
else 
	require('dotenv').config();

// process.argv.forEach(function (val, index, array) {
//   console.log(index + ': ' + val);
// });

// return;

global.env = process.env;

const BN = require('bn.js');
const web3 = require('web3')
const https = require('https');
const models = require('./models');
const util = require('./drivers/util');
const cryptFunc = require('./drivers/cryptfuncs');

const Op = models.Sequelize.Op;
// const util = new utilfunc();
const crypt = new cryptFunc();

async function getEtherOpt(address, apikey) {
	
	let ether = '/api?module=account&action=balance&address=' + address  + '&tag=latest&apikey=' + apikey;
	
	let etherUrl = {
		hostname: global.env.ETHERSCAN_HOST,
		path: ether,
		method: 'GET'
	};
	
	return etherUrl;
}

async function getTokenOpt(address, apikey, contract) {
	
	let token = '/api?module=account&action=tokenbalance&contractaddress=' + contract + '&address=' + address + '&tag=latest&apikey=' + apikey;
	
	let tokenUrl = {
		hostname: global.env.ETHERSCAN_HOST,
		path: token,
		method: 'GET'
	};
	
	return tokenUrl;
}

async function getAssetByUnit(amount) {
	return amount.toString().substr(0, amount.toString().length - 18) + '.' + amount.toString().substr(amount.toString().length - 18, amount.toString().length);
}

let requestHttps = url => {
	return new Promise((resolve, reject) => {
		https.get(url, res => {
			res.setEncoding('utf8');
			let body = '';
			res.on('data', chunk => body += chunk);
			res.on('end', () => resolve(body));
		}).on('error', reject);
	}).catch(err => {
		console.log(err);		
	});
};

module.exports.testcode = 
async function testcode() {

	let result;

	do {
		// let time = new Date().getTime();
		// console.log(time);
		// let temp = '3999913.400348';
		// temp.lastIndexOf
		// console.log(util.removeFloatPoint(temp, 18));

		// let key = await crypt.getSha256Key(Date.now().toString());
		// let key = await crypt.gensalt();
		// console.log(key);

		// let encoded = await crypt.encryptEx('marucard@naver.com', process.env.API_ENCRYPTION_KEY);
		// console.log(encoded);

		// let decoded = await crypt.decryptEx(encoded, process.env.API_ENCRYPTION_KEY);
		// console.log(decoded);
		
		
		let time = new Date().getTime();
		let token = await crypt.generateToken(time, 'machine0083@naver.com');
		console.log(token);

	}while(false);

	return result;
}



module.exports.checkBalance = 
async function checkBalance() {

	let result;
	
	do {
		let Assets = {
			model: models.Assets,
			required: true,		// true: inner join, false: outer join
			attributes: ['asset_type', 'asset_address', 'decimal'],
			where: { asset_type: { [Op.between]: [20, 21] }	}
		};
		
		let accounts = await models.Accounts.findAll({
			attributes: ['id', 'address', 'user_id', 'symbol', 'balance'],
			where: { user_id: { [Op.ne]: 1 } },
			include: [Assets]
		});
		
		for(let i = 0; i < accounts.length; i++) {
			
			let url = accounts[i].asset.asset_type == 20 ? await getEtherOpt(accounts[i].address, global.env.ETHERSCAN_APIKEY) : await getTokenOpt(accounts[i].address, global.env.ETHERSCAN_APIKEY, accounts[i].asset.asset_address);
			let balance = JSON.parse(await requestHttps(url));
			
			console.log(balance);
			
			let bn_reminder = new BN(accounts[i].reminder);
			let bn_result = new BN(balance.result);
			
			if(bn_reminder.cmp(bn_result) > -1)
				continue;
			
			// collection	
			let bn_increase = bn_result.sub(bn_reminder);
			let bn_balance = new BN(accounts[i].balance);
			bn_result = bn_balance.add(bn_increase);
			let amount = util.getAssetByUnit(bn_result, accounts[i].asset.decimal);
			console.log(amount);
			
			// result = await models.Accounts.update({balance: bn_result.toString()}, {where: {id: accounts[i].id}});
		}
		
	}while(false);
	
	return result;
}






