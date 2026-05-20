# Plugin Runtime Channel

Channel 是插件 runtime 和宿主之间的通信端口。业务层只依赖
`PluginRuntimeChannelPort<TSide>`，底层可以替换成 IPC、TCP、HTTP 或其他传输。

## 文件分层

- `message.ts`：底层协议消息结构，包含 request、notification、success、error、stream frame。
- `event/client.ts`：client -> host 的事件。client 是插件运行侧。
- `event/host.ts`：host -> client 的事件。host 是插件宿主侧。
- `event/common.ts`：双向通用事件，目前只有 `channel.stream`。
- `event/index.ts`：按 side 组合发送/接收类型，限制 host 和 client 只能发送各自允许的事件。
- `index.ts`：稳定 port 接口，业务代码应该依赖这个入口。

## 方向规则

`PluginRuntimeChannelPort<'host'>`：

- 可以发送 `host.request`、`host.ping`、`host.shutdown`。
- 可以接收 `client.ready`、`client.stdio`、`client.fail`、`client.request`。

`PluginRuntimeChannelPort<'client'>`：

- 可以发送 `client.ready`、`client.stdio`、`client.fail`、`client.request`。
- 可以接收 `host.request`、`host.ping`、`host.shutdown`。

`channel.stream` 是底层流 frame，双向可发送。业务代码优先使用 `request({ input })`、
`waitForInputStream()`、`createReply({ output })`，无需直接拼 stream frame。

## Host 侧调用插件

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

## Client 侧处理插件调用

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

## Client 反向调用 Host

插件侧需要调用宿主能力时，发送 `client.request`。

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

宿主侧注册 request handler 接收：

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

## Request 输入流

调用方可以给 request 附带输入流：

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

接收方在 handler 中读取：

```ts
const input = await request.waitForInputStream({ timeoutMs: 5_000 });

for await (const chunk of input.stream.values()) {
  await writeChunk(chunk);
}
```

## 新增传输实现

新增 TCP 或 HTTP channel 时，实现 `PluginRuntimeChannelPort<TSide>` 即可。adapter 需要负责：

1. 发送和接收 `message.ts` 定义的协议消息。
2. 维护 pending request，并把 success/error 关联回 request id。
3. 将 `channel.stream` frame 转换成 `PluginChannelIncomingStream`。
4. 在 `close()` 时拒绝 pending request 和未完成的 stream。
