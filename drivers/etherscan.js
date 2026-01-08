  
class etherscan {
  
  constructor() {}

  static getEtherOpt(address, apikey) {
    
    let ether = '/api?module=account&action=balance&address=' + address  + '&tag=latest&apikey=' + apikey;
    
    let etherUrl = {
      hostname: global.env.ETHERSCAN_HOST,
      path: ether,
      method: 'GET'
    };
    
    return etherUrl;
  }

  static getTokenOpt(address, apikey, contract) {
    
    let token = '/api?module=account&action=tokenbalance&contractaddress=' + contract + '&address=' + address + '&tag=latest&apikey=' + apikey;
    
    let tokenUrl = {
      hostname: global.env.ETHERSCAN_HOST,
      path: token,
      method: 'GET'
    };
    
    return tokenUrl;
  }

  static getPolygonOpt(address, apikey) {
    
    let ether = '/api?module=account&action=balance&address=' + address  + '&tag=latest&apikey=' + apikey;
    
    let tokenUrl = {
      hostname: global.env.POLYGONSCAN_HOST,
      path: ether,
      method: 'GET'
    };
    
    return tokenUrl;
  }
}

module.exports = etherscan;