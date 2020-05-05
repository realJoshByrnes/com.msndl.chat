import * as net from 'net';

import Debug from 'debug';
import { EventEmitter } from 'events';
const log = Debug('listener');

// Notes:
// - Currently uses net.Addressinfo, so may not support non TCP connections.

declare interface Listener {
  on(event: 'listen', listener: () => void): this;
  on(event: 'connect', listener: (socket: net.Socket) => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

class Listener extends EventEmitter {
  protected address: string;
  protected port: number;
  protected family: string;
  private _server: net.Server;

  public constructor(port: number, address?: string) {
    super();
    this.address = address || '0.0.0.0';
    this.port = port;
    this.family = 'unknown';
    this._server = new net.Server();
    this._addHandlers();
    this._listen();
  }

  public close(): void {
    this._server.close();
  }

  protected _addHandlers(): void {
    this._server
      .on('listening', () => {
        const addr = this._server.address() as net.AddressInfo;
        this.address = addr.address;
        this.port = addr.port;
        this.family = addr.family;
        log(`Listening on ${addr.address}:${addr.port} (${addr.family})`);
        this.emit('listen');
      })
      .on('connection', (socket: net.Socket): void => {
        // Do something.
        const addr = socket.address() as net.AddressInfo;
        log(`Client connected from ${addr.address}:${addr.port} (${addr.family})`);
        this.emit('connect', socket);
      })
      .on('close', () => {
        const addr: net.AddressInfo = {
          address: this.address,
          port: this.port,
          family: this.family as string,
        };
        log(`Stopped listening on ${addr.address}:${addr.port} (${addr.family})`);
        this.emit('close');
      })
      .on('error', (err: Error) => {
        // const addr = this._server.address() as net.AddressInfo;
        log(`Listener Error: ${err}`);
        this.emit('error');
      });
  }

  protected _listen(): void {
    log(`Attempting to listen on ${this.address}:${this.port}`);
    this._server.listen(this.port, this.address);
  }
}

export default Listener;
