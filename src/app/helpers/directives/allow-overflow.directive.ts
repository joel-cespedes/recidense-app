import { Directive, ElementRef, AfterViewInit, inject } from '@angular/core';

@Directive({
  selector: '[appAllowOverflow]'
})
export class AllowOverflowDirective implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const toolbar = this.el.nativeElement as HTMLElement;

    setTimeout(() => {
      const container = toolbar.shadowRoot?.querySelector('.toolbar-container') as HTMLElement;

      if (container) {
        container.style.contain = 'none';
        container.style.overflow = 'visible';
      }
    }, 0);
  }
}
