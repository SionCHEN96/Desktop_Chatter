/**
 * 设置服务
 * 负责管理应用设置的持久化存储和读取
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SETTINGS_CONFIG } from '../../config/config.js';

// 获取当前模块的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 设置服务类
 * 封装设置文件的读写操作
 */
export class SettingsService {
  constructor() {
    this.settings = null;
    this.settingsPath = null;
    this.initialized = false;
  }

  /**
   * 初始化设置服务
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // 确定设置文件路径
      this.settingsPath = path.resolve(process.cwd(), SETTINGS_CONFIG.SETTINGS_FILE);
      
      // 确保data目录存在
      const dataDir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`[SettingsService] Created data directory: ${dataDir}`);
      }

      // 加载设置
      await this.loadSettings();
      this.initialized = true;
      
      console.log('[SettingsService] Settings service initialized successfully');
      console.log('[SettingsService] Settings file:', this.settingsPath);
      console.log('[SettingsService] Current settings:', this.settings);
    } catch (error) {
      console.error('[SettingsService] Failed to initialize settings service:', error);
      throw error;
    }
  }

  /**
   * 加载设置文件
   * @returns {Promise<void>}
   */
  async loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        // 读取现有设置文件
        const settingsData = fs.readFileSync(this.settingsPath, 'utf8');
        this.settings = JSON.parse(settingsData);
        console.log('[SettingsService] Loaded existing settings from file');
      } else {
        // 使用默认设置
        this.settings = { ...SETTINGS_CONFIG.DEFAULTS };
        console.log('[SettingsService] Using default settings');
        
        // 保存默认设置到文件
        await this.saveSettings();
      }

      // 确保所有默认设置都存在（处理新增的设置项）
      this.mergeDefaultSettings();
    } catch (error) {
      console.error('[SettingsService] Failed to load settings:', error);
      // 如果加载失败，使用默认设置
      this.settings = { ...SETTINGS_CONFIG.DEFAULTS };
      await this.saveSettings();
    }
  }

  /**
   * 合并默认设置（处理新增的设置项）
   */
  mergeDefaultSettings() {
    let hasChanges = false;
    
    // 深度合并默认设置
    const mergeDefaults = (current, defaults) => {
      for (const key in defaults) {
        if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
            hasChanges = true;
          }
          mergeDefaults(current[key], defaults[key]);
        } else if (!(key in current)) {
          current[key] = defaults[key];
          hasChanges = true;
        }
      }
    };

    mergeDefaults(this.settings, SETTINGS_CONFIG.DEFAULTS);

    // 如果有新增设置，保存到文件
    if (hasChanges) {
      console.log('[SettingsService] Merged new default settings');
      this.saveSettings();
    }
  }

  /**
   * 保存设置到文件
   * @returns {Promise<void>}
   */
  async saveSettings() {
    try {
      const settingsData = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.settingsPath, settingsData, 'utf8');
      console.log('[SettingsService] Settings saved to file');
    } catch (error) {
      console.error('[SettingsService] Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * 获取设置值
   * @param {string} key - 设置键（支持点号分隔的路径，如 'voice.enabled'）
   * @param {*} defaultValue - 默认值
   * @returns {*} 设置值
   */
  get(key, defaultValue = null) {
    if (!this.initialized) {
      console.warn('[SettingsService] Service not initialized, returning default value');
      return defaultValue;
    }

    try {
      const keys = key.split('.');
      let value = this.settings;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return defaultValue;
        }
      }
      
      return value;
    } catch (error) {
      console.error('[SettingsService] Failed to get setting:', key, error);
      return defaultValue;
    }
  }

  /**
   * 设置值
   * @param {string} key - 设置键（支持点号分隔的路径，如 'voice.enabled'）
   * @param {*} value - 设置值
   * @returns {Promise<void>}
   */
  async set(key, value) {
    if (!this.initialized) {
      throw new Error('Settings service not initialized');
    }

    try {
      const keys = key.split('.');
      let current = this.settings;
      
      // 导航到目标对象
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== 'object') {
          current[k] = {};
        }
        current = current[k];
      }
      
      // 设置值
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;
      
      // 保存到文件
      await this.saveSettings();
      
      console.log(`[SettingsService] Setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('[SettingsService] Failed to set setting:', key, value, error);
      throw error;
    }
  }

  /**
   * 获取所有设置
   * @returns {Object} 所有设置
   */
  getAll() {
    return this.settings ? { ...this.settings } : {};
  }

  /**
   * 重置设置为默认值
   * @returns {Promise<void>}
   */
  async reset() {
    try {
      this.settings = { ...SETTINGS_CONFIG.DEFAULTS };
      await this.saveSettings();
      console.log('[SettingsService] Settings reset to defaults');
    } catch (error) {
      console.error('[SettingsService] Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * 检查服务是否已初始化
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * 获取语音设置
   * @returns {Object} 语音设置
   */
  getVoiceSettings() {
    return this.get('voice', SETTINGS_CONFIG.DEFAULTS.voice);
  }

  /**
   * 设置语音开关
   * @param {boolean} enabled - 是否启用语音
   * @returns {Promise<void>}
   */
  async setVoiceEnabled(enabled) {
    await this.set('voice.enabled', enabled);
  }

  /**
   * 获取语音开关状态
   * @returns {boolean} 语音是否启用
   */
  isVoiceEnabled() {
    return this.get('voice.enabled', SETTINGS_CONFIG.DEFAULTS.voice.enabled);
  }
}
