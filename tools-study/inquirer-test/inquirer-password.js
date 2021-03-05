const inquirer = require('inquirer');

let questions = [
  {
    type: 'password',
    name: 'password-1',
    message: '请输入密码：'
  },
  {
    type: 'password',
    name: 'password-2',
    message: '请输入密码：',
    mask: '&'
  }
];

inquirer.prompt(questions).then((ans) => {
  console.log(ans);
});