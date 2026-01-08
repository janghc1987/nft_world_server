/*** models/user.js ***/

// const { Sequelize, DataTypes } = require("sequelize");
// const { Sequelize } = require("sequelize/types");

// 이전에 MariaDB에 users 테이블과 comments 테이블을 만들었으니 
// 시퀄라이즈에 User 모델과 Comment 모델 생성 및 연결

// VARCHAR -> STRING
// INT -> INTEGER
// TINYINT -> BOOLEAN
// DATETIME -> DATE
// UNSIGNED가 적용된 INT -> INTEGER.UNSIGNED
// ZEROFILL -> INTEGER.UNSIGNED.ZEROFILL

module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    /* 첫번째 인자: 테이블 이름 */
    'mnb_nft_favorite', 
 
    /* 두번째 인자: 컬럼 모델 */
    {
    auction_id: {
      type: DataTypes.INTEGER, // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull 
      //unique: false, // UNIQUE -> unique
    },
    address: {
      type: DataTypes.STRING(80), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      unique: false, // UNIQUE -> unique
    },
    favorite_yn: {
      type: DataTypes.STRING(1), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      unique: false, // UNIQUE -> unique
    }
  }, 

  /* 세번째 인자: 테이블 옵션 */
  {
    timestamps: true, // true 시 시퀄라이즈는 자동으로 createdAt과 updateAt 컬럼 추가
  });
};