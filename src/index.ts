import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import authRoutes from './auth/authRoutes';
import { handleCustomErrors } from './middleware/errors';
import { seedDb } from './db/seedDb';
import config from './config';
import { launchSocketServer } from './helpers/socketio';

seedDb();

const app = express();
app.use(cors(config.cors.options));
app.set('port', config.port);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(handleCustomErrors);
app.use(authRoutes);

const httpServer = launchSocketServer(app);

httpServer.listen(app.get('port'), () => {
  console.log('App started on port', app.get('port'));
});
