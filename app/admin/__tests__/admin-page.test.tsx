/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPage from '../page'

describe('Admin Dashboard Page', () => {
  it('renders page with "管理中心" title', () => {
    render(<AdminPage />)
    expect(screen.getByText('管理中心')).toBeInTheDocument()
  })

  it('displays three feature cards', () => {
    render(<AdminPage />)
    expect(screen.getByText('封面图生成')).toBeInTheDocument()
    expect(screen.getByText('自动标签')).toBeInTheDocument()
    expect(screen.getByText('写作助手')).toBeInTheDocument()
  })

  it('cards link to correct pages', () => {
    render(<AdminPage />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/admin/cover')
    expect(hrefs).toContain('/admin/tags')
    expect(hrefs).toContain('/admin/writing')
  })
})
