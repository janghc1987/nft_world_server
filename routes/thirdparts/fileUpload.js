const multer = require('multer');
const moment = require('moment');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    //cb(null, 'upload');  // 파일이 저장되는 경로입니다.
    const dir = './uploads' // 파일이 저장되는 경로입니다.
    fs.exists(dir, exist => {
    if (!exist) {
      return fs.mkdir(dir, error => cb(error, dir))
    }
    return cb(null, dir)
    })
    
  },
  filename: function(req, file, cb) {
    
    var _fileLen = file.originalname.length;
 
    /** 
     * lastIndexOf('.') 
     * 뒤에서부터 '.'의 위치를 찾기위한 함수
     * 검색 문자의 위치를 반환한다.
     * 파일 이름에 '.'이 포함되는 경우가 있기 때문에 lastIndexOf() 사용
     */
    var _lastDot = file.originalname.lastIndexOf('.');
 
    // 확장자 명만 추출한 후 소문자로 변경
    var _fileExt = file.originalname.substring(_lastDot, _fileLen).toLowerCase();

    cb(null, moment().format('YYYYMMDDHHmmss') + "_" + Math.floor(Math.random() * 899999 + 100000)+_fileExt);  // 저장되는 파일명
  }
}); 

const upload = multer({ storage: storage }).single("file");   // single : 하나의 파일업로드 할때

module.exports = upload; 