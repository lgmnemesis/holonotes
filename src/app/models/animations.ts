import { trigger, state, transition, style, animate, keyframes } from '@angular/animations';

export let fade =
  trigger('fade', [
    state('void', style({ opacity: 0 })),
    transition(':enter, :leave', [
      animate(350)
    ])
  ]);

export let translateXLeft =
  trigger('translateXLeft', [
    state('void', style({ transform: 'translateX(300px)' })),
    transition(':enter, :leave', [
      animate(250)
    ])
  ]);

export let translateXLeftLong =
  trigger('translateXLeftLong', [
    state('void', style({ transform: 'translateX(300px)' })),
    transition(':enter, :leave', [
      animate(450)
    ])
  ]);

export let translateXRight =
  trigger('translateXRight', [
    state('void', style({ transform: 'translateX(-300px)' })),
    transition(':enter, :leave', [
      animate(250)
    ])
  ]);

export let translateYDown =
  trigger('translateYDown', [
    state('void', style({ transform: 'translateY(-50px)' })),
    transition(':enter, :leave', [
      animate(250)
    ])
  ]);

export let translateYDownSlow =
  trigger('translateYDownSlow', [
    state('void', style({ transform: 'translateY(-50px)' })),
    transition(':enter, :leave', [
      animate(550)
    ])
  ]);

export let translateYDownLong =
  trigger('translateYDownLong', [
    state('void', style({ transform: 'translateY(-550px)' })),
    transition(':enter, :leave', [
      animate(550)
    ])
  ]);


export let translateYUp =
  trigger('translateYUp', [
    state('void', style({ transform: 'translateY(50px)' })),
    transition(':enter, :leave', [
      animate(250)
    ])
  ]);

  export let translateYUpAll =
  trigger('translateYUpAll', [
    state('void', style({ transform: 'translateY(100vh)' })),
    transition(':enter, :leave', [
      animate(200)
    ])
  ]);

export let rollUp =
  trigger('rollUp', [
    transition(':enter', [
      style({transform: 'translateY(50px)'}),
      animate(350)
    ]),
    state('void', style({ transform: 'translateY(-50px)' })),
    transition(':leave', [
      style({transform: 'translateY(0px)'}),
      animate(350)
    ])
  ]);

  export let slideXLeft =
    trigger('slideXLeft', [
      state('in', style({ transform: 'translateX(0)' })),
      transition('void => *', [
        style({ transform: 'translateX(100%)' }),
        animate(200)
      ]),
      transition('* => void', [
        animate(0, style({ transform: 'translateX(-100%)' }))
      ])
    ]);

export let heightDown =
  trigger('heightDown', [
    state('void', style({ height: '0' })),
    transition(':enter, :leave', [
      animate(250)
    ])
  ]);

  export let heightDownFast =
    trigger('heightDownFast', [
      state('void', style({ height: '0' })),
      transition(':enter, :leave', [
        animate(150)
      ])
  ]);

export let heightDownChangeState =
  trigger('heightDownChangeState', [
    state('initial', style({
      height: '0'
    })),
    state('final', style({
      height: '50px'
    })),
    transition('initial=>final', animate('200ms')),
    transition('final=>initial', animate('200ms'))
  ]);

export let leftAndBlink =
  trigger('leftAndBlink', [
    state('void', style({ transform: 'translateX(50px)' })),
    transition(':enter', [
      animate(250, style({ transform: 'translateX(0)' })),
      animate('1s 150ms', keyframes ( [
        style({ backgroundColor: 'var(--ion-color-danger)' }),
        style({ backgroundColor: 'var(--ion-color-medium)' }),
        style({ backgroundColor: 'var(--ion-color-danger)' }),
        style({ backgroundColor: 'var(--ion-color-medium)' }),
        style({ backgroundColor: 'var(--ion-color-danger)' })
      ]))
    ]),
    transition(':leave', [
      animate(250, style({ transform: 'translateX(-50px)'}))
    ])
  ]);
