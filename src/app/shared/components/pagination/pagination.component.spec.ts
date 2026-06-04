import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppPaginationComponent } from './pagination.component';

describe('AppPaginationComponent', () => {
  let fixture: ComponentFixture<AppPaginationComponent>;
  let component: AppPaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppPaginationComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AppPaginationComponent);
    component = fixture.componentInstance;
  });

  it('computes totalPages correctly', () => {
    component.total = 100; component.pageSize = 10;
    expect(component.totalPages).toBe(10);
  });

  it('totalPages minimum is 1', () => {
    component.total = 0; component.pageSize = 10;
    expect(component.totalPages).toBe(1);
  });

  it('pages returns sequential 1..N when N <= 7', () => {
    component.total = 50; component.pageSize = 10;
    expect(component.pages).toEqual([1, 2, 3, 4, 5]);
  });

  it('pages includes ellipsis when N > 7', () => {
    component.total = 200; component.pageSize = 10; component.page = 5;
    const pages = component.pages;
    expect(pages[0]).toBe(1);
    expect(pages[pages.length - 1]).toBe(20);
    expect(pages.some(p => p === '...')).toBe(true);
  });

  it('next emits page + 1 if not on last page', () => {
    component.total = 100; component.pageSize = 10; component.page = 3;
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.next();
    expect(spy).toHaveBeenCalledWith(4);
  });

  it('next does NOT emit on last page', () => {
    component.total = 30; component.pageSize = 10; component.page = 3;
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.next();
    expect(spy).not.toHaveBeenCalled();
  });

  it('prev does NOT emit on first page', () => {
    component.total = 30; component.pageSize = 10; component.page = 1;
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.prev();
    expect(spy).not.toHaveBeenCalled();
  });

  it('goto ignores ... entries', () => {
    component.total = 30; component.pageSize = 10; component.page = 1;
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.goto('...');
    expect(spy).not.toHaveBeenCalled();
  });

  it('goto ignores out-of-range', () => {
    component.total = 30; component.pageSize = 10; component.page = 1;
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.goto(99);
    expect(spy).not.toHaveBeenCalled();
  });
});
