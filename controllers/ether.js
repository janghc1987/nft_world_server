
const ethfuncs = require('../drivers/ethdrv');
const cryptfuncs = require('../drivers/cryptfuncs');
const models = require('../models');
const BN = require('bn.js');

const users = new ethfuncs('ropsten', 3, global.env.INFURA_USERS_KEY);
const admin = new ethfuncs('ropsten', 3, global.env.INFURA_ADMIN_KEY);
const crypt = new cryptfuncs();

const Op = models.Sequelize.Op;

class tokenCtrl {

	// crypt;
	

	constructor() {

		// this.crypt = new cryptfuncs();

	}
	
	async newMaster(passphrase) {

		let result = new Object();;

		do
		{
			result.newmaster = await admin.newAccount(passphrase);
			
			let encoded = await crypt.encryptEx(result.newmaster.privateKey, global.env.API_ENCRYPTION_KEY);
			let temp = encoded.split(':');
		
			result.secret = temp[1];
			result.cryptoiv = temp[0];

		}while(false);

		return result;
	}
	
	async getMaster() {

		let result;

		do
		{
			let master = await models.Accounts.findOne({
				attributes: ['address', 'secret', 'user_id', 'symbol', 'balance'],
				where: {
					user_id: 1,
					symbol: 'ETH'
				},
			});
			
			result = master;

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
	
	async transfer(id, from, to, amount, decodedKey) {
		
		let result = new Object();

		do
		{
			let Assets = {
				model: models.Assets,
				required: true,		// true: inner join, false: outer join
				attributes: ['asset_type', 'asset_address'],
				where: { asset_type: 20	}
			};

			let account = await models.Accounts.findOne({
				attributes: ['id', 'address', 'user_id', 'symbol', 'balance', 'asset_id'],
				where: { user_id: id, symbol: 'ETH' },
				include: [Assets]
			});

			let bn_balance = new BN(account.balance);
			let bn_amount = new BN(util.getAssetByDecimal(amount));
	
			if(bn_amount.cmp(bn_balance) == 1) {				
				result.result = -1;
				break;
			}

			let tx = await admin.createTransaction(from, to, bn_amount, decodedKey);
			result.transactionHash = tx.hash(true).toString('hex');
			result.result = 1;
			admin.sendSignedTransaction(tx)
			.then(async confirmedTx => {
				// insert tx into db
				let value = await models.Transactions.create({
					tx_hash: confirmedTx.transactionHash,
					block_number: confirmedTx.blockNumber,
					block_hash: confirmedTx.blockHash,
					sender: confirmedTx.from,
					receiver: confirmedTx.to,
					value: bn_amount.toString(),
					issentout: 1,
					asset_id: account.asset_id,
					block_time: confirmedTx.blockTime * 1000
				});				
				console.log(value);
			});
			
		}while(false);

		return result;
	}	
}


module.exports = tokenCtrl;