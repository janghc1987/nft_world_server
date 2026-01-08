
const cryptfuncs = require('../drivers/cryptfuncs');
const models = require('../models');
const util = require('../drivers/util');
const BN = require('bn.js');
const { v4: uuidv4 } = require('uuid');

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
				attributes: ['address', 'secret', 'user_id', 'symbol', 'balance'],
				where: { user_id: 1, symbol: tokenName },
			});
			
			result = master;

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

	async exchangeForToken(userId, pointUse, tokenSave, tokenName) {
		
		let result = new Object();

		do
		{
			// let accounts = await models.Accounts.findAll({
			// 	attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
			// 	where: {
			// 		[Op.or]: [{user_id: fromId, symbol: 'MPT' }, {address: to, symbol: 'MPT' }]
			// 	},
			// });
			let asset = await models.Assets.findOne({
				where: { symbol: tokenName },
			});
			
			let pointUser = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: userId, symbol: 'SP' },
			});

			let user = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: userId, symbol: tokenName },
			});
			
			let admin = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: 1, symbol: tokenName },
			});
			

			// point check
			
			let bn_sender_balance = new BN(admin.balance);
			let bn_receiver_balance = new BN(user.balance);
			let bn_amount = new BN(util.getAssetByDecimal(tokenSave, asset.decimal));
	
			if(bn_amount.cmp(bn_sender_balance) == 1) {
				result.result = -1;
				break;
			}

			bn_sender_balance = bn_sender_balance.sub(bn_amount);
			bn_receiver_balance = bn_receiver_balance.add(bn_amount);

			let descPoint = tokenSave + ' ' + tokenName + '를 적립하고 ' + pointUse + ' 포인트를 차감하였습니다.';
			let descToken = pointUse + ' 포인트를 차감하고 ' + tokenSave + ' ' + tokenName + '를 적립하였습니다.';

			let body = { 'storeCd': '3152150001', 'cardNo': pointUser.address, 'point': pointUse, 'msg': descPoint};	
			let pointOpt = util.getMaruPointOpt('/pointUse', body, global.env.MARU_POINT_APIKEY);
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
			
			let query = `CASE WHEN (asset_id=4 AND user_id=${user.user_id}) THEN ${response.totalPoint} WHEN (asset_id=${asset.id} AND user_id=${user.user_id}) THEN ${bn_receiver_balance.toString()} WHEN (asset_id=${asset.id} AND user_id=1) THEN ${bn_sender_balance.toString()} ELSE balance END`;
			
			// console.log(query);
			
			let done = await models.Accounts.update(
				{	balance: models.sequelize.literal(query) },
				{ where: { [Op.or]: [{ user_id: user.user_id }, { user_id: 1 }]}}
			);
			
			let uuidPoint = uuidv4();
			let uuidToken = uuidv4();
			
			
			done = await models.Transactions_internal.create({uuid: uuidPoint, sender_id: pointUser.user_id, sender: pointUser.address, receiver_id: admin.user_id, receiver: 'admin', value: pointUse, description: descPoint, reason: 'usePoint', status: 'completed', asset_id: 4 });
			
			// result.pointTxId = done.dataValues.id;
			// result.pointData = done.dataValues;			
			
			done = await models.Transactions_internal.create({uuid: uuidToken, sender_id: admin.user_id, sender: admin.address, receiver_id: user.user_id, receiver: user.address, value: bn_amount.toString(), description: descToken, reason: 'saveToken', status: 'completed', asset_id: user.asset_id });

			// result.result = 1;
			// result.tokenTxid = done.dataValues.id;
			// result.tokenData = done.dataValues;
			// result.description = pointUse + '의 포인트를 차감하고, ' + descToken;

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
			// result.tokenData.description = pointUse + '의 포인트를 차감하고, ' + descToken;
			// delete result.pointData.date_time;
			// delete result.pointData.id;
			// delete result.tokenData.date_time;
			delete result.tokenData.id;
			
			// let done = await models.Accounts.update({balance: admin.balance + amount}, {where: {user_id: userId, symbol: 'MPT'}});
			
			// let done = await models.Accounts.update({balance: bn_sender_balance.sub(bn_amount).toString()}, {where: {user_id: userId, symbol: tokenName}});
			
			// // if(done == 0) {
			// // 	result.result = -2;
			// // 	break;
			// // }
			
			// done = await models.Accounts.update({balance: bn_receiver_balance.add(bn_amount).toString()}, {where: {address: to, symbol: tokenName }});
			
			// // if(done == 0) {
			// // 	result.result = -3;
			// // 	break;
			// // }
			
			// done = await models.Transactions_internal.create({sender_id: sender.user_id, sender: sender.address, receiver_id: receiver.user_id, receiver: receiver.address, value: amount, asset_id: sender.asset_id });
			// result.result = 1;
			// result.txid = done.dataValues.id;
			// console.log(done);

		}while(false);

		return result;
	}	
}


module.exports = etherCtrl;