const { program } = require('commander');
// 标准用法
// program.command('start')
//   .description('start a commander')
//   .action((name, options) => {
//     console.log(name);
//     console.log(options);
//   })

// 声明可变参数，可变参数会以数组的形式传递给处理函数。
program.command('start <name> [options...]')
  .action((name, options) => {
    console.log(name);
    console.log(options);
  })

// arguments函数用法
// program
//   .version('0.0.1')
//   .arguments('<cmd> [env]')
//   .description('test command')
//   .action(function(cmdValue, envValue) {
//     console.log('command:', cmdValue);
//     console.log('environment:', envValue || 'no environment given');
//   });


program.parse(process.argv);