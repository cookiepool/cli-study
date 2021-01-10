const { program } = require('commander');

const minimist = require('minimist');

program
  .version('1.0.0', '-v, --vers')
  .command('start <name> [options...]')
  .description('Test a whole commander order')
  .option('-e --extra [exargs]', 'Test a options')
  .action((name, startOptions, cmd) => {
    console.log(cmd);
  });

program.parse(process.argv);
console.log(process.argv);

let args = minimist(process.argv, {
  string: 'extra'
});

console.log(args);