import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CrashService, Crash } from '../crash';

@Component({
  selector: 'app-crash-list',
  imports: [MatTableModule],
  templateUrl: './crash-list.html',
})
export class CrashList implements OnInit {
  private crashService = inject(CrashService);

  crashes: Crash[] = [];
  columns = ['policeRef', 'crashDate', 'district', 'severity'];

  ngOnInit() {
    this.crashService.getAll().subscribe((data) => (this.crashes = data));
  }
}
