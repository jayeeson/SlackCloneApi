import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './auth/authRoutes';
import { handleCustomErrors } from './middleware/errors';
import config from './config';

const app = express();
app.use(bodyParser.json());
app.use(authRoutes);
app.use(handleCustomErrors);

app.listen(config.port, () => {
  console.log('App started on port', config.port);
});
