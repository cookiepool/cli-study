// 分别引入node.js文件系统、操作系统、路径三个模块
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

const xdgConfigPath = file => {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME
  if (xdgConfigHome) {
    const rcDir = path.join(xdgConfigHome, 'vue')
    if (!fs.existsSync(rcDir)) {
      // fs.ensureDirSync()，fs-extra模块的专有语法，确保目录存在。如果目录结构不存在，则创建目录结构。如果提供，选项可以指定目录所需的模式
      fs.ensureDirSync(rcDir, 0o700)
    }
    return path.join(rcDir, file)
  }
}

// migration for 3.0.0-rc.7
// we introduced a change storing .vuerc in AppData, but the benefit isn't
// really obvious so we are reverting it to keep consistency across OSes
// 这个方法是让.vuerc都统一放到用户文件夹下管理，不在放在AppData/Roaming下管理
const migrateWindowsConfigPath = file => {
  // 如果不是windows平台，取消操作
  if (process.platform !== 'win32') {
    return
  }
  // 获取windows平台的appdata文件夹路径
  // 比如：'C:\\Users\\cm-lee\\AppData\\Roaming'
  const appData = process.env.APPDATA
  if (appData) {
    // path.join() 方法会将所有给定的 path 片段连接到一起（使用平台特定的分隔符作为定界符），然后规范化生成的路径。
    // 长度为零的 path 片段会被忽略。 如果连接后的路径字符串为长度为零的字符串，则返回 '.'，表示当前工作目录。
    // 'C:\\Users\\cm-lee\\AppData\\Roaming\\vue'
    const rcDir = path.join(appData, 'vue')
    // 'C:\\Users\\cm-lee\\AppData\\Roaming\\vue\\.vuerc'
    const rcFile = path.join(rcDir, file)
    // os.homedir返回当前用户的主目录的字符串路径。'C:\\Users\\cm-lee'
    // 'C:\\Users\\cm-lee\\.vuerc'
    const properRcFile = path.join(os.homedir(), file)
    // fs.existsSync()：如果路径存在，则返回 true，否则返回 false。
    if (fs.existsSync(rcFile)) {
      try {
        if (fs.existsSync(properRcFile)) {
          // 移除文件或者目录，这个api是fs-extra特有的
          fs.removeSync(rcFile)
        } else {
          // 移动文件或目录m,这个api是fs-extra特有的
          fs.moveSync(rcFile, properRcFile)
        }
      } catch (e) {}
    }
  }
}

exports.getRcPath = file => {
  migrateWindowsConfigPath(file)
  return (
    process.env.VUE_CLI_CONFIG_PATH ||
    xdgConfigPath(file) ||
    // os.homedir返回当前用户的主目录的字符串路径。'C:\\Users\\cm-lee'
    path.join(os.homedir(), file)
  )
}
