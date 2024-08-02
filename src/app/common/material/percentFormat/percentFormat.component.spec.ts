/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PercentFormatComponent } from './percentFormat.component';

describe('PercentFormatComponent', () => {
  let component: PercentFormatComponent;
  let fixture: ComponentFixture<PercentFormatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PercentFormatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PercentFormatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
