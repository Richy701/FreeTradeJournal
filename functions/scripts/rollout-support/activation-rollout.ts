export interface RolloutActions {
  closeGate(): Promise<void>
  drainGate(): Promise<void>
  publishTemplates(): Promise<void>
  disable(): Promise<void>
  replaceGraph(): Promise<void>
  enable(): Promise<void>
  verify(): Promise<void>
  restore(): Promise<void>
  openGate(): Promise<void>
}

// No automatic retries on writes. A failed restore leaves signup enrollment
// paused, so new users use the scheduled fallbacks until an operator repairs it.
export async function runActivationRollout(actions: RolloutActions): Promise<void> {
  await actions.closeGate()
  let writesStarted = false
  try {
    await actions.drainGate()
    writesStarted = true
    await actions.publishTemplates()
    await actions.disable()
    await actions.replaceGraph()
    await actions.enable()
    await actions.verify()
  } catch (error) {
    if (writesStarted) {
      try { await actions.restore() } catch {
        throw new Error('Rollout and restore failed. Enrollment gate remains paused; inspect the saved backup before recovery.', { cause: error })
      }
    }
    await actions.openGate()
    throw error
  }
  await actions.openGate()
}
