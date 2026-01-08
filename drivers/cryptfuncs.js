const { reject } = require('async');
const crypto = require('crypto');
const { resolve } = require('path');


const iv = "1234567890123456";
const IV_LENGTH = 16; // For AES, this is always 16
const ENCRYPTION_KEY = global.env.API_ENCRYPTION_KEY

class cryptfuncs {
	
	constructor() {}
	
	async encrypt(source, uid)	{
		let cipher = crypto.createCipheriv("aes-256-cbc", uid, iv);
		cipher.update(source, 'ascii');

		return cipher.final('base64');
	}


	async decrypt(encrypted, uid)	{
		let decipher = crypto.createDecipheriv("aes-256-cbc", uid, iv);  
		decipher.update(encrypted, 'base64');

		return decipher.final('ascii');
	}
	
	async gensalt()	{
		return crypto.randomBytes(16).toString('base64');
	}
	
	async genpassword()	{
		return crypto.randomBytes(12).toString('base64');
	}


	async genhashedpasswd(passwd, salt) {
		// return crypto.scrypt(passwd, salt, 64);

		return new Promise((resolve, reject) => {
			let result;
			return crypto.scrypt(passwd, salt, 64, (err, buf) => {
				if(err)	
					reject(err);

				result = buf.toString('base64');
				resolve(result);
			})
		})
	}

	// HMAC functions?????
	// referred from https://drt0927.tistory.com/10
	async GenerateHMAC(key, payload) {
		// 암호화 객체 생성, sha256 알고리즘 선택
		var hmac = crypto.createHmac('sha256', key);

		// 암호화할 본문 생성
		var timestamp = new Date().getTime();
		var message = new Buffer(payload + timestamp).toString('base64');
		// var message = new Buffer(payload + timestamp).toString('base64');

		hmac.write(message);
		hmac.end();

		return hmac.read();
	}


	async getSha256Key(id)	{
		return crypto.createHash("sha256").update(id, "ascii").digest();
	}


	async chkTokenExpired(token, key, now, refval)	{
		let regdate = decrypt(token, key);
		// console.log("regdate: " + new Date(regdate * 1000));

		let gap = (new Date(now).getTime() - new Date(regdate * 1000).getTime()) / 1000;
		// console.log("gap: " + gap);

		// gap over 3 month, then generate new token
		return (gap > refval) ? true : false;  
	}

	async generateToken(salt, time, key)	{
		// return await this.encrypt(Math.floor(new Date(now).getTime() / 1000).toString(), key);		
		// let password = await crypt.genpassword();
		// return await this.genhashedpasswd(key, salt);
		return await this.genhashedpasswd(key + time, salt);	
	}

	// const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)

	async encryptEx(text, key) {
		let iv = crypto.randomBytes(IV_LENGTH);
		let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
		let encrypted = cipher.update(text);

		encrypted = Buffer.concat([encrypted, cipher.final()]);

		return iv.toString('hex') + ':' + encrypted.toString('hex');
	}

	async getEncryptEx(text, key, cryptoiv) {
		// let iv = crypto.randomBytes(IV_LENGTH);
		let iv = Buffer.from(cryptoiv, 'hex');
		let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
		let encrypted = cipher.update(text);

		encrypted = Buffer.concat([encrypted, cipher.final()]);

		return iv.toString('hex') + ':' + encrypted.toString('hex');
	}

	async decryptEx(text, key) {
		let textParts = text.split(':');
		let iv = Buffer.from(textParts.shift(), 'hex');
		let encryptedText = Buffer.from(textParts.join(':'), 'hex');
		let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
		let decrypted = decipher.update(encryptedText);

		decrypted = Buffer.concat([decrypted, decipher.final()]);

		return decrypted.toString();
	}
	
}






module.exports = cryptfuncs;