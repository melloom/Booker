const { createUserDocuments } = require('./create-user-docs');

console.log('Starting user document creation process...');
createUserDocuments()
  .then(() => {
    console.log('Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Process failed:', error);
    process.exit(1);
  }); 