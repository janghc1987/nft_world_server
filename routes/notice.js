const express = require('express');
// const jwt = require('jsonwebtoken'); // module import
const { check, body, query, validationResult } = require('express-validator');
const noticeCtrl = require('../controllers/notice');
const authfunc = require('../controllers/auth');
const router = express.Router();

const auth = new authfunc();
const notice = new noticeCtrl();

/**
 * @swagger
 * tags:
 *    name: notice
 *    description: API for notice (공지 Nodejs API)
 */
  
/**
 * @swagger
 * /notice/list/{Category}:
 *   get:
 *     summary: get notice list (공지 리스트 가져오기)
 *     tags: [notice]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: Category
 *        enum: [notice, news, event]
 *        type: string
 *      - in: query
 *        name: PageNumber
 *        type: integer
 *      - in: query
 *        name: PageSize
 *        type: integer
 *     responses:
 *       200:
 *         description: get notice list
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
router.get('/list/:Category', 
	[
		query('PageNumber').isFloat({min: 1}).withMessage('invalid Number Value'),
		query('PageSize').isFloat({min: 1}).withMessage('invalid Number Value')
	],
	async function(req, res) {

  let data = new Object();
  data.result = new Object();

	let ret;
	
	// res.render()
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
		ret = await auth.tokenDecode(req.headers.authorization);

		if(ret.email == null) {
      data.result.code = 401;
      data.result.message = 'active token expired';
      data.result.status = 'activeTokenExpired';
      res.status(data.result.code);
			
      break;
    }
 
		// get account info
		ret = await notice.getNoticeList(req.params.Category, req.query);

    data.result.code = 200;
    data.result.message = 'getting notice list';
    data.result.status = 'gettingNoticeList';
		data.noticeList = ret;
    res.status(data.result.code);

  } while(false);

  res.send(data);
});

/**
 * @swagger
 * /notice/content/{NoticeId}:
 *   get:
 *     summary: get notice content (공지 컨텐츠 가져오기)
 *     tags: [notice]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: accept-language
 *        type: string
 *        required: true
 *        enum: [en-US, ko-KR, zh-CN]
 *      - in: path
 *        name: NoticeId
 *        type: integer
 *     responses:
 *       200:
 *         description: get notice content
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
 router.get('/content/:NoticeId', 
	[
		check('NoticeId').isFloat({min: 0}).withMessage('invalid Number Value')
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
		ret = await auth.tokenDecode(req.headers.authorization);

		if(ret.email == null)
    {
      data.result.code = 401;
      data.result.message = 'active token expired';
      data.result.status = 'activeTokenExpired';
      res.status(data.result.code);
      break;
    }
 
		// get account info
		ret = await notice.getNoticeContent(req.params.NoticeId);

		// if(txList.result < 0)
    // {
    //   data.result.code = 400;
    //   data.result.message = 'get transaction list failed';
    //   data.result.status = 'getTransactionListFailed';
    //   res.status(data.result.code);

    //   break;
    // }

    data.result.code = 200;
    data.result.message = 'getting notice content';
    data.result.status = 'gettingNoticeContent';
		data.content = ret;
    res.status(data.result.code);

  } while(false);

  res.send(data);
});



module.exports = router;

