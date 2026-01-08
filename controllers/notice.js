
// const jwt = require('jsonwebtoken'); // module import
// const passport = require('passport');
const models = require('../models');
const cryptfuncs = require('../drivers/cryptfuncs');
const { nextTick, forEach } = require('async');
// const assets = require('../models/assets');
const util = require('../drivers/util');

const Op = models.Sequelize.Op;
class noticeCtrl {

	// crypt;
	

	constructor() {

		// this.crypt = new cryptfuncs();

	}
	
	
	async getNoticeList(category = NULL, pageObj = NULL) {

		let result;

		do {
			
			let notices = {
				required: true,		// true: inner join, false: outer join
				attributes: ['id', 'nt_writer', 'nt_mb_no', 'nt_title', 'nt_categories', 'nt_image', 'nt_created_at'],
				order: [['nt_created_at', 'DESC']]
			};

			if(!util.isEmpty(category))
				if(category !== '{Category}')
					notices.where = { nt_categories: category };

			if(!util.isEmpty(pageObj)) {
				notices.offset = (pageObj.PageNumber - 1) * pageObj.PageSize;
				notices.limit = Number(pageObj.PageSize);
				
			}
			
			let list = await models.misNotice.findAll(
				notices
				// include: [Users]
			);
			
			result = list;

		}while(false);

		return result;
	}
	
	
	async getNoticeContent(id) {

		let result;

		do {
			let content = await models.misNotice.findOne({
				required: true,		// true: inner join, false: outer join
				attributes: ['id', 'nt_writer', 'nt_mb_no', 'nt_title', 'nt_content', 'nt_categories', 'nt_image', 'nt_created_at'],
				where: { id: id },
			});

			result = content;

		}while(false);

		return result;
	}
}

module.exports = noticeCtrl;