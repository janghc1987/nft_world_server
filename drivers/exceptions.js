



module.exports.wrapAsync = 
function(fn) {
  return function (req, res, next) {
    // 모든 오류를 .catch() 처리하고 체인의 next() 미들웨어에 전달
    // (이 경우에는 오류 처리기)

		// res.error_code = 1000;
		// res.status_code = 400;
		// res.message
    fn(req, res, next).catch(next);
  };
}
