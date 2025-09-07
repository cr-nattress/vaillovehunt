export interface OrgEvent {
  key: string
  orgSlug: string
  orgName: string
  eventName: string
  startAt?: string
  endAt?: string
  data?: any
}

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function fetchTodaysEvents(baseUrl: string = ''): Promise<OrgEvent[]> {
  // Compute today in local browser time
  const todayStr = formatDateYYYYMMDD(new Date())
  const prefix = `events/${todayStr}/`
  const url = `${baseUrl}/.netlify/functions/kv-list?prefix=${encodeURIComponent(prefix)}&includeValues=true`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!res.ok) {
    console.warn('Failed to fetch events list', res.status)
    return []
  }

  const json = await res.json()
  const data = json?.data || {}
  const events: OrgEvent[] = Object.keys(data).map((key: string) => {
    const value = data[key] || {}
    // Expect key like events/YYYY-MM-DD/{orgSlug}.json
    const parts = key.split('/')
    const file = parts[parts.length - 1]
    const orgSlug = file.replace(/\.json$/i, '')
    return {
      key,
      orgSlug,
      orgName: value.orgName || orgSlug,
      eventName: value.eventName || todayStr,
      startAt: value.startAt,
      endAt: value.endAt,
      data: value,
    }
  })

  return events.sort((a, b) => a.orgName.localeCompare(b.orgName))
}
