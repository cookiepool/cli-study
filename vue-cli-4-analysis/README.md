# \_\_mocks\_\_
这个文件夹暂时不知到干嘛的。

# .circleci
这个文件夹暂时不知到干嘛的。

# .github
这个文件夹是放置的相关的说明文档，比如如何为项目贡献，以及git相关的一些提交规范，等等。

# docs
这个文件夹是官方的cli文档，也就是我们在 `cli.vuejs.org` 上看到的东西。

# packages
这个文件夹就是vue/cli 4.X的核心。

## @vue
这个文件夹就包含了cli工具对应的插件、启动服务等一系列工具。

### babel-preset-app

### cli
#### \_\_tests\_\_
这个文件夹应该是做单元测试的。

#### bin
`bin` 下面的 `vue.js` 就是脚手架命令的入口。

#### lib
`lib` 文件夹下的文件就是各个命令的详细代码，比如我们使用的 `create`, `add`, `invoke` 等一系列命令。

#### types
`types` 这个文件夹暂时没弄懂是干嘛的。

## test
暂时没什么用处。

## vue-cli-version-marker
获取cli版本号的目录，里面的自述文件有说这个文件夹的作用。

# scripts
这个文件夹是项目启动相关的一些脚本，对应的配置可以在 `package.json` 里面的 `scripts` 中找到。

