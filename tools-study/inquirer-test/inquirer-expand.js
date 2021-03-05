const inquirer = require('inquirer');

let questions = [
  {
    type: 'expand',
    name: 'smart phone brand',
    message: '选择你的智能手机品牌',
    choices: [
      {
        key: 'a',
        name: 'Apple',
        value: 'apple'
      },
      {
        key: 's',
        name: 'Samsung',
        value: 'samsung'
      },
      {
        key: 'x',
        name: 'Xiaomi',
        value: 'xiaomi'
      }
    ],
    default: 2
  }
];

inquirer.prompt(questions).then((ans) => {
  console.log(ans);
});