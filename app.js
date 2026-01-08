//모든 숫자는 문자형태로 보낼것. toString(), bigNum() 둘다 특정 숫자에 에러남.

let runmode = process.argv.slice(-1)[0];

global.env = process.env;

if(runmode === 'local')	
	require('dotenv').config({path: __dirname + '/config/.env_local'});
else if(runmode === 'dev')	
	require('dotenv').config({path: __dirname + '/config/.env_dev'});
else if(runmode === 'prod')	
	require('dotenv').config({path: __dirname + '/config/.env_prod'});
else 
	require('dotenv').config({path: __dirname + '/config/.env_prod'});

process.argv.forEach(function (val, index, array) {
	console.log(index + ': ' + val);
});





console.log(runmode);

const schedule = require('node-schedule');
const initapp = require('./initapp');
const express = require('express');
const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const ethData = JSON.parse(fs.readFileSync(initapp.homepath + '/ethData.json'));
const crypto = require('crypto');
const bnum = require('big-number');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
//const redis = require('redis');
const jwt = require('jsonwebtoken'); // module import
const aws = require('aws-sdk');
const passportcfg = require('./drivers/passport');
const db = require('./models');
const excp = require('./drivers/exceptions');
const util = require('./drivers/util');
const nftfunc = require('./controllers/nft');
const nftController = new nftfunc();
const useInterval = require('usehooks-ts').useInterval;
const {createProxyMiddleware} = require('http-proxy-middleware');

const app = express();
// const router = express.Router();

// redis
//const redisclient = redis.createClient(global.env.REDIS_SERVER_PORT, global.env.REDIS_SERVER_IP);

var {sequelize} = require('./models/index')
sequelize.sync();

const index = require('./routes/index');
const ether = require('./routes/ether');
const token = require('./routes/token');
const auth = require('./routes/auth');
const users = require('./routes/users');
const nft = require('./routes/nft');
const accounts = require('./routes/accounts');
const point = require('./routes/point');
const notice = require('./routes/notice');
const { exception } = require('console');
const tokenApi = require('./routes/api/v1/token');
const adminApi = require('./routes/api/v1/admin');
const serverStatic = require('serve-static');
const path = require('path');

app.use(passport.initialize());
passportcfg();


// Swagger definition
// You can set every attribute except paths and swagger
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
const swaggerDefinition = {
  info: { // API informations (required)
    title: 'wallet-backend', // Title (required)
    version: '1.0.0', // Version (required)
    description: 'ether/token RPC API' // Description (optional)
  },
  // host: 'atairport.aidat.cf', // Host (optional)
  host: runmode === 'prod' ? global.env.NODE_SERVER_IP : global.env.NODE_SERVER_IP + ':' + global.env.NODE_SERVER_PORT, // Host (optional)
  // host: 'localhost:8588', // Host (optional)
  basePath: '/', // Base path (optional)
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      scheme: 'bearer',
      in: 'header', 
			bearerFormat: "JWT"
    }
  }
};

const components = {
  securitySchemes: {
    jwt: {
      type: "http",
      scheme: "bearer",
      in: "header",
      bearerFormat: "JWT"
    },
  }
};

const security = [{
  jwt: []
}];


// Options for the swagger docs
const options = {
    // Import swaggerDefinitions
    swaggerDefinition,
    // components,
    // security,
		// swagger: "2.0",
    // Path to the API docs
		// swaggerOptions: {
		// 	authAction :{ JWT: {name: "JWT", schema: {type: "apiKey", in: "header", name: "Authorization", description: ""}, value: "Bearer <JWT>"} }
		// },		
    apis: ['./routes/nft.js', './routes/users.js', './routes/accounts.js', './routes/point.js', './routes/ether.js', './routes/token.js', './routes/auth.js', './routes/notice.js']
}; 

// Options for the swagger docs
const tokenOpts = {
	swaggerDefinition,
	apis: ['./routes/api/v1/token.js']
};

const adminOpts = {
	swaggerDefinition,
	apis: ['./routes/api/v1/admin.js']
};

const swaggerSpec = swaggerJSDoc(options);
const tokenSpec = swaggerJSDoc(tokenOpts);
const adminSpec = swaggerJSDoc(adminOpts);

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json;');
  res.send(swaggerSpec);
});

app.use('/apidocs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//app.use(serverStatic(path.join(__dirname,'uploads')));  
app.use('/uploads',express.static('uploads'));


app.use(
	//
	createProxyMiddleware(['/create','/sell','/settle','/cancel','/bid','/buynow','/myAuctionList','/auctionList','/myNFTList','/auctionDetail','/nftDetail','/transfer','/chgMyImg'],{
		target:'https://dev.dt468jj27btfj.amplifyapp.com',
		//target:'http://127.0.0.1:3000',
		changeOrigin:true
	})
);

app.use(
	//
	createProxyMiddleware(['/create','/sell','/settle','/cancel','/bid','/buynow','/myAuctionList','/auctionList','/myNFTList','/auctionDetail','/nftDetail','/transfer','/chgMyImg','/chgMyNickName'],{
		target:'http://127.0.0.1:3000',
		changeOrigin:true
	})
);

app.use(
	createProxyMiddleware('/v1/get', {
		target: 'http://127.0.0.1:3000',  //프록시 할 주소
		onProxyReq(proxyReq, req, res) {
			proxyReq.setHeader('Origin','http://127.0.0.1:3000')
		},
		changeOrigin : true
	})
);

//body-parser  application/x-www-form-urlencoded
app.use(express.urlencoded({extended: false}));
//body-parser application/json 
app.use(express.json());

// middleware for appliaction
app.use(function(req, res, next) {
	
	res.header("Access-Control-Allow-Origin", "*"); 
	res.header("Access-Control-Allow-Headers", "*"); 
	console.log('middleware for appliaction');
	console.log(req.url);

	if(false) {
		
		if(req.url === '/accounts/innerTransactions' || req.url === '/accounts/innerTransactions/' || req.url === '/accounts/innertransactions' || req.url === '/accounts/innertransactions/')
			req.url = '/accounts/innerTransactions/undefined'

		if(req.url === '/accounts/transactions' || req.url === '/accounts/transactions/')
			req.url = '/accounts/transactions/undefined'
					
		// for notice
		if(req.url.includes('/notice/list?') === true)
			req.url = req.url.replace('/notice/list', '/notice/list/undefined');
			

		next();
	} else {
		
		if(req.url === '/accounts/innerTransactions' || req.url === '/accounts/innerTransactions/' || req.url === '/accounts/innertransactions' || req.url === '/accounts/innertransactions/')
		req.url = '/accounts/innerTransactions/undefined'

		if(req.url === '/accounts/transactions' || req.url === '/accounts/transactions/')
			req.url = '/accounts/transactions/undefined'		
			
		// for notice
		if(req.url.includes('/notice/list?') === true)
			req.url = req.url.replace('/notice/list', '/notice/list/undefined');

		let result = new Object();
		let active = util.isEmpty(req.headers.authorization) ? null : req.headers.authorization.split('Bearer ')[1];

		
		if(active != null) {	
			jwt.verify(active, process.env.JWT_ACTIVE_SECRET, function(err, decoded) {
				if(err) {
					result.message = 'active token expired';
					result.status = 'activeTokenExpired';
					result.code = 401;
					res.status(result.code);

					return res.json({
						result
					});
				}
				
				next();
			});
		}
		else
			next();
	
	}
});


app.use('/', index);
app.use('/point', point);
app.use('/ether', ether);
app.use('/token', token);
app.use('/auth', auth);
app.use('/users', users);
app.use('/nft', nft);
app.use('/accounts', accounts);
app.use('/notice', notice);

app.use('/api/v1/token', tokenApi);
app.use('/api/v1/admin', adminApi);

app.get('/', excp.wrapAsync(async function (req, res) {
    await new Promise((resolve) => setTimeout(() => resolve(), 50));
    // 비동기 에러
    // throw new Error("에러 발생!");

		throw new Error('error occurred');
  })
);



// middleware for error
app.use(function (error, req, res, next) {
	res.status(400);
  res.json({ 
		error_code: res.errorCode,
		status_code: res.statusCode,
		message: error.message,
		// detail: 'error occurred'
	});
});




// middleware for router
// router.use(function(req, res, next) {
// 	// req.cache = client;
	
// 	console.log(req.headers.authorization);
// 	// next();
// });

// app.use('/', router);

// app.use('/', router);

// app.listen(3000);

// function wrapAsync(fn) {
//   return function (req, res, next) {
//     // 모든 오류를 .catch() 처리하고 체인의 next() 미들웨어에 전달
//     // (이 경우에는 오류 처리기)

// 		// res.error_code = 1000;
// 		// res.status_code = 400;
// 		// res.message
//     fn(req, res, next).catch(next);
//   };
// }

app.use((err, req, res, next) => {
  const newError = newErrorMap.get(err.name);
  if(newError) {
    next(new newError(err.message));
  } else {
    next(err);
  }
});



app.listen(global.env.NODE_SERVER_PORT, () => {

	// var j = schedule.scheduleJob('0 * * * * *', function(){
	// 	nftController.setTokenSwap();
		
	// });

	// console.log('server running on port ' + global.env.NODE_SERVER_PORT);
});

// module.exports = app;


// 200 : OK, 요청 정상 처리 
// 201 : Created, 생성 요청 성공
// 202 : Accepted, 비동기 요청 성공
// 204 : No Content, 요청 정상 처리, 응답 데이터 없음. 

// 실패

// 400 : Bad Request, 요청이 부적절 할 때, 유효성 검증 실패, 필수 값 누락 등. 
// 401 : Unauthorized, 인증 실패, 로그인하지 않은 사용자 또는 권한 없는 사용자 처리
// 402 : Payment Required
// 403 : Forbidden, 인증 성공 그러나 자원에 대한 권한 없음. 삭제, 수정시 권한 없음. 
// 404 : Not Found, 요청한 URI에 대한 리소스 없을 때 사용. 
// 405 : Method Not Allowed, 사용 불가능한 Method를 이용한 경우. 
// 406 : Not Acceptable, 요청된 리소스의 미디어 타입을 제공하지 못할 때 사용.
// 408 : Request Timeout
// 409 : Conflict, 리소스 상태에 위반되는 행위 시 사용.
// 413 : Payload Too Large
// 423 : Locked
// 428 : Precondition Required
// 429 : Too Many Requests

// 500 : 서버 에러 