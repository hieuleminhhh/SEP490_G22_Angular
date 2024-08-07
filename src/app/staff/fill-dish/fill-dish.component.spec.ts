/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FillDishComponent } from './fill-dish.component';

describe('FillDishComponent', () => {
  let component: FillDishComponent;
  let fixture: ComponentFixture<FillDishComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FillDishComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FillDishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
