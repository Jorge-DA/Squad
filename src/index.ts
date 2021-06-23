import './database';


import app from './app';
import { field, sep, title } from './config/fmt';


(async () => {
  
  const server = await app.listen(app.get('port'));
  sep();
  title(`{${app.get('pkg').name}} - ${app.get('pkg').description}`);
  field('\x1b[37mServer', `\x1b[33m${app.get('port')}\x1b[0m`);
  field('\x1b[37mStatus', `\x1b[33m${app.get('env')}\x1b[0m`);
})();
/**
 * ya quedo wey     jjiji
 */