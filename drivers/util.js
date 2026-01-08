
var request = require("request");
const https = require('https');

class utilfunc {

	constructor() {}
	
	static getAssetByUnit(amount, decimal) {
		
		let result = amount.toString();
		
		if(result.length >= decimal)		
			result = result.substr(0, result.length - 18) + '.' + result.substr(result.length - 18, result.length);
		else
			for(let gap = decimal - amount.toString().length; gap >= 0; gap--)
				gap > 0 ? result = '0' + result : result = '0.' + result;			
			
		return result;
	}

	static getAssetByDecimal(amount, decimal) {
		
		let result = amount.toString();

		let pointidx = result.indexOf('.');

		if(pointidx < 0) {
			for(let i = decimal; i > 0; i--)
				result = result + '0';
		} else {
			for(let i = decimal - (result.length - result.indexOf('.') - 1); i > 0; i--)
				result = result + '0';

			let token = result.split('.');
			result = '';

			for(let i = 0; i < token.length; i++)
				result = result + token[i];
		}
		
		return result;
	}
	
	
	static isEmpty(value) { 
		if( value == "" || value == null || value == undefined || value == 'undefined' || ( value != null && typeof value == "object" && !Object.keys(value).length ) ) { 
			return true;
		} else { 
			return false;
		} 
	};

	
	static pagination(pagenum, pagesize) {

		// let offset = pagenum * pagesize;
		
		if(pagenum < 1)
			return -1;
		
		let result = { offset: (pagenum - 1) * pagesize, limit: pagesize };		
		
		return result;
	}
	
	
	static getMaruPointOpt(path, body, apikey) {
		
		// let body = body;
		// let path = path;
		
		// if(type === 'save') {
		// 	body = {
		// 		"storeCd": "3152150001",
		// 		"cardNo": "5610013316641520",
		// 		"money": amount,
		// 		"msg": "테스트 적립"
		// 	};
		// 	path = '/pointSave';
		// } else if(type === 'use') {
		// 	body = {
		// 		storeCd: "3152150001",
		// 		cardNo: "5610013316641520",
		// 		point: amount,
		// 		msg: "테스트 적립"
		// 	};
		// 	path = '/pointUse';
		// } else if(type === 'total') {
		// 	body = {
		// 		"cardNo": "5610013316641520",
		// 	};
		// 	path = '/totalPoint';
		// } else if(type === 'issue') {
		// 	body = body;
		// 	path = path;			
		// } else if(type === 'check') {
		// 	body = {
		// 		"cardNo": "5610013316641520",
		// 	};
		// 	path = '/checkCard';
		// }		
		
		let option = {
			url: 'http://api.marucard.co.kr' + path,
			method: 'POST',
			headers: {
        // 'Content-Type': 'text/html',
				'Authorization': apikey,
      },
			body: body,
			json: true
		};
		
		return option;
	}

	static async requestUrl(options) {

		return new Promise((resolve, reject) => {
			request(options, function (error, response, body) {
				if (error)
					reject(error);
				else {
					// console.log(body);
					resolve(body);
				}
			});
		});
	}
	
	
	static async requestHttps(url) {
		return new Promise((resolve, reject) => {
			https.get(url, res => {
				res.setEncoding('utf8');
				let body = '';
				res.on('data', chunk => body += chunk);
				res.on('end', () => resolve(body));
			}).on('error', reject);
		}).catch(err => {
			console.log(err);		
		});
	}
	
	// static async requestHttps(url) {
	// 	try {
	// 		return new Promise((resolve, reject) => {
	// 			http.get(url, res => {
	// 				res.setEncoding('utf8');
	// 				let body = '';
	// 				res.on('data', chunk => body += chunk);
	// 				res.on('end', () => resolve(body));
	// 			}).on('error', reject);
	// 		});
	// 	} catch (err) {
	// 		console.log(err);
	// 	}
	// };
	
	static async uploadImage(files) {
  
		let data = new Object();
		data.result = new Object();
	
		console.log(req.files);
		// console.log(s3.config);
	
		const param = {
			'Bucket' : 'maruprod-bucket',
			'Key' : `stores/${files['image']['name']}`,
			'ACL' : 'public-read',
			'Body' : files['image']['data'],
			'ContentType': files['image']['mimetype']
		}; //s3 업로드에 필요한 옵션 설정
	
		s3obj.upload(param, (err, data) => { //callback function
			if(err) {
					console.log('image upload err : ' + err);
					return;
			}
			
			return data.Location;
	
			// const imgTag = `<img src=${data.Location} width="100%" />`;
	
			// const action = {
			//     type : 'content',
			//     value : `${postState.content} \n ${imgTag}`
			// };
			// postDispatch(action)
			// console.log('image upload res : ' + JSON.stringify(data));
		});
	}
	
}

module.exports = utilfunc;