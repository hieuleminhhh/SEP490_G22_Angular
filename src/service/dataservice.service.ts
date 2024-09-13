import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private messageSource = new BehaviorSubject<string>('Initial Message');
  private variableSource = new BehaviorSubject<number>(0);
  currentMessage = this.messageSource.asObservable();
  currentVariable = this.variableSource.asObservable();

  private notify = new Subject<void>(); // Subject để phát sự kiện
  notify$ = this.notify.asObservable(); // Observable để subscribe

  constructor() {}

  changeMessage(message: string) {
    this.messageSource.next(message);
  }

  changeVariable(newValue: number) {
    this.variableSource.next(newValue);
  }

  triggerFunction() {
    this.notify.next(); // Phát sự kiện
  }
}
