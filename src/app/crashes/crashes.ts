import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CrashService, Crash } from '../crash';
import { PageHeader } from '../page-header/page-header';

@Component({
  selector: 'app-crashes',
  imports: [MatTableModule, PageHeader],
  templateUrl: './crashes.html',
  styleUrl: './crashes.css',
})
export class Crashes implements OnInit {
  private crashService = inject(CrashService);

  crashes = signal<Crash[]>([]);
  columns = ['policeRef', 'crashDate', 'district', 'severity'];

  ngOnInit() {
    this.crashService.getAll().subscribe((data) => this.crashes.set(data));
  }
}
