const express = require('express');
// const jwt = require('jsonwebtoken'); // module import
const { check, body, query, validationResult } = require('express-validator');
const authCrtl = require('../controllers/auth');
const pointCtrl = require('../controllers/point');
const Tx = require('ethereumjs-tx').Transaction;
const initapp = require('../initapp')

const router = express.Router();
const point = new pointCtrl();
const auth = new authCrtl();


/**
 * @swagger
 * tags:
 *    name: point
 *    description: API for MSC Point
 */

/**
 * 
 * /point/transfer:
 *   put:
 *     summary: transfer point amount (포인트 다른 지갑으로 송금하기)
 *     tags: [point]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: body
 *        name: point
 *        description: transfer point amount
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
 *         description: transfer point amount
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
router.put('/transfer', 
	[
		body('amount').isFloat({min: 1}).withMessage('invalid Number Value'),
		body('password').notEmpty().withMessage('empty Password')
	],
	async function(req, res) {
	
  let data = new Object();
  data.result = new Object();
  data.txid = null;

  do
  {
		// check auth
		let user = await auth.tokenDecode(req.headers.authorization);
				
		// check user password
		let isValid = await point.checkPassword(user.id, req.body['password']);
		
		if(!isValid)
    {
      data.result.code = 401;
      data.result.message = 'invalid password';
      data.result.status = 'invalidPassword';
      res.status(data.result.code);

      break;
    }
		
		// check enough money to send out in master balance from db and then send
		let tx = await point.transfer(user.id, req.body['to'], req.body['amount']);

		if(tx.result < 0)
    {
      data.result.code = 400;
      data.result.message = 'send point transaction failed';
      data.result.status = 'sendPointTransactionFailed';
      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'send point transaction succeeded';
    data.result.status = 'sendPointTransactionSucceeded';
		data.txid = tx.transactionHash;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});


/**
 * @swagger
 * /point/exchangeFor/{tokentName}:
 *   put:
 *     summary: exchange point for token (포인트를 토큰으로 교환하기)
 *     tags: [point]
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
 *            - password
 *          properties: 
 *            pointUse: 
 *              type: integer
 *            tokenSave: 
 *              type: integer
 *            password: 
 *              type: string
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
		check('tokenName').notEmpty().withMessage('not allow empty value'),
		body('pointUse').isFloat({min: 1}).withMessage('invalid number value (min: 1)'),
		body('tokenSave').isFloat({min: 0.0001}).withMessage('invalid number value (min: 0.0001)')
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
				
		// check user password
		let isValid = await point.checkPassword(user.id, req.body['password']);
		
		if(!isValid) {
      data.result.code = 401;
      data.result.message = 'invalid password';
      data.result.status = 'invalidPassword';
      res.status(data.result.code);

      break;
    }
		
		// check enough money to send out in master balance from db and then send
		let tx = await point.exchangeForToken(user.id, req.body['pointUse'], req.body['tokenSave'], req.params.tokenName);

		if(tx.result < 0) {
      data.result.code = 400;

			if(tx.result === -1) {
      	data.result.message = 'not enough admin token balance';
      	data.result.status = 'notEnoughAdminTokenBalance';
			} else if(tx.result === -2) {
      	data.result.message = 'failed to request for point server';
      	data.result.status = 'failedToRequestForPointServer';
			}

      res.status(data.result.code);

      break;
    }

    data.result.code = 200;
    data.result.message = 'exchange point transaction succeeded';
    data.result.status = 'exchangePointTransactionSucceeded';
		data.id = tx.tokenTxid;
		data.data = tx.tokenData;
    res.status(data.result.code);

  } while(false);  
  
  res.send(data);
});





module.exports = router;

