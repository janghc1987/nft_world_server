/*** models/user.js ***/

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
    'config', 

    /* 두번째 인자: 컬럼 모델 */
    {
    // 시퀄라이즈는 기본적으로 id를 기본키로 연결하므로 id 컬럼은 적을 필요가 없음
    option: {
      type: DataTypes.STRING(32), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      unique: true, // UNIQUE -> unique
    },
    value: {
      type: DataTypes.STRING(32), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      // unique: true, // UNIQUE -> unique
    },
		desc: {
      type: DataTypes.STRING, // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
      // unique: true, // UNIQUE -> unique
    },
		is_valid: {
			type: DataTypes.BOOLEAN, // VARCHAR -> STRING
			allowNull: false, // NOT NULL -> allowNull
			unique: true, // UNIQUE -> unique
		},
		modified_at: {
			type: DataTypes.DATE, // DATETIME -> DATE
			allowNull: false,
			defaultValue: sequelize.literal('now()'),
		},		
		created_at: {
			type: DataTypes.DATE, // DATETIME -> DATE
			allowNull: false,
			defaultValue: sequelize.literal('now()'),
    },
  }, 

  /* 세번째 인자: 테이블 옵션 */
  {
    timestamps: false, // true 시 시퀄라이즈는 자동으로 createdAt과 updateAt 컬럼 추가
  });
};