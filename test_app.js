//모든 숫자는 문자형태로 보낼것. toString(), bigNum() 둘다 특정 숫자에 에러남.
let DEBUG = 2;
const express = require('express');
const app = express();
const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const ethData = JSON.parse(fs.readFileSync(__dirname + '/ethData.json'));
const crypto = require('crypto');
const bnum = require('big-number');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


// Swagger definition
// You can set every attribute except paths and swagger
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
const swaggerDefinition = {
    info: { // API informations (required)
      title: 'wallet-backend', // Title (required)
      version: '1.0.0', // Version (required)
      description: 'Auth API' // Description (optional)
    },
    // host: 'atairport.aidat.cf', // Host (optional)
    host: '1.234.44.25:8588', // Host (optional)
    basePath: '/' // Base path (optional)
  };


// Options for the swagger docs
const options = {
    // Import swaggerDefinitions
    swaggerDefinition,
    // Path to the API docs
    apis: ['./test_app.js']
};

const swaggerSpec = swaggerJSDoc(options);
app.use('/apidocs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let tokenbinPath = __dirname + '/contract/token.bin';
let hardfork = 'petersburg';
let fromAddress;
let fromPrivateKey;
let privateKey;
let toAddress;
let sendAmount;
let tokenName;
let contractAbi; 
let contractAddr;
let contract;
let txid;
let web3;
let chain;
let chainId;//ropsten
let data = {};
let sync;
//body-parser  application/x-www-form-urlencoded
app.use(express.urlencoded({extended: false}));
//body-parser application/json
app.use(express.json());

async function deploy(owner, passwd) {

    let bin = fs.readFileSync(tokenbinPath).toString();
    let deployobj = {data: "0x" + bin};
    // let gas = await web3.eth.estimateGas(deployobj);
    let privateKey = Buffer.from(passwd,'hex');
    let txid = '';

    let rawTx = {from: owner, gasPrice: web3.eth.gasPrice, data: "0x" + bin};

    let gas = await web3.eth.estimateGas(rawTx);
    console.log(gas);

    try {
        rawTx = {
            from: owner,
            chainId: web3.utils.toHex(chainId),
            nonce: web3.utils.toHex(await getNonce(owner)),
            gas: web3.utils.toHex(gas),
            gasPrice: web3.utils.toHex(await getGasPrice()),
            gasLimit: web3.utils.toHex(await getGasLimit()),
            data: "0x" + bin
        };
        
        // let rawTx = {from: owner, gas: gas, gasPrice: web3.eth.gasPrice, data: "0x" + bin};
        let tx = new Tx(rawTx, { chain: chain, hardfork: hardfork });
		tx.sign(privateKey);
		let serializedTx = tx.serialize();
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function(hash){
             console.log(hash);
             txid = hash;
			//  res.send(hash);
		}).on('error', function(error){
            console.log(error);
			//  res.send('false');
        });
 
    } catch (error) {
	    console.log(error)
		//  res.send('false');
	}
    // let txid = await web3.personal.sendTransaction(tx, passwd);	
    
    return txid;
}

async function getGasLimit(){
    let returnVal = await web3.eth.getBlock('latest');
    returnVal = returnVal.gasLimit;
    if(returnVal >  43000) return 42000;
    return returnVal;
}
async function getGasPrice(){
    let returnVal = await web3.eth.getGasPrice();
    if(returnVal >  10000000000) return 10000000000;

    return returnVal;
}
async function getNonce(fromAddress){
    let returnVal = await web3.eth.getTransactionCount(fromAddress, 'pending');
    return returnVal;
}
async function getWeb3(DEBUG){
    web3 = new	Web3('https://ropsten.infura.io/v3/5b72559c2fb641838bab583d3f8a7f94');
    // web3 = new	Web3('https://:fc77df60cc1748199243adb4a2e4e0ec@ropsten.infura.io/v3/fa5ed4b5ff0d448590242eda3677ae27');
	//  web3 = new Web3('http://localhost:7789');
    chain = 'ropsten';
    //  chainId = 44;// mainnet
    chainId = 3;// ropsten

}

async function getMaster(DEBUG){
    web3 = new	Web3('https://ropsten.infura.io/v3/3ae74697204f4b3d99d8e3574a781cce');
    // web3 = new	Web3('https://:fc77df60cc1748199243adb4a2e4e0ec@ropsten.infura.io/v3/fa5ed4b5ff0d448590242eda3677ae27');
	//  web3 = new Web3('http://localhost:7789');
    chain = 'ropsten';
    //  chainId = 44;// mainnet
    chainId = 3;// ropsten

}

async function getAccounts(DEBUG){
    let returnVal = await web3.eth.getAccounts();
    console.log(returnVal);
    return returnVal;
}

async function getContract(){


	contractAbi = JSON.parse(fs.readFileSync("/home/coin/nodejs/"+tokenName+'_abi.json'));
    
	contractAddr = ethData[tokenName]['contractAddr'];
    contract = new web3.eth.Contract(contractAbi, contractAddr);

}

async function sendToken(){
   
    let rawTx = {
        chainId: web3.utils.toHex(chainId),
        nonce: web3.utils.toHex(await getNonce(fromAddress)),
        gasPrice: web3.utils.toHex(await getGasPrice()),
        gasLimit: web3.utils.toHex(await getGasLimit()),
        data: contract.methods.transfer(toAddress, sendAmount).encodeABI(),
        to: contractAddr
    }
		
    return rawTx;
}

async function sendETH(){
    let rawTx = {
        chainId: web3.utils.toHex(chainId),
        nonce: web3.utils.toHex(await getNonce(fromAddress)),
        gasPrice: web3.utils.toHex(await getGasPrice()),
        gasLimit: web3.utils.toHex(await getGasLimit()),
        value: web3.utils.toHex(sendAmount),
        to: toAddress
    }
	console.log(toAddress);
	return rawTx;
	//console.log(rawTx);
  //  return await sendSignedTransaction(rawTx) ;
}

async function sendSignedTransaction(rawTx){

    let tx = new Tx(rawTx, { chain: chain, hardfork: hardfork });
    tx.sign(privateKey);
    let serializedTx = tx.serialize();
    let hash  = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    return hash['transactionHash'];
}


async function getTransaction(txid)
{   
    let res;

    try {
        res = await web3.eth.getTransaction(txid);
    }
    catch(exp) {
        // console.log(exp.message);
        res = exp.message;
    }

    return res;
}

async function getTransactionReceipt(txid)
{
    return await web3.eth.getTransactionReceipt(txid);
}

async function mint(owner, passwd, tgaddr, value) {
    
    let tkdata = await contract.methods.mint(tgaddr, value).encodeABI();	// make tx with txdata
    // let tkdata = web3.utils.toHex(await contract.mint(tgaddr, value));	// make tx with txdata
    let privateKey = Buffer.from(passwd, 'hex');

    let rawTx = {from: owner, to: contractAddr, gasPrice: web3.eth.gasPrice, data: tkdata};
    let gas = await web3.eth.estimateGas(rawTx);
    console.log(gas);

    try {
        rawTx = {
            from: owner,
            chainId: web3.utils.toHex(chainId),
            nonce: web3.utils.toHex(await getNonce(owner)),
            gas: web3.utils.toHex(gas),
            gasPrice: web3.utils.toHex(await getGasPrice()),
            gasLimit: web3.utils.toHex(await getGasLimit()),
            to: contractAddr,
            data: tkdata
        };
        
        // let rawTx = {from: owner, gas: gas, gasPrice: web3.eth.gasPrice, data: "0x" + bin};
        let tx = new Tx(rawTx, { chain: chain, hardfork: hardfork });
		tx.sign(privateKey);
		let serializedTx = tx.serialize();
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function(hash){
             console.log(hash);
             txid = hash;
			//  res.send(hash);
		}).on('error', function(error){
            console.log(error);
			//  res.send('false');
        });
    } 
    catch (error) {
	    console.log(error)
		//  res.send('false');
    }
    
    return txid;
};

app.get('/accounts', async (req, res) => {
    await getWeb3(2);
    let accounts = await getAccounts();

    res.send(accounts);
});

app.get('/mint/:tokenName/:owner/:passwd/:tgaddr/:value', async (req, res) => {
    await getWeb3(2);
    tokenName = req.params.tokenName;
    DEBUG = 2;
    await getContract();

    let tkdata = await mint(req.params.owner, req.params.passwd, req.params.tgaddr, req.params.value);

    // res.send(await getGasPrice());
	res.send(tkdata);
});


app.get('/deploy/:owner/:passwd', async (req, res) => {
    await getWeb3(2);
    let txid = await deploy(req.params.owner, req.params.passwd);
    res.send(txid);

    // res.send(await getGasPrice());
	// res.send("1000000000");
});



app.get('/gec_transaction/transfer/:txid', async (req, res) => {
    let transfer = new Object();

    do {
        await getWeb3(2);
        let tx = await getTransaction(req.params.txid);
        // let tr = await getTransactionReceipt(req.params.txid);

        console.log(tx);

        if(tx == null)
        {
            transfer.result = -1;
            transfer.reason = 'tx id not found';
            break;
        }

        if(tx.input == '0x')
        {
            transfer.result = -2;
            transfer.reason = 'invaild gec tx';
            break;
        }

        try {

            let idx = 0;
            let first = '';
            let second = '';

            if(tx.input.indexOf('0xa9059cbb') == 0)
            {
                transfer.from = tx.from;
                transfer.contract = tx.to;
            }
            else if(tx.input.indexOf('0xb61d27f6') == 0)
            {
                transfer.from = tx.to;
                idx = tx.input.indexOf('0xb61d27f6') + 10;
                first = tx.input.substring(idx, idx + 64);
                transfer.contract = '0x' + first.substring(24, 64);
            }
            else
            {
                transfer.result = -3;
                transfer.reason = 'unknown method is used';
                break;
            }            

            idx = tx.input.indexOf('a9059cbb') + 8;
            first = tx.input.substring(idx, idx + 64);
            transfer.to = '0x' + first.substring(24, 64);
            // console.log(transfer.from);
            idx += 64;
            second = tx.input.substring(idx, idx + 64);
            
            transfer.value = second.replace(/^[^(1-9)|^(a-f)]+/i, '');

        }
        catch(exp) {
            transfer.result = -10;
            transfer.reason = 'wrong worked in parsing tx json object';
            break;
        }

        transfer.result = 0;
        // console.log(transfer.value);
    }while(false);

    res.send(transfer);
});


app.get('/getgasprice', async (req, res) => {
    await getWeb3(2);
    let returnVal = await web3.eth.getGasPrice();
    res.send(returnVal);

    // res.send(await getGasPrice());
	// res.send("1000000000");
});

//newAddress
app.get('/eth_newAddress/:account/:debug', async (req, res) => {
    await getWeb3(req.params.debug);
    let account = await  web3.eth.accounts.create(req.params.account);

	res.send(account);

});

//newMaster
app.get('/eth_newMaster/:account/:debug', async (req, res) => {
    await getMaster(req.params.debug);
    let account = await  web3.eth.accounts.create(req.params.account);

	res.send(account);

});

//이더리움잔액 
app.get('/eth_getBalance/:addr/:debug', async (req, res) => {

    await getWeb3(req.params.debug);
    await web3.eth.getBalance(req.params.addr, function(err, val) {
        res.send(web3.utils.fromWei(val, 'ether'));
    });
});

// 토큰 잔액
app.get('/token_getBalance/:tokenName/:addr/:debug', async (req, res) => {
	
    await getWeb3(req.params.debug);
    tokenName = req.params.tokenName;
    DEBUG = req.params.debug
    await getContract();

	await contract.methods.balanceOf(req.params.addr).call(function(err, val){
		// fn_balance = web3.utils.fromWei(val, 'ether');
		res.send(val);
	});

});
// 이더리움 무브
app.get('/eth_move/:fromAddress/:password/:toAddress/:sendAmount/:debug', async (req, res) => {

    await getWeb3(req.params.debug);
    fromAddress = req.params.fromAddress;
    fromPrivateKey =  req.params.password;
    privateKey = Buffer.from(fromPrivateKey,'hex');
    toAddress = req.params.toAddress;
    sendAmount = req.params.sendAmount;
    try {
		let   rawTx = await sendETH();
		let tx = new Tx(rawTx, { chain: chain, hardfork: hardfork });
		tx.sign(privateKey);
		let serializedTx = tx.serialize();
		 web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function(hash){
			 console.log(hash);
			 res.send(hash);
		}).on('error', function(error){
		 console.log(error);
			 res.send('false');
		}) ;

 
    } catch (error) {
	console.log(error)
		 res.send('false');
	}
});http://18.166.30.127:8588/eth_transactions/0x84e31158b5913896F1f6118dE6bC2cd449E3C7db/384B0B69F00654848636EF089D0D437FD584D06F0A1891ECAC4BF8960D0A1B/0x84e31158b5913896F1f6118dE6bC2cd449E3C7db/478400000000000000.000000000000/2

// 이더리움 전송
app.get('/eth_transactions/:fromAddress/:password/:toAddress/:sendAmount/:debug', async (req, res) => {

    await getWeb3(req.params.debug);
    fromAddress = req.params.fromAddress;
    fromPrivateKey =  req.params.password;
    privateKey = Buffer.from(fromPrivateKey,'hex');
    toAddress = req.params.toAddress;
    sendAmount = req.params.sendAmount;
    try {
		let   rawTx = await sendETH();
		let tx = new Tx(rawTx, { chain: chain, hardfork: hardfork });
		tx.sign(privateKey);
		let serializedTx = tx.serialize();
		 web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function(hash){
			 console.log(hash);
			 res.send(hash);
		}).on('error', function(error){
		 console.log(error);
			 res.send('false');
		}) ;
 
    } catch (error) {
        console.log(error)
		 res.send('false');
	}
});


// 이더리움 출금
app.get('/eth_sendout/:fromAddress/:password/:toAddress/:sendAmount/:debug', async (req, res) => {

    try {
        await getMaster(req.params.debug);
        fromAddress = req.params.fromAddress;
        fromPrivateKey =  req.params.password;
        privateKey = Buffer.from(fromPrivateKey,'hex');
        toAddress = req.params.toAddress;
        sendAmount = req.params.sendAmount;
        
		let   rawTx = await sendETH();
		let tx = new Tx(rawTx, { chain: chain, hardfork: hardfork });
		tx.sign(privateKey);
		let serializedTx = tx.serialize();
		 web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function(hash){
			 console.log(hash);
			 res.send(hash);
		}).on('error', function(error){
		 console.log(error);
			 res.send('false');
		}) ;
 
    } catch (error) {
        console.log(error)
		 res.send('false');
	}
});



// 토큰전송
app.get('/token_transactions/:fromAddress/:password/:toAddress/:sendAmount/:tokenName/:debug',async  (req, res) => {
    await getMaster(req.params.debug);
    fromAddress = req.params.fromAddress;
    fromPrivateKey =  req.params.password;
    privateKey = Buffer.from(fromPrivateKey,'hex');
    toAddress = req.params.toAddress;
    sendAmount =  req.params.sendAmount;
    tokenName = req.params.tokenName;
    DEBUG = req.params.debug

    await getContract();

    let tkdata = await contract.methods.transfer(toAddress, sendAmount).encodeABI();	// make tx with txdata
    // let tkdata = web3.utils.toHex(await contract.mint(tgaddr, value));	// make tx with txdata    

    let rawTx = {from: fromAddress, to: contractAddr, gasPrice: web3.eth.gasPrice, data: tkdata};
    let gas = await web3.eth.estimateGas(rawTx);
    console.log('from: ' + fromAddress + ', passwd: ' + fromPrivateKey);

    // await getContract();
    try {
    // let   rawTx = await sendToken();
        rawTx = {
            from: fromAddress,
            chainId: web3.utils.toHex(chainId),
            nonce: web3.utils.toHex(await getNonce(fromAddress)),
            gas: web3.utils.toHex(gas),
            gasPrice: web3.utils.toHex(await getGasPrice()),
            gasLimit: web3.utils.toHex(await getGasLimit()),
            to: contractAddr,
            data: tkdata
        };    
        let tx = new Tx(rawTx, { chain: chain, hardfork: hardfork });
        tx.sign(privateKey);
        let serializedTx = tx.serialize();
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('transactionHash', function(hash){
            console.log(hash);
            res.send(hash);
		}).on('error', function(error){
            console.log(error);
            res.send('false');
		});   
    } 
    catch (error) {
        console.log(error)
 	    res.send('false');        
    }
});

app.listen(8588, () => {
    console.log('server running on port 8588');
});