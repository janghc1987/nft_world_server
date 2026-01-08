const express = require('express');
// const fs = require('fs');
// const bodyparser = require('body-parser');

const router = express.Router();

// router.use(express.static('routes'));





/**
 * @swagger
 * tags:
 *   name: index
 *   description: index management
 * definitions:
 *   index:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: 할일 내용
 *       done:
 *         type: boolean
 *         description: 완료 여부
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns index page
 *     tags: [index]
 *     responses:
 *       200:
 *         description: todo list
 *         schema:
 *           type: object
 *           properties:
 *             todos:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/index'
 */
/* GET home page. */
router.get('/', function(req, res) {
  // res.status(200).render('index', { title: 'Express' });
	
	let data = new Object();
  data.result = new Object();


  data.result.code = 200;
  data.result.message = 'request ok';
  data.result.status = 'requestOk';
  res.status(data.result.code);

  res.send(data);
	
});


/**
 * @swagger
 * /test:
 *   get:
 *     summary: Returns index page
 *     tags: [index]
 *     responses:
 *       200:
 *         description: todo list
 *         schema:
 *           type: object
 *           properties:
 *             todos:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/index'
 */
/* GET home page. */
router.get('/test', function(req, res) {
  // res.status(200).render('index', { title: 'Express' });
	
	let data = new Object();
  data.result = new Object();


  data.result.code = 200;
  data.result.message = 'request ok';
  data.result.status = 'requestOk';
  res.status(data.result.code);

  res.send(data);
	
});

module.exports = router;