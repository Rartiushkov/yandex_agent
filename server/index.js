import { createApp } from './src/app.js'

const port = Number(process.env.DIRECT_CONNECTOR_PORT || process.env.PORT || 8787)
const app = createApp()

app.listen(port, () => {
  console.log(`Direct connector listening on http://localhost:${port}`)
})
