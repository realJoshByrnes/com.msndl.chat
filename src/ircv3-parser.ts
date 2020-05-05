// IRCv3 compatible parser. ~JD 04/05/2020

import { EventEmitter } from 'events';
import Debug from 'debug';
const log = Debug('IRCv3::Parser');

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
declare interface IRCParser {
  on(event: 'raw', listener: (message: string) => void): this;
  on(event: 'message', listener: (tag: Buffer, prefix: Buffer, command: string, parameters: Buffer[]) => void): this;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IRCPrefix {
  ServerName?: string;
  Nick?: string;
  User?: string;
  Host?: string;
}

class IRCParser extends EventEmitter {
  private chunkedMessage?: Buffer; // Storage for partial message
  private chunkedWord?: Buffer; // Storage for partial word
  private isTrailing: boolean; // is Trailing Parameter (RFC1459)
  private words: Buffer[]; // Words are parts of an IRC message (delimited by 0x20)

  public constructor() {
    super();
    this.isTrailing = false;
    this.words = [];
  }

  public chunk(data: Buffer): void {
    let messageStart = 0;
    let paramStart = 0;

    for (let pointer = 0; pointer < data.length; pointer++) {
      // Message delimiter (\r or \n)
      if ([13, 10].indexOf(data[pointer]) !== -1) {
        this.processParam(data.slice(paramStart, pointer), false);
        this.processMessage(data.slice(messageStart, pointer), false);
        messageStart = pointer + 1;
        paramStart = messageStart;
      }
      // Word delimiter (' ') and not part of an IRC trailing parameter
      else if (data[pointer] === 32 && this.isTrailing === false) {
        this.processParam(data.slice(paramStart, pointer), false);
        paramStart = pointer + 1;
        // This is (the start of) an IRC trailing parameter
        if (this.words.length > 2 && data[paramStart] === 58) {
          this.isTrailing = true;
        }
      }
    }
    this.processParam(data.slice(paramStart, data.length), true);
    this.processMessage(data.slice(messageStart, data.length), true);
  }

  public static isCommand(command: Buffer): boolean {
    return Buffer.isBuffer(command) && command.toString('binary').match(/^([a-zA-Z]+|\d{3})$/) !== null;
  }

  public static parsePrefix(prefix: Buffer): IRCPrefix {
    // TODO: Implement
    return {};
  }

  public static parseTags(tags: Buffer): Map<string, string> {
    // TODO: Implement
    return new Map();
  }

  private processMessage(message: Buffer, toBuffer = false): void {
    if (this.chunkedMessage !== undefined) {
      message = Buffer.concat([this.chunkedMessage, message]);
      this.chunkedMessage = undefined;
    }
    if (message.length === 0) return;

    if (toBuffer === false) {
      // TODO: Invalid messages should be dropped.
      // IF MESSAGE TOO LONG (Excl Tags) - Ignored
      // COMMAND IS INVALID - NOT [A-Z]+ or [0-9]{3} - Ignored
      // IF MESSAGE-TAG TOO LONG - Ignored
      // Invalid TAGS? - Ignored
      const [tags, prefix, command, ...parameters] = this.words;

      // TODO: We could probably avoid turning command into string twice (isCommand and nCommand)
      if (IRCParser.isCommand(command)) {
        // We drop invalid IRC Commands (not LETTERS or 3 digit raw numeric) - Others don't. TODO: Think of solution
        const nTags = IRCParser.parseTags(tags);
        const nPrefix = IRCParser.parsePrefix(prefix);
        const nCommand = command.toString('binary'); // Always ASCII
        const nParameters = parameters.slice(0, 15); // Limit to 15 (RFC1459)
        this.emit('raw', message);
        this.emit('message', nTags, nPrefix, nCommand, nParameters);
      }

      this.words = [];
      if (this.isTrailing === true) {
        this.isTrailing = false;
      }
    } else {
      this.chunkedMessage = message;
    }
  }

  private processParam(param: Buffer, toBuffer = false): void {
    if (this.chunkedWord !== undefined) {
      param = Buffer.concat([this.chunkedWord, param]);
      this.chunkedWord = undefined;
    }
    if (param.length === 0) return;

    if (toBuffer === false) {
      // Is this NOT a trailing param?
      if (this.isTrailing === false) {
        // Has an IRCv3 message-tag been stored?
        if (this.words.length === 0) {
          // Is this NOT a message-tag (starts with '@')
          if (param[0] !== 64) {
            this.words.push(Buffer.from([])); // Store empty message-tag
          } else {
            this.words.push(param.slice(1)); // Remove leading '@'
            return;
          }
        }
        // Has an IRC prefix been stored?
        if (this.words.length === 1) {
          // Is this NOT a prefix (starts with ':')
          if (param[0] !== 58) {
            this.words.push(Buffer.from([])); // Store empty prefix
          } else {
            this.words.push(param.slice(1)); // Remove leading ':'
            return;
          }
        }
        // This should either be a command or middle parameter
        this.words.push(param);
      } else {
        // Remove leading ':' from trailing parameter
        this.words.push(param.slice(1));
      }
    } else {
      this.chunkedWord = param;
    }
  }
}

export default IRCParser;
