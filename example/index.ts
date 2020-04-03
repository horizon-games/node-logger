import * as express from 'express'
import { createLogger, requestLogger, requestRecoverer, getLogEntry } from '@horizongames/node-logger'

const logger = createLogger({
  service: 'example',
  level: 'info',
  json: true,
  // concise: true,
  tags: { 'version': 'v0.1' }
})

const app = express()
app.use(requestLogger(logger))

app.get('/', (req, res) => {
  const logEntry = getLogEntry(req)
  logEntry.info('logging some action from within the handler, yeay', { details: 123 })

  res.status(200).send('welcome')
})

app.get('/throw', (req, res) => {
  throw Error('oh no')
  
  // this will never be reached, as the `requestRecoverer` below
  // will catch the exception and log+return an error.
  res.status(200).send('hi')
})

// Must be the very last handler, wow express sucks
app.use(requestRecoverer)

app.listen(3001, () => {
  logger.info('listening on port 3001')
})
