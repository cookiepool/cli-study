// fs-extra，这个模块是作为node.js的fs模块的替代品和补充，地址：https://github.com/jprichardson/node-fs-extra
const fs = require('fs-extra')
// path模块不做多的介绍，知道node.js的都知道这个模块
const path = require('path')
// inquirer，一组常用的交互式命令行用户界面。地址：https://github.com/SBoudrias/Inquirer.js
const inquirer = require('inquirer')
// 引入本地模块Creator
const Creator = require('./Creator')
// 引入本地工具函数，具体含义看对应的源码注释
const { clearConsole } = require('./util/clearConsole')
// 引入本地工具函数，具体含义看对应的源码注释
// 这个就是你在手动选择生成项目时的一些选项，比如linter版本，路由模式等
const { getPromptModules } = require('./util/createTools')
// 引入工具函数，具体含义看对应的源码注释
const { chalk, error, stopSpinner, exit } = require('@vue/cli-shared-utils')
// validate-npm-package-name，给我一个字符串，我会告诉你它是否是一个有效的npm包名。地址：https://github.com/npm/validate-npm-package-name
const validateProjectName = require('validate-npm-package-name')

async function create (projectName, options) {
  // options是调用这个方法时传递过来的Commander对象
  // 判断是否设置了proxy，在前面的vue.js里面我们可以看到create命令有一个--proxy的选项
  // 如果你设置了那个选项值，那么这儿就会做这个赋值操作
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy
  }

  // 获取Node.js进程的当前工作目录，记住不是node.js的安装目录
  const cwd = options.cwd || process.cwd()
  // 判断你输入的项目名称是否时‘.’，这个地方输入允许输入'.'是因为有时候你在创建Vue项目时是想直接在你新建的文件夹下创建相关文件（package.json、node_modules）
  // 那么你在创建项目时在你的新建文件夹下打开控制台输入vue create .即可。
  // 这里判断你的项目名字是不是输入的'.'
  const inCurrent = projectName === '.'
  // 获取项目名，这里的path.relative(from, to)，表示根据当前工作目录返回 from 到 to 的相对路径， 如果 from 和 to 各自解析到相同的路径（分别调用 path.resolve() 之后），则返回零长度的字符串。
  // 这里执行这句是为了获取你当前新建的文件夹的名字，当你的项目名是'.'时。
  const name = inCurrent ? path.relative('../', cwd) : projectName
  // 获取项目生成的目标路径，path.resolve() 方法会将路径或路径片段的序列解析为绝对路径。
  // 给定的路径序列会从右到左进行处理，后面的每个 path 会被追加到前面，直到构造出绝对路径。
  const targetDir = path.resolve(cwd, projectName || '.')

  // 验证你的项目的名字是否符合npm包的命名规则，这个validateProjectName方法会返回一个包含：validForNewPackages :: Boolean和validForOldPackages :: Boolean
  // 两个属性的对象
  const result = validateProjectName(name)
  // 如果你的命名不符合规范会给出错误提示或者警告提示，并且结束创建项目的进程
  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${name}"`))
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red.dim('Error: ' + err))
    })
    result.warnings && result.warnings.forEach(warn => {
      console.error(chalk.red.dim('Warning: ' + warn))
    })
    exit(1)
  }

  // 判断目标路径是否存在，并且未使用merge命令（--merge Merge target directory if it exists）
  if (fs.existsSync(targetDir) && !options.merge) {
    // 是否使用force命令（Overwrite target directory if it exists）
    if (options.force) {
      // 使用了force命令就移除当前目录
      await fs.remove(targetDir)
    } else {
      // 清除控制台，详细源码解析见对应的文件
      await clearConsole()
      // 如果你想在当前目录新建项目，也就是你的命令输入的是：vue create .
      if (inCurrent) {
        // 给出提示：是否在当前目录创建项目，这里使用了inquirer这个工具
        const { ok } = await inquirer.prompt([
          {
            name: 'ok',
            type: 'confirm',
            message: `Generate project in current directory?`
          }
        ])
        if (!ok) {
          return
        }
      } 
      // 如果你不是以vue create .命令创建项目，而是指定了项目名字，并且在新建项目的目录下有跟你项目相同名字的文件夹，则会显示这儿的操作
      // 比如你在haha文件下建了一个lala文件夹，并且在haha文件夹下打开了终端，输入以下命名：vue create lala，则会显示这部分提示
      else {
        // 给出三个选项overwrite：删除已存在的同名文件夹，merge：合并掉，cancel：退出操作
        const { action } = await inquirer.prompt([
          {
            name: 'action',
            type: 'list',
            message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
            choices: [
              { name: 'Overwrite', value: 'overwrite' },
              { name: 'Merge', value: 'merge' },
              { name: 'Cancel', value: false }
            ]
          }
        ])
        if (!action) {
          return
        } else if (action === 'overwrite') {
          console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
          await fs.remove(targetDir)
        }
      }
    }
  }

  // 主体核心代码，构造器，
  /***
   * 核心构造函数
   * @param { string } name 创建的项目名
   * @param { string } targetDir 创建项目时的目标路径
   * @param { function } getPromptModules 创建项目时的选项时的应答选项
   * ***/
  const creator = new Creator(name, targetDir, getPromptModules())
  // 创建项目的核心就在这儿了
  await creator.create(options)
}

// ...args表示剩余参数
module.exports = (...args) => {
  return create(...args).catch(err => {
    stopSpinner(false) // do not persist
    error(err)
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1)
    }
  })
}
