



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
 * /api/v1/admin/getAdminApiKey:
 *   post:
 *     summary: get Admin API Key (Admin API Key 가져오기)
 *     tags: [MSC admin]
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
 *          properties: 
 *            email: 
 *              type: string
 *     responses:
 *       200:
 *         description: get Admin API Key
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
router.post('/getAdminApiKey', 
[
  // body('email').isEmail().withMessage('invalid Email Address'),
  // body('password').notEmpty().withMessage('empty Password')
],
async function(req, res) {

  let data = new Object();
  data.result = new Object();

  do {
    // check auth
    // let user = await auth.tokenDecode(req.headedrs.authorization.split('Barear ')[1]);

    // console.log(req.body['email']);

    // const errors = validationResult(req);

    // if (!errors.isEmpty()) {	
    //   data.result.code = 400;			
    //   data.result.message = errors.array()[0].param + ': ' + errors.array()[0].msg.toLowerCase();
    //   data.result.status = errors.array()[0].msg.replace(/(\s*)/g, "");
    //   res.status(data.result.code);

    //   break;
    // }
        
    // check user password
    //  let isValid = await auth.checkPassword(req.body['email'], req.body['password']);

    // if(!isValid) {
    //   data.result.code = 401;
    //   data.result.message = 'invalid password';
    //   data.result.status = 'invalidPassword';
    //   res.status(data.result.code);

    //   break;
    // }

    let apiKey = await auth.getAdminApiKey(req.body['email']);
    
    if(!apiKey) {
      data.result.code = 401;
      data.result.message = 'invalid email';
      data.result.status = 'invalidEmail';
      res.status(data.result.code);

      break;
    }

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
 * /api/v1/admin/checkBalance:
 *   get:
 *     summary: get innerTransactions by uuid (내부 거래 확인하기)
 *     tags: [admin]
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
		let isVerified = await auth.verifyAdminApiKey(req.headers.authorization);
    
    if(!isVerified) {
      data.result.code = 401;
      data.result.message = 'invalid api key';
      data.result.status = 'invalidApiKey';
      res.status(data.result.code);

      break;
    }
		
		// check enough money to send out in master balance from db and then send
		let count = accounts.checkBalance();

    data.result.code = 200;
    data.result.message = 'get transaction succeeded';
    data.result.status = 'getTransactionSucceeded';
    res.status(data.result.code);
		data.count = count;

  } while(false);
  
  res.send(data);
});


module.exports = router;