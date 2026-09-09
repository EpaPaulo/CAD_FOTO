// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ImageUploader } from './ImageUploader'

afterEach(cleanup)
describe('ImageUploader', () => {
  it('provides a real keyboard-accessible upload button', () => {
    render(<ImageUploader onUpload={vi.fn()} />)
    const input = screen.getByLabelText('Choose a tool photo')
    const choose = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: 'Choose photo' }))
    expect(choose).toHaveBeenCalledOnce()
  })
  it('accepts a photo and clears the input so it can be retried', () => {
    const upload = vi.fn()
    render(<ImageUploader onUpload={upload} />)
    const file = new File(['photo'], 'tools.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Choose a tool photo'), { target: { files: [file] } })
    expect(upload).toHaveBeenCalledWith(file)
  })
  it('explains invalid files instead of silently ignoring them', () => {
    const upload = vi.fn()
    const { container } = render(<ImageUploader onUpload={upload} />)
    fireEvent.drop(container.querySelector('.capture-dropzone')!, { dataTransfer: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] } })
    expect(screen.getByRole('alert').textContent).toContain('Choose a photo')
    expect(upload).not.toHaveBeenCalled()
  })
  it('prevents another upload while busy', () => {
    const upload = vi.fn()
    const { container } = render(<ImageUploader onUpload={upload} disabled />)
    fireEvent.drop(container.querySelector('.capture-dropzone')!, { dataTransfer: { files: [new File(['photo'], 'tools.jpg', { type: 'image/jpeg' })] } })
    expect(upload).not.toHaveBeenCalled()
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
  })
})
