interface HttpResult<T> {
  code: number;
  msg: string;
  data?: T | null;
}
