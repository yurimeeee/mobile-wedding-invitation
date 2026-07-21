"use client"

import { useState, useEffect } from "react"
import { Upload, ImageIcon, Flower2, Heart } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AdminTemplate } from "@/lib/admin-data"

interface TemplateBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: AdminTemplate | null
}

const categories = ["모던", "클래식", "플로럴", "미니멀", "전통"]
const fonts = [
  { value: "Noto Serif KR", label: "노토 세리프 (명조체)" },
  { value: "Geist", label: "게이스트 (고딕체)" },
]
const bgColors = ["#faf3f3", "#f5ede4", "#ffffff", "#fdf0f0", "#f3ede0", "#1a1a1a", "#fdfbf7"]

export function TemplateBuilder({ open, onOpenChange, template }: TemplateBuilderProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("모던")
  const [active, setActive] = useState(true)
  const [bgColor, setBgColor] = useState("#faf3f3")
  const [font, setFont] = useState("Noto Serif KR")
  const [layout, setLayout] = useState<"카드형" | "스크롤형">("스크롤형")

  useEffect(() => {
    if (template) {
      setTitle(template.name)
      setCategory(template.category)
      setActive(template.status === "활성")
      setBgColor(template.bgColor)
      setFont(template.fontFamily)
      setLayout(template.layout)
    } else {
      setTitle("")
      setCategory("모던")
      setActive(true)
      setBgColor("#faf3f3")
      setFont("Noto Serif KR")
      setLayout("스크롤형")
    }
  }, [template, open])

  const isDark = bgColor === "#1a1a1a"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-3xl" side="right">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{template ? "템플릿 편집" : "새 템플릿 만들기"}</SheetTitle>
          <SheetDescription>
            설정을 변경하면 오른쪽 미리보기에 실시간으로 반영됩니다.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[1fr_320px]">
          {/* Left: Config panel */}
          <ScrollArea className="h-[calc(100vh-8.5rem)]">
            <div className="flex flex-col gap-6 p-6">
              {/* Meta */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tpl-title">템플릿 이름</Label>
                  <Input
                    id="tpl-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 파스텔 가든 N01"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>카테고리</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex flex-col">
                    <Label>활성 상태</Label>
                    <span className="text-xs text-muted-foreground">
                      사용자에게 템플릿을 노출합니다
                    </span>
                  </div>
                  <Switch checked={active} onCheckedChange={setActive} />
                </div>
              </div>

              {/* Styling */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground">스타일 옵션</h3>
                <div className="flex flex-col gap-2">
                  <Label>배경 색상</Label>
                  <div className="flex flex-wrap gap-2">
                    {bgColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBgColor(color)}
                        className={`size-9 rounded-full border-2 transition-all ${
                          bgColor === color ? "border-accent ring-2 ring-accent/30" : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`배경색 ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>기본 폰트</Label>
                  <Select value={font} onValueChange={setFont}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>레이아웃 스타일</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["카드형", "스크롤형"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLayout(l)}
                        className={`rounded-lg border p-3 text-sm transition-all ${
                          layout === l
                            ? "border-accent bg-accent/10 font-medium"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Asset uploaders */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground">기본 에셋</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-accent hover:text-accent-foreground"
                  >
                    <ImageIcon className="size-6" />
                    <span className="text-xs">커버 이미지</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-accent hover:text-accent-foreground"
                  >
                    <Flower2 className="size-6" />
                    <span className="text-xs">플라워 일러스트</span>
                  </button>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Right: Live mobile preview */}
          <div className="hidden items-center justify-center border-l border-border bg-muted/40 p-6 md:flex">
            <div className="phone-frame w-[240px]">
              <div className="phone-screen">
                <div
                  className="flex aspect-[9/19] flex-col items-center justify-center gap-4 px-6 text-center"
                  style={{ backgroundColor: bgColor }}
                >
                  <Heart
                    className="size-8"
                    style={{ color: isDark ? "#e8c4c4" : "#c98b8b" }}
                    fill="currentColor"
                  />
                  <p
                    className="text-xl leading-tight"
                    style={{
                      color: isDark ? "#f5f5f5" : "#3a3a3a",
                      fontFamily: font === "Noto Serif KR" ? "var(--font-serif)" : "var(--font-sans)",
                    }}
                  >
                    김민수
                    <br />
                    &<br />
                    이지영
                  </p>
                  <div
                    className="h-px w-12"
                    style={{ backgroundColor: isDark ? "#555" : "#d4c4c4" }}
                  />
                  <p className="text-sm" style={{ color: isDark ? "#bbb" : "#7a7a7a" }}>
                    2026년 9월 20일 토요일
                    <br />
                    오후 1시
                  </p>
                  <p className="text-xs" style={{ color: isDark ? "#999" : "#999" }}>
                    더채플앳청담
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {template ? "변경사항 저장" : "템플릿 생성"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
