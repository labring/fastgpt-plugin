import { fork } from 'child_process';
import { resolve } from 'path';

import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';

const pluginPath = resolve(process.cwd(), 'index.js');

const p = fork(pluginPath, [], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  // execArgv: [],
  env: {
    RUNTIME_MODE: PluginRuntimeModeEnum.localPool
  }
});

console.log(p);
p.on('message', (msg) => {
  console.log(msg);
});

// this.channel = createChildProcessIpcChannel(this.process, {
//   defaultTimeoutMs: this.options.podTimeout
// });
// this.channel.onError((error) => this.handleError(error));
// this.channel.setRequestHandler((message) => this.handleClientRequest(message));

// // 等待 ready 信号（pod 生命周期，不走 router）
// let settled = false;
// const settle = (fn: () => void) => {
//   if (settled) return;
//   settled = true;
//   clearTimeout(readyTimeout);
//   unsubReady();
//   fn();
// };

// const readyTimeout = setTimeout(() => {
//   settle(() => {
//     reject(new Error('Pod startup timeout'));
//     this.kill();
//   });
// }, 10_000);

// const unsubReady = this.channel.onReady((msg) => {
//   if (msg.messageType === 'ready') {
//     settle(() => {
//       this.status = 'idle';
//       this.options.callbacks?.onReady?.(this.getInfo());
//       resolve();
//     });
//   }
// });

// this.process.on('error', (err) => this.handleError(err));
// this.process.on('exit', (code, signal) => {
//   // 若 ready 尚未收到，立即 reject（不等 10 秒超时）
//   settle(() => {
//     reject(new Error(`Pod process exited before ready: code=${code}, signal=${signal}`));
//   });
//   this.handleExit(code, signal);
// });

// // 转发 stdout / stderr 输出（逐行）
// if (this.process.stdout) {
//   createInterface({ input: this.process.stdout, crlfDelay: Infinity }).on('line', (line) => {
//     this.options.callbacks?.onStdout?.(line);
//   });
// }
// if (this.process.stderr) {
//   createInterface({ input: this.process.stderr, crlfDelay: Infinity }).on('line', (line) => {
//     this.options.callbacks?.onStderr?.(line);
//   });
// }
