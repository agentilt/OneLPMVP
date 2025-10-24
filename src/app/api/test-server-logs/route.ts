import { NextRequest, NextResponse } from 'next/server'

// Store logs in memory
let serverLogs: string[] = []

export function addLog(log: string) {
  serverLogs.push(`${new Date().toISOString()} - ${log}`)
  if (serverLogs.length > 100) {
    serverLogs.shift() // Keep only last 100 logs
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'OK',
    logs: serverLogs,
    logsCount: serverLogs.length
  })
}

export async function DELETE(request: NextRequest) {
  serverLogs = []
  return NextResponse.json({
    status: 'OK',
    message: 'Logs cleared'
  })
}
