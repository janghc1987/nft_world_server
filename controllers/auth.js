
const jwt = require('jsonwebtoken'); // module import
const passport = require('passport');
const models = require('../models');
const cryptFunc = require('../drivers/cryptfuncs');
// const { Utils } = require('sequelize/types');
const util = require('../drivers/util');

const crypt = new cryptFunc();

// exports.create = function(req, res) {
	
// 	passport.authenticate('local', {session: false}, (err, user) => {
// 		if(err || !user) {
// 			return res.status(400).json({
// 				message: 'something is not rigth',
// 				user: user
// 			});			
// 		}
		
// 		req.login(user, {session: false}, (err) => {
// 			if(err) {
// 				res.send(err);
// 			}
// 			const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET);
// 			return res.json({user, token});
// 		});
// 	})(req, res);
// }


class authCtrl {

	constructor() {

	}
	
	async create(req, res) {
		
		console.log(req.body);
		
		passport.authenticate('local', {session: false}, (err, user) => {
			
			if(err || !user) {
				return res.status(400).json({
					message: 'something is not right',
					user: user
				});			
			}
			
			req.login(user, {session: false}, (err) => {
				
				if(err) {
					res.send(err);
				}
				const token = jwt.sign(user.toJSON(), global.env.JWT_SECRET);
				return res.json({user, token});
			});
			
		})(req, res);
	}

	async jwtverify(jwtauthcode, tkdata) {

		let res = false;    
		let decoded = '';

		do
		{
			try {
				decoded = jwt.verify(jwtauthcode, tkdata['secretkey']);
			}
			catch(exp) {
				break;
			}

			console.log(decoded.pwd);
			console.log(decoded.name);

			if(decoded.pwd != tkdata['passphrase'] || decoded.name != tkdata['name'])
				break;

			res = true;

		} while(false);

		return true;
	}

	async tokenDecode(active) {

		let result;

		do {

			if(util.isEmpty(active)) {
				result = new Object();
				result.code = 401;
				result.message = "invalid active token value";
				result.status = "invalidActiveTokenValue";
				break;
			}

			result = await jwt.decode(active.split('Bearer ')[1]);
			if(result == null || result == false) {
				result = new Object();
				result.code = 401;
				result.message = "invalid active token value";
				result.status = "invalidActiveTokenValue";
				break;
			}
			
			result.code = 200;

		} while(false);

		return result;
	}

	async tokenVerify(active) {
		
		// return res.json({result: 'tokenverify'});		
		// let active = req.headers.authorization.split('Barear ')[1];
		// let decoded = jwt.decode(active);
		let result = await new Promise((resolve, reject) => {
			jwt.verify(active, global.env.JWT_ACTIVE_SECRET, function(err, decoded) {
				if(err)
					reject(err);
				else
					resolve(decoded);
			});
		});

		return result;
	}

	async checkPassword(email, password) {

		let result;

		do {
			let user = await models.Users.findOne({ 
				attributes: ['passwd', 'salt'],
				where: { email: email },
			});

			if(!user) {
				result = false;
				break;
			}
				
			let hash = await crypt.genhashedpasswd(password, user.salt);

			result = hash === user.passwd ? true : false;

		}while(false);

		return result;
	}

	async getApiKey(email) {

		let result;

		do {

			let user = await models.Users.findOne({ attributes: ['cryptoiv'], where: { email: email } });

			if(user.cryptoiv) {
				result = await crypt.getEncryptEx(email, global.env.API_ENCRYPTION_KEY, user.cryptoiv);
				break;
			}

			let encoded = await crypt.encryptEx(email, global.env.API_ENCRYPTION_KEY);
			let temp = encoded.split(':');
			let done = await models.Users.update({ cryptoiv: temp[0] }, { where: { email: email } });
			result = encoded;

		} while(false);

		return result;
	}
	
	async getAdminApiKey(email) {

		let result;

		do {

			let user = await models.misMember.findOne({ attributes: ['mb_apikey', 'mb_apitime', 'mb_salt'], where: { mb_email: email } });			

			if(!user.mb_apikey) {
				// result = await crypt.getEncryptEx(email, global.env.API_ENCRYPTION_KEY, user.mb_apikey);
				let salt = await crypt.gensalt();
				let time = new Date().getTime().toString();
				let apikey = await crypt.generateToken(salt, time, email);
				
				await models.misMember.update({ mb_apikey: apikey, mb_apitime: time, mb_salt: salt }, { where: { mb_email: email } });
				
				result = apikey;
				break;
			}
			
			if(user.mb_apikey === await crypt.generateToken(user.mb_salt, user.mb_apitime, email))
				result = user.mb_apikey;
			else
				result = false;

		} while(false);

		return result;
	}

	async verifyApiKey(encoded) {

		let result;

		do {
			
			let user = await models.misMember.findOne({ attributes: ['mb_apikey', 'mb_salt'], where: { mb_email: email } });


			let email = await crypt.decryptEx(encoded, global.env.API_ENCRYPTION_KEY);
			result = await models.Users.findOne({ attributes: ['cryptoiv', 'id', 'email'], where: { email: email } });

		} while(false);

		return result;
	}
	
	
	async verifyAdminApiKey(apikey) {

		let result;

		do {

			let user = await models.misMember.findOne({ attributes: ['mb_email', 'mb_apitime', 'mb_salt'], where: { mb_apikey: apikey } });
			
			if(!util.isEmpty(user) && apikey === await crypt.generateToken(user.mb_salt, user.mb_apitime, user.mb_email))
				result = true;
			else
				result = false;

		} while(false);

		return result;
	}		

	async isValidKey(id) {

		let result;

		do
		{
			let user = await models.Users.findOne({
				where: { id: id },
			});			

			result = user.class === 'admin' ? true : false;

		}while(false);

		return result;
	}
	
	async checkAdmin(adminEmail) {
		
		let result;

		do
		{
			let admin = await models.misMember.findOne({
				where: { mb_email: adminEmail },
			});
			
			if(!admin)
				result = false;

			result = admin.mb_status === 'active' ? true : false;

		}while(false);

		return result;
	}
	
	async resetPassword(email, newPasswrod) {

		let result = new Object();

		do
		{
			
			let salt = await crypt.gensalt();
			// let password = await crypt.genpassword();
			let hash = await crypt.genhashedpasswd(newPasswrod, salt);
		
			result.result = await models.Users.update({passwd: hash, salt: salt}, {where: {email: email}});
			
			result.password = newPasswrod;

		}while(false);

		return result;
	}
}

module.exports = authCtrl;