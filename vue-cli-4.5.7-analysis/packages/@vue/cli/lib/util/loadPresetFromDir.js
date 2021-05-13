const path = require('path')
const fs = require('fs-extra')

/***
 * @param { String } dir 目录路径
 * @return { Object } 预置配置信息
 * ***/
module.exports = async function loadPresetFromDir (dir) {
  // 目录下面的文件必须叫preset.json才行
  const presetPath = path.join(dir, 'preset.json')
  if (!fs.existsSync(presetPath)) {
    throw new Error('remote / local preset does not contain preset.json!')
  }
  // 读取文件信息
  const preset = await fs.readJson(presetPath)

  // if the preset dir contains generator.js or generator/index.js, we will inject it as a hidden
  // plugin so it will be invoked by the generator.
  const hasGenerator = fs.existsSync(path.join(dir, 'generator.js')) || fs.existsSync(path.join(dir, 'generator/index.js'))
  if (hasGenerator) {
    (preset.plugins || (preset.plugins = {}))[dir.replace(/[\/]$/, '')] = {
      _isPreset: true,
      prompts: true
    }
  }

  return preset
}
