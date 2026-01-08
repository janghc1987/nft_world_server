const express = require('express');
// const jwt = require('jsonwebtoken'); // module import
const { check, body, query, validationResult } = require('express-validator');
const authCrtl = require('../controllers/auth');
const tokenCtrl = require('../controllers/token');
const Tx = require('ethereumjs-tx').Transaction;
const initapp = require('../initapp')

const router = express.Router();
const token = new tokenCtrl();
const auth = new authCrtl();


/**
 * @swagger
 * tags:
 *    name: token
 *    description: API for ERC20 (ERC20 Nodejs API)
 */

/**
 * @swagger
 * /token/transfer/{tokenName}:
 *   put:
 *     summary: transfer token amount (토큰 다른 지갑으로 송금하기)
 *     tags: [token]
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
 *            - password
 *          properties: 
 *            to: 
 *              type: string
 *            amount: 
 *              type: integer
 *            password: 
 *              type: string
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
		let user = await auth.tokenDecode(req.headers.authorization);
				
		// check user password
		let isValid = await token.checkPassword(user.id, req.body['password']);
		
		if(!isValid)
    {
      data.result.code = 401;
      data.result.message = 'invalid password';
      data.result.status = 'invalidPassword';
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




/**
 * @swagger
 * /token/isInternalAddress/{tokenName}/{address}:
 *   get:
 *     summary: is internal address (내부 지갑인지 확인)
 *     tags: [token]
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
 *      - in: path
 *        name: address
 *        type: string
 *        required: true
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
router.get('/isInternalAddress/:tokenName/:address',
async function(req, res) {

	let data = new Object();
	data.result = new Object();
	data.isInternal = false;

	do {
		
		let isValid = await token.isTokenValid(req.params.tokenName);
		
		if(isValid == 0) {
			data.result.code = 400;
			data.result.message = 'given token name is invalid';
			data.result.status = 'givenTokenNameIsInvalid';
			res.status(data.result.code);
			break;
		}
		
		let isInternal = await token.isInternalAddress(req.params.address, req.params.tokenName);

		if(isInternal == 1) {
			
			data.result.code = 200;
			data.isInternal = true;
			data.result.message = 'given token address is internal';
			data.result.status = 'givenTokenAddressIsInternal';
			res.status(data.result.code);
			
		} else if(isInternal == 0) {

			data.result.code = 200;
			data.result.message = 'given token address is external';
			data.result.status = 'givenTokenAddressIsExternal';
			res.status(data.result.code);
			
		} else {
			data.result.code = 400;
			data.result.message = 'given token address is invalid';
			data.result.status = 'givenTokenAddressIsInvalid';
			res.status(data.result.code);
		}

		res.status(data.result.code);

	} while(false);

	res.send(data);
});




/**
 * 
 * /token/collect/{tokenName}:
 *   put:
 *     summary: transfer token amount by owner (토큰 다른 지갑으로 송금하기)
 *     tags: [token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *      - in: body
 *        name: token
 *        description: transfer token amount by owner
 *        schema:
 *          required:
 *            - from
 *            - to
 *            - amount
 *            - password
 *          properties: 
 *            from: 
 *              type: string
 *            to: 
 *              type: string
 *            amount: 
 *              type: string
 *            password: 
 *              type: string
 *     responses:
 *       200:
 *         description: transfer token amount by owner
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
 router.put('/collect/:tokenName', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do
  {
		ret = await auth.checkAdmin(req.body['adminEmail']);

		if(ret == false)
    {
      data.result.code = 401;
      data.result.message = 'invalid admin account';
      data.result.status = 'invalidAdminAccount';
      res.status(data.result.code);
      break;
    }
		
		// get master address, secret
		let master = await token.getMaster(req.params.tokenName);
		let tokenObj = await token.getContract(req.params.tokenName);
		
		// check enough money to send out in master balance from db and then send
		let tx = await token.collectAll(tokenObj, master);
		
		if(tx.result < 0)
		{
			data.result.code = 400;
			data.result.message = 'collect token failed';
			data.result.status = 'collectTokenFailed';
			res.status(data.result.code);

			break;
		}

		data.result.message = 'collect token succeeded';
		data.result.status = 'collectTokenSucceeded';
		data.txid = tx.txid;

		data.result.code = 200;
    res.status(data.result.code);

  } while(false);
  
  res.send(data);
});

/**
 * @swagger
 * /token/auction/{address}:
 *   get:
 *     summary: auction
 *     tags: [token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: address
 *        type: string
 *     responses:
 *       200:
 *         description: auction
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
 router.get('/auction/:address', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do {
  
		let tokenObj = await token.getContract('NFTM');
		let result = await token.auction(tokenObj, req.params.address);

		data.result.message = 'auction';
		data.result.status = 'auction';
		data.res = result;

		data.result.code = 200;
    res.status(data.result.code);

  } while(false);
  
  res.send(data);
});

/**
 * @swagger
 * /token/exchangeForPoint/{tokentName}:
 *   put:
 *     summary: exchange token for point (토큰을 포인트로 전환하기)
 *     tags: [token]
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
 *            - password
 *          properties: 
 *            tokenUse: 
 *              type: integer
 *            pointSave: 
 *              type: integer
 *            password: 
 *              type: string
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
		check('tokenName').notEmpty().withMessage('not allow empty value'),
		body('pointSave').isFloat({min: 1}).withMessage('invalid Number Value'),
		body('tokenUse').isFloat({min: 0.0001}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();

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
		let user = await auth.tokenDecode(req.headers.authorization);
				
		// check user password
		let isValid = await token.checkPassword(user.id, req.body['password']);
		
		if(!isValid)
    {
      data.result.code = 401;
      data.result.message = 'invalid password';
      data.result.status = 'invalidPassword';
      res.status(data.result.code);

      break;
    }
		
		// check enough money to send out in master balance from db and then send
		let tx = await token.exchangeForPoint(user.id, req.body['pointSave'], req.body['tokenUse'], req.params.tokenName);

		if(tx.result < 0)
    {
      data.result.code = 400;

			if(tx.result === -1) {
      	data.result.message = 'not enough token balance';
      	data.result.status = 'notEnoughTokenBalance';
			} else if(tx.result === -2) {
      	data.result.message = 'failed to request for point server';
      	data.result.status = 'failedToRequestForPointServer';
			}

      res.status(data.result.code);

      break;
    }

		// get point with maruapi
		// let tx = await token.pointSave(user.id, req.body['pointAmount']);

    data.result.code = 200;
    data.result.message = 'exchange token transaction succeeded';
    data.result.status = 'exchangeTokenTransactionSucceeded';
		data.id = tx.tokenTxid;
		data.data = tx.tokenData;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});

/**
 * @swagger
 * /token/deploy:
 *   post:
 *     summary: deploy contract (컨트랙트 배포하기)
 *     tags: [token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *     responses:
 *       200:
 *         description: deploy contract
 *         schema:
 *           type: object
 *           properties:
 *             balance:
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
 router.post('/deploy', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do
  {
    // if(!await auth.jwtverify(req.headers['authorization'], initapp.ethdata[req.params.tokenName]))
    // {
    //   data.result.code = 204;
    //   data.result.message = '허가되지 않은 API KEY 입니다.';
    //   data.result.status = 'Invalid API KEY used';
    //   res.status(data.result.code);

    //   break;
    // }
		data.txid = await token.deploy();
    // data.txid = await admin.deploy(req.body['owner'], req.body['password']);

    if(data.txid == null)
    {
      data.result.code = 204;
      data.result.message = '트랜젝션 실패';
      data.result.status = 'No transaction ID';
      res.status(data.result.code);
    
      break;
    }

    data.result.code = 200;
    data.result.message = '요청 정상 처리';
    data.result.status = 'OK';
    res.status(data.result.code);

  } while(false);

  res.send(data);
});  


/**
 * @swagger
 * /token/mint/{tokenName}:
 *   put:
 *     summary: mint token amount (토큰 증액하기)
 *     tags: [token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *      - in: body
 *        name: token
 *        description: mint token amount
 *        schema:
 *          required:
 *            - target
 *            - amount
 *          properties: 
 *            target: 
 *              type: string
 *            amount: 
 *              type: integer
 *     responses:
 *       200:
 *         description: mint token amount
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
 router.put('/mint/:tokenName', async function(req, res) {
	// app.get('/mint/:tokenName/:owner/:password/:tgaddr/:value', async (req, res) => {
	let data = new Object();
	data.result = new Object();
	data.txid = null;

	do
	{
		// get master address, secret
		let master = await token.getMaster(req.params.tokenName);
		let tokenObj = await token.getContract(req.params.tokenName);
		
		// decode secret key
		// let decodedKey = master.secret;
		
		// data.txid = await token.mint(master.address, tokenObj, req.body['target'], req.body['amount'], master.secret);

		if(data.txid == null)
		{
			data.result.code = 204;
			data.result.message = '트랜젝션 실패';
			data.result.status = 'No transaction ID';
			res.status(data.result.code);
		
			break;
		}

		data.result.code = 200;
		data.result.message = '요청 정상 처리';
		data.result.status = 'OK';
		res.status(data.result.code);    

	} while(false);

	res.send(data);
});

module.exports = router;

