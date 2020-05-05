import { Socket } from 'net';
import Debug from 'debug';
const log = Debug('Main');

log('MSN Chat OCX lives!');

import Listener from './listener';
import IRCProtocolHandler from './ircproto';

const listener = new Listener(6667, '[::]');
listener.on('connect', (socket: Socket) => {
  const client = new IRCProtocolHandler(socket);
  console.log(client.listenerCount);
});
