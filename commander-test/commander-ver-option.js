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
program.version('1.1.0')
  .option('-t, --test', 'test option function') // 一般用法
  .option('-d, --debug-test', 'test option function -- debug test') // 带多个单词
  .option('-a, --argu-test <name>', 'test option function -- agru test', 'default value') // 带参数<>，并设置默认值

// 注意，在执行相关的命令后，要在控制台打印相关的信息的话，必须在最后执行以下这句代码。
program.parse(process.argv);

console.log('----------------');
if(program.test) {
  console.log('you use --test commander');
}
if(program.debugTest) {
  console.log('you use --debug-test commander');
}
if(program.arguTest) {
  console.log(`output: ${program.arguTest}`);
}
console.log('----------------');