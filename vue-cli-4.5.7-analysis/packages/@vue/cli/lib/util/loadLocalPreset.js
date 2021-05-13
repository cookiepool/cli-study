const fs = require('fs-extra')
const loadPresetFromDir = require('./loadPresetFromDir')

/***
 * @param { String } path 配置文件的路径
 * ***/
module.exports = async function loadLocalPreset (path) {
  // 获取当前path的状态
  // fs.statSync：https://www.cnblogs.com/shangyueyue/p/12591543.html
  const stats = fs.statSync(path)
  // 如果path对应的是文件
  if (stats.isFile()) {
    // 读取json文件并把它转换为对象
    // readJson属于fs-extra的方法：https://github.com/jprichardson/node-fs-extra/blob/master/docs/readJson.md
    return await fs.readJson(path)
  } 
  // 如果path是一个目录
  else if (stats.isDirectory()) {
    // 从目录里面去加载文件的预置配置信息
    return await loadPresetFromDir(path)
  } else {
    throw new Error(`Invalid local preset path: ${path}`)
  }
}
