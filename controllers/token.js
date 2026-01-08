
const ethfuncs = require('../drivers/ethdrv');
const cryptfuncs = require('../drivers/cryptfuncs');
const models = require('../models');
const util = require('../drivers/util');
const BN = require('bn.js');
const { v4: uuidv4 } = require('uuid');


// const users = new ethfuncs(global.env.ETH_NET, 3, global.env.INFURA_USERS_KEY);
// const admin = new ethfuncs(global.env.ETH_NET, 3, global.env.INFURA_ADMIN_KEY);
const admin = new ethfuncs('mpando', 55, global.env.INFURA_ADMIN_KEY);
const crypt = new cryptfuncs();

const Op = models.Sequelize.Op;

class etherCtrl {

	// crypt;
	

	constructor() {

		// this.crypt = new cryptfuncs();

	}
	
	
	async getMaster(tokenName) {

		let result;

		do
		{
			let master = await models.Accounts.findOne({
				attributes: ['address', 'secret', 'cryptoiv', 'user_id', 'symbol', 'balance'],
				where: { user_id: 1, symbol: tokenName },
			});


			if(!master) {

				result = -1;
				break;
			}
			
			// let decrypted = await crypt.decryptEx(master.cryptoiv + ':' + master.secret, global.env.API_ENCRYPTION_KEY);
			
			// // master.setDataValue('secret' , decrypted);
			// master.secret = decrypted;
			result = master;

		}while(false);

		return result;
	}
	
	async getUserByAddress(tokenName, address) {

		let result;

		do
		{
			let user = await models.Accounts.findOne({
				attributes: ['address', 'secret', 'user_id', 'symbol', 'balance'],
				where: { symbol: tokenName, address: address },
			});
			
			result = user;

		}while(false);

		return result;
	}
	
	async getAccountById(tokenName, userId) {

		let result;

		do
		{
			let user = await models.Accounts.findOne({
				attributes: ['address', 'secret', 'user_id', 'symbol', 'balance'],
				where: { user_id: userId, symbol: tokenName },
			});

			if(!user) {

				result = -1;
				break;
			}
			
			result = user;

		}while(false);

		return result;
	}
	
	async getContract(tokenName) {

		let result;

		do
		{
			let tokenObj = admin.getContract(tokenName);
			
			result = tokenObj;

		}while(false);

		return result;
	}
	
	async auction(token, address) {
		
		return await admin.auction(token.contract, address);
	}

	async checkPassword(id, password) {

		let result;

		do
		{
			let user = await models.Users.findOne({
				attributes: ['passwd', 'salt'],
				where: { id: id },
			});
				
			let hash = await crypt.genhashedpasswd(password, user.salt);

			result = hash === user.passwd ? true : false;

		}while(false);

		return result;
	}

	async isInternalAddress(address, symbol) {

		let result;

		do
		{
			let valid = await admin.isAddress(address);
			
			if(!valid) {
				result = -1;
				break;
			}
			
			let count = await models.Accounts.count({
				where: { address: address, symbol: symbol },
			});

			result = count > 0 ? 1 : 0;

		}while(false);

		return result;
	}
	
	async isTokenValid(symbol) {
		
		let result;

		do {
		
			let count = await models.Assets.count({
				where: { symbol: symbol },
			});			

			result = count > 0 ? 1 : 0;

		}while(false);

		return result;
	}

	async transferInternal(fromId, to, amount, tokenName) {
		
		let result = new Object();

		do
		{			
			let asset = await models.Assets.findOne({
				where: { symbol: tokenName },
			});
			
			let sender = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: fromId, symbol: tokenName },
			});
			
			let receiver = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { address: to, symbol: tokenName },
			});
			
			console.log(util.getAssetByDecimal(amount, asset.decimal));

			// util.getAssetByDecimal(amount);
			
			let bn_sender_balance = new BN(sender.balance);
			let bn_receiver_balance = new BN(receiver.balance);
			let bn_amount = new BN(util.getAssetByDecimal(amount, asset.decimal));
	
			if(bn_amount.cmp(bn_sender_balance) == 1) {
				result.result = -2;
				break;
			}
			
			let done = await models.Accounts.update({balance: bn_sender_balance.sub(bn_amount).toString()}, {where: {user_id: fromId, symbol: tokenName}});
			
			// if(done == 0) {
			// 	result.result = -2;
			// 	break;
			// }
			
			done = await models.Accounts.update({balance: bn_receiver_balance.add(bn_amount).toString()}, {where: {address: to, symbol: tokenName }});
			
			// if(done == 0) {
			// 	result.result = -3;
			// 	break;
			// }
			
			let uuid = uuidv4();
			let descToken = amount + '의' + tokenName + '을 전송하였습니다.';
			
			done = await models.Transactions_internal.create({uuid: uuid, sender_id: sender.user_id, sender: sender.address, receiver_id: receiver.user_id, receiver: receiver.address, value: bn_amount.toString(), description: descToken, reason: 'txInternal', status: 'completed', asset_id: sender.asset_id });
			result.result = 1;
			result.data = done.dataValues;
			result.data.value = util.getAssetByUnit(done.dataValues.value, asset.decimal);
			result.txid = result.data.id;
			delete result.data.date_time;
			delete result.data.id;
			
			// console.log(result.data);
			
		}while(false);

		return result;
	}	

	async transferByOwnerInternal(fromId, amount, tokenName) {
		
		let result = new Object();

		do
		{
			let asset = await models.Assets.findOne({
				where: { symbol: tokenName },
			});
			
			let sender = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: fromId, symbol: tokenName },
			});
			
			let admin = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: 1, symbol: tokenName },
			});
			
			console.log(util.getAssetByDecimal(amount, asset.decimal));

			// util.getAssetByDecimal(amount);
			
			let bn_sender_balance = new BN(sender.balance);
			let bn_admin_balance = new BN(admin.balance);
			let bn_amount = new BN(util.getAssetByDecimal(amount, asset.decimal));
	
			if(bn_amount.cmp(bn_sender_balance) == 1) {
				result.result = -1;
				break;
			}
			
			let done = await models.Accounts.update({balance: bn_sender_balance.sub(bn_amount).toString()}, {where: {user_id: fromId, symbol: tokenName}});
			
			// if(done == 0) {
			// 	result.result = -2;
			// 	break;
			// }
			
			done = await models.Accounts.update({balance: bn_admin_balance.add(bn_amount).toString()}, {where: {user_id: 1, symbol: tokenName }});
			
			// if(done == 0) {
			// 	result.result = -3;
			// 	break;
			// }
			
			let uuid = uuidv4();
			let descToken = amount + '의' + tokenName + '을 전송하였습니다.';
			
			done = await models.Transactions_internal.create({uuid: uuid, sender_id: sender.user_id, sender: sender.address, receiver_id: admin.user_id, receiver: admin.address, value: bn_amount.toString(), asset_id: sender.asset_id, description: descToken, reason: 'txInternal', status: 'completed' });
			result.result = 1;
			result.data = done.dataValues;
			result.data.value = util.getAssetByUnit(done.dataValues.value, asset.decimal);
			result.txid = result.data.id;
			delete result.data.date_time;
			delete result.data.id;

			// console.log(done);

		}while(false);

		return result;
	}	

	async transfer(id, tokenName, from, to, tokenContract, amount, decodedKey) {
		
		let result = new Object();

		do
		{
			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['asset_type', 'asset_address', 'decimal'],
				where: { symbol: tokenName }
			};

			let account = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: id, symbol: tokenName },
				include: [Assets]
			});

			// let dc_amount = util.getAssetByDecimal(amount, account.asset.decimal);
			let bn_balance = new BN(account.balance);
			let bn_amount = new BN(util.getAssetByDecimal(amount, account.asset.decimal));
	
			if(bn_amount.cmp(bn_balance) == 1) {
				result.result = -1;
				break;
			}

			let tx = await admin.transfer(from, to, tokenContract, bn_amount, decodedKey);
			result.txid = tx.hash(true).toString('hex');
			result.result = 1;
			admin.sendSignedTransaction(tx)
			.then(async confirmedTx => {
				
				// console.log(confirmedTx.transactionHash);
				
				let done = await models.Transactions_internal.update({status: 'completed'}, {where: {tx_hash: confirmedTx.transactionHash}});
				
				console.log(done);

				// update tx into db
				done = await models.Transactions.update({
					block_number: confirmedTx.blockNumber,
					block_hash: confirmedTx.blockHash,
					block_time: confirmedTx.blockTime * 1000 }, 
					{where: {tx_hash: confirmedTx.transactionHash}
				});
				
				console.log(done);
			});
			
			let uuid = uuidv4();
			let descToken = amount + '의' + tokenName + '을 전송하였습니다.';
			
			// insert tx into db
			await models.Transactions.create({tx_hash: '0x' + result.txid, sender_id: id, sender: from, receiver: to, value: bn_amount.toString(), issentout: 1, asset_id: account.asset_id});
			
			await models.Transactions_internal.create({uuid: uuid, tx_hash: '0x' + result.txid, sender_id: id, sender: from, receiver: to, value: bn_amount.toString(), asset_id: account.asset_id, description: descToken, reason: 'txExternal', status: 'pending' });
			
			result.result = 1;
			// result.txid = done.dataValues.id;
			// result = tx;

		}while(false);

		return result;
	}
	
	async collectAll(token, master) {
		
		let result;

		do {
			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['asset_type', 'asset_address', 'decimal'],
				where: { symbol: token['name'] }
				// where: { asset_type: { [Op.between]: [20, 21] }	}
			};
			
			let accounts = await models.Accounts.findAll({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance'],
				where: { user_id: { [Op.ne]: 1 } },
				include: [Assets]
			});
			
			let txlist = [];
			
			for(let i = 0; i < accounts.length; i++)
				txlist.add(await admin.transferByOwner(accounts[i].address, master.address, token, accounts[i].reminder, master.address, master.secret));
			
			result = txlist;

		} while(false);

		return result;
	}
	
	async getTransactions(id, symbol) {
		
		let result;

		do {

			let txQuery;
			
			if(symbol === 'undefined' || symbol === null) {
				
				let Assets = {
					model: models.Assets,
					required: true,		// true: inner join, false: outer join
					attributes: ['asset_type', 'asset_address', 'decimal'],
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
					attributes: ['asset_type', 'asset_address', 'decimal'],
					where: { symbol: symbol	}
				};
				
				txQuery = { 
					attributes: ['id', 'tx_hash', 'sender_id', 'receiver', 'value', 'issentout', 'asset_id', 'block_time', 'date_time'],
					where: { sender_id: id }, include: [ Assets ]
				};
			}
			
			
			let txlist = await models.Transactions.findAll(txQuery);
			
			for(let i = 0; i < txlist.length; i++) {
				txlist[i].setDataValue('value' , util.getAssetByUnit(txlist[i].value, txlist[i].asset.decimal));
			}
	
			result = txlist;
			result.result = 1;

		}while(false);

		return result;
	}

	async exchangeForPoint(userId, pointSave, tokenUse, tokenName) {
		
		let result = new Object();

		do
		{
			let asset = await models.Assets.findOne({
				where: { symbol: tokenName },
			});
			
			let user = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: userId, symbol: 'SP' },
			});

			let tokenUser = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: userId, symbol: tokenName },
			});
			
			let admin = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: 1, symbol: tokenName },
			});
			

			// point check
			
			let bn_sender_balance = new BN(tokenUser.balance);
			let bn_receiver_balance = new BN(admin.balance);
			let bn_amount = new BN(util.getAssetByDecimal(tokenUse, asset.decimal));
	
			if(bn_amount.cmp(bn_sender_balance) == 1) {
				result.result = -1;
				break;
			}

			bn_sender_balance = bn_sender_balance.sub(bn_amount);
			bn_receiver_balance = bn_receiver_balance.add(bn_amount);

			// let descPoint = pointSave + '의 포인트를 적립하였습니다.';
			// let descToken = tokenUse + '의 ' + tokenName + '를 차감하였습니다.';
			
			let descPoint = tokenUse + ' ' + tokenName + '를 차감하고 ' + pointSave + ' 포인트를 적립하였습니다.';
			let descToken = pointSave + ' 포인트를 적립하고 ' + tokenUse + ' ' + tokenName + '를 차감하였습니다.';


			let body = { 'storeCd': '3152150001', 'cardNo': user.address, 'money': pointSave, 'msg': descPoint};	
			let pointOpt = util.getMaruPointOpt('/pointSave', body, global.env.MARU_POINT_APIKEY);
			let response = await util.requestUrl(pointOpt);

			if(response.result === false) {
				result.result = -2;
				break;
			}

			// account.cardNo = response.cardNo;
			
			// for(let i = 0; i < assets.length; i++) {					
			// 	accounts.push({
			// 		address: assets[i].id === 4 ? account.cardNo : account.address,
			// 		secret: assets[i].id === 4 ? '' : account.secret,
			// 	});
			// }

			// { result: true,
			// 	msg: '정상처리',
			// 	authority: '12576644',
			// 	storeCd: '3152150001',
			// 	storeName: '마루포인트(통합)',
			// 	tradeDate: '20210426',
			// 	tradeTime: '015125',
			// 	point: '100',
			// 	totalPoint: 47519 }

			// console.log(response);
			// result = response;
			// break;
			
			// UPDATE accounts A
			// SET A.balance = A.balance + 
			// 	CASE WHEN (A.asset_id = 4) then 10 
			// 	WHEN (A.asset_id = 2) then -10
			// 	else 0 end
			// where A.user_id=30
			
			let query = `CASE WHEN (asset_id=4 AND user_id=${user.user_id}) THEN ${response.totalPoint} WHEN (asset_id=${asset.id} AND user_id=${user.user_id}) THEN ${bn_sender_balance.toString()} WHEN (asset_id=${asset.id} AND user_id=1) THEN ${bn_receiver_balance.toString()} ELSE balance END`;
			
			// console.log(query);
			
			let done = await models.Accounts.update(
				{	balance: models.sequelize.literal(query) },
				{ where: { [Op.or]: [{ user_id: user.user_id }, { user_id: 1 }]}}
			);
			
			let uuidPoint = uuidv4();
			let uuidToken = uuidv4();
						
			done = await models.Transactions_internal.create({uuid: uuidPoint, sender_id: admin.user_id, sender: 'admin', receiver_id: user.user_id, receiver: user.address, value: pointSave, description: descPoint, reason: 'savePoint', status: 'completed', asset_id: 4});
			
			// result.pointTxId = done.dataValues.id;
			// result.pointData = done.dataValues;
			
			// done = await models.Transactions_internal.create({sender_id: 1, sender: 'marucard', receiver_id: user.user_id, receiver: user.address, value: pointSave, reason: 'savePoint', status: 'completed', asset_id: 4});
			
			done = await models.Transactions_internal.create({uuid: uuidToken, sender_id: tokenUser.user_id, sender: tokenUser.address, receiver_id: admin.user_id, receiver: admin.address, value: bn_amount.toString(), description: '', description: descToken, reason: 'useToken', status: 'completed', asset_id: tokenUser.asset_id });			

			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['symbol', 'asset_info', 'decimal'],
			};
			
			let txInfo = await models.Transactions_internal.findOne(
				{where: {uuid: uuidToken},
				include: [Assets]}
			);

			result.result = 1;
			result.tokenData = txInfo;
			result.tokenTxid = txInfo.id;
			// result.tokenTxid = done.dataValues.id;
			// result.tokenData = done.dataValues;
			// result.tokenData.description = pointSave + '의 포인트를 적립하고, ' + descToken;

			// result.tokenData.date_time = txInfo.date_time;

			// delete result.pointData.date_time;
			// delete result.pointData.id;
			// delete result.tokenData.date_time;
			delete result.tokenData.id;			

		} while(false);

		return result;
	}
	
	async save(adminId, address, amount, tokenName) {
		
		let result;

		do
		{
			let tx = await admin.transferByOwner(from, to, tokenContract, amount, master, decodedKey);
			
			result = tx;

		}while(false);

		return result;
	}
	
	async deploy() {
		
		let result;

		do
		{
			console.log(await admin.getBalance('0x12b7b909282a14dE8C4384C5a2a6F63157428Fb5'));
			
			let tx = await admin.deploy("0x12b7b909282a14dE8C4384C5a2a6F63157428Fb5", "0xa79bd4737881648cd6960ddcf4b37b61fb896115d89b902c326f6e4ed31636a0");
			
			// let tx = await admin.deploy("0x922935c3496Dc27abc76141F2DbC2d4094ee6A0E", "0x5c577c11c3d97068ebe303d470ced3717772fe4af970c3251783037e8e0816c1");
			
			// let tx = await admin.deploy("0x31FAd11484478CFBE9C6ca67AaD582686C815754", "0xe246d322380372d171b4943f2a1f8bec2d1d28366f2d16b4b19c166818e7a273");
			
			result = tx;

		}while(false);

		return result;
		
	}
		
	async mint(master, token, target, amount, passwd) {
		
		let result;

		do
		{
			
			let Assets = await models.Assets.findOne({
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['asset_type', 'asset_address', 'decimal'],
				where: { symbol: token.name }
			});
			
			let bn_amount = new BN(util.getAssetByDecimal(amount, Assets.decimal));
			
			let tx = await admin.mint(master, token.contract, target, bn_amount, passwd);
			
			result = tx;

		}while(false);

		return result;
		
	}

}


module.exports = etherCtrl;