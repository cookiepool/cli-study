const inquirer = require('inquirer');

let questions = [
  {
    type: 'checkbox',
    name: 'your select',
    message: '选择你喜欢的品牌',
    choices: [
      new inquirer.Separator('--- 国产品牌 ---'),
      {
        name: 'Huawei'
      },
      {
        name: 'Xiaomi'
      },
      {
        name: 'VIVO'
      },
      {
        name: 'OPPO'
      },
      new inquirer.Separator('--- 国外品牌 ---'),
      {
        name: 'Apple'
      },
      {
        name: 'Nokia',
        disabled: true
      },
      {
        name: 'Samsung'
      }
    ],
    validate(value) {
      if(value.length <= 0) {
        return '至少选择一项！'
      }
      return true;
    },
    loop: false,
    default: ['VIVO']
  }
];

inquirer.prompt(questions).then((ans) => {
  console.log(ans);
});