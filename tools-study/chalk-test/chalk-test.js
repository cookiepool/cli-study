const chalk = require('chalk');

console.log(chalk.bold.blueBright.underline('---- Hello Chalk 1----\n'));
console.log(chalk.blueBright.bold.underline('---- Hello Chalk 2----\n'));

console.log(chalk.blueBright.bold.underline.blue.redBright('---- Hello Chalk 3----\n'));

console.log(chalk.bold.blueBright.reset('---- Hello Chalk 4----\n'));

console.log(chalk.red.bold('---- Hello Chalk 5----\n'));

console.log(chalk('---- Hello Chalk 6----'));
console.log(chalk.dim('---- Hello Chalk 6----'));
console.log(chalk.italic('---- Hello Chalk 7----'));
console.log(chalk.underline('---- Hello Chalk 8----'));
console.log(chalk.inverse('---- Hello Chalk 9----'));
console.log(chalk.hidden('---- Hello Chalk 10----'));
console.log(chalk.strikethrough('---- Hello Chalk 11----\n'));

console.log(chalk.magenta('---- Hello Chalk 12----'));
console.log(chalk.cyan('---- Hello Chalk 13----'));
console.log(chalk.blackBright('---- Hello Chalk 14----'));
console.log(chalk.redBright('---- Hello Chalk 15----'))
console.log(chalk.greenBright('---- Hello Chalk 16----'));
console.log(chalk.blueBright('---- Hello Chalk 17----'));
console.log(chalk.yellowBright('---- Hello Chalk 18----'));
console.log(chalk.magentaBright('---- Hello Chalk 19----'));
console.log(chalk.cyanBright('---- Hello Chalk 20----'));
console.log(chalk.whiteBright('---- Hello Chalk 21----\n'));

console.log(chalk.bgBlack('---- Hello Chalk 12----'));
console.log(chalk.bgRed('---- Hello Chalk 12----'));
console.log(chalk.bgGreen('---- Hello Chalk 12----'));
console.log(chalk.bgYellow('---- Hello Chalk 12----'));
console.log(chalk.bgBlue('---- Hello Chalk 12----'));
console.log(chalk.bgMagenta('---- Hello Chalk 12----'));
console.log(chalk.bgCyan('---- Hello Chalk 13----'));
console.log(chalk.bgBlackBright('---- Hello Chalk 14----'));
console.log(chalk.bgRedBright('---- Hello Chalk 15----'))
console.log(chalk.bgGreenBright('---- Hello Chalk 16----'));
console.log(chalk.bgBlueBright('---- Hello Chalk 17----'));
console.log(chalk.bgYellowBright('---- Hello Chalk 18----'));
console.log(chalk.bgMagentaBright('---- Hello Chalk 19----'));
console.log(chalk.bgCyanBright('---- Hello Chalk 20----'));
console.log(chalk.bgWhiteBright('---- Hello Chalk 21----'));

const miles = 18;
const calculateFeet = miles => miles * 5280;

console.log(chalk`
	There are {bold 5280 feet} in a mile.
	In {bold ${miles} miles}, there are {green.bold ${calculateFeet(miles)} feet}.
`);

console.log(chalk.rgb(9, 218, 158).bold('---- Hello Chalk 21 ----'))
console.log(chalk.rgb(9, 218, 158).visible('---- Hello Chalk 21 ----'))
console.log(chalk.hex('#09DA9E').visible('---- Hello Chalk 21 ----'))

console.log(chalk.bgHex('#09DA9E').visible('---- Hello Chalk 21 ----'))
console.log(chalk.bgRgb(9, 218, 158).visible('---- Hello Chalk 21 ----'))