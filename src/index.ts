import express from 'express';

// import { seedDb } from './utils/seedDb';
// seedDb();

const app = express();

app.listen(3000, () => {
  console.log('App started');
});
