const inquirer = require('inquirer');

let questions = [
  {
    type: 'rawlist',
    name: 'todo',
    message: '你现在想要做什么？',
    choices: [
      'Eat food',
      'Buy a phone',
      new inquirer.Separator('----line----'),
      'Play game',
      'Work'
    ],
    // 默认选中buy a phone这个选项
    default: 1
  },
  {
    type: 'rawlist',
    name: 'brand',
    message: '请选择你需要购买的手机品牌',
    choices: [
      'Huawei',
      'Samsung',
      'Apple',
      'Xiaomi'
    ],
    // 筛选一下结果，将大写转换为小写
    filter(value) {
      return value.toLowerCase();
    }
  }
];

inquirer.prompt(questions).then((ans) => {
  console.log(ans);
});