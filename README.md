# MSN Chat (Protocol)

This article describes the processes designed for MSN Chat.

## Channel Server

There are two types of MSN Chat servers, one is the directory server, and the other is an IRCX-like channel server. The directory server's primary job is to locate which channel server a particular channel or user is on. It is also used for channel creation.

### AUTH Command

The auth command is well defined in the latest version of the IRCX draft

## Directory Server

The directory server is used to create channels, and to locate channels and users.

## MSN Chat specific

### SASL Authentication

MSN Chat supports two SASL authentication packages, which can be used as specified in IRCX-Draft-04:

- NTLM
- GateKeeper.

#### NTLM

NTLM authentication was used on MSN Chat to verify a user by a username and password. NTLM was believed to have been implemented to enable Microsoft Active Directory users to be authenticated without sending passwords over an un-encrypted connection.

#### GateKeeper

GateKeeper was the mostly widely used authentication package on MSN Chat, and was the only official authentication method of all publically released MSN Chat clients.

There are 3 versions of GateKeeper:
* Version 1: Challenge-response based authentication to prevent replay attacks and restrict access to official clients only on MSN Chat
* Version 2: GUID added to make users identifiable by a semi-persistant identifier, which is stored in the Windows registry
* Version 3: Server hostname added to hash to help prevent relay attacks

All three versions are no longer considered secure. As GateKeeper only provides access control, there are no security concerns.

```
Client: AUTH GateKeeper I :GKSSP\0<unknown><version><sequence>
SERVER: AUTH GateKeeper S :GKSSP\0<unknown><version><sequence><challenge>
CLIENT: AUTH GateKeeper S :GKSSP\0<unknown><version><sequence><hash><guid>
SERVER: AUTH Gatekeeper * <hexguid>@GateKeeper 0
```

- `<unknown>` Two bytes, which are still unknown - however, any two bytes may be used
- `<version>` Unsigned 32-bit number representing GateKeeper version (only 1, 2 and 3 are valid)
- `<sequence>` Unsigned 32-bit sequence counter for both directions
  - Client sends 1 for initial
  - Server sends 2 for challenge
  - Client sends 3 for hash
- `<challenge>` 8 byte nonce sent by the server
- `<hash>` Hmac-md5 hash of the challenge (and hostname in GateKeeper v2) using the key 'SRFMKSJANDRESKKC'
- `<guid>` Raw bytes of any GUID except a null GUID - Not sent in GateKeeper v1
- `<hexguid>` is a hex representation of the GUID specified by the client, or a random GUID issued by the server in GateKeeper v1

_Note: As the GUID is sent as raw bytes, the hex GUID may appear to differ in order from the GUID that is sent, depending on the endianess of the client and server._

#### Passport (package extension)

To support users using a '.net Passport' (MSN's login system), both NTLM and GateKeeper authentication packages support an addition passport parameter (named NTLMPassport and GateKeeperPassport respectively).

A client specifying a passport would provide a PassportTicket and PassportProfile token. The combined length of PassportTicket and PassportProfile could not exceed 457 bytes due to IRC's 512 byte message limit.

```
Client: AUTH GateKeeperPassport I :GKSSP\0<unknown><version><sequence>
SERVER: AUTH GateKeeperPassport S :GKSSP\0<unknown><version><sequence><challenge>
CLIENT: AUTH GateKeeperPassport S :GKSSP\0<unknown><version><sequence><hash><nullguid>
SERVER: AUTH GatekeeperPassport S :OK
CLIENT: AUTH GateKeeperPassport S :<ticketlength><ticket><passportlength><passport>
SERVER: AUTH GatekeeperPassport * <UID> 0
```

- `<nullguid>` raw bytes of a null GUID with the value of `{00000000-0000-0000-0000-000000000000}`
- `<ticket>` and `<profile>` These are encrypted cookies (MSPauth and MSPProf) that specify a user account for .net Passport
- `<ticketlength>` and `<profilelength>` An 8 byte hex representation of the length ot the `<ticket>` and `<profile>`
- `<uid>` specifies a Unique ID for logged in .net Passport account

#### Clear-text

It's also notable that while NTLM was in use in official clients such as the MSN Chat Admin Client, it was still possible for user registration to be completed using the PASS and USER command combination as specified in RFC 1459. As with NTLM, users who use a PASS/USER combination would be authenticated using Microsoft Active Directory.