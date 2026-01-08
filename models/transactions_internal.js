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
    'transactions_internal', 

    /* 두번째 인자: 컬럼 모델 */
    {
			// 시퀄라이즈는 기본적으로 id를 기본키로 연결하므로 id 컬럼은 적을 필요가 없음
			uuid: {
				type: DataTypes.STRING(36), // VARCHAR -> STRING
				allowNull: true, // NOT NULL -> allowNull
			},
			tx_hash: {
				type: DataTypes.STRING(66), // VARCHAR -> STRING
				allowNull: true, // NOT NULL -> allowNull
			},
			sender_id: {
				type: DataTypes.INTEGER, // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
			},
			sender: {
				type: DataTypes.STRING(42), // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
			},
			receiver_id: {
				type: DataTypes.INTEGER, // VARCHAR -> STRING
				allowNull: true, // NOT NULL -> allowNull
			},
			receiver: {
				type: DataTypes.STRING(42), // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
			},
			value: {
				type: DataTypes.DECIMAL(36, 0), // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
			},
			description: {
				type: DataTypes.TEXT(''), // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
				unique: false, // UNIQUE -> unique			
			},
			reason: {
				type: DataTypes.ENUM(['txInternal', 'savePoint', 'usePoint', 'txExternal', 'saveToken', 'useToke']), // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
				// unique: true, // UNIQUE -> unique
			},
			status: {
				type: DataTypes.ENUM(['pending', 'completed', 'failed', 'cancel']), // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
				// unique: true, // UNIQUE -> unique
			},
			asset_id: {
				type: DataTypes.INTEGER, // VARCHAR -> STRING
				allowNull: false, // NOT NULL -> allowNull
			},
			date_time: {
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