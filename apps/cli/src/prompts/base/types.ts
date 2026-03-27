export interface IPrompt<I, O> {
  run(input: I): Promise<O>;
}
