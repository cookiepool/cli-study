const { program } = require('commander');

/********************************
 * 版本信息
 * *****************************/
// 只有版本号
program.version('1.0.0');
// 自定义命令标识
// program.version('1.0.0', '-v, --vers');
// 增加描述信息
// program.version('1.0.0', '-v, --vers', 'this is version function');

/********************************
 * 选项
 * *****************************/


// 注意，在执行相关的命令后，要在控制台打印相关的信息的话，必须在最后执行以下这句代码。
program.parse(process.argv);