const semver = require('semver');

console.log(semver.prerelease('1.2.3-alpha.1')); // [ 'alpha', 1 ]
console.log(semver.prerelease('1.2.3')); // null