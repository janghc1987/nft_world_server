const express = require('express');
const { check, body, query, header, validationResult } = require('express-validator');
const userFunc = require('../controllers/users');
const excp = require('../drivers/exceptions');
const router = express.Router();
const user = new userFunc();



router.post('/chgMyImg', excp.wrapAsync(user.chgMyImg));


router.post('/chgMyNickName', excp.wrapAsync(user.chgMyNickName));

/**
   * @swagger
   * test
   */
 router.post('/myUserInfo', async function(req, res) {	 

  let data = new Object(); 
  data.result = new Object(); 

    let ret;
    
    // res.render()  
  do{
        // get user profile
        ret = await user.myUserInfo(req.body.address);

        data.result.code = 200;
        data.userInfo = ret;
        res.status(data.result.code);

  } while(false);

  res.send(data);
});



module.exports = router;