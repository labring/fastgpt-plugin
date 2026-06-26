import { describe, expect, it, vi } from 'vitest';

import { compileTypeScriptModuleSource } from './import-hooks';

describe('compileTypeScriptModuleSource', () => {
  it('在 transform 模式不可用时回退到 typescript transpile', async () => {
    const stripTypeScriptTypesFn = vi.fn(() => {
      throw new Error("The property 'options.mode' must be one of: 'strip'. Received 'transform'");
    });
    const transpileModule = vi.fn(() => ({
      outputText: 'export const answer = 42;\n',
      diagnostics: []
    }));
    const compiler = {
      transpileModule,
      ModuleKind: { ESNext: 99 },
      ScriptTarget: { ES2022: 9 },
      ModuleResolutionKind: { Bundler: 100 },
      JsxEmit: { ReactJSX: 4 },
      DiagnosticCategory: { Error: 1 },
      flattenDiagnosticMessageText: vi.fn()
    } as any;

    const output = compileTypeScriptModuleSource('export const answer: number = 42;', {
      filePath: '/tmp/plugin/index.ts',
      stripTypeScriptTypesFn,
      typeScriptCompiler: compiler
    });

    expect(output).toBe('export const answer = 42;\n');
    expect(stripTypeScriptTypesFn).toHaveBeenCalledTimes(1);
    expect(transpileModule).toHaveBeenCalledTimes(1);
  });

  it('在 transform 模式可用时优先走 Node 内建转换', () => {
    const stripTypeScriptTypesFn = vi
      .fn()
      .mockReturnValueOnce('const __fastgptPluginTransformProbe__ = 1;\n')
      .mockReturnValueOnce('export const answer = 42;\n');
    const transpileModule = vi.fn();
    const compiler = {
      transpileModule,
      ModuleKind: { ESNext: 99 },
      ScriptTarget: { ES2022: 9 },
      ModuleResolutionKind: { Bundler: 100 },
      JsxEmit: { ReactJSX: 4 },
      DiagnosticCategory: { Error: 1 },
      flattenDiagnosticMessageText: vi.fn()
    } as any;

    const output = compileTypeScriptModuleSource('export const answer: number = 42;', {
      filePath: '/tmp/plugin/index.ts',
      stripTypeScriptTypesFn,
      typeScriptCompiler: compiler
    });

    expect(output).toBe('export const answer = 42;\n');
    expect(stripTypeScriptTypesFn).toHaveBeenCalledTimes(2);
    expect(transpileModule).not.toHaveBeenCalled();
  });
});
