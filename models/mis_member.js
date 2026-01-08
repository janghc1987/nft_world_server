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
    'mis_member', 

    /* 두번째 인자: 컬럼 모델 */
    {
    // 시퀄라이즈는 기본적으로 id를 기본키로 연결하므로 id 컬럼은 적을 필요가 없음
		mb_no: {
      type: DataTypes.INTEGER.UNSIGNED, // VARCHAR -> STRING
			primaryKey: true,
			autoIncrement: true
    },
    mb_name: {
      type: DataTypes.STRING(100), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
    },
    mb_email: {
      type: DataTypes.STRING(200), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      unique: true, // UNIQUE -> unique
    },
		mb_level: {
      type: DataTypes.INTEGER.UNSIGNED, // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
			defaultValue: 1
    },
		mb_group: {
      type: DataTypes.STRING(1), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
			defaultValue: 'S'
    },
		mb_dial_code: {
      type: DataTypes.STRING(10), // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
			defaultValue: '82'
    },
		mb_phone: {
      type: DataTypes.STRING(50), // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
			defaultValue: ''
    },
		mb_status: {
      type: DataTypes.ENUM(['active', 'prepare', 'locked', 'inactive']), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
			defaultValue: 'prepare'
    },
		mb_apikey: {
      type: DataTypes.STRING(88), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      unique: true, // UNIQUE -> unique
    },
    mb_apitime: {
      type: DataTypes.STRING(16), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
      unique: true, // UNIQUE -> unique
    },
		mb_lang: {
      type: DataTypes.CHAR(2), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
			defaultValue: 'ko'
    },
    mb_salt: {
      type: DataTypes.STRING(24), // VARCHAR -> STRING
      allowNull: false, // NOT NULL -> allowNull
			defaultValue: ''
    },
		mb_pin: {
      type: DataTypes.STRING(128), // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
			defaultValue: ''
    },
		mb_photo: {
      type: DataTypes.STRING(200), // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
			defaultValue: ''
    },
		mb_lasted_id: {
      type: DataTypes.INTEGER, // VARCHAR -> STRING
      allowNull: true, // NOT NULL -> allowNull
			defaultValue: 0
    },
    mb_created_at: {
      type: DataTypes.DATE, // DATETIME -> DATE
      allowNull: true,
      defaultValue: sequelize.literal('now()'),
    },
  }, 

  /* 세번째 인자: 테이블 옵션 */
  {
    timestamps: false, // true 시 시퀄라이즈는 자동으로 createdAt과 updateAt 컬럼 추가
  });
};