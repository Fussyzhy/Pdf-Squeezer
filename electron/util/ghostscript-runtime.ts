import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type ElectronProcess = NodeJS.Process & { resourcesPath?: string }

function getDevelopmentCoreRoot() {
  return path.resolve(__dirname, '../../core')
}

function getPackagedCoreRoot() {
  const electronProcess = process as ElectronProcess
  return electronProcess.resourcesPath
    ? path.join(electronProcess.resourcesPath, 'core')
    : getDevelopmentCoreRoot()
}

export function getGhostscriptCoreRoot() {
  return process.env.NODE_ENV === 'development'
    ? getDevelopmentCoreRoot()
    : getPackagedCoreRoot()
}

export function getGhostscriptCommand() {
  return path.join(getGhostscriptCoreRoot(), 'bin', 'gswin64c.exe')
}

export function getGhostscriptEnv() {
  const coreRoot = getGhostscriptCoreRoot()
  const binPath = path.join(coreRoot, 'bin')
  const libraryPaths = [
    path.join(coreRoot, 'lib'),
    path.join(coreRoot, 'Resource'),
    path.join(coreRoot, 'iccprofiles'),
  ]

  return {
    ...process.env,
    GS_LIB: libraryPaths.join(path.delimiter),
    PATH: [binPath, process.env.PATH ?? ''].filter(Boolean).join(path.delimiter),
  }
}