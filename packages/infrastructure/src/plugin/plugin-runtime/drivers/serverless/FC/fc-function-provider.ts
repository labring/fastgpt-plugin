import type {
  FCFunctionDefinition,
  FCFunctionEnsureResult,
  FCFunctionInvokeInput,
  FCFunctionInvokeResult,
  FCFunctionProvider,
  FCFunctionRecord
} from './types';

export class InMemoryFCFunctionProvider implements FCFunctionProvider {
  private readonly functions = new Map<string, FCFunctionRecord>();

  async getFunction(functionName: string): Promise<FCFunctionRecord | null> {
    return this.functions.get(functionName) ?? null;
  }

  async ensureFunction(definition: FCFunctionDefinition): Promise<FCFunctionEnsureResult> {
    const previous = this.functions.get(definition.functionName);
    const next: FCFunctionRecord = {
      ...definition,
      updatedAt: Date.now(),
      state: 'active'
    };

    this.functions.set(definition.functionName, next);

    return {
      state: previous
        ? isSameFunction(previous, definition)
          ? 'unchanged'
          : 'updated'
        : 'created',
      function: next
    };
  }

  async deleteFunction(functionName: string): Promise<void> {
    this.functions.delete(functionName);
  }

  async invoke<P = unknown, R = unknown>(
    _input: FCFunctionInvokeInput<P>
  ): Promise<FCFunctionInvokeResult<R>> {
    throw new Error('InMemoryFCFunctionProvider does not execute functions');
  }
}

function isSameFunction(previous: FCFunctionRecord, next: FCFunctionDefinition): boolean {
  return (
    previous.image === next.image &&
    previous.roleArn === next.roleArn &&
    JSON.stringify(previous.entrypoint) === JSON.stringify(next.entrypoint) &&
    JSON.stringify(previous.command) === JSON.stringify(next.command) &&
    previous.artifact.bucket === next.artifact.bucket &&
    previous.artifact.key === next.artifact.key &&
    JSON.stringify(previous.config) === JSON.stringify(next.config) &&
    JSON.stringify(previous.env) === JSON.stringify(next.env)
  );
}
