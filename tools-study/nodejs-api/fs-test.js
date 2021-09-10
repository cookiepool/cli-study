const fs = require('fs-extra');

// 不支持windows的反斜杠路径
console.log(fs.existsSync('D:/PROJ/cli-study/tools-study/nodejs-api/fs-test-dir/a.js')); // true
console.log(fs.existsSync('D:/PROJ/cli-study/tools-study/nodejs-api/fs-test-dir/b.js')); // false

// 不支持windows的反斜杠路径 
console.log(fs.readFileSync('./fs-test-dir/a.js')); // 返回一个Buffer

// 目录存在则返回undefined
console.log(fs.ensureDirSync('./fs-test-dir/test-dir')); // D:\PROJ\cli-study\tools-study\nodejs-api\fs-test-dir\test-dir

fs.writeFileSync('./fs-test-dir/text.txt', 'Hello CLI');

fs.remove('./fs-test-dir/text.txt');