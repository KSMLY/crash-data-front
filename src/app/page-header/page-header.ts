import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-header',
  imports: [],
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-header.css',
})
export class PageHeader {
  title = input.required<string>();
  description = input<string>('');
}
