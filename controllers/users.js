
const jwt = require('jsonwebtoken'); // module import
const passport = require('passport');
const models = require('../models');
const cryptfuncs = require('../drivers/cryptfuncs');
const util = require('../drivers/util');
const { nextTick } = require('async');
const upload = require('../routes/thirdparts/fileUpload_s3_aws');
const multer = require('multer');
const { Nft , Users } = require('../models');
const ethfuncs = require('../drivers/ethdrv');
const admin = new ethfuncs('mainnet', 1, global.env.INFURA_ADMIN_KEY);
const BigNumber = require('bignumber.js');
const etherscan = require('../drivers/etherscan');
const BN = require('bn.js');

// import cryptfuncs from '../drivers/cryptfuncs';

const crypt = new cryptfuncs();

class usersfunc {
	
	async chgMyImg(req, res) {

		
		let result = new Object();
		result.code = "OK"

		upload(req, res, function(err) {
		
			if (err instanceof multer.MulterError) {
				return next(err);
			} else if (err) {
				return next(err);  
			}

			try{
				if(req.file){
					let query = `INSERT INTO mnb_nft_users(
						ADDRESS,
						FILE_PATH,
						NICK_NAME,
						TVP_AMOUNT,
						TVS_AMOUNT,
						CREATEDAT,
						UPDATEDAT
					)
					VALUES(
						'${req.body.address}',
						'${req.file.location.replace('\\','/')}',
						NULL,
						'0',
						'0',
						NOW(),
						NOW()
					)
					ON DUPLICATE KEY UPDATE 
					file_path = '${req.file.location.replace('\\','/')}'`;
		
					models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE }).then(function(fileRes){
						result.code = "OK";
					});
					
					result.code = "OK";
				}else{
					result.code = "FAIL";
				}

				if(err) {
					result.code = 'FAIL';
					result.message = 'create nft failed';
					result.status = 'creatNftFailed';
				}else{
					result.message = 'OK';
					result.status = 'createNftOK';
				}
			}catch(error){
				console.log(error)
			}
			res.json(result)
			res.send();

		});

		
							
	}

	async chgMyNickName(req, res) {

		let result = new Object();
		result.result = new Object();

		try{

				let query = `INSERT INTO mnb_nft_users(
					ADDRESS,
					NICK_NAME,
					TVP_AMOUNT,
					CREATEDAT,
					UPDATEDAT
				)
				VALUES(
					'${req.body.address}',
					'${req.body.nickName}',
					'0',
					NOW(),
					NOW()
				)
				ON DUPLICATE KEY UPDATE 
				nick_name = '${req.body.nickName}'`;

				models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE }).then(function(fileRes){
					result.result.code = 200;
				});
				result.result.code = 200;

		}catch(e){
			console.log(e);
		}

		res.send(result);	
							
	}


	
	async myUserInfo(address) {

		let result ;
		let tvsBalance = null;
		let ethBalance = null;
		let polygonBalance = null;
		let tvs_amount = '0';
		let eth_amount = '0';
		let polygon_amount = '0';


		
		const toTokenAmountString = (rawBalance) => {
		// rawBalance가 null/undefined/"Error"/"" 등일 수 있음
		if (rawBalance === null || rawBalance === undefined) return "0";
		if (rawBalance === "Error" || rawBalance === "NOTOK") return "0"; // etherscan류
		
		// 숫자 문자열이 아니면 0
		if (!/^\d+(\.\d+)?$/.test(String(rawBalance))) return "0";
		
		// BigNumber로 나눠서 문자열로 반환
		// (etherscan result는 보통 wei 단위의 정수 문자열)
		const bn = new BigNumber(String(rawBalance));
		if (!bn.isFinite() || bn.isNaN()) return "0";
		
		return bn.div(new BigNumber(10).pow(18)).toFixed(); // 필요하면 toFixed(6) 등
		};

		  
		try{
			do {			

				if(address != undefined){
					// let token = await admin.getContract('TVS');
					// tvsBalance = await admin.getTokenBalance(address, token.contract);
					
					let tvsurl = etherscan.getTokenOpt(address, global.env.ETHERSCAN_APIKEY,'0xdb34D66dE1F5Ee546dAD6F9075169fE04e1fb772');
					let resultTvs  = JSON.parse(await util.requestHttps(tvsurl));
					tvsBalance = resultTvs.result;

					let ethurl = etherscan.getEtherOpt(address, global.env.ETHERSCAN_APIKEY);
					let resultEth  = JSON.parse(await util.requestHttps(ethurl));
					ethBalance = resultEth.result;
					console.log('ethBalance : '+ethBalance)
					//ethBalance = new BN(resultEth.result);

					let polygonurl = etherscan.getPolygonOpt(address, global.env.POLYGONSCAN_APIKEY);
					let resultPolygon  = JSON.parse(await util.requestHttps(polygonurl));
					polygonBalance = resultPolygon.result;

					tvs_amount = toTokenAmountString(tvsBalance);
					eth_amount = toTokenAmountString(ethBalance);
					polygon_amount = toTokenAmountString(polygonBalance);


					// if(tvsBalance != null){
					// 	tvs_amount = new BigNumber(tvsBalance).div(new BigNumber(10).pow(18)).toNumber();
					// }
					// if(ethBalance != null){
					// 	eth_amount = new BigNumber(ethBalance).div(new BigNumber(10).pow(18)).toNumber();
					// }
					// if(polygonBalance != null){
					// 	polygon_amount = new BigNumber(polygonBalance).div(new BigNumber(10).pow(18)).toNumber();
					// }
				}


				let query = `SELECT  address
									,file_path
									,nick_name
									,tvp_amount
									,${tvs_amount} AS tvs_amount 
									,${eth_amount} AS eth_amount 
									,${polygon_amount} AS polygon_amount 
							FROM mnb_nft_users 
							WHERE address = '${address}'`;

				result = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.SELECT });

				if(result.length == 0){
					let query2 = `SELECT '${address}' AS address
									,'' AS file_path
									,'' AS nick_name
									,0 AS tvp_amount
									,${tvs_amount} AS tvs_amount 
									,${eth_amount} AS eth_amount 
									,${polygon_amount} AS polygon_amount `;

					result = await models.sequelize.query(query2, { type: models.Sequelize.QueryTypes.SELECT });
				}

			
			}while(false);

		}catch(error){
			console.log(error)
		}
		return result;
	}

	async mySwapHistory(address) {

		let result;

		try{
			do {			

				let query = `SELECT  id
									,address
									,blockNumber
									,eth_amount
									,tvp_amount
									,tvs_amount
									,polygon_amount
									,createdAt 
									,updatedAt
							FROM mnb_nft_swap_histories
							AND address = '${address}'`;

				result = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.SELECT });
			
			}while(false);
		}catch(error){
			console.log(error)
		}

		return result;
	}


}




module.exports = usersfunc;