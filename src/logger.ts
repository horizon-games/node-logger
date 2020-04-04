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
  log(level: string, message: string, ...fields: object[])
  debug(message: string, ...fields: object[])
  info(message: string, ...fields: object[])
  warn(message: string, ...fields: object[])
  error(message: string, ...fields: object[])
  critical(message: string, ...fields: object[])
}

export interface LogEntry {
  fields: object
  set(k: string, v: object)
  get(k: string)
  log(level: string, message: string, ...fields: object[])
  debug(message: string, ...fields: object[])
  info(message: string, ...fields: object[])
  warn(message: string, ...fields: object[])
  error(message: string, ...fields: object[])
  critical(message: string, ...fields: object[])
}

class logger implements Logger {
  constructor(public config: Config, public backend: winston.Logger) {}

  createEntry(fields?: object): LogEntry {
    return createLogEntry(this, fields)
  }

  log(level: string, message: string, ...fields: object[]) {
    let meta = {}
    if (fields && fields.length > 0) {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        if (field && (field instanceof Error || (field as any).stack)) {
          if (level !== 'warn' && level != 'error' && level !== 'critical') {
            level = 'error'
          }
          meta = { ...meta, ...{ 
            stacktrace: (field as any).stack, panic: (field as any).message 
          } }
        } else {
          meta = { ...meta, ...field }
        }
      }
    }
    this.backend.log(level, message, meta)
  }

  debug(message: string, ...fields: object[]) {
    this.log('debug', message, ...fields)
  }
  
  info(message: string, ...fields: object[]) {
    this.log('info', message, ...fields)
  }
  
  warn(message: string, ...fields: object[]) {
    this.log('warn', message, ...fields)
  }
  
  error(message: string, ...fields: object[]) {
    this.log('error', message, ...fields)
  }
  
  critical(message: string, ...fields: object[]) {
    this.log('critical', message, ...fields)
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
    log: function(level: string, message: string, ...fields: object[]) {
      // if (logger.config.concise !== true) {
      //   this.fields['severity'] = level
      // }
      if (fields && fields.length > 0) {
        logger.log(level, message, ...[ this.fields, ...fields ])
      } else {
        logger.log(level, message, this.fields)
      }
    },
    debug: function(message: string, ...fields: object[]) {
      this.log('debug', message, ...fields)
    },
    info: function(message: string, ...fields: object[]) {
      this.log('info', message, ...fields)
    },
    warn: function(message: string, ...fields: object[]) {
      this.log('warn', message, ...fields)
    },
    error: function(message: string, ...fields: object[]) {
      this.log('error', message, ...fields)
    },
    critical: function(message: string, ...fields: object[]) {
      this.log('critical', message, ...fields)
    }
  }
}
