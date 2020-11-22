import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import authRoutes from './auth/authRoutes';
import { handleCustomErrors } from './middleware/errors';
import config from './config';

import { seedDb } from './db/seedDb';
seedDb();
console.log('seeded db');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(authRoutes);
app.use(handleCustomErrors);

app.listen(config.port, () => {
  console.log('App started on port', config.port);
});
