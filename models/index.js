const path = require('path'); 
const Sequelize = require('sequelize'); 

const config = require(path.join(__dirname, '..', 'config', 'config.json'))[global.env.NODE_ENV];

const db = {}; 
const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize; 
db.Sequelize = Sequelize; 

db.Users = require('./users')(sequelize, Sequelize); 
db.Accounts = require('./accounts')(sequelize, Sequelize); 
db.Assets = require('./assets')(sequelize, Sequelize); 
db.Config = require('./config')(sequelize, Sequelize); 
db.Exchanges = require('./exchanges')(sequelize, Sequelize); 
db.Login = require('./login')(sequelize, Sequelize); 
db.Transactions = require('./transactions')(sequelize, Sequelize); 
db.Transactions_internal = require('./transactions_internal')(sequelize, Sequelize); 

db.Nft = require('./nft')(sequelize, Sequelize); 
db.NftMarket = require('./nft_Market')(sequelize, Sequelize); 
db.NftBidding = require('./nft_bidding')(sequelize, Sequelize); 
db.NftSwapInfo = require('./nft_swap_info')(sequelize, Sequelize); 
db.NftSwapHist = require('./nft_swap_history')(sequelize, Sequelize); 


db.NftFavorite = require('./nft_favorite')(sequelize, Sequelize); 


// db.Authlog = require('./mis_auth_log')(sequelize, Sequelize); 
// db.Auth = require('./mis_auth')(sequelize, Sequelize); 
// db.misMember = require('./mis_member')(sequelize, Sequelize); 
// db.misNotice = require('./mis_notice')(sequelize, Sequelize); 
// db.Menupermit = require('./mis_menu_permit')(sequelize, Sequelize); 
// db.Useragent = require('./mis_user_agents')(sequelize, Sequelize); 




db.Users.hasMany(db.Accounts, { foreignKey: 'user_id', sourceKey: 'id' });
db.Accounts.belongsTo(db.Users, { foreignKey: 'user_id', targetKey: 'id' });

db.Users.hasMany(db.Exchanges, { foreignKey: 'user_id', sourceKey: 'id' });
db.Exchanges.belongsTo(db.Users, { foreignKey: 'user_id', targetKey: 'id' });

db.Users.hasMany(db.Login, { foreignKey: 'user_id', sourceKey: 'id' });
db.Login.belongsTo(db.Users, { foreignKey: 'user_id', targetKey: 'id' });

db.Assets.hasMany(db.Transactions, { foreignKey: 'asset_id', sourceKey: 'id' });
db.Transactions.belongsTo(db.Assets, { foreignKey: 'asset_id', targetKey: 'id' });

db.Assets.hasMany(db.Transactions, { foreignKey: 'asset_id', sourceKey: 'id' });
db.Transactions_internal.belongsTo(db.Assets, { foreignKey: 'asset_id', targetKey: 'id' });

db.Assets.hasMany(db.Accounts, { foreignKey: 'asset_id', sourceKey: 'id' });
db.Accounts.belongsTo(db.Assets, { foreignKey: 'asset_id', targetKey: 'id' });


db.Nft.hasMany(db.NftMarket, { foreignKey: 'id',sourceKey: 'id'});
db.NftMarket.belongsTo(db.Nft, { foreignKey: 'nft_id',targetKey: 'id'});

// db.assets = db.Assets.findAll();
 
module.exports = db;

