const express = require('express');
const { check, body, query, header, validationResult } = require('express-validator');
const nftfunc = require('../controllers/nft');
const excp = require('../drivers/exceptions');
const router = express.Router();
const nft = new nftfunc();
const ethfuncs = require('../drivers/ethdrv');
const users = new ethfuncs('ropsten', 3, '04c4d59194974921b49dc457d728b64e');
const web3 = require('web3');
const tokenCtrl = require('../controllers/token');
const Tx = require('ethereumjs-tx').Transaction;
const initapp = require('../initapp')
const token = new tokenCtrl();


/**
 * @swagger
 * 민팅
 */
router.post('/create', excp.wrapAsync(nft.create));


/**
 * @swagger
 * 경매시작
 */
 router.post('/sell', excp.wrapAsync(nft.sell));

 /**
 * @swagger
 * 정찰
 */
  router.post('/settle', excp.wrapAsync(nft.settle));

 /**
 * @swagger
 * 경매취소
 */
  router.post('/cancel', excp.wrapAsync(nft.cancel));

  /**
 * @swagger
 * 경매삭제
 */
   router.post('/delete', excp.wrapAsync(nft.delete));

  /**
   * @swagger
   * 입찰
  */
  router.post('/bid', excp.wrapAsync(nft.bid));

  /**
  * @swagger
  * 바로구매
  */
  router.post('/buynow', excp.wrapAsync(nft.buynow));
  
  /**
  * @swagger
  * 좋아요 클릭
  */
 router.post('/chgFavorite', excp.wrapAsync(nft.chgFavorite));

  

   /**
   * @swagger
   * test
   */
  router.post('/myAuctionList', async function(req, res) {	 

    let data = new Object(); 
    data.result = new Object(); 
  
      let ret;
      
      // res.render()  
    do{
          // get user profile
          ret = await nft.getMyAuctionList(req.body.address);
  
          data.result.code = 200;
          data.myAucList = ret;
          res.status(data.result.code);
  
    } while(false);
  
    res.send(data);
  });


   /**
   * @swagger
   * test
   */
    router.post('/auctionList', async function(req, res) {	 

      let data = new Object(); 
      data.result = new Object(); 
    
        let ret;
        
        // res.render()  
      do{
            // get user profile
            ret = await nft.getAuctionList(req);
    
            data.result.code = 200;
            data.result.auctionList = ret.result;
            data.result.totalCount = ret.totalCount;
            data.result.nextPage = ret.nextPage;
            res.status(data.result.code);
    
          console.log(data.result.nextPage)

      } while(false);
    
      res.send(data);
    });

  /**
   * @swagger
   * test
   */
   router.post('/myNFTList', async function(req, res) {	 

    let data = new Object(); 
    data.result = new Object();  
  
      let ret;
      
      // res.render()
    do{
          // get user profile
          console.log("marketyn :"+req.body.marketYn);
          ret = await nft.getMyNFTList(req.body.address,req.body.marketYn);		
  
          data.result.code = 200;
          data.myAucList = ret;
          res.status(data.result.code);
  
    } while(false);
  
    res.send(data);
  });


   /**
   * @swagger
   * test
   */
    router.post('/auctionDetail', async function(req, res) {	 

      let data = new Object(); 
      data.result = new Object(); 
    
        let ret;
        
        // res.render()  
      do{
            // get user profile
            ret = await nft.getAuctionDetail(req.body.auctionId);
    
            data.result.code = 200;
            data.auctionDetail = ret.auctionDetail;
            data.result.biddingList = ret.auctionDetail.biddingList;
            res.status(data.result.code);
    

      } while(false);
    
      res.send(data);
    });

    /**
   * @swagger
   * test
   */
     router.post('/nftDetail', async function(req, res) {	 

      let data = new Object(); 
      data.result = new Object(); 
    
        let ret;
        
        // res.render()  
      do{
            // get user profile
            ret = await nft.getNftDetail(req.body.nftId);
    
            data.result.code = 200;
            data.nftDetail = ret;
            res.status(data.result.code);
    
      } while(false);
    
      res.send(data);
    });

   
   /**
   * @swagger
   * test
   */ 
  router.post('/myFavoriteList', async function(req, res) {	 

    let data = new Object(); 
    data.result = new Object(); 

      let ret;
      
      // res.render()  
    do{
          // get user profile
          ret = await nft.myFavoriteList(req.body.address);

          data.result.code = 200;
          data.myFavoriteList = ret;
          res.status(data.result.code);

    } while(false);

    res.send(data);
  });


  /**
   * @swagger
   * test
   */
   router.post('/mySwapHistory', async function(req, res) {	 

    let data = new Object(); 
    data.result = new Object(); 
  
      let ret;
      
      // res.render()  
    do{
          // get user profile
          ret = await nft.getMySwapHistory(req.body.address);
  
          data.result.code = 200;
          data.swapHistory = ret;
          res.status(data.result.code);
  
    } while(false);
  
    res.send(data);
  });





  /**
 * @swagger
 * test
 */
   router.post('/transfer', excp.wrapAsync(nft.transfer));



  /**
 * @swagger
 * test
 */
   router.post('/transferToken', excp.wrapAsync(nft.transferToken)); 

   

module.exports = router;