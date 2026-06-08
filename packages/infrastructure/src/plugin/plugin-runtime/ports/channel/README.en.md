# Plugin Runtime Channel

Language: [简体中文](./README.md) | [English](./README.en.md)

Channel is the communication port between the plugin runtime and the host. Business layers depend only on `PluginRuntimeChannelPort<TSide>`, while the underlying transport can be replaced with IPC, TCP, HTTP, or another mechanism.

## File Layers

- `message.ts`: low-level protocol message structures, including request, notification, success, error, and stream frame.
- `event/client.ts`: client -> host events. The client is the plugin runtime side.
- `event/host.ts`: host -> client events. The host is the plugin host side.
- `event/common.ts`: bidirectional common events. Currently only `channel.stream`.
- `event/index.ts`: composes send/receive types by side and limits host/client to events each side is allowed to send.
- `index.ts`: stable port interface. Business code should depend on this entry.

## Direction Rules

`PluginRuntimeChannelPort<'host'>`:

- Can send `host.request`, `host.ping`, and `host.shutdown`.
- Can receive `client.ready`, `client.stdio`, `client.fail`, and `client.request`.

`PluginRuntimeChannelPort<'client'>`:

- Can send `client.ready`, `client.stdio`, `client.fail`, and `client.request`.
- Can receive `host.request`, `host.ping`, and `host.shutdown`.

`channel.stream` is the low-level stream frame and can be sent in both directions. Business code should prefer `request({ input })`, `waitForInputStream()`, and `createReply({ output })` instead of composing stream frames directly.

## Host-Side Plugin Invocation

```ts
import {
  PluginChannelHostMethod,
  type PluginRuntimeChannelPort
} from '@infrastructure/plugin/plugin-runtime/ports/channel';

async function invokeRun(channel: PluginRuntimeChannelPort<'host'>) {
  const response = await channel.request(
    PluginChannelHostMethod.request,
    {
      eventName: 'run',
      payload: { prompt: 'hello' },
      returnStream: true
    },
    { timeoutMs: 30_000, traceId: 'trace-1' }
  );

  if (response.output) {
    for await (const chunk of response.output.stream.values()) {
      console.log(chunk);
    }
  }

  return response.result;
}
```

## Client-Side Plugin Invocation Handling

```ts
import {
  PluginChannelClientMethod,
  PluginChannelHostMethod,
  type PluginRuntimeChannelPort
} from '@infrastructure/plugin/plugin-runtime/ports/channel';

function registerPlugin(channel: PluginRuntimeChannelPort<'client'>) {
  channel.setRequestHandler(async (request) => {
    if (request.method !== PluginChannelHostMethod.request) {
      throw new Error(`Unsupported method: ${String(request.method)}`);
    }

    if (request.params.eventName === 'run') {
      return channel.createReply(undefined, {
        output: streamRunResult(request.params.payload)
      });
    }

    return handleEvent(request.params.eventName, request.params.payload);
  });

  void channel.notify(PluginChannelClientMethod.ready, {
    pid: process.pid,
    startedAt: Date.now()
  });
}
```

## Client Reverse Invocation To Host

When the plugin side needs host capabilities, it sends `client.request`.

```ts
import {
  PluginChannelClientMethod,
  type PluginRuntimeChannelPort
} from '@infrastructure/plugin/plugin-runtime/ports/channel';

async function getUserInfo(channel: PluginRuntimeChannelPort<'client'>) {
  const response = await channel.request(PluginChannelClientMethod.request, {
    method: 'userInfo',
    args: {}
  });

  return response.result;
}
```

The host side registers a request handler:

```ts
import {
  PluginChannelClientMethod,
  type PluginRuntimeChannelPort
} from '@infrastructure/plugin/plugin-runtime/ports/channel';

function registerHostBridge(channel: PluginRuntimeChannelPort<'host'>) {
  channel.setRequestHandler(async (request) => {
    if (request.method !== PluginChannelClientMethod.request) {
      throw new Error(`Unsupported method: ${String(request.method)}`);
    }

    return dispatchHostMethod(request.params.method, request.params.args);
  });
}
```

## Request Input Streams

Callers can attach an input stream to a request:

```ts
await channel.request(
  PluginChannelClientMethod.request,
  {
    method: 'uploadFile',
    args: { filename: 'a.txt' }
  },
  { input: fileStream }
);
```

The receiver reads it in the handler:

```ts
const input = await request.waitForInputStream({ timeoutMs: 5_000 });

for await (const chunk of input.stream.values()) {
  await writeChunk(chunk);
}
```

## Adding A Transport Implementation

To add a TCP or HTTP channel, implement `PluginRuntimeChannelPort<TSide>`. The adapter needs to:

1. Send and receive protocol messages defined in `message.ts`.
2. Maintain pending requests and associate success/error responses with request ids.
3. Convert `channel.stream` frames into `PluginChannelIncomingStream`.
4. Reject pending requests and unfinished streams in `close()`.
