'use client'

import ClickAnimation from '@/components/ClickAnimation'
import Live2DWidget from '@/components/Live2DWidget'

export default function ClientGlobalWidgets() {
  return (
    <>
      <Live2DWidget />
      <ClickAnimation />
    </>
  )
}
