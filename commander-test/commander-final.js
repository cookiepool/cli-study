const { program } = require('commander');

program
  .version('1.0.0', '-v, --vers')
  .command('start <name> [options...]')
  .description('Test a whole commander order')
  .option('-e --extra [exargs]', 'Test a options')
  .action((name, startOptions, cmd) => {
    // 如果你的可选参数是空的，那么这地方startOPtions输出的是空数组
    // console.log(name, startOptions, cmd);
    if(cmd.extra) {
      console.log(`cmd.extra's value is ${ cmd.extra }`);
    } else {
      console.log('no cmd.extra');
    }
    if(startOptions.length > 0) {
      startOptions.forEach(function(item) {
        console.log(item);
      })
    }
  })

program.parse(process.argv);