import { replaceSensitiveText } from './string';

export const getErrText = (err: any, def = ''): string => {
  const msg: string = getErrorMessage(err) || def;
  // msg && console.log('error =>', msg);
  return replaceSensitiveText(msg);
};

const getErrorMessage = (err: any, depth = 0): string | undefined => {
  if (depth > 5) return;
  if (typeof err === 'string') return err;
  if (!err || typeof err !== 'object') return;

  const resultFailureMessage = getResultFailureMessage(err, depth);
  if (resultFailureMessage) return resultFailureMessage;

  const reasonWithCauseMessage = getReasonWithCauseMessage(err, depth);
  if (reasonWithCauseMessage) return reasonWithCauseMessage;

  return getFirstString(
    getResponseBodyMessage(err?.response?.data, depth),
    getResponseBodyMessage(err?.response?.body, depth),
    getResponseBodyMessage(err?.body, depth),
    getI18nText(err?.response?.data?.error?.reason),
    getI18nText(err?.response?.error?.reason),
    getI18nText(err?.error?.reason),
    getI18nText(err?.response?.data?.reason),
    getI18nText(err?.response?.reason),
    err?.response?.data?.message ||
      err?.response?.data?.error?.message ||
      err?.response?.error?.message ||
      err?.error?.message ||
      err?.response?.message ||
      err?.message ||
      err?.response?.data?.msg ||
      err?.response?.msg ||
      err?.msg,
    getI18nText(err?.response?.data?.error),
    getI18nText(err?.response?.error),
    getI18nText(err?.error),
    getI18nText(err?.reason),
    getErrorMessage(err?.error, depth + 1),
    getErrorMessage(err?.cause, depth + 1),
    getI18nText(err)
  );
};

const getReasonWithCauseMessage = (err: any, depth: number): string | undefined => {
  if (!('reason' in err) || !('cause' in err)) return;

  const reasonText = getI18nText(err.reason);
  const causeText = getCauseMessage(err.cause, depth + 1);

  return joinErrorMessages(reasonText, causeText);
};

const getResultFailureMessage = (err: any, depth: number): string | undefined => {
  if (!('error' in err)) return;

  const reasonText = getI18nText(err.reason);
  const errorText = getErrorMessage(err.error, depth + 1);

  return joinErrorMessages(reasonText, errorText);
};

const getResponseBodyMessage = (body: unknown, depth: number): string | undefined => {
  if (!body) return;

  if (typeof body !== 'string') {
    return getErrorMessage(body, depth + 1);
  }

  try {
    const payload = JSON.parse(body);
    return getErrorMessage(payload?.error, depth + 1) || getErrorMessage(payload, depth + 1);
  } catch {
    return body || undefined;
  }
};

const getCauseMessage = (err: any, depth: number): string | undefined => {
  if (!err || typeof err !== 'object') {
    return getErrorMessage(err, depth);
  }

  const reasonText = getI18nText(err.reason);
  const nestedCauseText =
    'cause' in err ? getCauseMessage(err.cause, depth + 1) : undefined;

  return joinErrorMessages(reasonText, nestedCauseText) ?? getErrorMessage(err, depth);
};

const getI18nText = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return;

  const record = value as Record<string, unknown>;
  const text = record['zh-CN'] ?? record.en ?? record['zh-Hant'];

  return typeof text === 'string' ? text : undefined;
};

const getFirstString = (...values: unknown[]): string | undefined =>
  values.find((value): value is string => typeof value === 'string' && value.length > 0);

const joinErrorMessages = (...messages: (string | undefined)[]): string | undefined => {
  const uniqueMessages = messages
    .filter((message, index): message is string => {
      return Boolean(message) && messages.indexOf(message) === index;
    })
    .filter((message, index, values) => {
      return !values.some(
        (value, valueIndex) => valueIndex > index && value.startsWith(`${message}:`)
      );
    });

  return uniqueMessages.length > 0 ? uniqueMessages.join(': ') : undefined;
};
