#!/usr/bin/env node

const { semver, error } = require('@vue/cli-shared-utils')
const requiredVersion = require('../package.json').engines.node

// 检测node.js版本是否符合要求
if (!semver.satisfies(process.version, requiredVersion, { includePrerelease: true })) {
  error(
    `You are using Node ${process.version}, but vue-cli-service ` +
    `requires Node ${requiredVersion}.\nPlease upgrade your Node version.`
  )
  process.exit(1)
}

const Service = require('../lib/Service')
const service = new Service(process.env.VUE_CLI_CONTEXT || process.cwd())

const rawArgv = process.argv.slice(2)

// 第二个参数，boolean后面的数组，表示你在运行vue-cli-service命令时跟了这些参数时，对应的布尔值就是true。
// 比如这样：vue-cli-service serve --https，args对象对应的https字段的值就是true。
// 执行node vue-cli-service.js build --modern
// 下面输出：[ 'build', '--modern' ]
console.log(rawArgv)
const args = require('minimist')(rawArgv, {
  boolean: [
    // build
    'modern',
    'report',
    'report-json',
    'inline-vue',
    'watch',
    // serve
    'open',
    'copy',
    'https',
    // inspect
    'verbose'
  ]
})
// // 执行node vue-cli-service.js build --modern
// 下面输出
/***
  {
    _: [ 'build' ],
    modern: true,
    report: false,
    'report-json': false,
    'inline-vue': false,
    watch: false,
    open: false,
    copy: false,
    https: false,
    verbose: false
  }
***/
console.log(args)
const command = args._[0]

service.run(command, args, rawArgv).catch(err => {
  error(err)
  process.exit(1)
})
