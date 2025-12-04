const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the password you want to hash: ', (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  
  console.log('\n---------------------------------------------------');
  console.log('Your Hashed Password:');
  console.log(hash);
  console.log('---------------------------------------------------');
  console.log('Copy this value and paste it into your .env file');
  console.log('and Vercel Environment Variables as MY_PASSWORD or WIFE_PASSWORD.');
  console.log('---------------------------------------------------');
  
  rl.close();
});
