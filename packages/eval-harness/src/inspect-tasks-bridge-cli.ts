import { runHeldOutJudgeRegression } from './inspect-tasks-bridge'
import 'dotenv/config'

const result = runHeldOutJudgeRegression({ model: process.env.INSPECT_MODEL })
console.log(JSON.stringify(result, null, 2))
process.exit(result.accuracy !== null && result.accuracy >= 0.5 ? 0 : 1)
