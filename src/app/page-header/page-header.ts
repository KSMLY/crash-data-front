import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-header.css',
})
export class PageHeader {
  title = input.required<string>();
  description = input<string>('');
  // Off on the report page itself
  showReport = input(true);
}
