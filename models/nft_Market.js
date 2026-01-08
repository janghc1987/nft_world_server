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
    'mnb_nft_market', 
 
		

    /* 두번째 인자: 컬럼 모델 */
    {
    // 시퀄라이즈는 기본적으로 id를 기본키로 연결하므로 id 컬럼은 적을 필요가 없음
		nft_id: {
      type: DataTypes.INTEGER, // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull 
      //unique: false, // UNIQUE -> unique
    },
		buynow_price: {
      type: DataTypes.STRING(200), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      // unique: true, // UNIQUE -> unique
    },
		start_price: {
      type: DataTypes.STRING(200), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      // unique: true, // UNIQUE -> unique
    },
		current_price: {
      type: DataTypes.STRING(200), // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
      // unique: true, // UNIQUE -> unique
    },
    status: {
      type: DataTypes.STRING(2), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      // status : 1(경매진행중),2(경매종료),3(바로구매상태),9(취소)
    },
    expire_date: {
      type: DataTypes.STRING(20), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      // unique: true, // UNIQUE -> unique
    },
    highest_bidder: {
      type: DataTypes.STRING(200), // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
      // unique: true, // UNIQUE -> unique 
    },
    seller: {
      type: DataTypes.STRING(80), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      unique: false, // UNIQUE -> unique
    }, 
    bidCnt: {
      type: DataTypes.INTEGER, // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
      unique: false, // UNIQUE -> unique
      defaultValue : 0
    }, 
  }, 

  /* 세번째 인자: 테이블 옵션 */
  {
    timestamps: true, // true 시 시퀄라이즈는 자동으로 createdAt과 updateAt 컬럼 추가
  });
};