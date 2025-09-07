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
  // Return mock scavenger hunts occurring today
  const mockEvents: OrgEvent[] = [
    {
      key: 'events/bhhs-vail',
      orgSlug: 'bhhs',
      orgName: 'BHHS',
      eventName: 'Vail',
      startAt: formatDateYYYYMMDD(new Date()),
      endAt: formatDateYYYYMMDD(new Date()),
      data: { description: 'BHHS Vail Scavenger Hunt' }
    },
    {
      key: 'events/beaver-creek-sports-nottingham',
      orgSlug: 'beaver-creek-sports',
      orgName: 'Beaver Creek Sports',
      eventName: 'Nottingham Hunt',
      startAt: formatDateYYYYMMDD(new Date()),
      endAt: formatDateYYYYMMDD(new Date()),
      data: { description: 'Beaver Creek Sports Nottingham Hunt' }
    },
    {
      key: 'events/ra-nelson-find-the-goat',
      orgSlug: 'ra-nelson',
      orgName: 'RA Nelson',
      eventName: 'Find the goat',
      startAt: formatDateYYYYMMDD(new Date()),
      endAt: formatDateYYYYMMDD(new Date()),
      data: { description: 'RA Nelson Find the goat Hunt' }
    }
  ]

  // Simulate async behavior
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return mockEvents.sort((a, b) => a.orgName.localeCompare(b.orgName))
}
