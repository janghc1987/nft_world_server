const express = require('express');
const { check, body, query, validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken'); // module import
const excp = require('../../../drivers/exceptions');
const usersfunc = require('../../../controllers/users');
const authCrtl = require('../../../controllers/auth');
const accountCtrl = require('../../../controllers/accounts');
const tokenCtrl = require('../../../controllers/token');
const pointCtrl = require('../../../controllers/point');
// const { not } = require('sequelize/types/lib/operators');
// const { not } = require('sequelize/types/lib/operators');

const router = express.Router();
const users = new usersfunc();
const token = new tokenCtrl();
const auth = new authCrtl();
const accounts = new accountCtrl();
const point = new pointCtrl();

/**
 * @swagger
 * tags:
 *    name: MSC Token
 *    description: API for MSC Token
 */

/**
 * @swagger
 * /api/v1/token/register:
 *   post:
 *     summary: post user register (사용자 계정 만들기)
 *     tags: [MSC Token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: body
 *        name: users
 *        description: users register
 *        schema:
 *          required:
 *            - email
 *            - password
 *          properties: 
 *            email: 
 *              type: string
 *            password: 
 *              type: string
 *            nick: 
 *              type: string
 *            name: 
 *              type: string
 *            phone: 
 *              type: string
 *     responses:
 *       200:
 *         description: post user register
 *         schema:
 *           type: object
 *           properties:
 *             accounts:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.post('/register', excp.wrapAsync(users.register));
//  router.post('/register', async function(req, res) {

//   let data = new Object();
//   data.result = new Object();
//   data.txid = null;

//   do
//   {
// 		// check auth
// 		// let user = await auth.tokenDecode(req.headers.authorization);
				
// 		// check user password
// 		let isValid = await auth.checkPassword(req.body['email'], req.body['password']);
		
// 		if(!isValid)
//     {
//       data.result.code = 401;
//       data.result.message = 'invalid password';
//       data.result.status = 'invalidPassword';
//       res.status(data.result.code);

//       break;
//     }

// 		let apiKey = await auth.getApiKey(req.body['email']);

// 		data.result.code = 200;
//     data.result.message = 'get api key succeeded';
//     data.result.status = 'getApiKeySucceeded';
// 		data.apiKey = apiKey;
//     res.status(data.result.code);

// 	} while(false);
  
//   res.send(data);

// });

/**
 * @swagger
 * /api/v1/token/getApiKey:
 *   post:
 *     summary: get API Key (API Key 가져오기)
 *     tags: [MSC Token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: body
 *        name: user
 *        description: get API Key
 *        schema:
 *          required:
 *            - email
 *            - password
 *          properties: 
 *            email: 
 *              type: string
 *            password: 
 *              type: string
 *     responses:
 *       200:
 *         description: get API Key
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
router.post('/getApiKey', 
	[
		// body('email').isEmail().withMessage('invalid Email Address'),
		body('password').notEmpty().withMessage('empty Password')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();

  do {
		// check auth
		// let user = await auth.tokenDecode(req.headedrs.authorization.split('Barear ')[1]);

		// console.log(req.body['email']);

		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}
				
		// check user password
		let isValid = await auth.checkPassword(req.body['email'], req.body['password']);
		
		if(!isValid) {
      data.result.code = 401;
      data.result.message = 'invalid password';
      data.result.status = 'invalidPassword';
      res.status(data.result.code);

      break;
    }

		let apiKey = await auth.getApiKey(req.body['email']);

		data.result.code = 200;
    data.result.message = 'get api key succeeded';
    data.result.status = 'getApiKeySucceeded';
		data.apiKey = apiKey;
    res.status(data.result.code);

	} while(false);
  
  res.send(data);
});


/**
 * @swagger
 * /api/v1/token/accounts:
 *   get:
 *     summary: get accounts (사용자 계좌 정보 조회)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *     responses:
 *       200:
 *         description: get accounts
 *         schema:
 *           type: object
 *           properties:
 *             accounts:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.get('/accounts', async function(req, res) {

  let data = new Object();
  data.result = new Object();

	let ret;
	
	// res.render()
  do {
		// check auth
		user = await auth.decodeApiKey(req.headers.authorization);

		if(user.email == null) {
      data.result.code = 400;
      data.result.message = 'active token expired';
      data.result.status = 'activeTokenExpired';
      res.status(data.result.code);
      break;
    }
 
		// get account info
		ret = await accounts.getAccount(user.id, user.email);		

    data.result.code = 200;
    data.result.message = 'getting account information succeeded';
    data.result.status = 'gettingAccountInformationSucceeded';
		data.accounts = ret;
    res.status(data.result.code);

  } while(false);

  res.send(data);
});


// /**
//  * @swagger
//  * /api/v1/token/accounts/address/{address}:
//  *   get:
//  *     summary: get accounts by address (사용자 계좌 정보 조회)
//  *     tags: [MSC Token]
//  *     security:
//  *      - bearerAuth: []
//  *     parameters:
//  *      - in: header
//  *        name: accept-language
//  *        type: string
//  *        required: true
//  *        enum: [en-US, ko-KR, zh-CN]
//  *      - in: path
//  *        name: address
//  *        type: string
//  *        required: true
//  *     responses:
//  *       200:
//  *         description: get accounts by address
//  *         schema:
//  *           type: object
//  *           properties:
//  *             accounts:
//  *               type: string
//  *             result:
//  *               properties:
//  *                 code:
//  *                   type: integer
//  *                 message:
//  *                   type: string
//  *                 status:
//  *                   type: string
//  */
//  router.get('/accounts/address/:address', async function(req, res) {

//   let data = new Object();
//   data.result = new Object();

// 	let ret;
	
// 	// res.render()
//   do
//   {
// 		// check auth
// 		let user = await auth.decodeApiKey(req.headers.authorization);
		
// 		// check user password
// 		let isValid = await auth.isValidKey(user.id);

// 		if(!isValid) {
// 			data.result.code = 401;
//       data.result.message = 'invalid class';
//       data.result.status = 'invalidClass';
// 			res.status(data.result.code);

// 			break;
// 		}
		
// 		// get account info
// 		ret = await accounts.getAccountByAddress(req.params.address);

//     data.result.code = 200;
//     data.result.message = 'getting account information succeeded';
//     data.result.status = 'gettingAccountInformationSucceeded';
// 		data.accounts = ret;
//     res.status(data.result.code);

//   } while(false);

//   res.send(data);
// });


// /**
//  * @swagger
//  * /api/v1/token/accounts/email/{email}:
//  *   get:
//  *     summary: get accounts by email (사용자 계좌 정보 조회)
//  *     tags: [MSC Token]
//  *     security:
//  *      - bearerAuth: []
//  *     parameters:
//  *      - in: header
//  *        name: accept-language
//  *        type: string
//  *        required: true
//  *        enum: [en-US, ko-KR, zh-CN]
//  *      - in: path
//  *        name: email
//  *        type: string
//  *        required: true
//  *     responses:
//  *       200:
//  *         description: get accounts by email
//  *         schema:
//  *           type: object
//  *           properties:
//  *             accounts:
//  *               type: string
//  *             result:
//  *               properties:
//  *                 code:
//  *                   type: integer
//  *                 message:
//  *                   type: string
//  *                 status:
//  *                   type: string
//  */
//  router.get('/accounts/email/:email', async function(req, res) {

//   let data = new Object();
//   data.result = new Object();

// 	let ret;
	
// 	// res.render()
//   do
//   {
// 		// check auth
// 		let user = await auth.decodeApiKey(req.headers.authorization);
		
// 		// check user password
// 		let isValid = await auth.isValidKey(user.id);
		
// 		if(!isValid) {
//       data.result.code = 401;
//       data.result.message = 'invalid class';
//       data.result.status = 'invalidClass';
//       res.status(data.result.code);

//       break;
//     }
		
// 		// get account info
// 		ret = await accounts.getAccountByEmail(req.params.email);

//     data.result.code = 200;
//     data.result.message = 'getting account information succeeded';
//     data.result.status = 'gettingAccountInformationSucceeded';
// 		data.accounts = ret;
//     res.status(data.result.code);

//   } while(false);

//   res.send(data);
// });



/**
 * @swagger
 * /api/v1/token/save/{tokenName}:
 *   put:
 *     summary: save token (토큰 적립하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *        required: true
 *      - in: body
 *        name: token
 *        description: save token
 *        schema:
 *          required:
 *            - amount
 *          properties: 
 *            amount: 
 *              type: integer
 *     responses:
 *       200:
 *         description: save token
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.put('/save/:tokenName', 
 	[
		body('amount').isFloat({min: 0.0001}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}

		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		// check user password
		// let isValid = await auth.isValidKey(user.id);
		
		if(!user) {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
		
		let sender = await token.getMaster(req.params.tokenName);
		let receiver = await token.getAccountById(req.params.tokenName, user.id);

		if(sender == -1 || receiver == -1) {
      data.result.code = 400;
      data.result.message = 'invalid token name';
      data.result.status = 'invalidTokenName';
      res.status(data.result.code);

      break;
    }
		
		let isInternal = await token.isInternalAddress(receiver.address, req.params.tokenName);		
		// check enough money to send out in master balance from db and then send
		if(isInternal == 1) {

			// check enough money to send internally in master balance from db and then send
			tx = await token.transferInternal(sender.user_id, receiver.address, req.body['amount'], req.params.tokenName);
			
			if(tx.result < 0)	{
				data.result.code = 400;
				data.result.message = 'save token transaction failed';
				data.result.status = 'saveTokenTransactionFailed';
				res.status(data.result.code);

				break;
			}

			data.result.code = 200;
			data.result.message = 'save token internal transaction succeeded';
			data.result.status = 'saveTokenInternalTransactionSucceeded';
			data.data = tx.data;
			data.txid = tx.txid;
		} else if(isInternal == 0) {
			
			let tokenObj = await token.getContract(req.params.tokenName);
		
			// check enough money to send out in master balance from db and then send
			tx = await token.transfer(sender.user_id, req.params.tokenName, sender.address, receiver.address, tokenObj['contract'], req.body['amount'], sender.secret);
			
			if(tx.result < 0)	{
				data.result.code = 400;
				data.result.message = 'save token transaction failed';
				data.result.status = 'saveTokenTransactionFailed';
				res.status(data.result.code);

				break;
			}

			data.result.code = 200;
			data.result.message = 'save token external transaction succeeded';
			data.result.status = 'saveTokenExternalTransactionSucceeded';
			data.txid = tx.txid;
		} else {
			
			data.result.code = 400;
			data.result.message = 'receiver address is invalid';
			data.result.status = 'receiverAddressIsInvalid';
			res.status(data.result.code);
		}
		
    data.result.code = 200;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});


/**
 * @swagger
 * /api/v1/token/use/{tokenName}:
 *   put:
 *     summary: use token (토큰 사용하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *        required: true
 *      - in: body
 *        name: token
 *        description: use token
 *        schema:
 *          required:
 *            - amount
 *          properties: 
 *            amount: 
 *              type: integer
 *     responses:
 *       200:
 *         description: use token
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.put('/use/:tokenName', 
	[
		body('amount').isFloat({min: 0.0001}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do {

		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}

		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		// check user password
		// let isValid = await auth.isValidKey(user.id);
		
		if(!user) {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
		
		let receiver = await token.getMaster(req.params.tokenName);
		let sender = await token.getAccountById(req.params.tokenName, user.id);
		
		if(sender == -1 || receiver == -1) {
      data.result.code = 400;
      data.result.message = 'invalid token name';
      data.result.status = 'invalidTokenName';
      res.status(data.result.code);

      break;
    }

		// check enough money to send out in master balance from db and then send
		let isInternal = await token.isInternalAddress(receiver.address, req.params.tokenName);

		if(isInternal == 1) {

			// check enough money to send internally in master balance from db and then send
			tx = await token.transferInternal(sender.user_id, receiver.address, req.body['amount'], req.params.tokenName);
			
			if(tx.result < 0)	{
				data.result.code = 400;
				data.result.message = 'use token transaction failed';
				data.result.status = 'useTokenTransactionFailed';
				res.status(data.result.code);

				break;
			}

			data.result.message = 'use token internal transaction succeeded';
			data.result.status = 'useTokenInternalTransactionSucceeded';
			data.data = tx.data;
			data.txid = tx.txid;
			// delete data.data.id;
		} else if(isInternal == 0) {
			
			// get master address, secret
			let tokenObj = await token.getContract(req.params.tokenName);
		
			// check enough money to send out in master balance from db and then send
			tx = await token.transfer(sender.user_id, req.params.tokenName, req.body['address'], receiver.address, tokenObj['contract'], req.body['amount'], sender.secret);
			
			if(tx.result < 0)	{
				data.result.code = 400;
				data.result.message = 'use token transaction failed';
				data.result.status = 'useTokenTransactionFailed';
				res.status(data.result.code);

				break;
			}

			data.result.message = 'use token external transaction succeeded';
			data.result.status = 'useTokenExternalTransactionSucceeded';
			data.txid = tx.txid;
		} else {
			
			data.result.code = 400;
			data.result.message = 'receiver address is invalid';
			data.result.status = 'receiverAddressIsInvalid';
			res.status(data.result.code);
		}
		
    data.result.code = 200;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});


/**
 * @swagger
 * /api/v1/token/exchangeForPoint/{tokentName}:
 *   put:
 *     summary: exchange token for point (토큰을 포인트로 전환하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokentName
 *        type: string
 *      - in: body
 *        name: token
 *        description: exchange token for point
 *        schema:
 *          required:
 *            - tokenUse
 *            - pointSave
 *          properties: 
 *            tokenUse: 
 *              type: integer
 *            pointSave: 
 *              type: integer
 *     responses:
 *       200:
 *         description: exchange token for point
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.put('/exchangeForPoint/:tokenName', 
	[
		body('pointSave').isFloat({min: 1}).withMessage('invalid Number Value'),
		body('tokenUse').isFloat({min: 0.0001}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do {

		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}

		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);
	
		if(user.email === -1) {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
				
		// check user password
		// let isValid = await token.checkPassword(user.id, req.body['password']);
		
		// if(!isValid)
    // {
    //   data.result.code = 401;
    //   data.result.message = 'invalid password';
    //   data.result.status = 'invalidPassword';
    //   res.status(data.result.code);

    //   break;
    // }
		
		// check enough money to send out in master balance from db and then send
		let tx = await token.exchangeForPoint(user.id, req.body['pointSave'], req.body['tokenUse'], req.params.tokenName);

		if(tx.result < 0) {
      data.result.code = 400;
      data.result.message = 'exchange token to point failed';
      data.result.status = 'exchangeTokenToPointFailed';
      res.status(data.result.code);

      break;
    }

		
		// let tx = await token.pointSave(user.id, req.body['pointAmount']);

    data.result.code = 200;
    data.result.message = 'exchange token to point succeeded';
    data.result.status = 'exchangeTokenToPointSucceeded';
		data.txid = tx.transactionHash;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});


/**
 * @swagger
 * /api/v1/token/exchangeFor/{tokentName}:
 *   put:
 *     summary: exchange point for token (포인트를 토큰으로 교환하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokentName
 *        type: string
 *      - in: body
 *        name: point
 *        description: exchange point for token
 *        schema:
 *          required:
 *            - pointUse
 *            - tokenSave
 *          properties: 
 *            pointUse: 
 *              type: integer
 *            tokenSave: 
 *              type: integer
 *     responses:
 *       200:
 *         description: exchange point for token
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.put('/exchangeFor/:tokenName', 
	[
		body('pointUse').isFloat({min: 1}).withMessage('invalid Number Value'),
		body('tokenSave').isFloat({min: 0.0001}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do {

		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}


		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		if(user.email === -1) {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
		
		// check enough money to send out in master balance from db and then send
		let tx = await point.exchangeForToken(user.id, req.body['pointUse'], req.body['tokenSave'], req.params.tokenName);

		if(tx.result < 0) {
      data.result.code = 400;
      data.result.message = 'exchange point to token failed';
      data.result.status = 'exchangePointToTokenFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'exchange point to token succeeded';
    data.result.status = 'exchangePointToTokeSucceeded';
		data.txid = tx.transactionHash;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});



/**
 * @swagger
 * /api/v1/token/transactions/{AssetName}:
 *   get:
 *     summary: get transactions (외부 거래 확인하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: AssetName
 *        type: string
 *      - in: query
 *        name: PageNumber
 *        type: integer
 *      - in: query
 *        name: PageSize
 *        type: integer
 *     responses:
 *       200:
 *         description: get transactions
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.get('/transactions/:AssetName', 
	[
		query('PageNumber').isFloat({min: 1}).withMessage('invalid Number Value'),
		query('PageSize').isFloat({min: 1}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;
	
	// console.log(req.query.PageNumber)

  do {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}

		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		if(user.email === -1) {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }

		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getTransactions(user.id, req.params.AssetName, req.query);

		if(txList.result < 0) {
      data.result.code = 400;
      data.result.message = 'get transaction list failed';
      data.result.status = 'getTransactionListFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'get transaction list succeeded';
    data.result.status = 'getTransactionListSucceeded';
    res.status(data.result.code);
		data.txList = txList;

  } while(false);  
  
  res.send(data);
});



/**
 * @swagger
 * /api/v1/token/innerTransactions/{AssetName}:
 *   get:
 *     summary: get innerTransactions (내부 거래 확인하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: AssetName
 *        type: string
 *      - in: query
 *        name: PageNumber
 *        type: integer
 *      - in: query
 *        name: PageSize
 *        type: integer
 *     responses:
 *       200:
 *         description: get innerTransactions
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.get('/innerTransactions/:AssetName', 
	[
		query('PageNumber').isFloat({min: 1}).withMessage('invalid Number Value'),
		query('PageSize').isFloat({min: 1}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();

  do {
		
		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}

		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		if(user.email === -1)
    {
      data.result.code = 401;
      data.result.message = 'invalid authorizations';
      data.result.status = 'invalidAuthorizations';
      res.status(data.result.code);

      break;
    }
		
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getTransactionsInternal(user.id, 2, req.params.AssetName, req.query);

		if(txList.result < 0)
    {
      data.result.code = 400;
      data.result.message = 'get transaction list failed';
      data.result.status = 'getTransactionListFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'get transaction list succeeded';
    data.result.status = 'getTransactionListSucceeded';
    res.status(data.result.code);
		data.sent = txList.sent;
		data.received = txList.received;

  } while(false);  
  
  res.send(data);
});



/**
 * @swagger
 * /api/v1/token/innerTransactions/id/{id}:
 *   get:
 *     summary: get innerTransactions by id (내부 거래 확인하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: id
 *        type: integer
 *     responses:
 *       200:
 *         description: get innerTransactions by id
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.get('/innerTransactions/id/:id', 
	[
		check('id').isFloat({min: 1}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();

  do {
		
		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}
		
		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		if(user.email === -1)
    {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
		
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getTransactionsInternal(user.id, 0, req.params.id);

		if(txList.result < 0) {
      data.result.code = 400;
      data.result.message = 'get transaction by id failed';
      data.result.status = 'getTransactionByIdFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'get transaction by id succeeded';
    data.result.status = 'getTransactionByIdSucceeded';
    res.status(data.result.code);
		data.sent = txList.sent;
		data.received = txList.received;

  } while(false);  
  
  res.send(data);
});



/**
 * @swagger
 * /api/v1/token/innerTransactions/uuid/{uuid}:
 *   get:
 *     summary: get innerTransactions by uuid (내부 거래 확인하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: uuid
 *        type: string
 *     responses:
 *       200:
 *         description: get innerTransactions by uuid
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.get('/innerTransactions/uuid/:uuid', 
	[
		check('uuid').isLength({min: 36, max: 36}).withMessage('invalid String Length'),
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();

  do {
		
		const errors = validationResult(req);

		if (!errors.isEmpty()) {	
			data.result.code = 400;			
			data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
			data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
			res.status(data.result.code);
	
			break;
		}
		
		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		if(user.email === -1)
    {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
				
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getTransactionsInternal(user.id, 1, req.params.uuid);

		if(txList.result < 0) {
      data.result.code = 400;
      data.result.message = 'get transaction by uuid failed';
      data.result.status = 'getTransactionByUuidFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'get transaction by uuid succeeded';
    data.result.status = 'getTransactionByUuidSucceeded';
    res.status(data.result.code);
		data.sent = txList.sent;
		data.received = txList.received;

  } while(false);  
  
  res.send(data);
});



/**
 * @swagger
 * /api/v1/token/transfer/{tokenName}:
 *   put:
 *     summary: transfer token amount (토큰 다른 지갑으로 송금하기)
 *     tags: [MSC Token]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *        required: true
 *      - in: body
 *        name: token
 *        description: transfer token amount
 *        schema:
 *          required:
 *            - to
 *            - amount
 *          properties: 
 *            to: 
 *              type: string
 *            amount: 
 *              type: integer
 *     responses:
 *       200:
 *         description: transfer token amount
 *         schema:
 *           type: object
 *           properties:
 *             txid:
 *               type: string
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
 router.put('/transfer/:tokenName',
 [
	 body('amount').isFloat({min: 0.0001}).withMessage('invalid Number Value (min: 0.0001)')
 ],
 async function(req, res) {

 let data = new Object();
 data.result = new Object();
 data.txid = null;

 do
 {
	 const errors = validationResult(req);

	 if (!errors.isEmpty()) {	
		 data.result.code = 400;			
		 data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
		 data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
		 res.status(data.result.code);
 
		 break;
	 }
	 
		// check auth
		let user = await auth.decodeApiKey(req.headers.authorization);

		if(user.email === -1) {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
	 
	 // get master address, secret
	 let master = await token.getMaster(req.params.tokenName);
	 let tokenObj = await token.getContract(req.params.tokenName);
	 
	 // decode secret key
	 let decodedKey = master.secret;

	 let tx;
	 
	 let isInternal = await token.isInternalAddress(req.body['to'], req.params.tokenName);

	 if(isInternal == 1) {

		 // check enough money to send internally in master balance from db and then send
		 tx = await token.transferInternal(user.id, req.body['to'], req.body['amount'], req.params.tokenName);
		 
		 if(tx.result < 0)
		 {
			 data.result.code = 400;
			 data.result.message = 'send token transaction failed';
			 data.result.status = 'sendTokenTransactionFailed';
			 res.status(data.result.code);

			 break;
		 }

		 data.result.code = 200;
		 data.result.message = 'send token internal transaction succeeded';
		 data.result.status = 'sendTokenInternalTransactionSucceeded';
		 data.id = tx.txid;
		 data.data = tx.data;
	 } else if(isInternal == 0) {

		 // check enough money to send out in master balance from db and then send
		 tx = await token.transfer(user.id, req.params.tokenName, master.address, req.body['to'], tokenObj['contract'], req.body['amount'], decodedKey);
		 
		 if(tx.result < 0)
		 {
			 data.result.code = 400;
			 data.result.message = 'send token transaction failed';
			 data.result.status = 'sendTokenTransactionFailed';
			 res.status(data.result.code);

			 break;
		 }

		 data.result.code = 200;
		 data.result.message = 'send token external transaction succeeded';
		 data.result.status = 'sendTokenExternalTransactionSucceeded';
		 data.txid = tx.txid;
	 } else {
		 
		 data.result.code = 400;
		 data.result.message = 'receiver address is invalid';
		 data.result.status = 'receiverAddressIsInvalid';
		 res.status(data.result.code);
	 }

	 res.status(data.result.code);

 } while(false);
 
 res.send(data);
});	



module.exports = router;

