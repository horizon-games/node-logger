node-logger
===========

An application logger for node with structured logging support, traceable log entries,
and built-in express.js requestLogger and exception recovery middlewares.

## Install

`npm install @horizongames/node-logger`


## Usage

For a combined example, see the [_example](./_example/index.ts) project.

**Logger:**

```ts
import { createLogger } from '@horizongames/node-logger'

// Setup a new logger passing a custom config (see logger.ts Config type for info)
const logger = createLogger({
  service: 'my-service',
  level: 'info',
  json: true,
  concise: false,
  tags: { 'version': 'v1.0.0' }
})

// Just a simple info log to record
logger.info('hi there')

// Log entry example to build a log payload with multiple log prints.
// Very useful in a structured logging situation with a central logger.
const entry = logger.createEntry()
entry.set('userID', 123)
entry.set('user', 'peterk')
entry.set('action', { purchase: { book: 'Sams Teach Yourself C in 21 Days' } })
entry.info('user made a purchase, yeay')

entry.set('sent', new Date())
entry.info('weve shipped the book')
```

**Request Logger for express:**
```ts
const logger = createLogger({ service: 'example' })

const app = express()
app.use(requestLogger(logger))
app.get('/', (req, res) => {
  res.status(200).send('welcome')
})

app.listen(3001, () => {
  logger.info('listening on port 3001')
})
```

**Request Recoverer + Logger for express (to catch/log exceptions):**

```ts
const logger = createLogger({ service: 'example' })

const app = express()
app.use(requestLogger(logger))
app.get('/', (req, res) => {
  res.status(200).send('welcome')
})

// the recoverer must be at the very end otherwise "express" will not
// catch the exception and handle this request properly. Super lame.
app.use(requestRecoverer)

app.listen(3001, () => {
  logger.info('listening on port 3001')
})
```

## License

MIT
