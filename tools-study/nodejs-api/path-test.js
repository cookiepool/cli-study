const path = require('path');

console.log(path.dirname('/tools-study/nodejs-api')); // /tools-study

console.log(path.join('/tools-study', '/nodejs-api')); // \tools-study\nodejs-api
console.log(path.resolve('./path-test-dir-two')); // D:\PROJ\cli-study\tools-study\nodejs-api\path-test-dir-two

console.log(path.relative('./path-test-dir-two', './path-test-dir-three')); // ..\path-test-dir-three