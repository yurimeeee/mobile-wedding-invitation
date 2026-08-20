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
  if (id === 'lovely-blush') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-start pt-4" style={{ background: 'linear-gradient(180deg,#F5E3E4,#FBF7F3)' }}>
        <div className="relative w-20 h-24 rounded-2xl overflow-hidden mb-3" style={{ background: '#EACBCE', border: '3px solid white', boxShadow: '0 4px 10px rgba(140,81,88,0.2)' }}>
          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full opacity-70" style={{ background: '#F0E0E1' }} />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full opacity-70" style={{ background: '#EFD9D6' }} />
        </div>
        <div className="w-16 h-2 rounded mb-1.5" style={{ background: '#8C5158', opacity: 0.6 }} />
        <div className="w-12 h-1.5 rounded" style={{ background: '#4A3F3F', opacity: 0.3 }} />
      </div>
    )
  }
  if (id === 'vintage-forest') {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#3D3830' }}>
        <div
          className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
        />
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5">
          <div className="w-16 h-1 rounded" style={{ background: 'rgba(255,255,255,0.5)' }} />
          <div className="w-20 h-2.5 rounded" style={{ background: 'rgba(255,255,255,0.9)' }} />
          <div className="w-12 h-1.5 rounded" style={{ background: 'rgba(255,255,255,0.6)' }} />
        </div>
      </div>
    )
  }
  return null
}
