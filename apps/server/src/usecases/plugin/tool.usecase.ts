import { ToolRepo } from '@/repo/tool.repo';

export class ToolUseCase {
  private readonly ToolRepo: ToolRepo;

  constructor(deps: { ToolRepo: ToolRepo }) {
    this.ToolRepo = deps.ToolRepo;
  }

  async listAllTools() {
    return this.ToolRepo.getAllTools();
  }

  async runTool() {}
}
