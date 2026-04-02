const b = require('bcryptjs');
const hash = b.hashSync('PV=nRT', 10);
console.log('HASH_START');
console.log(hash);
console.log('HASH_END');
console.log('VERIFY:', b.compareSync('PV=nRT', hash));
