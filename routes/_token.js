const express = require('express');
// const jwt = require('jsonwebtoken'); // module import
const authfunc = require('../controllers/auth');
const ethfuncs = require('../drivers/ethdrv');
const Tx = require('ethereumjs-tx').Transaction;
const initapp = require('../initapp')

const router = express.Router();

// let mode = process.argv.slice(2);
// let homepath = mode == 'dev' ? '/mnt/d/refs/script_home/nodejs' : '/home';

// const ethData = JSON.parse(fs.readFileSync(homepath + '/ethInfura/ethData.json'));

// const homepath = initapp.homepath;
// const ethData = initapp.ethdata;

const auth = new authfunc();

const users = new ethfuncs('mainnet', 1, global.env.INFURA_USERS_KEY);
const admin = new ethfuncs('mainnet', 1, global.env.INFURA_ADMIN_KEY);

// const users = new ethfuncs('ropsten', 3, global.env.INFURA_USERS_KEY);
// const admin = new ethfuncs('ropsten', 3, global.env.INFURA_ADMIN_KEY);


/**
 * @swagger
 * tags:
 *    name: _token
 *    description: API for ERC20 (ERC20 Nodejs API)
 */
  
/**
 * @swagger
 * /_token/getbalance/{tokenName}/{address}:
 *   get:
 *     summary: get token balance (지갑의 토큰 잔액 가져오기)
 *     tags: [_token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *      - in: path
 *        name: address
 *        type: string
 *     responses:
 *       200:
 *         description: get token balance
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
router.get('/getbalance/:tokenName/:address', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.balance = null;
	
	// res.render()

  do
  {
    let token = await admin.getContract(req.params.tokenName);
    // console.log(token);
    data.balance = await admin.getTokenBalance(req.params.address, token.contract);
    // console.log(data.balance);

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
 * /_token/getName/{tokenName}:
 *   get:
 *     summary: get token full name (토큰의 풀네임 가져오기)
 *     tags: [_token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *     responses:
 *       200:
 *         description: get token full name
 *         schema:
 *           type: object
 *           properties:
 *             name:
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
router.get('/getName/:tokenName', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.name = null;

  // console.log('authorization: ' + req.headers['authorization']);
  // console.log('token info: ' + initapp.ethdata[req.params.tokenName]['secretkey']);

  do
  {
    let token = await admin.getContract(req.params.tokenName);
    // console.log(token);
    data.name = await admin.getName(token.contract);
    // console.log(data.balance);

    if(data.name == null)
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
 * /_token/getSymbol/{tokenName}:
 *   get:
 *     summary: get token symbol (토큰의 심볼 가져오기)
 *     tags: [_token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *     responses:
 *       200:
 *         description: get token symbol
 *         schema:
 *           type: object
 *           properties:
 *             symbol:
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
router.get('/getSymbol/:tokenName', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.symbol = null;

  do
  {
    let token = await admin.getContract(req.params.tokenName);
    // console.log(token);
    data.symbol = await admin.getSymbol(token.contract);
    // console.log(data.balance);

    if(data.symbol == null)
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
 * /_token/getTotalSupply/{tokenName}:
 *   get:
 *     summary: get token totalSupply (토큰의 총 발행 수 가져오기)
 *     tags: [_token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *     responses:
 *       200:
 *         description: get token totalSupply
 *         schema:
 *           type: object
 *           properties:
 *             totalSupply:
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
router.get('/getTotalSupply/:tokenName', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.totalSupply = null;

  do
  {
    let token = await admin.getContract(req.params.tokenName);
    // console.log(token);
    data.totalSupply = await admin.getTotalSupply(token.contract);
    // console.log(data.balance);

    if(data.totalSupply == null)
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
 * /_token/getDecimals/{tokenName}:
 *   get:
 *     summary: get token decimals (발행된 토큰의 자리수 가져오기)
 *     tags: [_token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: tokenName
 *        type: string
 *     responses:
 *       200:
 *         description: get token decimals
 *         schema:
 *           type: object
 *           properties:
 *             decimals:
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
router.get('/getDecimals/:tokenName', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.decimals = null;

  do
  {
    let token = await admin.getContract(req.params.tokenName);
    // console.log(token);
    data.decimals = await admin.getDecimal(token.contract);
    // console.log(data.balance);

    if(data.decimals == null)
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
 * /_token/gettxinfo/{txid}:
 *   get:
 *     summary: get token transaction information (토큰 트랜젝션 정보 가져오기)
 *     tags: [_token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: txid
 *        type: string
 *     responses:
 *       200:
 *         description: get token transaction information
 *         schema:
 *           type: object
 *           properties:
 *             transfer:
 *               properties:
 *                 from:
 *                   type: string
 *                 to:
 *                   type: string
 *                 contract:
 *                   type: string
 *                 value:
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
router.get('/gettxinfo/:txid', async function(req, res) {

  let data = new Object();
  data.result = new Object();
  data.transfer = null;

  do {
    let tx = await admin.getTransaction(req.params.txid);

    // console.log(tx);

    if(tx == null)
    {
      data.result.code = 204;
      data.result.message = 'tx id not found';
      data.result.status = 'No transaction ID';
      break;
    }

    if(tx.input == '0x')
    {
      data.result.code = 204;
      data.result.message = 'invaild gec tx';
      data.result.status = 'No transaction ID';
      break;
    }

    try {

      let idx = 0;
      let first = '';
      let second = '';

      data.transfer = new Object();

      if(tx.input.indexOf('0xa9059cbb') == 0)
      {
        data.transfer.from = tx.from;
        data.transfer.contract = tx.to;
      }
      else if(tx.input.indexOf('0xb61d27f6') == 0)
      {
        data.transfer.from = tx.to;
        idx = tx.input.indexOf('0xb61d27f6') + 10;
        first = tx.input.substring(idx, idx + 64);
        data.transfer.contract = '0x' + first.substring(24, 64);
      }
      else
      {
        data.result.code = 200;
        data.result.message = 'unknown method is used';
        data.result.status = 'transaction ID';
        data.transfer.tx = tx;
        break;
      }            

      idx = tx.input.indexOf('a9059cbb') + 8;
      first = tx.input.substring(idx, idx + 64);
      data.transfer.to = '0x' + first.substring(24, 64);
      // console.log(transfer.from);
      idx += 64;
      second = tx.input.substring(idx, idx + 64);
      
      data.transfer.value = second.replace(/^[^(1-9)|^(a-f)]+/i, '');

      data.result.code = 200;
      data.result.message = '요청 정상 처리';
      data.result.status = 'OK';
      res.status(data.result.code);

    } catch(exp) {

      data.result.code = 204;
      data.result.message = 'wrong worked in parsing tx json object';
      data.result.status = 'No transaction ID';
      res.status(data.result.code);

      break;
    }
  }while(false);

  res.send(data);
});

/**
 * @swagger
 * /_token/transfer/{tokenName}:
 *   put:
 *     summary: transfer token amount (토큰 다른 지갑으로 송금하기)
 *     tags: [_token]
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
 *        description: transfer token amount
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
router.put('/transfer/:tokenName', async function(req, res) {


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
		// 	console.log(data.result.status);

    //   break;
    // }

    try {
			// console.log(req.params.tokenName);

			let token = await users.getContract(req.params.tokenName);
			// console.log(token['addr']);

			data.txid = await users.transfer(req.body['from'], req.body['to'], token['contract'], req.body['amount'], req.body['password']);
			// console.log(data.txid);

    } catch (error) {
      data.result.code = 204;
      data.result.message = '트랜젝션 실패';
      data.result.status = 'No transaction ID';
      res.status(data.result.code);
			console.log(data.result.status);

      break;
    }
    
    if(data.txid == null)
    {
      data.result.code = 204;
      data.result.message = '트랜젝션 실패';
      data.result.status = 'No transaction ID';
      res.status(data.result.code);
			console.log(data.result.status);

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
 * /_token/mint/{tokenName}:
 *   put:
 *     summary: mint token amount (토큰 증액하기)
 *     tags: [_token]
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
 *            - owner
 *            - password
 *            - target
 *            - amount
 *          properties: 
 *            owner: 
 *              type: string
 *            password: 
 *              type: string
 *            target: 
 *              type: string
 *            amount: 
 *              type: string
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

	// console.log('authorization: ' + req.headers['authorization']);

	// let decoded = jwt.verify(req.headers['authorization'], initapp.ethdata[req.params.tokenName]['secretkey']);

	// console.log('decoded_pwd: ' + decoded.pwd);
	// console.log('decoded_name: ' + decoded.name);

	// initapp.ethdata[req.params.tokenName]['secretkey'];
	// initapp.ethdata[req.params.tokenName]['passphrase'];
	// initapp.ethdata[req.params.tokenName]['name'];

	do
	{
		// if(!await auth.jwtverify(req.headers['authorization'], initapp.ethdata[req.params.tokenName]))
		// {
		// 	data.result.code = 204;
		// 	data.result.message = '허가되지 않은 API KEY 입니다.';
		// 	data.result.status = 'Invalid API KEY used';
		// 	res.status(data.result.code);

		// 	break;
		// }

		let token = await users.getContract(req.params.tokenName);
		console.log(token['addr']);

		data.txid = await users.mint(req.body['owner'], req.body['password'], token['contract'], req.body['target'], req.body['amount']);

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
 * /_token/deploy:
 *   post:
 *     summary: deploy contract (컨트랙트 배포하기)
 *     tags: [_token]
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: body
 *        name: token
 *        description: deploy contract
 *        schema:
 *          required:
 *            - owner
 *            - password
 *          properties: 
 *            owner: 
 *              type: string
 *            password: 
 *              type: string
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

    data.txid = await admin.deploy(req.body['owner'], req.body['password']);

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

