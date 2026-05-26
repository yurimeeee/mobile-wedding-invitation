import { type TemplateType } from '@/lib/types';

export function TemplateThumbnail({ id }: { id: TemplateType }) {
  if (id === 'classic-elegant') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-start pt-5" style={{ background: '#FCFDF8' }}>
        <div className="w-14 h-5 mb-2 rounded" style={{ background: '#d4c9b8' }} />
        <div className="w-20 h-4 mb-4 rounded" style={{ background: '#d4c9b8' }} />
        <div className="w-20 h-28 rounded-full overflow-hidden mb-3" style={{ background: '#e8e0d8' }} />
        <div className="w-24 h-2 rounded mb-1" style={{ background: '#261C1D', opacity: 0.5 }} />
        <div className="w-16 h-1.5 rounded" style={{ background: '#261C1D', opacity: 0.2 }} />
      </div>
    )
  }
  if (id === 'modern-minimal') {
    return (
      <div className="w-full h-full flex flex-col items-start justify-start" style={{ background: '#FFFFFF' }}>
        <div className="relative w-full h-36 overflow-hidden" style={{ background: '#e8e8e8' }}>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded" style={{ background: '#ccc' }} />
        </div>
        <div className="px-3 pt-3 w-full">
          <div className="w-24 h-2 rounded mb-1.5" style={{ background: '#2D2D2D', opacity: 0.5 }} />
          <div className="w-16 h-1.5 rounded" style={{ background: '#2D2D2D', opacity: 0.2 }} />
        </div>
      </div>
    )
  }
  if (id === 'korean-traditional') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-start pt-5" style={{ background: '#F8F4EB' }}>
        <div className="w-20 h-4 mb-5 rounded" style={{ background: '#c5b89a' }} />
        <div
          className="w-24 h-28 overflow-hidden mb-3"
          style={{
            background: '#ddd6c8',
            borderTopLeftRadius: 60,
            borderTopRightRadius: 60,
          }}
        />
        <div className="w-24 h-2 rounded mb-1" style={{ background: '#261C1D', opacity: 0.5 }} />
        <div className="w-16 h-1.5 rounded" style={{ background: '#261C1D', opacity: 0.2 }} />
      </div>
    )
  }
  if (id === 'floral-romantic') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-start pt-4" style={{ background: '#F8F4EB' }}>
        <div className="w-20 h-4 mb-3 rounded" style={{ background: '#c5b89a' }} />
        <div className="relative flex justify-center w-full">
          <div className="absolute -left-2 -top-3 w-10 h-12 rounded-full opacity-60" style={{ background: '#d4bfa8' }} />
          <div className="absolute -right-2 bottom-0 w-10 h-12 rounded-full opacity-60" style={{ background: '#d4bfa8' }} />
          <div
            className="relative w-20 h-28 overflow-hidden z-10"
            style={{ background: '#ddd6c8', border: '4px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
          />
        </div>
        <div className="w-24 h-2 rounded mt-3 mb-1" style={{ background: '#261C1D', opacity: 0.5 }} />
        <div className="w-16 h-1.5 rounded" style={{ background: '#261C1D', opacity: 0.2 }} />
      </div>
    )
  }
  if (id === 'dark-luxury') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-start pt-5" style={{ background: '#181818' }}>
        <div className="w-8 h-1 rounded mb-3" style={{ background: '#d4af37' }} />
        <div
          className="w-20 h-28 overflow-hidden mb-3"
          style={{ background: '#2a2a2a', border: '1px solid #d4af37' }}
        />
        <div className="w-24 h-2 rounded mb-1" style={{ background: '#F5F5F0', opacity: 0.5 }} />
        <div className="w-16 h-1.5 rounded" style={{ background: '#d4af37', opacity: 0.4 }} />
      </div>
    )
  }
  return null
}
