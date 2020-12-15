import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import authRoutes from './auth/authRoutes';
import chatRoutes from './chat/chatRoutes';
import { handleCustomErrors } from './middleware/errors';
import { seedDb } from './db/seedDb';
import config from './config';
import { launchSocketServer } from './helpers/socketio';
import * as mw from './middleware/validators';
import { asyncWrapper } from './utils/wrappers';
(async () => {
  seedDb();

  const app = express();
  app.set('port', config.port);
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(handleCustomErrors);
  app.use(authRoutes);
  app.use(asyncWrapper(mw.requireToken), chatRoutes);

  const httpServer = launchSocketServer(app);

  httpServer.listen(app.get('port'), () => {
    console.log('App started on port', app.get('port'));
  });
})();
