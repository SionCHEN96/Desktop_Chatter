/**
 * Test Fish Speech connection
 * Quick script to test if Fish Speech service is running and accessible
 */

import fetch from 'node-fetch';

const FISH_SPEECH_URL = 'http://localhost:8081';
const TTS_PROXY_URL = 'http://localhost:3002';

async function testConnection(url, serviceName) {
  try {
    console.log(`\n🔍 Testing ${serviceName} at ${url}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ ${serviceName} is running (Status: ${response.status})`);
      return true;
    } else {
      console.log(`⚠️ ${serviceName} responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`❌ ${serviceName} connection timeout`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${serviceName} connection refused - service not running`);
    } else {
      console.log(`❌ ${serviceName} connection failed: ${error.message}`);
    }
    return false;
  }
}

async function testFishSpeechAPI() {
  console.log('\n🧪 Testing Fish Speech API endpoints...');
  
  const endpoints = [
    { url: `${FISH_SPEECH_URL}/`, name: 'Root' },
    { url: `${FISH_SPEECH_URL}/v1/health`, name: 'Health Check' },
    { url: `${FISH_SPEECH_URL}/v1/models`, name: 'Models' },
    { url: `${FISH_SPEECH_URL}/docs`, name: 'API Docs' }
  ];
  
  for (const endpoint of endpoints) {
    await testConnection(endpoint.url, `Fish Speech ${endpoint.name}`);
  }
}

async function testTTSProxy() {
  console.log('\n🧪 Testing TTS Proxy endpoints...');
  
  const endpoints = [
    { url: `${TTS_PROXY_URL}/api/health`, name: 'Health Check' },
    { url: `${TTS_PROXY_URL}/api/fish-speech/status`, name: 'Fish Speech Status' }
  ];
  
  for (const endpoint of endpoints) {
    await testConnection(endpoint.url, `TTS Proxy ${endpoint.name}`);
  }
}

async function testTTSSynthesis() {
  console.log('\n🎵 Testing TTS synthesis...');
  
  try {
    const testText = "Hello, this is a test.";
    console.log(`Testing synthesis with text: "${testText}"`);
    
    const response = await fetch(`${TTS_PROXY_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        referenceAudio: null,
        referenceText: null
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ TTS synthesis successful: ${result.audioUrl}`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ TTS synthesis failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ TTS synthesis error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Fish Speech Service Connection Test');
  console.log('=====================================');
  
  // Test basic connections
  const fishSpeechRunning = await testConnection(FISH_SPEECH_URL, 'Fish Speech Service');
  const ttsProxyRunning = await testConnection(TTS_PROXY_URL, 'TTS Proxy Service');
  
  // Test Fish Speech API endpoints
  if (fishSpeechRunning) {
    await testFishSpeechAPI();
  }
  
  // Test TTS Proxy endpoints
  if (ttsProxyRunning) {
    await testTTSProxy();
  }
  
  // Test TTS synthesis if both services are running
  if (fishSpeechRunning && ttsProxyRunning) {
    await testTTSSynthesis();
  }
  
  console.log('\n📋 Summary:');
  console.log(`Fish Speech Service: ${fishSpeechRunning ? '✅ Running' : '❌ Not Running'}`);
  console.log(`TTS Proxy Service: ${ttsProxyRunning ? '✅ Running' : '❌ Not Running'}`);
  
  if (!fishSpeechRunning) {
    console.log('\n💡 To start Fish Speech:');
    console.log('   cd fish-speech-test');
    console.log('   start_fish_speech_clean.bat');
  }
  
  if (!ttsProxyRunning) {
    console.log('\n💡 To start TTS Proxy:');
    console.log('   cd fish-speech-test');
    console.log('   node server.js');
  }
  
  console.log('\n🎯 To start the main application:');
  console.log('   npm start');
}

main().catch(console.error);
