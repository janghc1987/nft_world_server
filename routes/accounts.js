const express = require('express');
// const jwt = require('jsonwebtoken'); // module import
const { check, body, query, validationResult } = require('express-validator');
const accountsCtrl = require('../controllers/accounts');
const authfunc = require('../controllers/auth');

const Tx = require('ethereumjs-tx').Transaction;
const initapp = require('../initapp')

const router = express.Router();

// let mode = process.argv.slice(2);
// let homepath = mode == 'dev' ? '/mnt/d/refs/script_home/nodejs' : '/home';

// const ethData = JSON.parse(fs.readFileSync(homepath + '/ethInfura/ethData.json'));

// const homepath = initapp.homepath;
// const ethData = initapp.ethdata;

const auth = new authfunc();

const accounts = new accountsCtrl();

/**
 * @swagger
 * tags:
 *    name: accounts
 *    description: API for accounts (사용자 계좌 Nodejs API)
 */
  
/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: get accounts (사용자 계좌 정보 조회)
 *     tags: [accounts]
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
router.get('/', async function(req, res) {

  let data = new Object();
  data.result = new Object();

	let ret;
	
	// res.render()
  do
  {
		// check auth
		ret = await auth.tokenDecode(req.headers.authorization);

		if(ret.email == null) {
      data.result.code = 401;
      data.result.message = 'active token expired';
      data.result.status = 'activeTokenExpired';
      res.status(data.result.code);
      break;
    }
 
		// get account info
		ret = await accounts.getAccount(ret.id, ret.email);		

    data.result.code = 200;
    data.result.message = 'getting account information succeeded';
    data.result.status = 'gettingAccountInformationSucceeded';
		data.accounts = ret;
    res.status(data.result.code);

  } while(false);

  res.send(data);
});


/**
 * @swagger
 * /accounts/transactions/{AssetName}:
 *   get:
 *     summary: get transactions (외부 거래 확인하기)
 *     tags: [accounts]
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
		let user = await auth.tokenDecode(req.headers.authorization);
		
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
 * /accounts/profile/{TokenAddress}:
 *   get:
 *     summary: get user profile (외부 거래 확인하기)
 *     tags: [accounts]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: TokenAddress
 *        type: string
 *     responses:
 *       200:
 *         description: user profile
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
 router.get('/profile/:TokenAddress', 
	async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do {
		
		// check auth
		// let user = await auth.tokenDecode(req.headers.authorization);
		
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getProfile(req.params.TokenAddress);

		if(txList.result < 0) {
      data.result.code = 400;
      data.result.message = 'get profile failed';
      data.result.status = 'getProfileFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'get profile succeeded';
    data.result.status = 'getProfileSucceeded';
    res.status(data.result.code);
		data.txList = txList;

  } while(false);  
  
  res.send(data);
});



/**
 * @swagger
 * /accounts/innerTransactions/{AssetName}:
 *   get:
 *     summary: get innerTransactions (내부 거래 확인하기)
 *     tags: [accounts]
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
		let user = await auth.tokenDecode(req.headers.authorization);
		
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getTransactionsInternal(user.id, 2, req.params.AssetName, req.query);

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
		data.sent = txList.sent;
		data.received = txList.received;

  } while(false);  
  
  res.send(data);
});


/**
 * @swagger
 * /accounts/innerTransactions/id/{id}:
 *   get:
 *     summary: get innerTransactions by id (내부 거래 확인하기)
 *     tags: [accounts]
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
		let user = await auth.tokenDecode(req.headers.authorization);
		
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getTransactionsInternal(user.id, 0, req.params.id);

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
		data.sent = txList.sent;
		data.received = txList.received;

  } while(false);  
  
  res.send(data);
});



/**
 * @swagger
 * /accounts/innerTransactions/uuid/{uuid}:
 *   get:
 *     summary: get innerTransactions by uuid (내부 거래 확인하기)
 *     tags: [accounts]
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
		let user = await auth.tokenDecode(req.headers.authorization);
		
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.getTransactionsInternal(user.id, 1, req.params.uuid);

		if(txList.result < 0) {
      data.result.code = 400;
      data.result.message = 'get transaction failed';
      data.result.status = 'getTransactionFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'get transaction succeeded';
    data.result.status = 'getTransactionSucceeded';
    res.status(data.result.code);
		data.sent = txList.sent;
		data.received = txList.received;

  } while(false);  
  
  res.send(data);
});


/**
 * @swagger
 * /accounts/checkBalance:
 *   get:
 *     summary: get innerTransactions by uuid (내부 거래 확인하기)
 *     tags: [accounts]
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
 router.get('/checkBalance', async function(req, res) {

  let data = new Object();
  data.result = new Object();

  do {
		
		// check auth
		let user = await auth.tokenDecode(req.headers.authorization);
		
		// check enough money to send out in master balance from db and then send
		let txList = await accounts.checkBalance();

		if(txList.result < 0) {
      data.result.code = 400;
      data.result.message = 'get transaction failed';
      data.result.status = 'getTransactionFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'get transaction succeeded';
    data.result.status = 'getTransactionSucceeded';
    res.status(data.result.code);
		data.sent = txList.sent;
		data.received = txList.received;

  } while(false);
  
  res.send(data);
});




module.exports = router;

