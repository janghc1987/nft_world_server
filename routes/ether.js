const express = require('express');
const etherCtrl = require('../controllers/ether');
const authCrtl = require('../controllers/auth');
const crypto = require('crypto');
const Tx = require('ethereumjs-tx').Transaction;

const router = express.Router();

// const users = new ethfuncs('ropsten', 3, '5b72559c2fb641838bab583d3f8a7f94');
// const admin = new ethfuncs('ropsten', 3, '3ae74697204f4b3d99d8e3574a781cce');


const ether = new etherCtrl();
const auth = new authCrtl();

// const users = new ethfuncs('mainnet', 1, '3ae74697204f4b3d99d8e3574a781cce');
// const admin = new ethfuncs('mainnet', 1, '3ae74697204f4b3d99d8e3574a781cce');


/**
 * @swagger
 * tags:
 *    name: ether
 *    description: API for Ethereum (이더리움 Nodejs API)
 */


/**
 * @swagger
 * /ether/newmaster:
 *   post:
 *     summary: generate new ethereum master wallet address (이더리움 새 마스터 주소 만들기)
 *     tags: [ether]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: body
 *        name: ethereum
 *        description: generate new master address
 *        schema:
 *          required:
 *            - passphrase
 *          properties: 
 *            passphrase: 
 *              type: string
 *     responses:
 *       200:
 *         description: generate new ethereum master wallet address
 *         schema:
 *           type: object
 *           properties:
 *             newmaster:
 *               type: string
 *             passphrase:
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
 router.post('/newmaster', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.newmaster = new Object();

  do {
		// let passphrase = crypto.createHash('sha256').update(req.body['passphrase']).digest('hex');
    
    data.newmaster = await ether.newMaster(req.body['passphrase']);
    // data.newmaster = await admin.newAccount(req.body['passphrase']);
    
    // account = await users.newAccount(email);
				
    // encrypt secret
    // let encoded = await crypt.encryptEx(account.privateKey, global.env.API_ENCRYPTION_KEY);
    // let temp = encoded.split(':');
  
    // data.secret = temp[1];
    // data.cryptoiv = temp[0];
    
		// data.passphrase = passphrase;

    if(data.newmaster == null) {
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
 * /ether/transfer:
 *   put:
 *     summary: transfer ethereum amount (이더리움 다른 지갑으로 송금하기)
 *     tags: [ether]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
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
 *              type: string
 *            password: 
 *              type: string
 *     responses:
 *       200:
 *         description: transfer ethereum amount
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
router.put('/transfer', async function(req, res) {

  let data = new Object();
  data.result = new Object();

  do
  {
		// check auth
		user = await auth.tokenDecode(req.headers.authorization);
		
		// 
	
		
		// check user password
		let isValid = await ether.checkPassword(user.id, req.body['password']);
		
		if(!isValid)
    {
      data.result.code = 401;
      data.result.message = 'invalid password';
      data.result.status = 'invalidPassword';
      res.status(data.result.code);

      break;
    }
		
		// get master address, secret
		let master = await ether.getMaster();
					
		// decode secret key
		let decodedKey = master.secret;			
		
		let tx = await ether.transfer(user.id, master.address, req.body['to'], req.body['amount'], decodedKey);
    
    if(tx.result < 0)
    {
      data.result.code = 400;
      data.result.message = 'send transaction failed';
      data.result.status = 'sendTransactionFailed';
      res.status(data.result.code);
    
      break;
    }

    data.result.code = 200;
    data.result.message = 'send transaction succeeded';
    data.result.status = 'sendTransactionSucceeded';
		data.txid = tx.transactionHash;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});

module.exports = router;
