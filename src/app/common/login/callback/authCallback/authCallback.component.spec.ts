/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AuthCallbackComponent } from './authCallback.component';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthCallbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
