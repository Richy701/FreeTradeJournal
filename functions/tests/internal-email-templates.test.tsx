import { describe, expect, it } from 'vitest'
import { render } from '@react-email/components'
import { FounderPulseEmail } from '../src/emails/FounderPulseEmail'
import { InternalNotificationEmail } from '../src/emails/InternalNotificationEmail'
import { ActivationReportEmail } from '../src/emails/ActivationReportEmail'

describe('internal report rendering', () => {
  it('keeps an empty pulse honest about missing activity and measurement', async () => {
    const html = await render(<FounderPulseEmail weekLabel="" peakOnline={0} peakOnlineWhen="" peakOnlineCountries={0} activeUsers={0} activeUsersDeltaPct={null} signups={0} signupsDeltaPct={null} totalAccounts={0} countriesCount={0} countriesPrev={0} topCountries={[]} busiestDay={null} busiestHour={null} topPages={[]} />)
    expect(html).toContain('No activity recorded')
    expect(html).toContain('not a simultaneous online count')
    expect(html).not.toContain('14:00')
    expect(html).not.toContain('Mondays')
  })
  it('does not turn an immature activation cohort into a zero rate', async () => {
    const html = await render(<ActivationReportEmail asOf="2026-09-14" excluded={0} cohorts={[{ week: '2026-09-14', signups: 1, activated: 0, mature: false, rate: null }]} />)
    expect(html).toContain('Waiting')
    const visibleText = new DOMParser().parseFromString(html, 'text/html').body.textContent
    expect(visibleText).not.toContain('0%')
  })
  it('escapes submitted content and preserves the attachment status', async () => {
    const html = await render(<InternalNotificationEmail title="Feedback" sender="<script>" message="<img src=x>" details={[]} diagnostics={{ browser: '<script>alert(1)</script>' }} nextStep="Reply to respond." attachmentStatus="Screenshot omitted: size limit." />)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x>')
    expect(html).toContain('&lt;img')
    expect(html).toContain('Screenshot omitted: size limit.')
    expect(html).not.toContain('Screenshot attached.')
  })
})
