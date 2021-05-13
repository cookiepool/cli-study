const fs = require('fs-extra')
const loadPresetFromDir = require('./loadPresetFromDir')

/***
 * @param { String } repository 地址
 * @param { String } clone 克隆参数（--clone）
 * ***/
module.exports = async function loadRemotePreset (repository, clone) {
  const os = require('os')
  const path = require('path')
  // 下载git仓库
  const download = require('download-git-repo')

  const presetName = repository
    .replace(/((?:.git)?#.*)/, '')
    .split('/')
    .slice(-1)[0]
    // for direct urls, it's hard to get the correct project name,
    // but we need to at least make sure no special characters remaining
    .replace(/[:#]/g, '')

  // os.tmpdir() 以字符串的形式返回操作系统的默认临时文件目录。'C:\\Users\\cm-lee\\AppData\\Local\\Temp'
  const tmpdir = path.join(os.tmpdir(), 'vue-cli-presets', presetName)

  // clone will fail if tmpdir already exists
  // https://github.com/flipxfx/download-git-repo/issues/41
  if (clone) {
    await fs.remove(tmpdir)
  }

  await new Promise((resolve, reject) => {
    /***
     * Download a git repository to a destination folder with options, and callback.
     * @param { String} repository git仓库地址
     * @param { String} tmpdir 拉取下来的文件存储的位置
     * ***/
    download(repository, tmpdir, { clone }, err => {
      if (err) return reject(err)
      resolve()
    })
  })

  return await loadPresetFromDir(tmpdir)
}
