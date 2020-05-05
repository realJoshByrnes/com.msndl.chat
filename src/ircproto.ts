import { EventEmitter } from 'events';
import { Socket } from 'net';
import Debug from 'debug';
import IRCParser from './ircv3-parser';
const log = Debug('IRC::Protocol');

class IRCProtocolHandler extends EventEmitter {
  protected socket: Socket;
  private parser: IRCParser;

  public constructor(socket: Socket) {
    super();
    this.socket = socket;
    this.parser = new IRCParser();
    this._handleEvents();
  }

  protected _handleEvents(): void {
    this.parser.on('message', (tag, prefix, command, params) => {
      log({ tag, prefix, command, params });
    });
    this.socket.on('data', (data: Buffer) => this.parser.chunk(data));
  }
}

export default IRCProtocolHandler;
