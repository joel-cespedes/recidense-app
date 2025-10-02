import { Animation, createAnimation } from '@ionic/angular';

export function pageTransition(_: HTMLElement, opts: any): Animation {
  const DURATION = 300;

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
    enteringPage.fromTo('transform', 'translateX(100%)', 'translateX(0)');
    leavingPage.fromTo('opacity', '1', '1');
  } else {
    leavingPage.fromTo('transform', 'translateX(0)', 'translateX(100%)');
    enteringPage.fromTo('opacity', '1', '1');
  }

  rootTransition.addAnimation(enteringPage);
  rootTransition.addAnimation(leavingPage);
  return rootTransition;
}
