const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the password you want to hash: ', (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const base64Hash = Buffer.from(hash).toString('base64');
  
  console.log('\n---------------------------------------------------');
  console.log('OPTION 1: Standard Hash (Try this first)');
  console.log(hash);
  console.log('\nOPTION 2: Base64 Encoded Hash (Use if Option 1 fails)');
  console.log('This version is safe from special character issues in Vercel.');
  console.log(base64Hash);
  console.log('---------------------------------------------------');
  console.log('Copy one of these values and paste it into your .env file');
  console.log('and Vercel Environment Variables as MY_PASSWORD or WIFE_PASSWORD.');
  console.log('---------------------------------------------------');
  
  rl.close();
});
