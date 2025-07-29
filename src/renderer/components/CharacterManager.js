import { initCharacterContainer, playSimpleAnimation, playAnimation } from '../../core/character/index.js';

export class CharacterManager {
  constructor() {
    this.animationStateMachine = null;
    this.init();
  }

  init() {
    const containerInfo = initCharacterContainer();
    this.animationStateMachine = containerInfo.animationStateMachine;
  }

  playAnimation(animationName) {
    console.log(`准备播放${animationName}动画`);
    playAnimation(animationName);
    console.log(`已调用播放${animationName}动画`);
  }

  playSimpleAnimation(animationName) {
    playSimpleAnimation(animationName);
  }
}