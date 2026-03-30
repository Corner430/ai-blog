import { NextRequest, NextResponse } from 'next/server'

const UMAMI_API_URL = process.env.UMAMI_API_URL || 'https://analytics.umami.is'
const UMAMI_API_TOKEN = process.env.UMAMI_API_TOKEN
const UMAMI_WEBSITE_ID = process.env.NEXT_UMAMI_ID

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug || !UMAMI_WEBSITE_ID || !UMAMI_API_TOKEN) {
    return NextResponse.json({ views: 0 })
  }

  try {
    const now = Date.now()
    const startAt = 0 // From the beginning of time
    const url = `/blog/${slug}/`

    const res = await fetch(
      `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${now}&type=url`,
      {
        headers: {
          Authorization: `Bearer ${UMAMI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!res.ok) {
      return NextResponse.json({ views: 0 })
    }

    const data = await res.json()
    const pageData = data.find((item: { x: string }) => item.x === url)
    const views = pageData?.y || 0

    return NextResponse.json({ views })
  } catch {
    return NextResponse.json({ views: 0 })
  }
}
