// 不是在API模式或者TEST模式下，exitProcess为true;
exports.exitProcess = !process.env.VUE_CLI_API_MODE && !process.env.VUE_CLI_TEST

// 封装退出函数
exports.exit = function (code) {
  if (exports.exitProcess) {
    process.exit(code)
  } else if (code > 0) {
    throw new Error(`Process exited with code ${code}`)
  }
}
