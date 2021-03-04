const inquirer = require('inquirer');

let questions = [
  {
    type: 'confirm',
    name: 'select your tool',
    message: 'is your choice?',
    default: 123,
    prefix: 'start---',
    suffix: '---end'
  }
]

inquirer.prompt(questions).then((answers) => {
  console.log(answers);
})