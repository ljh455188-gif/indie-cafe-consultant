import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from './prompt.js'

const app = express()
app.use(express.json())

app.post('/api/report', async (req, res) => {
  const { intake, discoveryResult, moatResult, neighborhood } = req.body

  if (!intake || !discoveryResult || !moatResult || !neighborhood) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const client = new Anthropic()
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: buildPrompt(intake, discoveryResult, moatResult, neighborhood) }],
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate report' })}\n\n`)
  } finally {
    res.end()
  }
})

const PORT = 3001
app.listen(PORT, () => console.log(`API server running on :${PORT}`))
