const globby = require('globby');
const path = require('path');

async function globby_test() {
  console.log(path.join(process.cwd(), '/content-lib')) // D:\PROJ\cli-study\tools-study\globby-test\content-lib
  
  // ['**/*'] 匹配文件以及嵌套的在文件夹里面的文件
  // cwd 指定匹配目录
  // dot 匹配以.开头的文件
  const results = await globby(['**/*'], { cwd: path.join(process.cwd(), './content-lib'), dot: true });

  console.log(results); // [ 'one.js', 'two.html', 'folder/text.txt' ]
}

globby_test();