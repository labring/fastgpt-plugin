import type { FCFunctionDefinition, FCFunctionEnsureResult, FCFunctionProvider } from './types';
import { FCRuntimeError } from './types';

export class FCFunctionRegistry {
  constructor(private readonly provider: FCFunctionProvider) {}

  async ensureFunction(definition: FCFunctionDefinition): Promise<FCFunctionEnsureResult> {
    try {
      return await this.provider.ensureFunction(definition);
    } catch (error) {
      throw new FCRuntimeError(
        'FC_FUNCTION_ENSURE_FAILED',
        `Failed to ensure FC function: ${definition.functionName}`,
        error
      );
    }
  }

  async getFunction(functionName: string) {
    try {
      return await this.provider.getFunction(functionName);
    } catch (error) {
      throw new FCRuntimeError(
        'FC_FUNCTION_NOT_FOUND',
        `Failed to get FC function: ${functionName}`,
        error
      );
    }
  }

  async deleteFunction(functionName: string): Promise<void> {
    try {
      await this.provider.deleteFunction(functionName);
    } catch (error) {
      throw new FCRuntimeError(
        'FC_FUNCTION_ENSURE_FAILED',
        `Failed to delete FC function: ${functionName}`,
        error
      );
    }
  }
}
