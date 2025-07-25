// 动画资源配置文件
// 用于管理动画名称和对应资源的映射关系

export const ANIMATION_CONFIG = {
  // 默认idle动画
  idle: {
    resource: './public/Animations/Standing Idle.fbx',
    name: 'Standing Idle',
    description: '默认待机动画，角色保持直立自然的站立姿势'
  },
  
  // 思考动画
  thinking: {
    resource: './public/Animations/Thinking.fbx', // 占位符，需要实际资源文件
    name: 'Thinking',
    description: '思考动画，角色表现出思考的状态'
  },
  
  // 开心动画
  joy: {
    resource: './public/Animations/Joy.fbx', // 占位符，需要实际资源文件
    name: 'Joy',
    description: '开心动画，角色表现出高兴的情绪'
  },
  
  // 悲伤动画
  sad: {
    resource: './public/Animations/Sad.fbx', // 占位符，需要实际资源文件
    name: 'Sad',
    description: '悲伤动画，角色表现出悲伤的情绪'
  }
};

export const ANIMATION_EVENTS = {
  // 用户发送消息时的动画
  USER_MESSAGE: 'idle',
  
  // AI响应思考阶段的动画
  AI_THINKING: 'thinking',
  
  // AI响应积极内容的动画
  AI_POSITIVE_RESPONSE: 'joy',
  
  // AI响应消极内容的动画
  AI_NEGATIVE_RESPONSE: 'sad',
  
  // 默认待机动画
  DEFAULT_IDLE: 'idle'
};

// 动画过渡时间配置（毫秒）
export const ANIMATION_TRANSITION = {
  DEFAULT: 300,
  SLOW: 300,
  FAST: 150
};

// 动画混合模式配置
export const ANIMATION_BLEND_MODE = {
  // 立即切换
  IMMEDIATE: 'immediate',
  
  // 淡入淡出
  FADE: 'fade',
  
  // 交叉淡入淡出
  CROSS_FADE: 'crossFade'
};

export default {
  ANIMATION_CONFIG,
  ANIMATION_EVENTS,
  ANIMATION_TRANSITION,
  ANIMATION_BLEND_MODE
};