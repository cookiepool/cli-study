const fs = require('fs-extra')
const path = require('path')

// 删除不在新文件信息里面的文件信息
function deleteRemovedFiles (directory, newFiles, previousFiles) {
  // get all files that are not in the new filesystem and are still existing
  const filesToDelete = Object.keys(previousFiles)
    .filter(filename => !newFiles[filename])

  // delete each of these files
  return Promise.all(filesToDelete.map(filename => {
    // 异步地删除文件或符号链接。
    // http://nodejs.cn/api/fs.html#fs_fs_unlink_path_callback
    return fs.unlink(path.join(directory, filename))
  }))
}

/***
 * 将信息写入文件（生成文件）
 * @param { String } dir 生成的文件的目录
 * @param { Object } files 文件名为键，文件内容为值的对象
 * @param { String } previousFiles 之前的文件信息
 * ***/
module.exports = async function writeFileTree (dir, files, previousFiles) {
  if (process.env.VUE_CLI_SKIP_WRITE) {
    return
  }
  // 删除文件
  if (previousFiles) {
    await deleteRemovedFiles(dir, files, previousFiles)
  }
  Object.keys(files).forEach((name) => {
    const filePath = path.join(dir, name)
    // https://github.com/jprichardson/node-fs-extra/blob/master/docs/ensureDir-sync.md
    // 确保目录存在。如果目录结构不存在，则创建目录结构。如果提供，选项可以指定目录所需的模式。
    // path.dirname() 该方法会返回 path 的目录名，类似于 Unix 的 dirname 命令。 尾部的目录分隔符会被忽略
    fs.ensureDirSync(path.dirname(filePath))
    // 创建文件并写入内容
    fs.writeFileSync(filePath, files[name])
  })
}
