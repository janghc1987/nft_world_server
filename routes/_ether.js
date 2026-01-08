const express = require('express');
const ethfuncs = require('../drivers/ethdrv');
const crypto = require('crypto');
const Tx = require('ethereumjs-tx').Transaction;
const cryptfuncs = require('../drivers/cryptfuncs');

const router = express.Router();

const crypt = new cryptfuncs();
const users = new ethfuncs('ropsten', 3, '04c4d59194974921b49dc457d728b64e');
const admin = new ethfuncs('ropsten', 3, '1a885bea48f64375b40d4f69b6c4d495');

// const users = new ethfuncs('mainnet', 1, '3ae74697204f4b3d99d8e3574a781cce');
// const admin = new ethfuncs('mainnet', 1, '3ae74697204f4b3d99d8e3574a781cce');

/**
 * @swagger
 * /ether/accounts:
 *   get:
 *     summary: get ethereum accounts in wallet (이더리움 지갑 계정들 가져오기)
 *     tags: [ether]
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
 *         description: get ethereum accounts in wallet
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
  data.accounts = null;

  do
  {
    data.accounts = await users.getAccounts();

    console.log(data.accounts);

    if(data.accounts == null)
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
 * /ether/gasprice:
 *   get:
 *     summary: get ethereum gasprice (이더리움 가스 가격 가져오기)
 *     tags: [ether]
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
 *         description: get ethereum gasprice
 *         schema:
 *           type: object
 *           properties:
 *             gasprice:
 *               type: integer
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
router.get('/gasprice', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.gasprice = null;

  do
  {
    data.gasprice = await users.getGasPrice();

    if(data.gasprice == null)
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
 * /ether/newaddress:
 *   post:
 *     summary: generate new ethereum wallet address (이더리움 새 지갑 만들기)
 *     tags: [ether]
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
 *         description: generate new ethereum wallet address
 *         schema:
 *           type: object
 *           properties:
 *             newaccount:
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
router.post('/newaddress', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.newaccount = null;

  do
  {
    data.newaccount = await users.newAccount(req.body['account']);

    if(data.newaccount == null)
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
  data.newmaster = null;

  do
  {
		// let passphrase = crypto.createHash('sha256').update(req.body['passphrase']).digest('hex');
    data.newmaster = await admin.newAccount(req.body['passphrase']);   
    
    // account = await users.newAccount(email);
				
    // encrypt secret
    let encoded = await crypt.encryptEx(account.privateKey, global.env.API_ENCRYPTION_KEY);
    let temp = encoded.split(':');
  
    data.secret = temp[1];
    data.cryptoiv = temp[0];
    
		// data.passphrase = passphrase;

    if(data.newmaster == null)
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
 * /ether/getbalance/{address}:
 *   get:
 *     summary: get balance of ethereum account (이더리움 지갑 잔고 가져오기)
 *     tags: [ether]
 *     security:
 *      - bearerAuth: []
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
 *         description: get balance of ethereum
 *         schema:
 *           type: object
 *           properties:
 *             balance:
 *               properties:
 *                 address:
 *                   type: string
 *                 ether:
 *                   type: integer
 *                 wei:
 *                   type: integer
 *             result:
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
router.get('/getbalance/:address', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.balance = null;

  do
  {
    data.balance = await users.getBalance(req.params.address);

    if(data.balance == null)
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
 * /ether/transfer:
 *   put:
 *     summary: transfer ethereum amount (이더리움 다른 지갑으로 송금하기)
 *     tags: [ether]
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
  data.txid = null;

  do
  {
    try {

      let privateKey = Buffer.from(req.body['privateKey'], 'hex');
      let rawTx = await users.getEthTx(req.body['from'], req.body['to'], req.body['amount']);
      data.txid = await users.sendSignedTransaction(rawTx, privateKey);

    } catch (error) {
      data.result.code = 204;
      data.result.message = '트랜젝션 실패';
      data.result.status = 'No transaction ID';
      res.status(data.result.code);
    
      break;
    }
    
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
