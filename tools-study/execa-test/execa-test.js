const execa = require('execa');

execa('echo', ['hello execa']).then((res) => {
  console.log(res);
});