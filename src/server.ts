import mongoose from 'mongoose';

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

import './config/env.js';
import app from './app.js';

const clientOptions: mongoose.ConnectOptions = {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 5000,
};

mongoose
  .connect(process.env.DATABASE as string, clientOptions)
  .then(() => console.log('DB connection successful! 😍'))
  .catch(err => {
    console.log('DB connection error! 💥');
    console.log(err.name, '=====', err.message);
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
