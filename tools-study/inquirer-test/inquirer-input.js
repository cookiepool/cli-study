const inquirer = require('inquirer');

/*** input ***/
let questions = [
  {
    type: 'input',
    name: 'input your favorite book',
    message: 'your favorite book is:',
    default: 'book-one',
  }
]

inquirer.prompt(questions).then((answers) => {
  console.log(answers);
})