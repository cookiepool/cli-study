const fs = require('fs')
const path = require('path')
const execa = require('execa')

async function genNewRelease () {
  const nextVersion = require('../lerna.json').version
  const { stdout } = await execa(require.resolve('lerna-changelog/bin/cli'), [
    '--next-version',
    nextVersion
  ])
  return stdout
}

const gen = (module.exports = async () => {
  const newRelease = await genNewRelease()
  const changelogPath = path.resolve(__dirname, '../CHANGELOG.md')

  const newChangelog =
    newRelease + '\n\n\n' + fs.readFileSync(changelogPath, { encoding: 'utf8' })
  fs.writeFileSync(changelogPath, newChangelog)

  delete process.env.PREFIX
})

// 当 Node.js 直接运行一个文件时，require.main 会被设为它的 module。
// 这意味着可以通过 require.main === module 来判断一个文件是否被直接运行。
// https://juejin.cn/post/6844903688838856712
if (require.main === module) {
  gen().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
