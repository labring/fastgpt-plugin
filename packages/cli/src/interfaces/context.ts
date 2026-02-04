/**
 * 运行时能力抽象（path、fs），便于测试注入 mock。
 * 与 Node 的 path 与 fs/promises 用法对齐。
 */
export interface APICapabilitiesContext {
  path: {
    join: (...paths: string[]) => string;
    resolve: (...paths: string[]) => string;
    dirname: (p: string) => string;
    relative: (from: string, to: string) => string;
    basename: (p: string) => string;
  };

  fs: {
    mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    readFile: (path: string, encoding?: BufferEncoding) => Promise<string>;
    writeFile: (path: string, data: string, encoding?: BufferEncoding) => Promise<void>;
    readdir: (
      path: string,
      options: { withFileTypes: true }
    ) => Promise<Array<{ name: string; isDirectory: () => boolean }>>;
  };
}
