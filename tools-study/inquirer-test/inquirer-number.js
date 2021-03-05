const inquirer = require('inquirer');

let questions = [
  {
    type: 'number',
    name: 'your favorite number',
    message: 'input your favorite number: ',
    default: true
  }
];

inquirer.prompt(questions).then((ans) => {
  console.log(ans);
});