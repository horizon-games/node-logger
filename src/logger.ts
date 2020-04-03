import * as winston from 'winston'

export interface Config {
  service: string
  level?: string
  json?: boolean
  concise?: boolean
  tags?: object
}

export interface Logger extends winston.Logger {
  config: Config
  createEntry(fields?: object): LogEntry
  critical(message: string, ...meta: any[]): winston.Logger
}

export interface LogEntry {
  fields: object
  set(k: string, v: object)
  get(k: string)
  log(level: string, message: string)
  debug(message: string)
  info(message: string)
  warn(message: string)
  error(message: string)
  critical(message: string)
}

export const createLogger = (config: Config): Logger => {
  if (config.service === '') {
    throw Error('config error! service cannot be empty')
  }

  let meta = { service: config.service }
  if (config.concise !== true && config.tags) {
    meta = { ...config.tags, ...meta }
  }

  const logger = <Logger>winston.createLogger({
    level: config.level || 'info',
    levels: { 
      critical: 0, 
      error: 1, 
      warn: 2, 
      info: 3, 
      debug: 4
    },
    defaultMeta: meta,
    format: winston.format.combine(
      winston.format.timestamp()
    )
  })

  if (config.json === true) {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.json()
      )
    }))
  } else {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: { 'critical': 'red' } }),
        winston.format.simple()
      )
    }))
  }

  logger.config = config
  logger.createEntry = (fields: object) => createLogEntry(logger, fields)
  logger.critical = (message: string, ...meta: any[]) => {
    logger.log('critical', message, ...meta)
    return logger
  }

  return logger
}

const createLogEntry = (logger: Logger, fields: object): LogEntry => {
  return {
    fields: fields || {},
    set: function(k: string, v: object) {
      this.fields[k] = v
    },
    get: function(k: string): object {
      return this.fields[k]
    },
    log: function(level: string, message: string) {
      // if (logger.config.concise !== true) {
      //   this.fields['severity'] = level
      // }
      logger.log(level, message, this.fields)
    },
    debug: function(message: string) {
      this.log('debug', message)
    },
    info: function(message: string) {
      this.log('info', message)
    },
    warn: function(message: string) {
      this.log('warn', message)
    },
    error: function(message: string) {
      this.log('error', message)
    },
    critical: function(message: string) {
      this.log('critical', message)
    }
  }
}
