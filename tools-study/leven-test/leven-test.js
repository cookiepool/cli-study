const leven = require('leven');

console.log(leven('hello', 'hello')); // 0
console.log(leven('hello', 'hella')); // 1
console.log(leven('hello', 'aelii')); // 3
console.log(leven('hello', 'hello world')); // 6