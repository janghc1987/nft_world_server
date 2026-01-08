
const express = require('express');
const { check, body, query, validationResult } = require('express-validator');
const authfunc = require('../controllers/auth');

// const { router } = require('./ether');
const router = express.Router();

const auth = new authfunc();



/**
 * @swagger
 * tags:
 *    name: auth
 *    description: API for auth
 */

/**
 * @swagger
 * /auth/getApiKey:
 *   post:
 *     summary: get API Key (API Key 가져오기)
 *     tags: [auth]
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
		// let user = await auth.tokenDecode(req.headers.authorization);
				
		// check user password
		let isValid = await auth.checkPassword(req.body['email'], req.body['password']);
		
		if(!isValid)
    {
      data.result.code = 401;
      data.result.message = 'invalid password';
      data.result.status = 'invalidPassword';
      res.status(data.result.code);

      break;
    }

		let apiKey = await auth.getApiKey(req.body['email']);

		data.result.code = 200;
    data.result.message = 'getting apikey succeeded';
    data.result.status = 'gettingApikeySucceeded';
		data.apiKey = apiKey;
    res.status(data.result.code);

	} while(false);
  
  res.send(data);

});


/**
 * @swagger
 * /auth/resetPassword:
 *   put:
 *     summary: reset password (사용자 암호 변경)
 *     tags: [auth]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: body
 *        name: data for reset user email
 *        description: user email
 *        schema:
 *          properties: 
 *            adminEmail: 
 *              type: string
 *            email: 
 *              type: string
 *            newPassword: 
 *              type: string
 *     responses:
 *       200:
 *         description: reset password
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
 router.put('/resetPassword', async function(req, res) {	 

  let data = new Object();
  data.result = new Object();

	let ret;
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
 
		// get user profile
		ret = await auth.resetPassword(req.body['email'], req.body['newPassword']);
		
		if(ret.result < 0)
    {
      data.result.code = 403;
      data.result.message = 'reset password failed';
      data.result.status = 'resetPasswordFailed';
      res.status(data.result.code);
      break;
    }

    data.result.code = 200;
    data.result.message = 'reset password succeeded';
    data.result.status = 'resetPasswordSucceeded';
		data.password = ret.password;
    res.status(data.result.code);

  } while(false);

  res.send(data);
});


module.exports = router;
