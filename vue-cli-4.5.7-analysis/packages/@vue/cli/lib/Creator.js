// 引入node.js的path模块
const path = require('path')
// debug库，一个模仿Node.js核心调试技术的小型JavaScript调试工具。在Node.js和web浏览器中工作
// 地址：https://github.com/visionmedia/debug
const debug = require('debug')
// inquirer，一组常用的交互式命令行用户界面。地址：https://github.com/SBoudrias/Inquirer.js
const inquirer = require('inquirer')
// 引入node.js的事件触发器模块
const EventEmitter = require('events')
// 引入模块文件
const Generator = require('./Generator')
// 引入lodash的深拷贝函数
const cloneDeep = require('lodash.clonedeep')
// 对对象进行排序
const sortObject = require('./util/sortObject')
// 获取版本号
const getVersions = require('./util/getVersions')
// 包管理工具的构造函数
const PackageManager = require('./util/ProjectPackageManager')
const { clearConsole } = require('./util/clearConsole')
// 注入prompts
const PromptModuleAPI = require('./PromptModuleAPI')
// 生成文件
const writeFileTree = require('./util/writeFileTree')
const { formatFeatures } = require('./util/features')
const loadLocalPreset = require('./util/loadLocalPreset')
const loadRemotePreset = require('./util/loadRemotePreset')
// 生成自述文件README.md
const generateReadme = require('./util/generateReadme')
// 工具集合，详见对应的代码解析
const { resolvePkg, isOfficialPlugin } = require('@vue/cli-shared-utils')

const {
  defaults, // 默认配置
  saveOptions,
  loadOptions, // 加载对应的选项
  savePreset,
  validatePreset,
  rcPath
} = require('./options')

const {
  chalk,
  execa,
  semver,

  log,
  warn,
  error,

  hasGit,
  hasProjectGit,
  hasYarn,
  hasPnpm3OrLater,
  hasPnpmVersionOrLater,

  exit,
  loadModule
} = require('@vue/cli-shared-utils')

// 判断是不是手动模式（这个地方应该就是创建项目的时候判断是手动选择模块还是使用默认设置或是上次保存的配置信息）
const isManualMode = answers => answers.preset === '__manual__'

module.exports = class Creator extends EventEmitter {
  // name：项目名 context: 项目路径 promptModules：创建项目时的问答模块
  constructor (name, context, promptModules) {
    // 调用super
    super()

    // 项目名
    this.name = name
    // 项目路径
    this.context = process.env.VUE_CLI_CONTEXT = context
    // 解析问答选择配置信息
    const { presetPrompt, featurePrompt } = this.resolveIntroPrompts()

    // 配置信息
    this.presetPrompt = presetPrompt
    // 特性功能信息
    this.featurePrompt = featurePrompt
    // 解析选择完功能特性过后的相关选项
    this.outroPrompts = this.resolveOutroPrompts()


    // 特性功能对应的选项
    this.injectedPrompts = []
    // 回调函数
    this.promptCompleteCbs = []

    // 这个两个变量的值在GeneratorAPI.js里面生成
    this.afterInvokeCbs = []
    this.afterAnyInvokeCbs = []

    this.run = this.run.bind(this)

    // 执行封装好的PromptModuleAPI，将配置好的特性和选项注入featurePrompt、injectedPrompts、promptCompleteCbs，
    // 详细代码逻辑见PromptModuleAPI.js
    const promptAPI = new PromptModuleAPI(this)
    promptModules.forEach(m => m(promptAPI))
  }

  /***
   * 创建项目
   * @param { Object } cliOptions 执行vue create时传递进来的选项参数
   * @param { Any } preset 预置选项
   * @return { Promise } async修饰过后的函数，返回一个Promise对象 
   * ***/
  async create (cliOptions = {}, preset = null) {
    // 判断当前是否是测试或是调试模式
    const isTestOrDebug = process.env.VUE_CLI_TEST || process.env.VUE_CLI_DEBUG
    // 解构
    const { run, name, context, afterInvokeCbs, afterAnyInvokeCbs } = this
    // 如果没有默认的配置信息
    if (!preset) {
      // 执行vue create时执行了参数--preset
      if (cliOptions.preset) {
        // vue create foo --preset bar
        // 加载默认配置
        preset = await this.resolvePreset(cliOptions.preset, cliOptions.clone)
      } else if (cliOptions.default) {
        // vue create foo --default
        // 加载默认配置
        preset = defaults.presets.default
      } else if (cliOptions.inlinePreset) {
        // vue create foo --inlinePreset {...}
        // 使用--inlinePreset命令，传入自定义的json格式的配置
        try {
          preset = JSON.parse(cliOptions.inlinePreset)
        } catch (e) {
          error(`CLI inline preset is not valid JSON: ${cliOptions.inlinePreset}`)
          exit(1)
        }
      } else {
        // 以上条件都不满足时，执行以下解析操作，通过prompts自行选择相关配置特性
        preset = await this.promptAndResolvePreset()
      }
    }

    // 通过手动模式选择的perset大概长这样
    // {
    //   useConfigFiles: true,
    //   plugins: {
    //     '@vue/cli-plugin-babel': {},
    //     '@vue/cli-plugin-typescript': { classComponent: false, useTsWithBabel: true },
    //     '@vue/cli-plugin-pwa': {},
    //     '@vue/cli-plugin-router': { historyMode: false },
    //     '@vue/cli-plugin-vuex': {},
    //     '@vue/cli-plugin-eslint': { config: 'prettier', lintOn: [Array] },
    //     '@vue/cli-plugin-unit-jest': {},
    //     '@vue/cli-plugin-e2e-cypress': {}
    //   },
    //   vueVersion: '2',
    //   cssPreprocessor: 'dart-sass'
    // }

    // clone before mutating
    preset = cloneDeep(preset)
    // inject core service
    preset.plugins['@vue/cli-service'] = Object.assign({
      projectName: name
    }, preset)

    // vue create proj --bare
    // Scaffold project without beginner instructions
    if (cliOptions.bare) {
      preset.plugins['@vue/cli-service'].bare = true
    }

    // legacy support for router
    if (preset.router) {
      preset.plugins['@vue/cli-plugin-router'] = {}

      if (preset.routerHistoryMode) {
        preset.plugins['@vue/cli-plugin-router'].historyMode = true
      }
    }

    // Introducing this hack because typescript plugin must be invoked after router.
    // Currently we rely on the `plugins` object enumeration order,
    // which depends on the order of the field initialization.
    // FIXME: Remove this ugly hack after the plugin ordering API settled down
    if (preset.plugins['@vue/cli-plugin-router'] && preset.plugins['@vue/cli-plugin-typescript']) {
      const tmp = preset.plugins['@vue/cli-plugin-typescript']
      delete preset.plugins['@vue/cli-plugin-typescript']
      preset.plugins['@vue/cli-plugin-typescript'] = tmp
    }

    // legacy support for vuex
    if (preset.vuex) {
      preset.plugins['@vue/cli-plugin-vuex'] = {}
    }

    // 确认包管理工具
    const packageManager = (
      cliOptions.packageManager ||
      loadOptions().packageManager ||
      (hasYarn() ? 'yarn' : null) ||
      (hasPnpm3OrLater() ? 'pnpm' : 'npm')
    )
    
    await clearConsole()
    // 创建一个包管理实例
    const pm = new PackageManager({ context, forcePackageManager: packageManager })

    log(`✨  Creating project in ${chalk.yellow(context)}.`)
    // 这个creation事件在cli-ui里面需要用到，@vue\cli-ui\apollo-server\connectors\projects.js
    // 这个文件里面有代码监听了creation事件，里面也使用了Creator构造函数
    this.emit('creation', { event: 'creating' })

    // get latest CLI plugin version
    const { latestMinor } = await getVersions()

    // generate package.json with plugin dependencies
    // 生成package.json参数
    const pkg = {
      name,
      version: '0.1.0',
      private: true,
      devDependencies: {},
      ...resolvePkg(context) // 如果生成项目的文件夹提供了package.json文件，...resolvePkg(context)这句话才有实际作用
    }
    const deps = Object.keys(preset.plugins)
    // 将cli相关的插件注入到package.json的devDependencies
    deps.forEach(dep => {
      if (preset.plugins[dep]._isPreset) {
        return
      }

      let { version } = preset.plugins[dep]

      // 判定@vue/cli-plugin-XXX系列插件的版本
      if (!version) {
        if (isOfficialPlugin(dep) || dep === '@vue/cli-service' || dep === '@vue/babel-preset-env') {
          version = isTestOrDebug ? `file:${path.resolve(__dirname, '../../../', dep)}` : `~${latestMinor}`
        } else {
          version = 'latest'
        }
      }

      pkg.devDependencies[dep] = version
    })

    // write package.json
    await writeFileTree(context, {
      'package.json': JSON.stringify(pkg, null, 2)
    })

    // generate a .npmrc file for pnpm, to persist the `shamefully-flatten` flag
    if (packageManager === 'pnpm') {
      const pnpmConfig = hasPnpmVersionOrLater('4.0.0')
        ? 'shamefully-hoist=true\n'
        : 'shamefully-flatten=true\n'

      await writeFileTree(context, {
        '.npmrc': pnpmConfig
      })
    }

    if (packageManager === 'yarn' && semver.satisfies(process.version, '8.x')) {
      // Vue CLI 4.x should support Node 8.x,
      // but some dependenices already bumped `engines` field to Node 10
      // and Yarn treats `engines` field too strictly
      await writeFileTree(context, {
        '.yarnrc': '# Hotfix for Node 8.x\n--install.ignore-engines true\n'
      })
    }

    // intilaize git repository before installing deps
    // so that vue-cli-service can setup git hooks.
    const shouldInitGit = this.shouldInitGit(cliOptions)
    if (shouldInitGit) {
      log(`🗃  Initializing git repository...`)
      this.emit('creation', { event: 'git-init' })
      await run('git init')
    }

    // install plugins
    log(`⚙\u{fe0f}  Installing CLI plugins. This might take a while...`)
    log()
    this.emit('creation', { event: 'plugins-install' })

    if (isTestOrDebug && !process.env.VUE_CLI_TEST_DO_INSTALL_PLUGIN) {
      // in development, avoid installation process
      await require('./util/setupDevProject')(context)
    } else {
      await pm.install()
    }

    // run generator
    log(`🚀  Invoking generators...`)
    this.emit('creation', { event: 'invoking-generators' })
    //   plugins: {
    //     '@vue/cli-plugin-babel': {},
    //     '@vue/cli-plugin-typescript': { classComponent: false, useTsWithBabel: true },
    //     '@vue/cli-plugin-pwa': {},
    //     '@vue/cli-plugin-router': { historyMode: false },
    //     '@vue/cli-plugin-vuex': {},
    //     '@vue/cli-plugin-eslint': { config: 'prettier', lintOn: [Array] },
    //     '@vue/cli-plugin-unit-jest': {},
    //     '@vue/cli-plugin-e2e-cypress': {}
    //   },
    const plugins = await this.resolvePlugins(preset.plugins, pkg)
    const generator = new Generator(context, {
      pkg,
      plugins,
      afterInvokeCbs,
      afterAnyInvokeCbs
    })
    await generator.generate({
      extractConfigFiles: preset.useConfigFiles
    })

    // install additional deps (injected by generators)
    log(`📦  Installing additional dependencies...`)
    this.emit('creation', { event: 'deps-install' })
    log()
    if (!isTestOrDebug || process.env.VUE_CLI_TEST_DO_INSTALL_PLUGIN) {
      await pm.install()
    }

    // run complete cbs if any (injected by generators)
    log(`⚓  Running completion hooks...`)
    this.emit('creation', { event: 'completion-hooks' })
    for (const cb of afterInvokeCbs) {
      await cb()
    }
    for (const cb of afterAnyInvokeCbs) {
      await cb()
    }

    if (!generator.files['README.md']) {
      // generate README.md
      log()
      log('📄  Generating README.md...')
      await writeFileTree(context, {
        'README.md': generateReadme(generator.pkg, packageManager)
      })
    }

    // commit initial state
    let gitCommitFailed = false
    if (shouldInitGit) {
      await run('git add -A')
      if (isTestOrDebug) {
        await run('git', ['config', 'user.name', 'test'])
        await run('git', ['config', 'user.email', 'test@test.com'])
        await run('git', ['config', 'commit.gpgSign', 'false'])
      }
      const msg = typeof cliOptions.git === 'string' ? cliOptions.git : 'init'
      try {
        await run('git', ['commit', '-m', msg, '--no-verify'])
      } catch (e) {
        gitCommitFailed = true
      }
    }

    // log instructions
    log()
    log(`🎉  Successfully created project ${chalk.yellow(name)}.`)
    if (!cliOptions.skipGetStarted) {
      log(
        `👉  Get started with the following commands:\n\n` +
        (this.context === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${name}\n`)) +
        chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn serve' : packageManager === 'pnpm' ? 'pnpm run serve' : 'npm run serve'}`)
      )
    }
    log()
    this.emit('creation', { event: 'done' })

    if (gitCommitFailed) {
      warn(
        `Skipped git commit due to missing username and email in git config, or failed to sign commit.\n` +
        `You will need to perform the initial commit yourself.\n`
      )
    }

    generator.printExitLogs()
  }

  // 执行相关的命令（npm git的相关命令）
  run (command, args) {
    if (!args) { [command, ...args] = command.split(/\s+/) }
    return execa(command, args, { cwd: this.context })
  }

  /***
   * 通过prompts选择配置选项
   * ***/
  async promptAndResolvePreset (answers = null) {
    // prompt
    if (!answers) {
      // 清空控制台
      await clearConsole(true)
      // 解析出所有的选项并注入inquirer.prompt。
      answers = await inquirer.prompt(this.resolveFinalPrompts())
    }
    debug('vue-cli:answers')(answers)

    if (answers.packageManager) {
      saveOptions({
        packageManager: answers.packageManager
      })
    }

    let preset
    // 非手动模式
    if (answers.preset && answers.preset !== '__manual__') {
      preset = await this.resolvePreset(answers.preset)
    } else {
      // manual
      preset = {
        useConfigFiles: answers.useConfigFiles === 'files',
        plugins: {}
      }
      answers.features = answers.features || []
      // run cb registered by prompt modules to finalize the preset
      this.promptCompleteCbs.forEach(cb => cb(answers, preset))
    }

    // validate
    validatePreset(preset)

    // save preset
    if (answers.save && answers.saveName && savePreset(answers.saveName, preset)) {
      log()
      log(`🎉  Preset ${chalk.yellow(answers.saveName)} saved in ${chalk.yellow(rcPath)}`)
    }

    debug('vue-cli:preset')(preset)
    return preset
  }

  /***
   * 解析默认配置
   * @param { String } name 预置配置的名字
   * @param { String } clone 是否使用了克隆命令
   * @return { Object } 返回配置信息
   * ***/
  async resolvePreset (name, clone) {
    let preset
    // 加载本地保存的默认配置
    const savedPresets = this.getPresets()

    // 如果传入的预置配置在本地的配置里面有，则取本地的
    if (name in savedPresets) {
      preset = savedPresets[name]
    } 
    // path.isAbsolute() 方法检测 path 是否为绝对路径。
    // 这部分表示你在使用vue create命令时在后面跟了参数--preset 文件名，表示你自己提供配置信息
    // 这个预置配置的文件放在你要生成项目的目录下面。
    else if (name.endsWith('.json') || /^\./.test(name) || path.isAbsolute(name)) {
      preset = await loadLocalPreset(path.resolve(name))
    } 
    // 提供的预置配置为一个连接
    else if (name.includes('/')) {
      log(`Fetching remote preset ${chalk.cyan(name)}...`)
      this.emit('creation', { event: 'fetch-remote-preset' })
      try {
        // 加载远程的预置配置
        preset = await loadRemotePreset(name, clone)
      } catch (e) {
        error(`Failed fetching remote preset ${chalk.cyan(name)}:`)
        throw e
      }
    }

    if (!preset) {
      error(`preset "${name}" not found.`)
      const presets = Object.keys(savedPresets)
      if (presets.length) {
        log()
        log(`available presets:\n${presets.join(`\n`)}`)
      } else {
        log(`you don't seem to have any saved preset.`)
        log(`run vue-cli in manual mode to create a preset.`)
      }
      exit(1)
    }
    return preset
  }

  // { id: options } => [{ id, apply, options }]
  /***
   * 解析插件
   * @param { Object } rawPlugins 选择的插件列表
   * @param { Object } pkg package.json信息
   * @return { Array } 返回解析过后的数组
   * ***/
  async resolvePlugins (rawPlugins, pkg) {
    // ensure cli-service is invoked first
    // 对对象进行排序
    rawPlugins = sortObject(rawPlugins, ['@vue/cli-service'], true)
    const plugins = []
    for (const id of Object.keys(rawPlugins)) {
      const apply = loadModule(`${id}/generator`, this.context) || (() => {})
      let options = rawPlugins[id] || {}

      if (options.prompts) {
        let pluginPrompts = loadModule(`${id}/prompts`, this.context)

        if (pluginPrompts) {
          const prompt = inquirer.createPromptModule()

          if (typeof pluginPrompts === 'function') {
            pluginPrompts = pluginPrompts(pkg, prompt)
          }
          if (typeof pluginPrompts.getPrompts === 'function') {
            pluginPrompts = pluginPrompts.getPrompts(pkg, prompt)
          }

          log()
          log(`${chalk.cyan(options._isPreset ? `Preset options:` : id)}`)
          options = await prompt(pluginPrompts)
        }
      }

      plugins.push({ id, apply, options })
    }
    return plugins
  }
  /***
   * 获取预置选项
   * @return { Object } 返回对应的预置选项
   * ***/
  getPresets () {
    // 加载对应的创建项目时的选项
    /***
     * loadOptions加载本地.vuerc文件的内容，大概长这样
     * {
        "useTaobaoRegistry": true,
        "latestVersion": "4.5.12",
        "lastChecked": 1616988092123,
        "packageManager": "npm",
        "presets": {
          "mine-default": {
            "useConfigFiles": true,
            "plugins": {
              "@vue/cli-plugin-babel": {},
              "@vue/cli-plugin-router": { "historyMode": false },
              "@vue/cli-plugin-vuex": {},
              "@vue/cli-plugin-eslint": {
                "config": "prettier",
                "lintOn": ["save", "commit"]
              }
            },
            "vueVersion": "2",
            "cssPreprocessor": "dart-sass"
          }
        }
      }
     * ***/
    const savedOptions = loadOptions()

    // 返回你本地保存的配置以及cli脚手架自带的配置
    return Object.assign({}, savedOptions.presets, defaults.presets)
  }

  /***
   * 解析第一步的选项（预置配置）
   * @return { Object } 返回对应的配置信息（比如你的预置配置、vue2、vue3或者是Manually select features）
   * ***/
  resolveIntroPrompts () {
    // 获取到对应的选项
    // 这个方法主要是会去取.vuerc里面保存的上次存储的配置信息
    /***
     * persets对象大概长这样
     * {
        "mine-default": {
          "useConfigFiles": true,
          "plugins": {
            "@vue/cli-plugin-babel": {},
            "@vue/cli-plugin-router": { "historyMode": false },
            "@vue/cli-plugin-vuex": {},
            "@vue/cli-plugin-eslint": {
              "config": "prettier",
              "lintOn": ["save", "commit"]
            }
          },
          "vueVersion": "2",
          "cssPreprocessor": "dart-sass"
        },
        "default": {
          "useConfigFiles": false,
          "plugins": {
            "@vue/cli-plugin-babel": {},
            "@vue/cli-plugin-eslint": {
              "config": "base",
              "lintOn": "['save']"
            }
          },
          "vueVersion": "2",
          "cssPreprocessor": "undefined"
        },
        "__default_vue_3__": {
          "useConfigFiles": false,
          "plugins": {
            "@vue/cli-plugin-babel": {},
            "@vue/cli-plugin-eslint": {
              "config": "base",
              "lintOn": "['save']"
            }
          },
          "vueVersion": "3",
          "cssPreprocessor": "undefined"
        }
      }
     * ***/
    const presets = this.getPresets()


    // Object.entries()方法返回一个给定对象自身可枚举属性的键值对数组，
    // 其排列与使用 for...in 循环遍历该对象时返回的顺序一致（区别在于 for-in 循环还会枚举原型链中的属性）。
    // Object.entries({a: 100, b: 'hello'})
    // 输出：[['a', 100], ['b', 'hello']]
    const presetChoices = Object.entries(presets).map(([name, preset]) => {
      let displayName = name
      // 区别判断是选择的vue2还是vue3
      if (name === 'default') {
        displayName = 'Default'
      } else if (name === '__default_vue_3__') {
        displayName = 'Default (Vue 3 Preview)'
      }
      
      // formatFeatures这个方法会把你选择的功能特性转换为一句话，
      // 比如这种 hash-mode ([Vue 2] dart-sass, babel, router, vuex, eslint)
      return {
        name: `${displayName} (${formatFeatures(preset)})`,
        value: name
      }
    })
    // 消息提示-选择你对应的配置，这个对象保存了对应的配置信息，也就是我们执行vue create projname
    // 显示的一行行选择，大概长下面这样
    // history-mode ([Vue 2] dart-sass, babel, router, vuex, eslint)
    // hash-mode ([Vue 2] dart-sass, babel, router, vuex, eslint)
    // Default ([Vue 2] babel, eslint)
    // Default (Vue 3 Preview) ([Vue 3] babel, eslint)
    // Manually select features
    const presetPrompt = {
      name: 'preset',
      type: 'list',
      message: `Please pick a preset:`,
      choices: [
        ...presetChoices,
        {
          name: 'Manually select features',
          value: '__manual__'
        }
      ]
    }
    // 选择对应的模块的时候的提示消息
    // 我们选择了对应的配置后，之后会让你选择对应的功能，比如babel、ts、vuex、router这些东西
    // ? Check the features needed for your project: (Press <space> to select, <a> to toggle all, <i> to invert selection)
    const featurePrompt = {
      name: 'features',
      when: isManualMode,
      type: 'checkbox',
      message: 'Check the features needed for your project:',
      choices: [],
      pageSize: 10
    }
    return {
      // 第一步对应的配置集合
      presetPrompt,
      // 第二步选择功能时的前置信息
      featurePrompt
    }
  }
  /***
   * 在选择完特性功能后，对应的其他选择，从Where do you prefer placing config for Babel, ESLint, etc.?
   * 这个消息过后的相关的选择提示，
   * ***/
  resolveOutroPrompts () {
    const outroPrompts = [
      {
        name: 'useConfigFiles',
        when: isManualMode,
        type: 'list',
        message: 'Where do you prefer placing config for Babel, ESLint, etc.?',
        choices: [
          {
            name: 'In dedicated config files',
            value: 'files'
          },
          {
            name: 'In package.json',
            value: 'pkg'
          }
        ]
      },
      {
        name: 'save',
        when: isManualMode,
        type: 'confirm',
        message: 'Save this as a preset for future projects?',
        default: false
      },
      {
        name: 'saveName',
        when: answers => answers.save,
        type: 'input',
        message: 'Save preset as:'
      }
    ]

    // ask for packageManager once
    const savedOptions = loadOptions()
    // 这后面的操作对应的是你的选项配置的包管理工具类型
    if (!savedOptions.packageManager && (hasYarn() || hasPnpm3OrLater())) {
      const packageManagerChoices = []

      // yarn
      if (hasYarn()) {
        packageManagerChoices.push({
          name: 'Use Yarn',
          value: 'yarn',
          short: 'Yarn'
        })
      }
      // pnpm
      if (hasPnpm3OrLater()) {
        packageManagerChoices.push({
          name: 'Use PNPM',
          value: 'pnpm',
          short: 'PNPM'
        })
      }
      // 默认使用npm
      packageManagerChoices.push({
        name: 'Use NPM',
        value: 'npm',
        short: 'NPM'
      })

      outroPrompts.push({
        name: 'packageManager',
        type: 'list',
        message: 'Pick the package manager to use when installing dependencies:',
        choices: packageManagerChoices
      })
    }

    return outroPrompts
  }
  /***
   * 解析用户最终选择的选项（最终的所有选项）
   * ***/
  resolveFinalPrompts () {
    // patch generator-injected prompts to only show in manual mode
    this.injectedPrompts.forEach(prompt => {
      const originalWhen = prompt.when || (() => true)
      prompt.when = answers => {
        return isManualMode(answers) && originalWhen(answers)
      }
    })

    const prompts = [
      this.presetPrompt,
      this.featurePrompt,
      ...this.injectedPrompts,
      ...this.outroPrompts
    ]
    debug('vue-cli:prompts')(prompts)
    return prompts
  }

  /***
   * 是否初始化git
   * @param { Object } cliOptions commander命令选项
   * @return { Boolean } true | false
   * ***/
  shouldInitGit (cliOptions) {
    // 是否安装了git
    if (!hasGit()) {
      return false
    }
    // --git
    if (cliOptions.forceGit) {
      return true
    }
    // --no-git
    if (cliOptions.git === false || cliOptions.git === 'false') {
      return false
    }
    // default: true unless already in a git repo
    // 判断项目下是否包含.git
    return !hasProjectGit(this.context)
  }
}
