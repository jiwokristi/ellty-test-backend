import mongoose from 'mongoose';

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1); 
});

import './config/env.js';
import app from './app.js';

let DB;
if (process.env.DATABASE_STANDARD && process.platform === 'win32') {
  console.log('Using standard MongoDB URI for Windows...');
  DB = process.env.DATABASE_STANDARD.replace(
    '<db_password>',
    process.env.DATABASE_PASSWORD as string,
  );
} else {
  DB = (process.env.DATABASE as string).replace(
    '<db_password>',
    process.env.DATABASE_PASSWORD as string,
  );
}

mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful! 😍'))
  .catch(err => {
    console.log('DB connection error! 💥');
    console.log(err.name, err.message);
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port} 💕`);
});

process.on('unhandledRejection', (err: any) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
