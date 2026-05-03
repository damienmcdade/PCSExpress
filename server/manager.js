#!/usr/bin/env node
/**
 * Production Process Manager
 * Keeps server alive, restarts on crash
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'

const LOG = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`)

LOG('PROCESS MANAGER STARTING')

let restarts = 0
const MAX_RESTARTS = 10

const start = () => {
  LOG(`Starting server (restart #${restarts})`)
  
  const server = spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    detached: false
  })

  server.on('exit', (code, signal) => {
    LOG(`Server exited: code=${code}, signal=${signal}`)
    
    restarts++
    if (restarts > MAX_RESTARTS) {
      LOG(`TOO MANY RESTARTS (${restarts}), EXITING`)
      process.exit(1)
    }

    LOG(`Restarting in 2 seconds...`)
    setTimeout(start, 2000)
  })

  server.on('error', (err) => {
    LOG(`Server error: ${err.message}`)
  })

  // Handle parent signals
  process.on('SIGTERM', () => {
    LOG('SIGTERM received, killing server')
    server.kill('SIGTERM')
    setTimeout(() => process.exit(0), 3000)
  })

  process.on('SIGINT', () => {
    LOG('SIGINT received, killing server')
    server.kill('SIGINT')
    setTimeout(() => process.exit(0), 3000)
  })
}

// Start the server
start()
