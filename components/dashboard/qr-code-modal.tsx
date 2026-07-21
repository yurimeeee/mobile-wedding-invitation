'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeCanvas } from 'qrcode.react'
import { Download } from 'lucide-react'

interface QrCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  title: string
}

export function QrCodeModal({ open, onOpenChange, url, title }: QrCodeModalProps) {
  const downloadQrCode = () => {
    const canvas = document.getElementById('dashboard-qrcode') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'wedding-invitation-qrcode.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>청첩장 QR코드</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeCanvas id="dashboard-qrcode" value={url} size={180} level="H" />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center break-all">{title}</p>
          <Button onClick={downloadQrCode} className="mt-4 w-full">
            <Download className="h-4 w-4 mr-2" />
            이미지로 저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
