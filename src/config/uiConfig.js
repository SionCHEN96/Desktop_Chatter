/**
 * UI相关配置
 * 包含样式、布局、主题等配置
 */

/**
 * 容器样式配置
 * @typedef {Object} ContainerStyles
 * @property {string} position - CSS position属性
 * @property {string} bottom - 底部距离
 * @property {string} left - 左侧距离
 */
export const CONTAINER_STYLES = {
  position: 'absolute',
  bottom: '200px',
  left: '0'
};

/**
 * 窗口配置
 * @typedef {Object} WindowConfig
 * @property {number} width - 窗口宽度
 * @property {number} height - 窗口高度
 * @property {boolean} transparent - 是否透明
 * @property {boolean} frame - 是否显示边框
 */
export const WINDOW_CONFIG = {
  width: 350,
  height: 600,
  transparent: true,
  frame: false
};

/**
 * 主题配置
 * @typedef {Object} ThemeConfig
 * @property {Object} colors - 颜色配置
 * @property {Object} fonts - 字体配置
 * @property {Object} spacing - 间距配置
 */
export const THEME_CONFIG = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    userMessage: '#dcf8c6',
    aiMessage: '#ffffff',
    background: 'rgba(255, 255, 255, 0.95)'
  },
  fonts: {
    primary: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    monospace: "'Courier New', monospace"
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};
