'use client';

import { type WeddingInfo, type CalendarSettings } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { User, Calendar, MapPin, Phone, CreditCard, Users, Flower } from 'lucide-react';
import { AddressSearch } from '@/components/editor/kakao-map';
import { DatePicker, TimePicker } from '@/components/editor/date-time-picker';

interface WeddingInfoFormProps {
  info: WeddingInfo;
  onChange: (updates: Partial<WeddingInfo>) => void;
  calendarSettings: CalendarSettings;
  onCalendarChange: (updates: Partial<CalendarSettings>) => void;
}

export function WeddingInfoForm({ info, onChange, calendarSettings, onCalendarChange }: WeddingInfoFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">예식 정보</h3>
        <p className="text-xs text-muted-foreground">일시, 장소 등 세부 내용을 입력해 주세요.</p>
      </div>

      <Accordion type="multiple" defaultValue={['couple', 'wedding', 'venue']} className="space-y-2">
        {/* Couple Information */}
        <AccordionItem value="couple" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>신랑 · 신부 정보</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'신랑 성 (영문)'}</Label>
                <Input value={info.groomLastName} onChange={(e) => onChange({ groomLastName: e.target.value })} placeholder="Last name" />
              </div>
              <div className="space-y-2">
                <Label>{'신랑 이름 (영문)'}</Label>
                <Input value={info.groomFirstName} onChange={(e) => onChange({ groomFirstName: e.target.value })} placeholder="First name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'신랑 성'}</Label>
                <Input value={info.groomLastNameKr} onChange={(e) => onChange({ groomLastNameKr: e.target.value })} placeholder="성" />
              </div>
              <div className="space-y-2">
                <Label>{'신랑 이름'}</Label>
                <Input value={info.groomFirstNameKr} onChange={(e) => onChange({ groomFirstNameKr: e.target.value })} placeholder="이름" />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'신부 성 (영문)'}</Label>
                <Input value={info.brideLastName} onChange={(e) => onChange({ brideLastName: e.target.value })} placeholder="Last name" />
              </div>
              <div className="space-y-2">
                <Label>{'신부 이름 (영문)'}</Label>
                <Input value={info.brideFirstName} onChange={(e) => onChange({ brideFirstName: e.target.value })} placeholder="First name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'신부 성'}</Label>
                <Input value={info.brideLastNameKr} onChange={(e) => onChange({ brideLastNameKr: e.target.value })} placeholder="성" />
              </div>
              <div className="space-y-2">
                <Label>{'신부 이름'}</Label>
                <Input value={info.brideFirstNameKr} onChange={(e) => onChange({ brideFirstNameKr: e.target.value })} placeholder="이름" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Wedding Details */}
        <AccordionItem value="wedding" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>예식 세부 정보</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>메인 문구</Label>
              <Textarea
                value={info.mainPhrase}
                onChange={(e) => onChange({ mainPhrase: e.target.value })}
                placeholder="서로 다른 두 사람이&#10;사랑으로 하나가 되는 날"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>예식 일시</Label>
              <DatePicker value={info.weddingDate} onChange={(v) => onChange({ weddingDate: v })} />
              <TimePicker value={info.weddingTime} onChange={(v) => onChange({ weddingTime: v })} />
            </div>

            <div className="space-y-3 pt-1">
              <Label className="text-muted-foreground text-xs">날짜 섹션 표시 설정</Label>
              <div className="flex items-center justify-between">
                <Label className="font-normal">달력 표시</Label>
                <Switch
                  checked={calendarSettings.calendarDisplay}
                  onCheckedChange={(v) => onCalendarChange({ calendarDisplay: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">카운트다운 표시</Label>
                <Switch
                  checked={calendarSettings.countdownDisplay}
                  onCheckedChange={(v) => onCalendarChange({ countdownDisplay: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">D-Day 표시</Label>
                <Switch
                  checked={calendarSettings.dDayDisplay}
                  onCheckedChange={(v) => onCalendarChange({ dDayDisplay: v })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Venue */}
        <AccordionItem value="venue" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>장소 및 위치</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>예식장 이름</Label>
              <Input value={info.ceremonyHall} onChange={(e) => onChange({ ceremonyHall: e.target.value })} placeholder="The Shilla Seoul" />
            </div>
            <div className="space-y-2">
              <Label>홀 / 룸</Label>
              <Input value={info.venue} onChange={(e) => onChange({ venue: e.target.value })} placeholder="Diamond Ballroom" />
            </div>
            <AddressSearch
              address={info.address}
              latitude={info.latitude}
              longitude={info.longitude}
              venueName={info.ceremonyHall}
              onAddressChange={(addr) => onChange({ address: addr })}
              onLocationChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
            />
            <div className="space-y-2">
              <Label>교통 안내</Label>
              <Textarea
                value={info.transportGuide}
                onChange={(e) => onChange({ transportGuide: e.target.value })}
                placeholder="지하철 3호선 동대입구역 5번 출구에서 도보 5분"
                rows={2}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Parents Information */}
        <AccordionItem value="parents" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>부모님 정보</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">{'신랑측 부모님'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'아버지 성함'}</Label>
                <div className="flex items-center gap-2">
                  <Input value={info.groomFatherName} onChange={(e) => onChange({ groomFatherName: e.target.value })} placeholder="성함" />
                  <label className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={info.groomFatherDeceased}
                      onCheckedChange={(v) => onChange({ groomFatherDeceased: v === true })}
                    />
                    {info.showDeceasedMark ? <Flower className="h-4 w-4" /> : '故'}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{'어머니 성함'}</Label>
                <div className="flex items-center gap-2">
                  <Input value={info.groomMotherName} onChange={(e) => onChange({ groomMotherName: e.target.value })} placeholder="성함" />
                  <label className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={info.groomMotherDeceased}
                      onCheckedChange={(v) => onChange({ groomMotherDeceased: v === true })}
                    />
                    {info.showDeceasedMark ? <Flower className="h-4 w-4" /> : '故'}
                  </label>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{'신부측 부모님'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'아버지 성함'}</Label>
                <div className="flex items-center gap-2">
                  <Input value={info.brideFatherName} onChange={(e) => onChange({ brideFatherName: e.target.value })} placeholder="성함" />
                  <label className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={info.brideFatherDeceased}
                      onCheckedChange={(v) => onChange({ brideFatherDeceased: v === true })}
                    />
                    {info.showDeceasedMark ? <Flower className="h-4 w-4" /> : '故'}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{'어머니 성함'}</Label>
                <div className="flex items-center gap-2">
                  <Input value={info.brideMotherName} onChange={(e) => onChange({ brideMotherName: e.target.value })} placeholder="성함" />
                  <label className="flex items-center gap-1.5 shrink-0 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={info.brideMotherDeceased}
                      onCheckedChange={(v) => onChange({ brideMotherDeceased: v === true })}
                    />
                    {info.showDeceasedMark ? <Flower className="h-4 w-4" /> : '故'}
                  </label>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <Label className="font-normal">{'고인 표시 방식'}<span className="block text-xs text-muted-foreground font-normal mt-0.5">부모님 성함 옆에 표시할 기호</span></Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={info.showDeceasedMark ? 'flower' : 'hanja'}
                onValueChange={(v) => {
                  if (v) onChange({ showDeceasedMark: v === 'flower' });
                }}
              >
                <ToggleGroupItem value="hanja" aria-label="한자로 표기" className="px-3">故</ToggleGroupItem>
                <ToggleGroupItem value="flower" aria-label="국화 아이콘으로 표기" className="px-3">
                  <Flower className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">{'항목 순서'}<span className="block text-xs text-muted-foreground font-normal mt-0.5">신부측 먼저 표시</span></Label>
              <Switch
                checked={info.brideFirst}
                onCheckedChange={(v) => onChange({ brideFirst: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contact */}
        <AccordionItem value="contact" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>연락처 정보</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'신랑 연락처'}</Label>
                <Input value={info.groomContact} onChange={(e) => onChange({ groomContact: e.target.value })} placeholder="010-1234-5678" />
              </div>
              <div className="space-y-2">
                <Label>{'신부 연락처'}</Label>
                <Input value={info.brideContact} onChange={(e) => onChange({ brideContact: e.target.value })} placeholder="010-8765-4321" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{'신랑측 부모님 연락처'}</Label>
                <Input value={info.groomParentContact} onChange={(e) => onChange({ groomParentContact: e.target.value })} placeholder="010-1111-2222" />
              </div>
              <div className="space-y-2">
                <Label>{'신부측 부모님 연락처'}</Label>
                <Input value={info.brideParentContact} onChange={(e) => onChange({ brideParentContact: e.target.value })} placeholder="010-3333-4444" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Bank Accounts */}
        <AccordionItem value="bank" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>계좌 정보</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-sm text-muted-foreground">{'신랑 계좌'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>은행명</Label>
                <Input value={info.groomBankName} onChange={(e) => onChange({ groomBankName: e.target.value })} placeholder="신한은행" />
              </div>
              <div className="space-y-2">
                <Label>계좌번호</Label>
                <Input value={info.groomBankAccount} onChange={(e) => onChange({ groomBankAccount: e.target.value })} placeholder="123-456-789012" />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{'신부 계좌'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>은행명</Label>
                <Input value={info.brideBankName} onChange={(e) => onChange({ brideBankName: e.target.value })} placeholder="국민은행" />
              </div>
              <div className="space-y-2">
                <Label>계좌번호</Label>
                <Input value={info.brideBankAccount} onChange={(e) => onChange({ brideBankAccount: e.target.value })} placeholder="987-654-321098" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
