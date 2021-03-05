const inquirer = require('inquirer');

let questions = [
  {
    type: 'confirm',
    name:'your select',
    message: 'Do you like red?',
    default: 'red'
  }
];

inquirer.prompt(questions).then((ans) => {
  console.log(ans);
})