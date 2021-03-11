// 这部分是工具封装
[
  'env', // 环境判断
  'exit', // 退出函数
  'ipc', // 本地与远程进程通讯
  'logger', // 日志打印
  'module', // 模块解析
  'object', // 操作对象
  'openBrowser', // 打开浏览器
  'pkg', // 解析package.json
  'pluginResolution', // 解析插件
  'launch', // 启动
  'request', // 请求方法，但是里面的request库已经弃用了
  'spinner', // 打印状态
  'validate' // 校验
].forEach(m => {
  // Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象分配到目标对象。它将返回目标对象。
  // 这个地方相当于全量导出对应模块
  Object.assign(exports, require(`./lib/${m}`))
})

exports.chalk = require('chalk')
// execa，这个包改进了child_process方法，地址：https://github.com/sindresorhus/execa
exports.execa = require('execa')
exports.semver = require('semver')

// Object.defineProperty() 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回此对象。
Object.defineProperty(exports, 'installedBrowsers', {
  enumerable: true,
  get () {
    return exports.getInstalledBrowsers()
  }
})
