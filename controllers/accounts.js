
// const jwt = require('jsonwebtoken'); // module import
// const passport = require('passport');
const models = require('../models');
const cryptfuncs = require('../drivers/cryptfuncs');
const ethfuncs = require('../drivers/ethdrv');
const { nextTick, forEach } = require('async');
const assets = require('../models/assets');
const util = require('../drivers/util');
const etherscan = require('../drivers/etherscan');
const BN = require('bn.js');

// import cryptfuncs from '../drivers/cryptfuncs';

const crypt = new cryptfuncs();
const users = new ethfuncs('ropsten', 3, global.env.INFURA_USERS_KEY);
const admin = new ethfuncs('ropsten', 3, global.env.INFURA_ADMIN_KEY);

const Op = models.Sequelize.Op;
class accountsCtrl {

	// crypt;
	

	constructor() {

		// this.crypt = new cryptfuncs();

	}
	
	async getAccount(userid, email) {

		let result = [];

		do {
			let accounts = await models.Accounts.findAll({
				attributes: ['symbol', 'address', 'secret', 'cryptoiv'],
				where: { user_id: userid }
			});

			let assets = await models.Assets.findAll();

			let account;
			

			
			// let existSP = await accounts.find((item, idx) => {
			// 	if(item.symbol === 'SP')
			// 		return 1;
			// 	else
			// 		return 0;
			// });

			if(accounts.length === 0)	{
				
				
				// for(let i = 0; i < accounts.length; i++)
				// 	if(accounts[i].getDataValue('symbol') === 'SP')
				// 		break;
				
				accounts = [];
				account = await users.newAccount(email);
				
				// encrypt secret
				let encoded = await crypt.encryptEx(account.privateKey, global.env.API_ENCRYPTION_KEY);
				let temp = encoded.split(':');
			
				account.secret = temp[1];
				account.cryptoiv = temp[0];
				
				// let body = { "userID": email, "link": true };
				// let pointOpt = util.getMaruPointOpt('/issueCard', body, global.env.MARU_POINT_APIKEY);
				// let response = await util.requestUrl(pointOpt);
				// account.cardNo = response.cardNo;
				
				for(let i = 0; i < assets.length; i++) {
					
					if(assets[i].id === 4)
						continue;
					
					accounts.push({
						address: assets[i].id === 4 ? account.cardNo : account.address,
						secret: assets[i].id === 4 ? '' : account.secret,
						cryptoiv: assets[i].id === 4 ? '' : account.cryptoiv,
					});
				}
			}
			
			let hasPointId = accounts.filter(acc => acc.symbol === 'SP').length === 0 ? false : true;
			
			if(!hasPointId) {
				let body = { "userID": email, "link": true };
				let pointOpt = util.getMaruPointOpt('/issueCard', body, global.env.MARU_POINT_APIKEY);
				
				try {
					let response = await util.requestUrl(pointOpt);
					
					// if(response.result === true) {
					if(!util.isEmpty(response.cardNo)) {
					
						account = await users.newAccount(email);
						account.cardNo = response.cardNo;
					
						for(let i = 0; i < assets.length; i++) {
							
							if(assets[i].id === 4) {
								accounts.push({
									address: assets[i].id === 4 ? account.cardNo : account.address,
									secret: assets[i].id === 4 ? '' : account.secret,
									cryptoiv: assets[i].id === 4 ? '' : account.cryptoiv,
								});
							}
						}
					}
				}
				catch {}
			}
			
			// else {

			// }
			
			let body = { "cardNo": accounts[2].address};
			let pointOpt = util.getMaruPointOpt('/totalPoint', body, global.env.MARU_POINT_APIKEY);
			let response = await util.requestUrl(pointOpt);

			for(let i = 0; i < assets.length; i++) {
				
				if(util.isEmpty(accounts[i]))
					continue;

				let item = await models.Accounts.findOrCreate({
					attributes: ['id', 'symbol', 'address', 'balance', 'reminder', 'user_id', 'asset_id'],
					where: {
						symbol: assets[i].symbol,
						address: accounts[i].address,
						secret: accounts[i].secret,
						cryptoiv: accounts[i].cryptoiv,
						reminder: 0,
						user_id: userid,
						asset_id: assets[i].id,
					},
					defaults: {	balance: 0 }
				});
				
				let datetime = await models.Accounts.findOne({
					where: {
						symbol: assets[i].symbol,
						address: accounts[i].address,
						secret: accounts[i].secret,
						cryptoiv: accounts[i].cryptoiv,
						reminder: 0,
						user_id: userid,
						asset_id: assets[i].id,
					},
				});

				
				// if(item[0].asset_id == 4) {
				// 	item[0].setDataValue('address' , '');
				// 	item[0].setDataValue('secret' , '');
				// }

				if(assets[i].symbol == 'SP') {
					let body = { "cardNo": accounts[i].address};
					let pointOpt = util.getMaruPointOpt('/totalPoint', body, global.env.MARU_POINT_APIKEY);
					let response = await util.requestUrl(pointOpt);
					// {
					// 	"result": true,
					// 	"msg": "정상처리",
					// 	"totalPoint": 47519
					// }

					if(item[0].balance !== response.totalPoint) {
						result.result = await models.Accounts.update({balance: response.totalPoint}, {where: {id: item[0].id}});

						item[0].setDataValue('balance' , response.totalPoint);
					}
				}
				
				if(assets[i].decimal > 0)
					item[0].setDataValue('balance' , util.getAssetByUnit(item[0].balance, assets[i].decimal));
				
				if(item[0].id >= 130)
					item[0].setDataValue('id' , item[0].id - 129);
					
				item[0].setDataValue('min_deposit' , assets[i].min_deposit);
				item[0].setDataValue('min_withdraw' , assets[i].min_withdraw);
				item[0].setDataValue('exchange_fee' , assets[i].exchange_fee);
				item[0].setDataValue('asset_logo' , assets[i].asset_logo);
				item[0].setDataValue('asset_link' , assets[i].asset_link);
				item[0].setDataValue('decimal' , assets[i].decimal);
				item[0].setDataValue('modified_at' , datetime.modified_at);
				item[0].setDataValue('created_at' , datetime.created_at);
				
				delete item[0].secret;
				delete item[0].cryptoiv;
				
				result.push(item[0]);
			}

		}while(false);

		return result;
	}
	
	async getAccountByAddress(address) {

		let result;

		do {
			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['asset_type', 'asset_address', 'decimal'],
			};
			
			let Users = {
				model: models.Users,
				required: true,		// true: inner join, false: outer join
				attributes: ['email'],
			};
			
			let accounts = await models.Accounts.findAll({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { address: address },
				include: [Assets, Users]
			});

			// let assets = await models.Assets.findAll();

			for(let i = 0; i < accounts.length; i++) {

				if(accounts[i].asset.decimal > 0)
					accounts[i].setDataValue('balance' , util.getAssetByUnit(accounts[i].balance, accounts[i].asset.decimal));
			}
			
			result = accounts;

		}while(false);

		return result;
	}
	
	
	async getProfile(address) {
		
		let result;
		
		do {
			
			let Users = {
				model: models.Users,
				required: true,		// true: inner join, false: outer join
				attributes: ['email', 'phone'],
			};
			
			let accounts = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id'],
				where: { address: address },
				include: [Users]
			});

			// let assets = await models.Assets.findAll();

			// for(let i = 0; i < accounts.length; i++) {

			// 	if(accounts[i].asset.decimal > 0)
			// 		accounts[i].setDataValue('balance' , util.getAssetByUnit(accounts[i].balance, accounts[i].asset.decimal));
			// }
			
			result = accounts;

		}while(false);
		
		return result;
	}
	
	async getAccountByEmail(email) {

		let result;

		do {
			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['asset_type', 'asset_address', 'decimal'],
			};
			
			let Users = {
				model: models.Users,
				required: true,		// true: inner join, false: outer join
				attributes: ['email'],
				where: { email: email },
			};
			
			let accounts = await models.Accounts.findAll({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				// where: { email: email },
				include: [Assets, Users]
			});

			// let assets = await models.Assets.findAll();

			for(let i = 0; i < accounts.length; i++) {

				if(accounts[i].asset.decimal > 0)
					accounts[i].setDataValue('balance' , util.getAssetByUnit(accounts[i].balance, accounts[i].asset.decimal));
			}
			
			result = accounts;

		}while(false);

		return result;
	}
	
	async addAsset(userid, symbol, amount) {

		let result;

		do {
			let asset = {
				user_id: userid, symbol: symbol, balance: models.sequelize.literal('field + 2')
			}
			
			result = await models.Accounts.update(asset, {where: {id: id}});
			// console.log(result);

		}while(false);

		return result[0];
	}

	async create(email) {

		let result;

		do {
			// create eth address
			let result = users.newAccount(email);

			// get asset info from assets table
			let assets = await new Promise((resolve, reject) => {
				models.Assets.findAll().then(res => {
					resolve(res);
				});
			});

			assets.forEach(async asset => {
				let item = await new Promise((resolve, reject) => {

					models.Accounts.findOrCreate({
						symbol: asset.symbol,
						address: result.address,
						secret: result.privateKey,
						user_id: userid,
						asset_id: asset.id,
					}).then(res => {
						resolve(res);
					});
				});

				result.push(item.dataValues);
			});

			// console.log(result.dataValues);

		}while(false);

		return result;
	}

	async getTransactions(id, symbol, pageObj = null) {
		
		let result;

		do {
			let txQuery;
			
			if(symbol === 'undefined' || symbol === null || symbol === '{AssetName}' || symbol === '') {
				
				let Assets = {
					model: models.Assets,
					required: true,		// true: inner join, false: outer join
					attributes: ['symbol', 'decimal'],
				};
				
				txQuery = { 
					attributes: ['id', 'tx_hash', 'sender_id', 'receiver', 'value', 'issentout', 'asset_id', 'block_time', 'date_time'], 
					where: { sender_id: id }, include: [ Assets ]
				};
			}
			else {
				let Assets = {
					model: models.Assets,
					required: true,		// true: inner join, false: outer join
					attributes: ['symbol', 'decimal'],
					where: { symbol: symbol	}
				};
				
				txQuery = { 
					attributes: ['id', 'tx_hash', 'sender_id', 'receiver', 'value', 'issentout', 'asset_id', 'block_time', 'date_time'],
					where: { sender_id: id }, 
					include: [ Assets ],
					order: [ [ 'date_time', 'DESC' ] ]
				};
			}
			
			if(!util.isEmpty(pageObj)) {
				txQuery.offset = (pageObj.PageNumber - 1) * pageObj.PageSize;
				txQuery.limit = Number(pageObj.PageSize);
			}
			
			let txlist = await models.Transactions.findAndCountAll(txQuery);
			
			for(let i = 0; i < txlist.rows.length; i++) {
				txlist.rows[i].setDataValue('value' , util.getAssetByUnit(txlist.rows[i].value, txlist.rows[i].asset.decimal));
			}
	
			result = txlist;
			result.result = 1;

		}while(false);

		return result;
	}

	async getTransactionsInternal(id, symbol, pageObj = null) {
		
		let result = new Object();

		do {

			let txSent;
			let txReceived;
			
			if(symbol === 'undefined' || symbol === null || symbol === '{AssetName}' || symbol === '') {
				
				let Assets = {
					model: models.Assets,
					required: true,		// true: inner join, false: outer join
					attributes: ['symbol', 'decimal'],
				};
				
				txSent = { 
					attributes: ['id', 'uuid', 'tx_hash', 'sender_id', 'sender', 'receiver_id', 'receiver', 'value', 'reason', 'status', 'asset_id', 'date_time'], 
					where: { sender_id: id }, include: [ Assets ],
					order: [ [ 'date_time', 'DESC' ] ]
				};

				txReceived = { 
					attributes: ['id', 'uuid', 'tx_hash', 'sender_id', 'sender', 'receiver_id', 'receiver', 'value', 'reason', 'status', 'asset_id', 'date_time'],
					where: { receiver_id: id }, include: [ Assets ],
					order: [ [ 'date_time', 'DESC' ] ]
				};
			}
			else {
				let Assets = {
					model: models.Assets,
					required: true,		// true: inner join, false: outer join
					attributes: ['symbol', 'decimal'],
					where: { symbol: symbol	}
				};

				// let Users = {
				// 	model: models.Users,
				// 	required: true,		// true: inner join, false: outer join
				// 	attributes: ['email', 'nick', 'name'],
				// 	where: { symbol: symbol	}
				// };
				
				txSent = { 
					attributes: ['id', 'uuid', 'tx_hash', 'sender_id', 'sender', 'receiver_id', 'receiver', 'value', 'reason', 'status', 'asset_id', 'date_time'],
					where: { sender_id: id }, include: [ Assets ],
					order: [ [ 'date_time', 'DESC' ] ]
				};

				txReceived = { 
					attributes: ['id', 'uuid', 'tx_hash', 'sender_id', 'sender', 'receiver_id', 'receiver', 'value', 'reason', 'status', 'asset_id', 'date_time'],
					where: { receiver_id: id }, include: [ Assets ],
					order: [ [ 'date_time', 'DESC' ] ]
				};
			}			
			
			if(!util.isEmpty(pageObj)) {
				txSent.offset = (pageObj.PageNumber - 1) * pageObj.PageSize
				txSent.limit = Number(pageObj.PageSize);
				txReceived.offset = (pageObj.PageNumber - 1) * pageObj.PageSize
				txReceived.limit = Number(pageObj.PageSize);
			}
			
			let sent = await models.Transactions_internal.findAndCountAll(txSent);
			let received = await models.Transactions_internal.findAndCountAll(txReceived);
	
			for(let i = 0; i < sent.rows.length; i++) {
				sent.rows[i].setDataValue('value' , util.getAssetByUnit(sent.rows[i].value, sent.rows[i].asset.decimal));
			}

			for(let i = 0; i < received.rows.length; i++) {
				received.rows[i].setDataValue('value' , util.getAssetByUnit(received.rows[i].value, received.rows[i].asset.decimal));
			}
	
			result.sent = sent;
			result.received = received;
			result.result = 1;

		}while(false);

		return result;
	}	
	
	
	async getTransactionsInternal(id, type, value, pageObj = null) {
		
		let result = new Object();

		do {

			let txSent;
			let txReceived;
			
			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['symbol', 'decimal'],
			};
			
			txSent = { 
				attributes: ['id', 'uuid', 'tx_hash', 'sender_id', 'sender', 'receiver_id', 'receiver', 'value', 'reason', 'status', 'asset_id', 'date_time'],
				where: { sender_id: id }, 
				include: [ Assets ],
				order: [ [ 'date_time', 'DESC' ] ]
			};

			txReceived = { 
				attributes: ['id', 'uuid', 'tx_hash', 'sender_id', 'sender', 'receiver_id', 'receiver', 'value', 'reason', 'status', 'asset_id', 'date_time'],
				where: { receiver_id: id }, 
				include: [ Assets ],
				order: [ [ 'date_time', 'DESC' ] ]
			};
			
			// 0: id
			// 1: uuid
			// 2: page nation
			if(type === 0) {
				txSent.where = {sender_id: id, id: value};
				txReceived.where = {receiver_id: id, id: value};				
			} else if(type === 1) {
				txSent.where = {sender_id: id, uuid: value};
				txReceived.where = {receiver_id: id, id: value};
			} else if(type === 2) {
				
				if(value !== 'undefined' && value !== null && value !== '{AssetName}' || value !== '')
					Assets.where = {symbol: value};
					
				txSent.where = {sender_id: id};
				txReceived.where = {receiver_id: id};	
			
				if(!util.isEmpty(pageObj)) {
					txSent.offset = (pageObj.PageNumber - 1) * pageObj.PageSize
					txSent.limit = Number(pageObj.PageSize);
					txReceived.offset = (pageObj.PageNumber - 1) * pageObj.PageSize
					txReceived.limit = Number(pageObj.PageSize);
				}
			}
			
			let sent = await models.Transactions_internal.findAndCountAll(txSent);
			let received = await models.Transactions_internal.findAndCountAll(txReceived);
	
			for(let i = 0; i < sent.rows.length; i++) {
				sent.rows[i].setDataValue('value' , util.getAssetByUnit(sent.rows[i].value, sent.rows[i].asset.decimal));
			}

			for(let i = 0; i < received.rows.length; i++) {
				received.rows[i].setDataValue('value' , util.getAssetByUnit(received.rows[i].value, received.rows[i].asset.decimal));
			}
	
			result.sent = sent;
			result.received = received;
			result.result = 1;

		}while(false);

		return result;
	}
	
	async checkBalance() {

		let result = 0;
		
		do {
			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['asset_type', 'asset_address', 'decimal'],
				where: { asset_type: { [Op.between]: [20, 21] }	}
			};
			
			let accounts = await models.Accounts.findAll({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'reminder'],
				where: { user_id: { [Op.ne]: 1 } },
				include: [Assets]
			});
			
			result = accounts.length;
			
			for(let i = 0; i < accounts.length; i++) {
				
				let url = accounts[i].asset.asset_type == 20 ? etherscan.getEtherOpt(accounts[i].address, global.env.ETHERSCAN_APIKEY) : etherscan.getTokenOpt(accounts[i].address, global.env.ETHERSCAN_APIKEY, accounts[i].asset.asset_address);
				let balance = JSON.parse(await util.requestHttps(url));
				
				console.log(balance);
				
				let bn_reminder = new BN(accounts[i].reminder);
				let bn_result = new BN(balance.result);
				
				if(bn_reminder.cmp(bn_result) > -1)
					continue;
				
				// collection	
				let bn_increase = bn_result.sub(bn_reminder);
				let bn_balance = new BN(accounts[i].balance);
				// console.log('increase: ' + bn_increase.toString(), ', reminder: ' + bn_reminder.toString() + ', result: ' + bn_result.toString());
				
				bn_result = bn_balance.add(bn_increase);
				let amount = util.getAssetByUnit(bn_result, accounts[i].asset.decimal);
				
				
				result = await models.Accounts.update({balance: bn_result.toString(), reminder: balance.result.toString()}, {where: {id: accounts[i].id}});
			}			
		}while(false);
		
		return result;
	}
}

module.exports = accountsCtrl;