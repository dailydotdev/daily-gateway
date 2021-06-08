import './profiler';
import './trace';
import logger from './src/logger';
import foreground from './src/index';
import background from './src/background';
import config from './src/config';

const isBackground = process.env.MODE === 'background';

const app = isBackground ? background : foreground;
const server = app.listen(config.port);

if (process.env.KEEP_ALIVE_TIMEOUT) {
  server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10);
}
if (isBackground) {
  logger.info('background processing in on');
}
logger.info(`server is listening to ${config.port}`);
