import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Preferences as ReadingPreferences } from '../core/models';
import { StudyService } from '../core/study.service';
import { SessionService } from '../core/session.service';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-preferences',
  imports: [FormsModule],
  template: `
    <div class="setting-row">
      <label for="reading-font">Reading font · पठन का फ़ॉन्ट</label>
      <select id="reading-font" [ngModel]="study.state().preferences.font" (ngModelChange)="change({ font: $event })" [disabled]="!session.owned() || session.maintenance()">
        <option value="noto">Noto Serif Devanagari</option><option value="mukta">Mukta</option><option value="hind">Hind</option>
      </select>
    </div>
    <p class="font-sample">ज्ञान की एक शांत यात्रा। पढ़ें, समझें और स्वयं चिंतन करें।</p>
    <div class="setting-row">
      <span>Text size · अक्षर आकार</span>
      <div class="segmented">
        @for (size of [19, 21, 24, 27]; track size) {
          <button [attr.aria-label]="'अक्षर आकार ' + size" [attr.aria-pressed]="study.state().preferences.size === size" [class.selected]="study.state().preferences.size === size" (click)="change({ size })">{{ size }}</button>
        }
      </div>
    </div>
    <label class="switch-row"><span>अर्थ दिखाएँ</span><input type="checkbox" [ngModel]="study.state().preferences.meaning" (ngModelChange)="change({ meaning: $event })" [disabled]="!session.owned() || session.maintenance()"></label>
    <label class="switch-row"><span>सरल व्याख्या दिखाएँ</span><input type="checkbox" [ngModel]="study.state().preferences.explanation" (ngModelChange)="change({ explanation: $event })" [disabled]="!session.owned() || session.maintenance()"></label>
    <div class="setting-row">
      <span lang="en">Reading theme</span>
      <div class="segmented">
        @for (theme of themes; track theme.id) {
          <button lang="en" [attr.aria-pressed]="study.state().preferences.theme === theme.id" [class.selected]="study.state().preferences.theme === theme.id" (click)="change({ theme: theme.id })">{{ theme.label }}</button>
        }
      </div>
    </div>`,
})
export class Preferences {
  readonly study = inject(StudyService);
  readonly session = inject(SessionService);
  private ui = inject(UiService);
  readonly themes: { id: 'paper' | 'night'; label: string }[] = [{ id: 'paper', label: 'Paper' }, { id: 'night', label: 'Night' }];

  async change(patch: Partial<ReadingPreferences>): Promise<void> {
    try { await this.study.setPreferences(patch); } catch (error) { this.ui.error(error); }
  }
}
