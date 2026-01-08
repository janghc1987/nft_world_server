const fs = require('fs');

// const home = process.argv.slice(2) == 'dev' ? '/mnt/d/refs/vsc_home/crypto-wallet' : '/home';

module.exports = {
	homepath: __dirname,
	ethdata: JSON.parse(fs.readFileSync(__dirname + '/ethData.json')),
}

