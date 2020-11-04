const chalk = require('chalk');
const semver = require('semver');

/**********************************
 * 第一步先检测Node.js版本
 * ********************************/
// 引入要求的Node.js版本
const requiredNodeVer = require('../package.json').engines.node;

// 封装一个检测版本的函数
function checkNodeVersion(requiredVer, projName) {
  if(!semver.satisfies(process.version, requiredVer, { includePrerelease: true})) {
    console.log(chalk.red(`You are using Node ${ process.version }, but this version of '${ projName }
    requires Node ${ requiredVer }.
    Please upgrade your Node version.`));

    // 结束进程
    process.exit(1);
  }
}

// 检测版本
checkNodeVersion(requiredNodeVer, 'cookie-cli');

// 核心代码
const { program } = require('commander');