// 循环已有的脚手架菜单，导入对应的菜单配置
// 对应的菜单就是我们在使用vue create命令过后选择 Manually select features会出现让你选择项目需要配备的功能，
// 如vue版本，babel, typescript等
// 执行了这个函数的话就相当于会返回一个数组，这个数组包含了菜单对应的文件的封装函数，详细的参考promptModules下的文件信息
exports.getPromptModules = () => {
  return [
    'vueVersion',
    'babel',
    'typescript',
    'pwa',
    'router',
    'vuex',
    'cssPreprocessors',
    'linter',
    'unit',
    'e2e'
  ].map(file => require(`../promptModules/${file}`))
}
