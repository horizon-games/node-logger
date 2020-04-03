import * as winston from 'winston'

export interface Config {
  service: string
  level?: string
  json?: boolean
  concise?: boolean
  tags?: object
}

export interface Logger {
  config: Config
  backend: winston.Logger
  createEntry(fields?: object): LogEntry
  log(level: string, message: string, meta?: object)
  debug(message: string, meta?: object)
  info(message: string, meta?: object)
  warn(message: string, meta?: object)
  error(message: string, meta?: object)
  critical(message: string, meta?: object)
}

export interface LogEntry {
  fields: object
  set(k: string, v: object)
  get(k: string)
  log(level: string, message: string, meta?: object)
  debug(message: string, meta?: object)
  info(message: string, meta?: object)
  warn(message: string, meta?: object)
  error(message: string, meta?: object)
  critical(message: string, meta?: object)
}

class logger implements Logger {
  constructor(public config: Config, public backend: winston.Logger) {}

  createEntry(fields?: object): LogEntry {
    return createLogEntry(this, fields)
  }

  log(level: string, message: string, meta?: object) {
    this.backend.log(level, message, meta)
  }

  debug(message: string, meta?: object) {
    this.backend.debug(message, meta)
  }
  
  info(message: string, meta?: object) {
    this.backend.info(message, meta)
  }
  
  warn(message: string, meta?: object) {
    this.backend.warn(message, meta)
  }
  
  error(message: string, meta?: object) {
    this.backend.error(message, meta)
  }
  
  critical(message: string, meta?: object) {
    this.backend.log('critical', message, meta)
  }
}

export const createLogger = (config: Config): Logger => {
  if (config.service === '') {
    throw Error('config error! service cannot be empty')
  }

  let meta = { service: config.service }
  if (config.concise !== true && config.tags) {
    meta = { ...config.tags, ...meta }
  }

  const backend = winston.createLogger({
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
    backend.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.json()
      )
    }))
  } else {
    backend.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: { 'critical': 'red' } }),
        winston.format.simple()
      )
    }))
  }

  return new logger(config, backend)
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
    log: function(level: string, message: string, meta?: object) {
      // if (logger.config.concise !== true) {
      //   this.fields['severity'] = level
      // }
      if (meta !== undefined) {
        logger.log(level, message, { ...this.fields, ...meta })
      } else {
        logger.log(level, message, this.fields)
      }
    },
    debug: function(message: string, meta?: object) {
      this.log('debug', message, meta)
    },
    info: function(message: string, meta?: object) {
      this.log('info', message, meta)
    },
    warn: function(message: string, meta?: object) {
      this.log('warn', message, meta)
    },
    error: function(message: string, meta?: object) {
      this.log('error', message, meta)
    },
    critical: function(message: string, meta?: object) {
      this.log('critical', message, meta)
    }
  }
}
