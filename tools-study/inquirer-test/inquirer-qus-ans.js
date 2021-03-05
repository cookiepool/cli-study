const inquirer = require('inquirer');

let questions = [
  {
    type: 'list',
    name: 'phone',
    message: 'choice your phone number',
    choices: [
      {
        name: 'xiaomi'
      },
      {
        name: 'huawei'
      },
      {
        name: 'samsung'
      }
    ]
  }
];

let answers = {
  'apple': 'ok',
  'oppo': 'ok'
};

inquirer.prompt(questions, answers).then((ans) => {
  console.log(ans);
});