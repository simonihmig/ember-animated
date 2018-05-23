import Component from '@ember/component';
import layout from '../templates/components/animated-beacon';
import { inject as service } from '@ember/service';
import { task } from '../-private/ember-scheduler';
import { current } from '../-private/scheduler';
import { afterRender, microwait } from '..';
import { componentNodes } from '../-private/ember-internals';
import Sprite from '../-private/sprite';

export const WILDCARD = {};

/**
  A component that marks a region of the page that 
  can serve as a source or destination for other animator components. 
  See [Animating Between Components](../../between).  
  ```hbs
  {{#animated-beacon group="one"}}
    <button {{action "launch"}}>Launch</button>
  {{/animated-beacon}}

  {{#animated-if showThing group="one" use=transition duration=500}}
    <div class="message" {{action "dismiss"}}>
      Hello
    </div>
  {{/animated-if}}
  ```
  ```js
import Component from '@ember/component';
import move from 'ember-animated/motions/move';
import scale from 'ember-animated/motions/scale';
import { parallel } from 'ember-animated';

export default Component.extend({
  showThing: false,

  transition: function * ({ receivedSprites, sentSprites }) {
    receivedSprites.forEach(parallel(scale, move));
    sentSprites.forEach(parallel(scale, move));
  },

  actions: {
    launch() {
      this.set('showThing', true);
    },
    dismiss() {
      this.set('showThing', false);
    }
  }
});
```
  @class animated-beacon
  @public
*/
export default Component.extend({
  layout,
  motionService: service('-ea-motion'),
  tagName: '',

  init() {
    this._super();
    this.inserted = false;
  },

  didInsertElement() {
    this._super();
    this._inserted = true;
    this.animationStarting = this.animationStarting.bind(this);
    this.get('motionService').observeAnimations(this.animationStarting);
  },
  willDestroyElement() {
    this._super();
    this.get('motionService').unobserveAnimations(this.animationStarting);
  },

  animationStarting() {
    this.get('participate').perform();
  },

  _firstChildElement() {
    if (!this._inserted) { return; }
    let { firstNode, lastNode } = componentNodes(this);
    let node = firstNode;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return node;
      }
      if (node === lastNode){ break; }
      node = node.nextSibling;
    }
  },

  participate: task(function * () {
    let element = this._firstChildElement();
    if (!element) {
      return;
    }
    let group = this.get('group') || '__default__';

    let outboundSprite = Sprite.positionedStartingAt(element, Sprite.offsetParentStartingAt(element));
    outboundSprite.owner = { group, id: WILDCARD };

    let inboundSprite;

    yield afterRender();
    yield microwait();
    yield * this.get('motionService').staticMeasurement(() => {
      let inboundParent = Sprite.offsetParentEndingAt(element);
      inboundSprite = Sprite.positionedEndingAt(element, inboundParent);
      inboundSprite.owner = { group, id: WILDCARD };
    });
    yield this.get('motionService.farMatch').perform(
      current(),
      [inboundSprite],
      [],
      [outboundSprite]
    );
  }).restartable()

});
