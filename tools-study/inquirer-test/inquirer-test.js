const inquirer = require('inquirer');

let questions = [
  {
    type: 'confirm',
    name: 'select your tool',
    message: 'select this?',
    default: false
  }
]

inquirer.prompt(questions).then((answers) => {
  console.log('tag here');
  console.log(answers);
})