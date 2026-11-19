export type IssueInternalPluginInvokeTokenInput = {
  tenantId: string;
  pluginId: string;
  invocationId: string;
  invokeToken: string;
};

export interface InternalPluginInvokeTokenIssuerPort {
  issue(input: IssueInternalPluginInvokeTokenInput, now?: number): string;
}
