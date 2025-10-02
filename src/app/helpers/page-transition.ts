import { Animation, createAnimation } from '@ionic/angular';

export function pageTransition(_: HTMLElement, opts: any): Animation {
  const DURATION = 500; // Más lento (antes 300ms)

  const getIonPageElement = (element: HTMLElement) => {
    if (element.classList.contains('ion-page')) {
      return element;
    }
    const ionPage = element.querySelector(':scope > .ion-page, :scope > ion-page');
    return ionPage ?? element;
  };

  const rootTransition = createAnimation()
    .duration(opts.duration || DURATION)
    .easing('cubic-bezier(0.3,0,0.66,1)');

  const enteringPage = createAnimation()
    .addElement(getIonPageElement(opts.enteringEl))
    .beforeRemoveClass('ion-page-invisible');

  const leavingPage = createAnimation().addElement(
    getIonPageElement(opts.leavingEl)
  );

  if (opts.direction === 'forward') {
    // Página entrante: slide desde la derecha + fade in
    enteringPage
      .fromTo('transform', 'translateX(100%)', 'translateX(0)')
      .fromTo('opacity', '0.7', '1');

    // Página saliente: se mantiene visible con ligero fade
    leavingPage.fromTo('opacity', '1', '0.8');
  } else {
    // Al regresar: página saliente se desliza a la derecha
    leavingPage
      .fromTo('transform', 'translateX(0)', 'translateX(100%)')
      .fromTo('opacity', '1', '0.7');

    // Página entrante: aparece con fade in
    enteringPage.fromTo('opacity', '0.8', '1');
  }

  rootTransition.addAnimation(enteringPage);
  rootTransition.addAnimation(leavingPage);
  return rootTransition;
}
