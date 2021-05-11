const validatePackage = require('validate-npm-package-name');

console.log(validatePackage('haha')); // { validForNewPackages: true, validForOldPackages: true }
console.log(validatePackage('@vue/cli')); // { validForNewPackages: true, validForOldPackages: true }
console.log(validatePackage('$%$%sS'))
// {
//   validForNewPackages: false,
//   validForOldPackages: false,
//   warnings: [ 'name can no longer contain capital letters' ],
//   errors: [ 'name can only contain URL-friendly characters' ]
// }

console.log(validatePackage('SS-ada_da'))