
const jwt = require('jsonwebtoken'); // module import
const passport = require('passport');
const models = require('../models');
const cryptfuncs = require('../drivers/cryptfuncs');
const util = require('../drivers/util');
const { nextTick } = require('async');
const upload = require('../routes/thirdparts/fileUpload_s3_aws');
const multer = require('multer');
const { Nft , NftFavorite , Users, NftSwapHist } = require('../models');

const ethfuncs = require('../drivers/ethdrv');
const users = new ethfuncs('ropsten', 3, '04c4d59194974921b49dc457d728b64e');
const BigNumber = require('bignumber.js');
const tokenCtrl = require('../controllers/token');
const Tx = require('ethereumjs-tx').Transaction;
const initapp = require('../initapp')
const token = new tokenCtrl();

// import cryptfuncs from '../drivers/cryptfuncs';

const crypt = new cryptfuncs();
const Op = models.Sequelize.Op;

class nftfunc {

	// crypt;
	

	constructor() {

		// this.crypt = new cryptfuncs();

	}
	
	/**
	 * 작품등록
	 * @param {*} req 
	 * @param {*} res 
	 */
	async create(req, res) {

		let result = new Object();
		result.code = "OK";

		upload(req, res, function(err) {
		
			if (err instanceof multer.MulterError) {
				console.log(err)
				return next(err);
			} else if (err) {
				console.log(err)
				return next(err);  
			}
			
			try {

				if(req.file){
					console.log('title :'+req.body.title) 
					console.log('원본파일명 : ' + req.file.originalname)
					console.log('저장파일명 : ' + req.file.filename)
					console.log('크기 : ' + req.file.size)
					console.log('description : ' + req.body.description)
					// console.log('경로 : ' + req.file.location) s3 업로드시 업로드 url을 가져옴
					
					let created = models.Nft.create({  
						address: req.body.address,
						file_path: req.file.location.replace('\\','/'), //s3 업로드시 업로드 url을 가져옴
						//file_path: req.file.path,
						category: req.body.category,
						nft_link: req.body.nftLink,
						market_yn: 'N',
						del_yn: 'N',
						title: req.body.title,
						description: req.body.description
					}).then(function(res){
						console.log(res)
						console.log("OK")
						result.code = "OK";
					}); 
				
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
	

	/**
	 * 판매등록
	 * @param {*} req 
	 * @param {*} res 
	 */
	async sell(req, res) {

		let result = new Object();
		result.result = new Object();

		try{
			do {
				
				let created = models.NftMarket.create({  
					nft_id: req.body.nftId,
					buynow_price: req.body.buyNowPrice,
					start_price: req.body.startPrice,
					current_price: req.body.startPrice,
					seller: req.body.seller,
					status: '1',
					expire_date: req.body.expireDate
				}); 

	
				let updated = await models.Nft.update({market_yn: 'Y'}, {where: {id: req.body.nftId}});

				result.result.code = 200;

			}while(false);
		
		}catch(error){
			console.log(error)
		}
		res.send(result);							
	}


	/**
	 * 입찰
	 * @param {*} req 
	 * @param {*} res 
	 */
	async bid(req, res) {

		let result = new Object();
		result.result = new Object();
		
		try{
				
			let preAuctionDetail = await models.NftMarket.findOne({
				attributes: [['highest_bidder','highestBidder'],'current_price'],
				include:[
					{
					model: Nft,
					attributes: [['address','owner'],['address','seller'],['file_path','img'] , ['title','auctionTitle'], ['nft_link','nftLink'],'description']
					} 
				],
				where: {id : req.body.auctionId}
				
			});

			let created = models.NftBidding.create({  
				auction_id: req.body.auctionId, 
				bidding_price: req.body.biddingPrice,
				address: req.body.address 
			}); 

			let targetRes = await models.NftMarket.findOne({
				attributes: ['bidCnt'],
				where: {id : req.body.auctionId}
				
			});

			let bidCnt = targetRes.bidCnt+1;

			let updated = await models.NftMarket.update({bidCnt: bidCnt,current_price:req.body.biddingPrice,highest_bidder:req.body.address}, {where: {id: req.body.auctionId}});

			//입찰자 TVP 차감
			let query = `UPDATE mnb_nft_users
							SET tvp_amount = CAST(tvp_amount AS UNSIGNED) - ${req.body.biddingPrice}
							WHERE address = '${req.body.address}'`;

			let myinfoUpdated = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE });
			
			//입찰자 TVP 리턴
			if(preAuctionDetail.dataValues.highestBidder !== 'null' && preAuctionDetail.dataValues.highestBidder !== ''){
				let query2 = `UPDATE mnb_nft_users
							SET tvp_amount = CAST(tvp_amount AS UNSIGNED) + ${preAuctionDetail.dataValues.current_price}
							WHERE address = '${preAuctionDetail.dataValues.highestBidder}'`;

				let myinfoUpdated2 = await models.sequelize.query(query2, { type: models.Sequelize.QueryTypes.UPDATE });
			}

			let auctionDetail = await models.NftMarket.findOne({
				attributes: [['id','auctionId'],['buynow_price','buyNowPrice'] ,['start_price','currentPrice'], ['expire_date','expiryDate'],['highest_bidder','highestBidder'],'status','seller'],
				include:[
					{
					model: Nft,
					attributes: [['address','owner'],['address','seller'],['file_path','img'] , ['title','auctionTitle'], ['nft_link','nftLink'],'description']
					} 
				],
				where: {id : req.body.auctionId}
				
			});

			let biddingList = await models.NftBidding.findAll({
				attributes: [['id','bidId'],['auction_id','auctionId'],['address','bidder'] ,['bidding_price','price'], ['createdAt','timestamp']],
				where: {auction_id : req.body.auctionId}
				
			});

			let userInfoQuery = `SELECT  address
								,tvp_amount
						FROM mnb_nft_users 
						WHERE address = '${req.body.address}'`;

			let userInfo = await models.sequelize.query(userInfoQuery, { type: models.Sequelize.QueryTypes.SELECT });


			result.result.code = 200;
			result.auctionDetail = auctionDetail;
			result.result.biddingList = biddingList;
			result.result.userInfo = userInfo[0];
	
		}catch(error){
			console.log(error)
		}
		res.send(result);	

	}

	/**
	 * 바로구매
	 * @param {*} req 
	 * @param {*} res 
	 */
	async buynow(req, res) {

		let result = new Object();

		try{
			do {

				let preAuctionDetail = await models.NftMarket.findOne({
					attributes: [['highest_bidder','highestBidder'],'current_price'],
					include:[
						{
						model: Nft,
						attributes: [['address','owner'],['address','seller'],['file_path','img'] , ['title','auctionTitle'], ['nft_link','nftLink'],'description']
						} 
					],
					where: {id : req.body.auctionId}
					
				});

				//입찰자 TVP 리턴
				if(preAuctionDetail.dataValues.highestBidder !== 'null' && preAuctionDetail.dataValues.highestBidder !== ''){
					let query2 = `UPDATE mnb_nft_users
								SET tvp_amount = CAST(tvp_amount AS UNSIGNED) + ${preAuctionDetail.dataValues.current_price}
								WHERE address = '${preAuctionDetail.dataValues.highestBidder}'`;

					let myinfoUpdated2 = await models.sequelize.query(query2, { type: models.Sequelize.QueryTypes.UPDATE });
				}
				
				let created = models.NftBidding.create({  
					auction_id: req.body.auctionId, 
					bidding_price: req.body.biddingPrice,
					address: req.body.address 
				}); 

				let targetRes = await models.NftMarket.findOne({
					attributes: ['nft_id','bidCnt','status'],
					where: {id : req.body.auctionId}
					
				});

				let bidCnt = targetRes.dataValues.bidCnt+1;
				
				let updated1 = await models.Nft.update({market_yn: 'N'}, {where: {id: targetRes.dataValues.nft_id}});
				let updated2 = await models.NftMarket.update({status: '3',bidCnt: bidCnt,highest_bidder:req.body.address,current_price:req.body.biddingPrice}, {where: {id: req.body.auctionId}});
				

				//입찰자 TVP 차감
				 let query = `UPDATE mnb_nft_users
				 				SET tvp_amount = CAST(tvp_amount AS UNSIGNED) - ${req.body.biddingPrice}
				 				WHERE address = '${req.body.address}'`;

				 let myinfoUpdated = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE });
				

				console.log("업데이트 성공");

				result.code = 200;
	
			}while(false);
		}catch(error){
			console.log(error)
		}
		res.send(result);							
	}

	/**
	 * 경매 SETTLE (경매 종료 후 판매자 확정)
	 */
	async settle(req, res) {

		let result = new Object();

		try{
			

			do {

				let maxPriceQuery = `SELECT MAX(CURRENT_PRICE) AS maxPrice FROM mnb_nft_markets WHERE id = '${req.body.auctionId}'`;
				let maxPriceRes = await models.sequelize.query(maxPriceQuery, { type: models.Sequelize.QueryTypes.SELECT });

				let selectQuery = `CASE 
								   WHEN UNIX_TIMESTAMP() <= EXPIRE_DATE  AND status = "1" 
								   THEN "경매가 진행중입니다." 
								   WHEN CURRENT_PRICE IS NULL 
								   THEN "입찰내역이 없습니다." ELSE "OK" END`;

				let targetRes = await models.NftMarket.findOne({
					attributes: ['nft_id','highest_bidder',[models.sequelize.literal(selectQuery),'status']],
					where: {id : req.body.auctionId}
					
				});

				let currentPrice = Number(maxPriceRes[0].maxPrice);
				let finalPrice = Number((currentPrice*0.975).toFixed(0));

				if(targetRes.dataValues.status !== 'OK'){
					result.message = targetRes.status;
					result.code = 100;
				}else{
					let updated1 = await models.Nft.update({market_yn: 'N',address:targetRes.highest_bidder}, {where: {id: targetRes.dataValues.nft_id}});
					let updated2 = await models.NftMarket.update({status: '2'}, {where: {id: req.body.auctionId}});

					/**
					let depositReturnListQuery = `SELECT auction_id AS auctionId
														,address
														,SUM(bidding_price) AS biddingPrice 
												  FROM mnb_nft_biddings 
												  WHERE auction_id = '${req.body.auctionId}'
												  GROUP BY auction_id,address`;

					let depositReturnList = await models.sequelize.query(depositReturnListQuery, { type: models.Sequelize.QueryTypes.SELECT });
					
					console.log('depositReturnList.length : '+depositReturnList.length);
					if(depositReturnList.length > 0){

						for(var i=0; i < depositReturnList.length ; i++){
							console.log('depositReturnList[i].biddingPrice : '+depositReturnList[i].biddingPrice);
							console.log('depositReturnList[i].address : '+depositReturnList[i].address);
							let depositUpdateQuery = `UPDATE mnb_nft_users
								SET tvp_amount = CAST(tvp_amount AS UNSIGNED) + ${depositReturnList[i].biddingPrice}
								WHERE address = '${depositReturnList[i].address}'`;

							let depositUpdate = await models.sequelize.query(depositUpdateQuery, { type: models.Sequelize.QueryTypes.UPDATE });
						}

					}
 					*/

					let query1 = `UPDATE mnb_nft_users
								SET tvp_amount = CAST(tvp_amount AS UNSIGNED) + ${finalPrice}
								WHERE address = '${req.body.owner}'`;

					let myInfoUpdated = await models.sequelize.query(query1, { type: models.Sequelize.QueryTypes.UPDATE });

					/**
					let query2 = `UPDATE mnb_nft_users
								SET tvp_amount = CAST(tvp_amount AS UNSIGNED) - ${currentPrice}
								WHERE address = '${targetRes.highest_bidder}'`;

					let buyerInfoUpdated = await models.sequelize.query(query2, { type: models.Sequelize.QueryTypes.UPDATE });
 					*/

					result.code = 200;
				}

			}while(false);
		}catch(error){
			console.log(error)
		}
		res.send(result);							
	}


	/**
	 * 경매취소
	 * @param {*} req 
	 * @param {*} res 
	 */
	async cancel(req, res) {

		let result = new Object();

		try{
			do {

				let targetRes = await models.NftMarket.findOne({
					attributes: ['nft_id',[models.sequelize.literal('CASE WHEN cast(CURRENT_PRICE as unsigned) > cast(START_PRICE as unsigned) THEN "입찰내역이 있습니다." ELSE "OK" END'),'status']],
					where: {id : req.body.auctionId}
				});

				if(targetRes.dataValues.status !== 'OK'){
					result.message = targetRes.status;
					result.code = 100;
				}else{
					let updated1 = await models.Nft.update({market_yn: 'N'}, {where: {id: targetRes.dataValues.nft_id}});
					let updated2 = await models.NftMarket.update({status: '9'}, {where: {id: req.body.auctionId}});
					result.code = 200;
				}

			}while(false);
		}catch(error){
			console.log(error)
		}
		res.send(result);							
	}

	/**
	 * 작품삭제
	 * @param {*} req 
	 * @param {*} res 
	 */
	 async delete(req, res) {

		let result = new Object();

		try{
			let updated = await models.Nft.update({del_yn: 'Y'}, {where: {id: req.body.nftId}});	
			result.code = 200;
			result.message = '작품삭제 성공';

		}catch(error){
			result.code = 100;
			result.message = '작품삭제 실패';
			console.log(error)
		}
		res.send(result);							
	}


	/**
	 * 나의 경매리스트
	 * @param {*} address 
	 * @returns 
	 */
	async getMyAuctionList(address) {

		let result
		let status = ['1','3'];
		//세틀대상 추가
		try{

			do {			
	
				result = await models.NftMarket.findAll({
					attributes: [['id','auctionId'],['buynow_price','buyNowPrice'] ,['start_price','currentPrice'], ['expire_date','expiryDate'],['highest_bidder','highestBidder'],'status'],
					include:[
						{
						model: Nft,
						attributes: [['address','owner'],['address','seller'],['file_path','img'] , ['title','auctionTitle'], ['nft_link','nftLink'], 'description'],
						where :{address : address, del_yn : 'N'}
						} 
					],
					where :{status:{[Op.in]: status }}
					
				});
			
			}while(false);

		}catch(error){
			console.log(error)
		}
		return result;
	}


	/**
	 * 통합 경매리스트
	 * @param {*} req 
	 * @returns 
	 */
	async getAuctionList(req) {

		let data = new Object(); 
		let result;
		let rankResult;
		let resultCount;
		let order = 'a.id DESC';
		const keyword = req.body.keyword?req.body.keyword:'';
		const category = req.body.category;
		const address = req.body.address;
		const limit = req.body.limit?req.body.limit:8;
		const offset = req.body.offset?req.body.offset:0;
		const where = util.isEmpty(category) ? {title :{ [Op.like]:'%'+keyword+'%'} }  :{title :{ [Op.like]:'%'+keyword+'%'} , category:{[Op.in]: category } } ;
		const orderby = req.body.orderby;
		let categoryWhere = '';

		if(orderby === 0){//LiveAuction
			order = 'a.id DESC';
		}else if(orderby === 1){//HotBid
			order = 'a.bidCnt DESC';
		}


		if(!util.isEmpty(category)){
			categoryWhere = `AND b.category IN (${category})`;
		}

		try{
			do {			


				
				let query = `SELECT row_number() over(order BY ${order}) AS rownum
									, a.id AS auctionId
									, a.buynow_price AS buyNowPrice
									, a.current_price AS currentPrice
									, a.expire_date AS expiryDate
									, a.highest_bidder AS highestBidder
									, a.status
									, IFNULL(c.favorite_yn,'N') AS favoriteYn
									, b.address AS owner
									, b.address AS seller
									, b.file_path AS img
									, b.nft_link AS nftLink
									, b.title AS auctionTitle
									, b.description
									, b.category
									, (SELECT IFNULL(SUM(bidding_price),0) FROM mnb_nft_biddings bid WHERE bid.auction_id = a.id) AS totalBidPrice
									, CASE 
									  WHEN b.category = 1 THEN 'Diamond' 
									  WHEN b.category = 2 THEN 'Artwork'
									  WHEN b.category = 3 THEN 'Digital Art'
									  ELSE '' END AS categoryNm
									, d.file_path AS profilePath
							FROM mnb_nft_markets a
							JOIN mnb_nft_masters b ON a.nft_id = b.id
							LEFT JOIN mnb_nft_favorites c ON a.id = c.auction_id AND c.address = '${address}'
							LEFT JOIN mnb_nft_users d ON b.address = d.address
							WHERE b.title like '%${keyword}%'
							${categoryWhere}
							AND a.expire_date >  ${Math.floor(Date.now() / 1000)}
							AND a.status = '1' 
							AND b.del_yn = 'N'
							ORDER BY ${order}
							LIMIT ${limit}
							OFFSET ${offset}`;

				result = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.SELECT });
	
				let rankQuery = `SELECT row_number() over(order BY ${order}) AS rownum
									, a.id AS auctionId
									, a.buynow_price AS buyNowPrice
									, a.current_price AS currentPrice
									, a.expire_date AS expiryDate
									, a.highest_bidder AS highestBidder
									, a.status
									, b.address AS owner
									, b.address AS seller
									, b.file_path AS img
									, b.nft_link AS nftLink
									, b.title AS auctionTitle
									, b.description
									, b.category
									, (SELECT IFNULL(SUM(bidding_price),0) FROM mnb_nft_biddings bid WHERE bid.auction_id = a.id) AS totalBidPrice
									, CASE 
									  WHEN b.category = 1 THEN 'Diamond' 
									  WHEN b.category = 2 THEN 'Artwork'
									  WHEN b.category = 3 THEN 'Digital Art'
									  ELSE '' END AS categoryNm
							FROM mnb_nft_markets a
							JOIN mnb_nft_masters b ON a.nft_id = b.id
							WHERE a.status = '1'
							${categoryWhere}
							AND a.expire_date >  ${Math.floor(Date.now() / 1000)}
							AND b.del_yn = 'N'
							AND a.bidCnt > 0
							ORDER BY a.bidCnt desc,current_price desc
							LIMIT ${limit}
							OFFSET ${offset}`;

				rankResult = await models.sequelize.query(rankQuery, { type: models.Sequelize.QueryTypes.SELECT });

				resultCount = await models.NftMarket.findAll({
					attributes: ['id'],
					include:[
						{
						model: Nft,
						attributes: [['address','owner'],['address','seller'],['file_path','img'] , ['nft_link','nftLink'], 'title', 'description'],
						where: where
						} 
					]
					,where : {expire_date :{ [Op.gte]: Math.floor(Date.now() / 1000)},status:'1'}
					
				});
			
			}while(false); 
		}catch(error){
			console.log(error)
		}

		data.result = result;
		data.rankResult = rankResult;
		data.totalCount = resultCount.length;
		data.nextPage = resultCount.length > limit + offset ? 'Y' : 'N';

		return data;
	}

	/**
	 * 나의 작품리스트
	 * @param {*} address 
	 * @param {*} marketYn 
	 * @returns 
	 */
	async getMyNFTList(address,marketYn) {

		let result;

		try{
			do {			
	
				result = await models.Nft.findAll({
					//where: {address : address}
					attributes: ['id',['address','owner'],['file_path','img'] ,['nft_link','nftLink'], 'file_path', 'market_yn', 'title', 'description'],
					where: {address : address, market_yn : marketYn, del_yn : 'N'},
					order: [['createdAt', 'DESC']]
					
				});
				
	
			
			}while(false);

			console.log(result)
		}catch(error){
			console.log(error)
		}

		return result;
	}


	/**
	 * 경매상세
	 * @param {*} id 
	 * @returns 
	 */
	async getAuctionDetail(id) {

		let data = new Object();  
		let auctionDetail;
		let biddingList;

		try{
			do {			
	
				let query = `SELECT a.id AS auctionId
									, a.buynow_price AS buyNowPrice
									, a.current_price AS currentPrice\
									, a.start_price as startPrice
									, a.expire_date AS expiryDate
									, a.highest_bidder AS highestBidder
									, a.status
									, b.address AS owner
									, a.seller
									, b.file_path AS img
									, b.nft_link AS nftLink
									, b.title AS auctionTitle
									, b.description
									, b.category
									, (SELECT IFNULL(SUM(bidding_price),0) FROM mnb_nft_biddings bid WHERE bid.auction_id = a.id) AS totalBidPrice
									, CASE 
									  WHEN b.category = 1 THEN 'Diamond' 
									  WHEN b.category = 2 THEN 'Artwork'
									  WHEN b.category = 3 THEN 'Digital Art'
									  ELSE '' END AS categoryNm
									, d.file_path AS profilePath
							FROM mnb_nft_markets a
							JOIN mnb_nft_masters b ON a.nft_id = b.id
							LEFT JOIN mnb_nft_users d ON b.address = d.address
							WHERE a.id = '${id}'`;

				auctionDetail = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.SELECT });

				// auctionDetail = await models.NftMarket.findOne({
				// 	attributes: [['id','auctionId'],['buynow_price','buyNowPrice'] ,['current_price','currentPrice'],['start_price','startPrice'], ['expire_date','expiryDate'],['highest_bidder','highestBidder'],'status','seller'],
				// 	include:[
				// 		{
				// 		model: Nft,
				// 		attributes: [['address','owner'],['address','seller'],['file_path','img'] , ['title','auctionTitle'], ['nft_link','nftLink'], 'description','category']
				// 		} 
				// 	],
				// 	where: {id : id}
					
				// });

				biddingList = await models.NftBidding.findAll({
					attributes: [['id','bidId'],['auction_id','auctionId'],['address','bidder'] ,['bidding_price','price'], ['createdAt','timestamp']],
					where: {auction_id : id}
					
				});
			
			}while(false);
		}catch(error){
			console.log(error)
		}
		data.auctionDetail = auctionDetail;
		data.auctionDetail.biddingList = biddingList;

		return data;
	}

	/**
	 * 나의작품 상세
	 * @param {*} id 
	 * @returns 
	 */
	async getNftDetail(id) {

		let result;

		try{
			do {			
	
				// result = await models.Nft.findOne({
				// 	attributes: ['id',['address','owner'],['file_path','img'] ,['nft_link','nftLink'], 'category', 'market_yn', 'title', 'description'],
				// 	where: {id : id}
					
				// });

				let query = `SELECT a.file_path AS img
									, a.nft_link AS nftLink
									, a.title
									, a.description
									, a.category
									, b.file_path AS profilePath
									, a.address AS owner
									, a.id
							FROM mnb_nft_masters a
							LEFT JOIN mnb_nft_users b ON a.address = b.address
							WHERE a.id = '${id}'`;

					result = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.SELECT });

			
			}while(false);

			console.log(result)
		}catch(error){
			console.log(error)
		}

		return result;
	}

	
	/**
	 * 집금로직
	 */
	async setTokenSwap() {

		let result;
		let swapETHData;
		let swapTVSData;
		let swapMATICData;
		let startBlock = 0;
		let address = '0x1A240a62aFB15D6f6B427e13Fad106C9E73962A7'; // ETH 집금주소
		let contractAddress = '0xdb34D66dE1F5Ee546dAD6F9075169fE04e1fb772'; // ERC20 집금주소
		let apiKey = '38JFUUFNQSWS5F2FC77HP4Y4H337W2JH1Y'; //토큰조회용 apikey


		try{
			do {			

				let dollorRes = await util.requestHttps('https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD');
				let dollorJson = JSON.parse(dollorRes);
				let dollor = Number(dollorJson[0].basePrice);

				console.log('dollor : ' + dollor);

				let ethRes = await util.requestHttps('https://api.upbit.com/v1/ticker?markets=KRW-ETH');
				let ethJson = JSON.parse(ethRes);
				let ethPrice = Number(ethJson[0].trade_price);
				
				console.log('ethPrice : ' + ethPrice);			

				let polygonRes = await util.requestHttps('https://api.upbit.com/v1/ticker?markets=KRW-MATIC');
				let polygonJson = JSON.parse(polygonRes);
				let polygonPrice = Number(polygonJson[0].trade_price);

				console.log('polygonPrice : ' + polygonPrice);			

				swapETHData = await models.NftSwapInfo.findOne({
					attributes: ['address','currentBlockNumber'],
					where: {address : address, symbol:'ETH'}
					
				});

				if(swapETHData){
					if(swapETHData && swapETHData.address !== ''){ 
						startBlock = swapETHData.currentBlockNumber;
					}
		
					console.log("ETH 집금시작 startBlock : "+swapETHData.currentBlockNumber);
		
					result = await util.requestHttps('https://api.etherscan.io/api?module=account&action=txlist&address='+address+'&startblock='+(Number(startBlock)+1));
					const ethBlockList = JSON.parse(result);
					// console.log("토큰결과")
					// console.log(tokenBlockList)
					if(ethBlockList.result.length > 0){
		
						for(var i=0 ; i < ethBlockList.result.length; i++){
							let tvpPoint = 0;
							if(ethBlockList.result[i].txreceipt_status === '1'){
								let ethAmount = new BigNumber(ethBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber();
								tvpPoint = (ethAmount*ethPrice)/dollor;

								let created = models.NftSwapHist.create({  
									address: ethBlockList.result[i].from,
									blockNumber: ethBlockList.result[i].blockNumber,
									txid: ethBlockList.result[i].hash,
									swap_from: 'ETH', 
									swap_to: 'TVP',
									swap_from_amount: new BigNumber(ethBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber(),
									swap_to_amount: tvpPoint.toFixed(0)
								}); 
							}
		
							let updated = await models.NftSwapInfo.update({currentBlockNumber: ethBlockList.result[i].blockNumber}, {where: {address: address , symbol: 'ETH'}});						

							let query = `INSERT INTO mnb_nft_users(
								ADDRESS,
								FILE_PATH,
								NICK_NAME,
								TVP_AMOUNT,
								CREATEDAT,
								UPDATEDAT
							)
							VALUES(
								'${ethBlockList.result[i].from}',
								NULL,
								NULL,
								'${tvpPoint.toFixed(0)}',
								NOW(),
								NOW()
							)
							ON DUPLICATE KEY UPDATE 
							tvp_amount = CAST(tvp_amount AS UNSIGNED) + ${tvpPoint.toFixed(0)}`;

							let myinfoUpdated = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE });

							console.log(" ETH AMT : "+new BigNumber(ethBlockList.result[i].value).div(new BigNumber(10).pow(18)))

						}
						
					}
				}


				swapTVSData = await models.NftSwapInfo.findOne({
					attributes: ['address','currentBlockNumber'],
					where: {address : contractAddress}
					
				});

				if(swapTVSData){
					if(swapTVSData && swapTVSData.address !== ''){ 
						startBlock = swapTVSData.currentBlockNumber;
					}
		
					console.log("ERC20 집금시작 startBlock : "+swapTVSData.currentBlockNumber);
		
					result = await util.requestHttps('https://api.etherscan.io/api?module=account&action=tokentx&address='+address+'&apikey='+apiKey+'&startblock='+(Number(startBlock)+1));
					const tokenBlockList = JSON.parse(result);
					// console.log("토큰결과")
					// console.log(tokenBlockList)
					if(tokenBlockList.result.length > 0){
		
						for(var i=0 ; i < tokenBlockList.result.length; i++){
							//if(tokenBlockList.result[i].txreceipt_status === '1'){
								let created = models.NftSwapHist.create({  
									address: tokenBlockList.result[i].from,
									blockNumber: tokenBlockList.result[i].blockNumber,
									txid: tokenBlockList.result[i].hash,
									swap_from: 'TVS',
									swap_to: 'TVP',
									swap_from_amount: new BigNumber(tokenBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber(),
									swap_to_amount: new BigNumber(tokenBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber()
								}); 
							//}
							
							let updated = await models.NftSwapInfo.update({currentBlockNumber: tokenBlockList.result[i].blockNumber}, {where: {address: contractAddress}});

							let query = `INSERT INTO mnb_nft_users(
											ADDRESS,
											FILE_PATH,
											NICK_NAME,
											TVP_AMOUNT,
											CREATEDAT,
											UPDATEDAT
										)
										VALUES(
											'${tokenBlockList.result[i].from}',
											NULL,
											NULL,
											'${new BigNumber(tokenBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber()}',
											NOW(),
											NOW()
										)
										ON DUPLICATE KEY UPDATE 
										tvp_amount = CAST(tvp_amount AS UNSIGNED) + ${new BigNumber(tokenBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber()}`;


							let myinfoUpdated = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE });
							
						}
						
					}
				}


				swapMATICData = await models.NftSwapInfo.findOne({
					attributes: ['address','currentBlockNumber'],
					where: {address : address, symbol:'MATIC'}
					
				});


				if(swapMATICData){
					if(swapMATICData && swapMATICData.address !== ''){ 
						startBlock = swapMATICData.currentBlockNumber;
					}
		
					console.log("POLYGON 집금시작 startBlock : "+swapMATICData.currentBlockNumber);
		
					result = await util.requestHttps('https://api.polygonscan.com/api?module=account&action=txlist&address='+address+'&startblock='+(Number(startBlock)+1));
					const maticBlockList = JSON.parse(result);
					// console.log("토큰결과")
					// console.log(tokenBlockList)
					if(maticBlockList.result.length > 0){
		
						for(var i=0 ; i < maticBlockList.result.length; i++){
							let tvpPoint = 0;
							if(maticBlockList.result[i].txreceipt_status === '1'){
								let polygonAmount = new BigNumber(maticBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber();
								tvpPoint = (polygonAmount*polygonPrice)/dollor;

								let created = models.NftSwapHist.create({  
									address: maticBlockList.result[i].from,
									blockNumber: maticBlockList.result[i].blockNumber,
									txid: maticBlockList.result[i].hash,
									swap_from: 'MATIC', 
									swap_to: 'TVP',
									swap_from_amount: new BigNumber(maticBlockList.result[i].value).div(new BigNumber(10).pow(18)).toNumber(),
									swap_to_amount: tvpPoint.toFixed(0)
								}); 
							}
		
							let updated = await models.NftSwapInfo.update({currentBlockNumber: maticBlockList.result[i].blockNumber}, {where: {address: address , symbol: 'MATIC'}});						

							let query = `INSERT INTO mnb_nft_users(
								ADDRESS,
								FILE_PATH,
								NICK_NAME,
								TVP_AMOUNT,
								CREATEDAT,
								UPDATEDAT
							)
							VALUES(
								'${maticBlockList.result[i].from}',
								NULL,
								NULL,
								'${tvpPoint.toFixed(0)}',
								NOW(),
								NOW()
							)
							ON DUPLICATE KEY UPDATE 
							tvp_amount = CAST(tvp_amount AS UNSIGNED) + ${tvpPoint.toFixed(0)}`;

							let myinfoUpdated = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE });

							console.log(" MATIC AMT : "+new BigNumber(maticBlockList.result[i].value).div(new BigNumber(10).pow(18)))

						}
						
					}
				}

				

				
			
			}while(false);
		}catch(error){
			console.log(error)
		}
	}
	

	async sendTokenSwap() {

		let result;
		let swapCurrentData;
		let startBlock = 0;
		let address = '0x135880dBA49C3156d79d520032a6c108BC7cf19B'; // 집금주소
		
		try{
			do {			

				swapCurrentData = await models.NftSwapInfo.findOne({
					attributes: ['address','currentBlockNumber'],
					where: {address : address}
					
				});

				if(!swapCurrentData){
					return;
				}

				if(swapCurrentData && swapCurrentData.address !== ''){ 
					startBlock = swapCurrentData.currentBlockNumber;
				}

				console.log("집금시작 startBlock : "+swapCurrentData.currentBlockNumber);

				//&sort=ASC
				result = await util.requestHttps('https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address='+address+'&startblock='+(Number(startBlock)+1));
				const blockList = JSON.parse(result);
				console.log('https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address='+address+'&startblock='+(Number(startBlock)+1))
				console.log(blockList.result.length);
				console.log(blockList.result);
				if(blockList.result.length > 0){

					for(var i=0 ; i < blockList.result.length; i++){
						console.log(blockList.result[i].txreceipt_status === '1')
						console.log(address)
						console.log(blockList.result[i].to)
						console.log(address === blockList.result[i].to)
						if(blockList.result[i].txreceipt_status === '1' && address.toLowerCase() === blockList.result[i].to){
							let created = models.NftSwapHist.create({  
								address: blockList.result[i].from,
								blockNumber: blockList.result[i].blockNumber,
								txid: blockList.result[i].hash,
								swap_from: 'TVS',
								swap_to: 'TVP',
								swap_from_amount: blockList.result[i].value,
								swap_to_amount: blockList.result[i].value/10000000000000
							}); 
						}
	
						let updated = await models.NftSwapInfo.update({currentBlockNumber: blockList.result[i].blockNumber}, {where: {address: address}});

						// if(i === blockList.result.length -1){
						// 	let updated = await models.NftSwapInfo.update({currentBlockNumber: blockList.result[i].blockNumber}, {where: {address: address}});
						// }
					}
				}
			}while(false);
		}catch(error){
			console.log(error)
		}
	}



	/**
	 * 좋아요 추가
	 * @param {*} req 
	 * @param {*} res 
	 */
	async chgFavorite(req, res) {

		let result = new Object();
		result.result = new Object();
		let auctionId = req.body.auctionId;
		let address = req.body.address;
		let favoriteYn = '';

		try{
			do {			

				if(address !== undefined && auctionId !== undefined){

					let favoriteInfo = await models.NftFavorite.findOne({
						attributes: ['auction_id','favorite_yn'],
						where: {address: address,auction_id : auctionId}
						
					});


					let updated;
					let created;
					if(favoriteInfo !== null){
						if(favoriteInfo.favorite_yn === 'Y'){
							updated = await models.NftFavorite.update({favorite_yn: 'N'}, {where: {address: address,auction_id : auctionId}});
							favoriteYn = 'N';
						}else{
							updated = await models.NftFavorite.update({favorite_yn: 'Y'}, {where: {address: address,auction_id : auctionId}});
							favoriteYn = 'Y';
						}
					}else{
						created = await models.NftFavorite.create({  
							favorite_yn: 'Y',
							auction_id: auctionId,
							address: address
						}); 

						favoriteYn = 'Y';
					}

					console.log(favoriteYn)
					console.log("created : "+created);
					console.log("updated : "+updated);
					
					result.result.code = 200;
					result.result.favoriteYn = favoriteYn;
				
				}else{

					result.result.code = 100;
					result.result.message = '파라미터값이 비어있습니다.';
		
				}
			
			}while(false);
		}catch(error){
			console.log(error)
		}
		res.send(result);	

	}


	/**
	 * 나의 좋아요리스트
	 * @param {*} address 
	 * @returns 
	 */
	async myFavoriteList(address) {

		let result;

		try{
			do {			

				let query = `SELECT b.id as auctionId
								, b.buynow_price as buyNowPrice 
								, b.start_price as currentPrice
								, b.expire_date as expiryDate
								, b.highest_bidder as highestBidder
								, b.status
								, a.address as owner
								, a.address as seller
								, a.file_path as img
								, a.title as auctionTitle
								, a.description
							FROM mnb_nft_masters a 
							INNER JOIN mnb_nft_markets b ON a.id = b.nft_id 
							LEFT JOIN mnb_nft_favorites c ON b.id = c.auction_id 
							WHERE b.status =  1 
							AND c.favorite_yn = 'Y'
							AND c.address = '${address}'`;

				result = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.SELECT });
			
			}while(false);

		}catch(error){
			console.log(error)
		}
		return result;
	}


	/**
	 * 스왑이력
	 * @param {*} address 
	 * @returns 
	 */
	async getMySwapHistory(address) {

		let result;

		try{
			do {			
	
				let query = `SELECT  swap_from
									, swap_to
									, swap_from_amount AS from_amount
									, swap_to_amount AS to_amount
									, createdAt AS swapDate
									, txid
							FROM mnb_nft_swap_histories
							WHERE address = '${address}'`;

				result = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.SELECT });
			
			}while(false);

		}catch(error){
			console.log(error)
		}
		return result;
	}
	

	/**
	 * 토근스왑 신청 (TVP -> TVS)
	 * 현재 미사용
	 * @param {*} req 
	 */
	async transfer(req) {

		let data = new Object();
		data.result = new Object();
		data.txid = null;
	
		do{
			try {
		
				console.log("토큰 스왑신청");

				if(data.txid !== null){

					let created = models.NftSwapHist.create({  
						address: req.body.address,
						blockNumber: '',
						txid: data.txid,
						swap_from: 'TVP', 
						swap_to: 'TVS',
						swap_from_amount: req.body.swapPoint,
						swap_to_amount: req.body.swapPoint
					}); 

					let query = `UPDATE INSERT INTO mnb_nft_users
								 SET tvp_amount = CAST(tvp_amount AS UNSIGNED) - ${req.body.swapPoint}
								 	,tvs_amount = CAST(tvs_amount AS UNSIGNED) + ${req.body.swapPoint}
									,CREATEDAT = NOW()
									,UPDATEDAT = NOW()
								 WHERE ADDRESS = '${req.body.address}'
									 `;

					let myinfoUpdated = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE });
		
				}


			} catch (error) {

				console.log(error)

				data.result.code = 204;
				data.result.message = '트랜젝션 실패';
				data.result.status = 'No transaction ID';
				res.status(data.result.code);
			
				break;
			}
			
			if(data.txid === null || data.txid ==='')
			{
				data.result.code = 204;
				data.result.message = '트랜젝션 실패';
				data.result.status = 'No transaction ID';
				res.status(data.result.code);
			
				break; 
			}else{
				data.result.code = 200;
				data.result.message = '요청 정상 처리';
				data.result.status = 'OK';
				res.status(data.result.code);
			}
	
		} while(false);  
		
		res.send(data);
		
	}
	

	/**
	 * 토큰스왑신청 (TVP -> TVS)
	 * @param {*} req 
	 * @param {*} res 
	 */
	async transferToken(req,res) {

		let data = new Object();
		data.result = new Object();
		data.txid = null;
	
		do{
			try {
		
				console.log("토큰 스왑신청");

				// get master address, secret
				let master = await token.getMaster(req.body.tokenName);
				let tokenObj = await token.getContract(req.body.tokenName);
				
				// decode secret key
				let decodedKey = master.secret;
				
		  //      let balance =tokenObj['contract'].methods.balanceOf('0xe0b6b5268ad6b1be8b4c6028189c1b98d7694d2d').call();
		  
				let res = await tokenObj['contract'].methods.transfer(req.body.address, req.body.amount).send({from: '0xe0b6b5268ad6b1be8b4c6028189c1b98d7694d2d'});
				
				data.txid = res.transactionHash;

				console.log(res); 
		  
				//res.blockNumber
				//res.from
				//res.to
				//res.status
				//res.transactionHash -- tx? 42dc
				// tx = await token.transfer('1', req.body.tokenName, master.address, req.body.address, tokenObj['contract'], req.body.amount, decodedKey);
				
				if(data.txid !== null){

					let created = models.NftSwapHist.create({  
						address: req.body.address,
						blockNumber: res.blockNumber,
						txid: data.txid,
						swap_from: 'TVP', 
						swap_to: 'TVS',
						swap_from_amount: req.body.tvpToken,
						swap_to_amount: req.body.tvsToken
					}); 

					let query = `UPDATE mnb_nft_users
								 SET tvp_amount = CAST(tvp_amount AS UNSIGNED) - ${req.body.tvpToken}
								 	,tvs_amount = CAST(tvs_amount AS UNSIGNED) + ${req.body.tvsToken}
									,CREATEDAT = NOW()
									,UPDATEDAT = NOW()
								 WHERE ADDRESS = '${req.body.address}'
									 `;

					let myinfoUpdated = await models.sequelize.query(query, { type: models.Sequelize.QueryTypes.UPDATE });
		
				}


			} catch (error) {

				console.log(error)

				data.result.code = 204;
				data.result.message = '트랜젝션 실패';
				data.result.status = 'No transaction ID';
				res.status(data.result.code);
			
				break;
			}
			
			if(data.txid === null || data.txid ==='')
			{
				data.result.code = 204;
				data.result.message = '트랜젝션 실패';
				data.result.status = 'No transaction ID';
				res.status(data.result.code);
			
				break; 
			}else{
				data.result.code = 200;
				data.result.message = '요청 정상 처리';
				data.result.status = 'OK';
				res.status(data.result.code);
			}
	
		} while(false);  
		
		res.send(data);
		
	}


}




module.exports = nftfunc;