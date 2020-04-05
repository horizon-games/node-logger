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
  createEntry(defaultPath?: string): LogEntry
  write(level: string, message: string, path: string | null, ...fields: object[])
  log(level: string, message: string, ...fields: object[])
  debug(message: string, ...fields: object[])
  info(message: string, ...fields: object[])
  warn(message: string, ...fields: object[])
  error(message: string, ...fields: object[])
  critical(message: string, ...fields: object[])
}

export interface LogEntry {
  defaultPath: string | null
  fields: object
  set(k: string, v: any, defaultPath?: boolean)
  get(k: string, defaultPath?: boolean): any
  log(level: string, message: string, ...fields: object[])
  debug(message: string, ...fields: object[])
  info(message: string, ...fields: object[])
  warn(message: string, ...fields: object[])
  error(message: string, ...fields: object[])
  critical(message: string, ...fields: object[])
}

const defaultFieldsPath = 'context'

class logger implements Logger {
  constructor(public config: Config, public backend: winston.Logger) {}

  createEntry(defaultPath?: string): LogEntry {
    if (defaultPath === undefined) {
      defaultPath = defaultFieldsPath
    }
    // * null path means default value
    // * '' (empty) path means root
    // * 'something' path means a /something path
    return createLogEntry(this, defaultPath)
  }

  write(level: string, message: string, path: string | null, ...fields: object[]) {
    let meta = null
    let err: Error = null
    if (fields && fields.length > 0) {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        if (field && (field instanceof Error || (field as any).stack)) {
          if (level !== 'warn' && level != 'error' && level !== 'critical') {
            level = 'error'
          }
          err = field as Error
        } else {
          meta = { ...meta, ...field }
        }
      }
      if (path !== null && path !== '') {
        meta = { [path]: { ...meta } }
      }
    }
    if (err !== null) {
      meta['stacktrace'] = err.stack
      meta['panic'] = err.message
    }
    this.backend.log(level, message, meta)
  }

  log(level: string, message: string, ...fields: object[]) {
    this.write(level, message, defaultFieldsPath, ...fields)
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

const createLogEntry = (logger: Logger, defaultPath: string | null): LogEntry => {
  return {
    defaultPath: defaultPath,
    fields: {},
    set: function(k: string, v: any, defaultPath?: boolean) {
      if (defaultPath !== false) {
        if (!this.fields[this.defaultPath]) {
          this.fields[this.defaultPath] = {}
        }
        this.fields[this.defaultPath][k] = v
      } else {
        this.fields[k] = v
      }
    },
    
    get: function(k: string, defaultPath?: boolean): any {
      if (defaultPath !== false) {
        return this.fields[this.defaultPath][k]
      } else {
        return this.fields[k]
      }
    },
    log: function(level: string, message: string, ...fields: object[]) {
      if (fields && fields.length > 0) {
        logger.write(level, message, '', ...[ this.fields, ...fields ])
      } else {
        logger.write(level, message, '', this.fields)
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
