#!/usr/bin/env node

// Check node version before requiring/doing anything else
// The user may be on a very old node version

// 这儿依赖了@vue/cli-shared-utils这个包，在项目中找到cli-shared-utils这个文件夹，就是这个包对应的源码。
// 这儿引入了chalk，semver两个库。
// chalk：这个包的作用就是让终端输出的信息带有颜色，这样看着更加直观。github：https://github.com/chalk/chalk
// semver：npm的语义版本器。github：https://github.com/npm/node-semver
const { chalk, semver } = require('@vue/cli-shared-utils')

// 引入包的node版本
const requiredVersion = require('../package.json').engines.node

// 快速比较两个字符串差异的个数。github: https://github.com/sindresorhus/leven
const leven = require('leven')

// 封装的Node.js版本检测函数
// wanted: 你想要的版本
// id: 你当前项目的名字
function checkNodeVersion (wanted, id) {
  // 调用semver.satisfies函数来比较当前Node.js版本与你想要的版本是否满足
  if (!semver.satisfies(process.version, wanted, { includePrerelease: true })) {
    // 不满足就借助chalk.red打印错误信息
    console.log(chalk.red(
      'You are using Node ' + process.version + ', but this version of ' + id +
      ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'
    ))
    // 终止node.js的进程。http://nodejs.cn/api/process.html#process_process_exit_code
    process.exit(1)
  }
}

// 调用Node.js的版本检测函数
checkNodeVersion(requiredVersion, '@vue/cli')

// Node.js将要失去维护的几个版本
const EOL_NODE_MAJORS = ['8.x', '9.x', '11.x', '13.x']
// 循环主要版本数组对象并做检测
for (const major of EOL_NODE_MAJORS) {
  // 判断版本号
  if (semver.satisfies(process.version, major)) {
    // 提示使用LTS版本
    console.log(chalk.red(
      `You are using Node ${process.version}.\n` +
      `Node.js ${major} has already reached end-of-life and will not be supported in future major releases.\n` +
      `It's strongly recommended to use an active LTS version instead.`
    ))
  }
}

// ----------------------------------------------------------------
// 以下为入口的核心代码

// 引入Node.js的文件系统模块
const fs = require('fs')
// 引入Node.js的路径模块
const path = require('path')
// 将Windows的反斜杠路径转换为正斜杠路径：foo\\bar ➔ foo/bar。github: https://github.com/sindresorhus/slash
const slash = require('slash')
// 一个做参数解析的工具包。github: https://github.com/substack/minimist
const minimist = require('minimist')

// enter debug mode when creating test repo（这个是官方注释）
/****
 * process.cwd() 方法会返回 Node.js 进程的当前工作目录。http://nodejs.cn/api/process.html#process_process_cwd
 * path.resolve([...paths]) 方法会将路径或路径片段的序列解析为绝对路径。
 * fs.existsSync(path) 如果路径存在，则返回 true，否则返回 false。
 * 给定的路径序列会从右到左进行处理，后面的每个 path 会被追加到前面，直到构造出绝对路径。http://nodejs.cn/api/path.html#path_path_resolve_paths
 * 下面这个判断条件的意思：
 * slash(process.cwd()).indexOf('/packages/test') > 0；这句意思是判断当前Node.js进程是否运行在/packages/test这个目录
 * fs.existsSync(path.resolve(process.cwd(), '../@vue')；这句意思是是否存在‘Node.js进程工作目录 + @vue’这个路径
 * fs.existsSync(path.resolve(process.cwd(), '../../@vue'；这句同理
 * ****/
if (
  slash(process.cwd()).indexOf('/packages/test') > 0 && (
    fs.existsSync(path.resolve(process.cwd(), '../@vue')) ||
    fs.existsSync(path.resolve(process.cwd(), '../../@vue'))
  )
) {
  // 给env对象新增属性VUE_CLI_DEBUG
  process.env.VUE_CLI_DEBUG = true
}

// commander.js 一款重量轻，表现力和强大的命令行框架，提供了用户命令行输入和参数解析强大功能。https://github.com/tj/commander.js
// 我们在控制台输入vue打印出的一系列命令就是commander提供的功能，注意：@vue/cli还是使用的2.x.x版本的commander，目前最新的为6.x.x版本，语法发生了变化。
const program = require('commander')
// 引入lib里面的模块
const loadCommand = require('../lib/util/loadCommand')

program
  .version(`@vue/cli ${require('../package').version}`) // 定义版本信息
  .usage('<command> [options]') // 定义帮助信息首行提示

// 这部分就是你使用vue create命令对应的选项和描述
// 关于commander的使用在这里不详细讲，可以参考我脚手架系列的文章，了解commander的基本用法
program
  .command('create <app-name>')
  .description('create a new project powered by vue-cli-service')
  .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
  .option('-d, --default', 'Skip prompts and use default preset')
  .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset')
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .option('-g, --git [message]', 'Force git initialization with initial commit message')
  .option('-n, --no-git', 'Skip git initialization')
  .option('-f, --force', 'Overwrite target directory if it exists')
  .option('--merge', 'Merge target directory if it exists')
  .option('-c, --clone', 'Use git clone when fetching remote preset')
  .option('-x, --proxy <proxyUrl>', 'Use specified proxy when creating project')
  .option('-b, --bare', 'Scaffold project without beginner instructions')
  .option('--skipGetStarted', 'Skip displaying "Get started" instructions')
  .action((name, cmd) => {
    // 处理commander传过来的选项，cmd是一个commander对象，包含我们使用命令时传递过来的选项等参数
    // 这个函数的定义在最低部
    const options = cleanArgs(cmd)
    
    // 使用插件minimist解析参数，process.argv是一个数组，数组前两个数据是node的运行绝对路径和脚本执行的绝对路径。
    // 这儿用process.argv.slice(3)做了下处理，对create命令过后超过一个以上的参数给出警告！
    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(chalk.yellow('\n Info: You provided more than one argument. The first one will be used as the app\'s name, the rest are ignored.'))
    }
    // --git makes commander to default git to true
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true
    }
    require('../lib/create')(name, options)
  })

program
  .command('add <plugin> [pluginOptions]')
  .description('install a plugin and invoke its generator in an already created project')
  .option('--registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .allowUnknownOption()
  .action((plugin) => {
    require('../lib/add')(plugin, minimist(process.argv.slice(3)))
  })

program
  .command('invoke <plugin> [pluginOptions]')
  .description('invoke the generator of a plugin in an already created project')
  .option('--registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .allowUnknownOption()
  .action((plugin) => {
    require('../lib/invoke')(plugin, minimist(process.argv.slice(3)))
  })

program
  .command('inspect [paths...]')
  .description('inspect the webpack config in a project with vue-cli-service')
  .option('--mode <mode>')
  .option('--rule <ruleName>', 'inspect a specific module rule')
  .option('--plugin <pluginName>', 'inspect a specific plugin')
  .option('--rules', 'list all module rule names')
  .option('--plugins', 'list all plugin names')
  .option('-v --verbose', 'Show full function definitions in output')
  .action((paths, cmd) => {
    require('../lib/inspect')(paths, cleanArgs(cmd))
  })

program
  .command('serve [entry]')
  .description('serve a .js or .vue file in development mode with zero config')
  .option('-o, --open', 'Open browser')
  .option('-c, --copy', 'Copy local url to clipboard')
  .option('-p, --port <port>', 'Port used by the server (default: 8080 or next available port)')
  .action((entry, cmd) => {
    loadCommand('serve', '@vue/cli-service-global').serve(entry, cleanArgs(cmd))
  })

program
  .command('build [entry]')
  .description('build a .js or .vue file in production mode with zero config')
  .option('-t, --target <target>', 'Build target (app | lib | wc | wc-async, default: app)')
  .option('-n, --name <name>', 'name for lib or web-component mode (default: entry filename)')
  .option('-d, --dest <dir>', 'output directory (default: dist)')
  .action((entry, cmd) => {
    loadCommand('build', '@vue/cli-service-global').build(entry, cleanArgs(cmd))
  })

program
  .command('ui')
  .description('start and open the vue-cli ui')
  .option('-H, --host <host>', 'Host used for the UI server (default: localhost)')
  .option('-p, --port <port>', 'Port used for the UI server (by default search for available port)')
  .option('-D, --dev', 'Run in dev mode')
  .option('--quiet', `Don't output starting messages`)
  .option('--headless', `Don't open browser on start and output port`)
  .action((cmd) => {
    checkNodeVersion('>=8.6', 'vue ui')
    require('../lib/ui')(cleanArgs(cmd))
  })

program
  .command('init <template> <app-name>')
  .description('generate a project from a remote template (legacy API, requires @vue/cli-init)')
  .option('-c, --clone', 'Use git clone when fetching remote template')
  .option('--offline', 'Use cached template')
  .action(() => {
    loadCommand('init', '@vue/cli-init')
  })

program
  .command('config [value]')
  .description('inspect and modify the config')
  .option('-g, --get <path>', 'get value from option')
  .option('-s, --set <path> <value>', 'set option value')
  .option('-d, --delete <path>', 'delete option from config')
  .option('-e, --edit', 'open config with default editor')
  .option('--json', 'outputs JSON result only')
  .action((value, cmd) => {
    require('../lib/config')(value, cleanArgs(cmd))
  })

program
  .command('outdated')
  .description('(experimental) check for outdated vue cli service / plugins')
  .option('--next', 'Also check for alpha / beta / rc versions when upgrading')
  .action((cmd) => {
    require('../lib/outdated')(cleanArgs(cmd))
  })

program
  .command('upgrade [plugin-name]')
  .description('(experimental) upgrade vue cli service / plugins')
  .option('-t, --to <version>', 'Upgrade <package-name> to a version that is not latest')
  .option('-f, --from <version>', 'Skip probing installed plugin, assuming it is upgraded from the designated version')
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies')
  .option('--all', 'Upgrade all plugins')
  .option('--next', 'Also check for alpha / beta / rc versions when upgrading')
  .action((packageName, cmd) => {
    require('../lib/upgrade')(packageName, cleanArgs(cmd))
  })

program
  .command('migrate [plugin-name]')
  .description('(experimental) run migrator for an already-installed cli plugin')
  // TODO: use `requiredOption` after upgrading to commander 4.x
  .option('-f, --from <version>', 'The base version for the migrator to migrate from')
  .action((packageName, cmd) => {
    require('../lib/migrate')(packageName, cleanArgs(cmd))
  })

program
  .command('info')
  .description('print debugging information about your environment')
  .action((cmd) => {
    console.log(chalk.bold('\nEnvironment Info:'))
    require('envinfo').run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
        npmPackages: '/**/{typescript,*vue*,@vue/*/}',
        npmGlobalPackages: ['@vue/cli']
      },
      {
        showNotFound: true,
        duplicates: true,
        fullTree: true
      }
    ).then(console.log)
  })

// output help information on unknown commands
program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log()
    suggestCommands(cmd)
  })

// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk.cyan(`vue <command> --help`)} for detailed usage of given command.`)
  console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))

// enhance common error messages
const enhanceErrorMessages = require('../lib/util/enhanceErrorMessages')

enhanceErrorMessages('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return `Missing required argument for option ${chalk.yellow(option.flags)}` + (
    flag ? `, got ${chalk.yellow(flag)}` : ``
  )
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

function suggestCommands (unknownCommand) {
  const availableCommands = program.commands.map(cmd => cmd._name)

  let suggestion

  availableCommands.forEach(cmd => {
    const isBestMatch = leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand)
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`))
  }
}

function camelize (str) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs (cmd) {
  const args = {}
  cmd.options.forEach(o => {
    const key = camelize(o.long.replace(/^--/, ''))
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}
