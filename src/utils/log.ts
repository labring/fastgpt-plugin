import chalk from 'chalk';
import { format } from 'date-fns';

chalk.level = 1; // Add this line to force color support

export enum LogLevelEnum {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3
}

export enum EventTypeEnum {
  outLinkBot = '[Outlink bot]',
  feishuBot = '[Feishu bot]',
  wxOffiaccount = '[Offiaccount bot]'
}

const logMap = {
  [LogLevelEnum.debug]: {
    levelLog: chalk.bgGreen('[Debug]')
  },
  [LogLevelEnum.info]: {
    levelLog: chalk.bgBlue('[Info]')
  },
  [LogLevelEnum.warn]: {
    levelLog: chalk.bgYellow('[Warn]')
  },
  [LogLevelEnum.error]: {
    levelLog: chalk.bgRed('[Error]')
  }
};
const envLogLevelMap: Record<string, number> = {
  debug: LogLevelEnum.debug,
  info: LogLevelEnum.info,
  warn: LogLevelEnum.warn,
  error: LogLevelEnum.error
};

const LOG_LEVEL = (() => {
  const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLocaleLowerCase();
  return envLogLevelMap[LOG_LEVEL] ?? LogLevelEnum.info;
})();

/* add logger */
export const addLog = {
  log(level: LogLevelEnum, msg: string, obj: Record<string, any> = {}) {
    if (level < LOG_LEVEL) return;

    const stringifyObj = JSON.stringify(obj);
    const isEmpty = Object.keys(obj).length === 0;

    console.log(
      `${logMap[level].levelLog} ${format(Date.now(), 'yyyy-MM-dd HH:mm:ss')}: ${msg} ${
        level !== LogLevelEnum.error && !isEmpty ? stringifyObj : ''
      }`
    );

    if (level === LogLevelEnum.error) console.log(obj);
  },
  debug(msg: string, obj?: Record<string, any>) {
    this.log(LogLevelEnum.debug, msg, obj);
  },
  info(msg: string, obj?: Record<string, any>) {
    this.log(LogLevelEnum.info, msg, obj);
  },
  warn(msg: string, obj?: Record<string, any>) {
    this.log(LogLevelEnum.warn, msg, obj);
  },
  error(msg: string, error?: any) {
    this.log(LogLevelEnum.error, msg, {
      message: error?.message || error,
      stack: error?.stack,
      ...(error?.config && {
        config: {
          headers: error.config.headers,
          url: error.config.url,
          data: error.config.data
        }
      }),
      ...(error?.response && {
        response: {
          status: error.response.status,
          statusText: error.response.statusText
        }
      })
    });
  }
};
