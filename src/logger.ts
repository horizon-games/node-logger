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
  write(level: string, message: string, rootFields: object[], pathFields: object[], path: string | null)
  log(level: string, message: string, ...fields: object[])
  debug(message: string, ...fields: object[])
  info(message: string, ...fields: object[])
  warn(message: string, ...fields: object[])
  error(message: string, ...fields: object[])
  critical(message: string, ...fields: object[])
}

export interface LogEntry {
  path: string | null
  rootFields: object
  pathFields: object
  set(k: string, v: any, rootField?: boolean)
  get(k: string, rootField?: boolean): any
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
    // * null path means default value
    // * '' (empty) path means root
    // * 'something' path means a /something path
    if (defaultPath === undefined) {
      defaultPath = defaultFieldsPath
    }
    return createLogEntry(this, defaultPath)
  }

  write(level: string, message: string, rootFields: object, pathFields: object[], path: string | null) {
    let meta = rootFields, pathMeta = {}
    let err: Error = null

    for (let i = 0; i < pathFields.length; i++) {
      const field = pathFields[i]
      if (field && (field instanceof Error || (field as any).stack)) {
        if (level !== 'warn' && level != 'error' && level !== 'critical') {
          level = 'error'
        }
        err = field as Error
      } else {
        pathMeta = { ...pathMeta, ...field }
      }
    }
    if (path !== null && path !== '') {
      meta[path] = pathMeta
    } else {
      meta = { ...pathMeta, ...meta }
    }
    if (err !== null) {
      meta['stacktrace'] = err.stack
      meta['panic'] = err.message
    }

    this.backend.log(level, message, meta)
  }

  log(level: string, message: string, ...fields: object[]) {
    this.write(level, message, {}, fields, defaultFieldsPath)
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

const createLogEntry = (logger: Logger, path: string | null): LogEntry => {
  return {
    path: path,
    rootFields: {},
    pathFields: {},

    set: function(k: string, v: any, rootField?: boolean) {
      if (rootField === true) {
        this.rootFields[k] = v        
      } else {
        this.pathFields[k] = v
      }
    },
    
    get: function(k: string, rootField?: boolean): any {
      if (rootField === true) {
        return this.rootFields[k]
      } else {
        return this.pathFields[k]
      }
    },

    log: function(level: string, message: string, ...fields: object[]) {
      let pathFields: object[] = []
      for (let k in this.pathFields) {
        let v = this.pathFields[k]
        pathFields.push({ [k]: v })
      }
      pathFields = [ ...pathFields, ...fields ]

      logger.write(level, message, this.rootFields, pathFields, this.path)
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
