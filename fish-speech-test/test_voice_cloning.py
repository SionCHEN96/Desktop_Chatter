#!/usr/bin/env python3
"""
Test script for Fish Speech Voice Cloning functionality
"""

import requests
import json
import base64
import os
import time

def test_voice_cloning_with_file():
    """Test voice cloning with file upload"""
    
    # 检查是否有测试音频文件
    test_audio_file = "test_output.wav"  # 之前生成的测试音频
    if not os.path.exists(test_audio_file):
        print(f"❌ Test audio file not found: {test_audio_file}")
        print("Please run the basic TTS test first to generate a reference audio file.")
        return False
    
    try:
        print("=== Voice Cloning Test ===")
        print(f"Using reference audio: {test_audio_file}")
        
        # 要合成的文本
        target_text = "This is a voice cloning test. I should sound like the reference audio."
        reference_text = "Hello, this is a test of Fish Speech text to speech."
        
        print(f"Target text: {target_text}")
        print(f"Reference text: {reference_text}")
        print()
        
        # 准备文件上传
        with open(test_audio_file, 'rb') as audio_file:
            files = {
                'referenceAudio': (test_audio_file, audio_file, 'audio/wav')
            }
            data = {
                'text': target_text,
                'referenceText': reference_text
            }
            
            print("Sending voice cloning request...")
            start_time = time.time()
            
            response = requests.post(
                "http://localhost:3002/api/voice-clone",
                files=files,
                data=data,
                timeout=120
            )
            
            end_time = time.time()
            duration = end_time - start_time
        
        print(f"Response status: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Voice cloning request successful!")
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if result.get('success'):
                audio_url = result.get('audioUrl')
                audio_size = result.get('audioSize')
                reference_size = result.get('referenceAudioSize')
                
                print(f"🎵 Cloned audio generated: {audio_url}")
                print(f"📊 Cloned audio size: {audio_size} bytes")
                print(f"📊 Reference audio size: {reference_size} bytes")
                
                # 测试是否可以访问音频文件
                if audio_url:
                    audio_response = requests.get(f"http://localhost:3002{audio_url}")
                    if audio_response.status_code == 200:
                        print(f"✅ Cloned audio file accessible: {len(audio_response.content)} bytes")
                        
                        # 保存克隆的音频文件
                        cloned_filename = f"cloned_{int(time.time())}.wav"
                        with open(cloned_filename, 'wb') as f:
                            f.write(audio_response.content)
                        print(f"💾 Cloned audio saved as: {cloned_filename}")
                        
                    else:
                        print(f"❌ Cloned audio file not accessible: {audio_response.status_code}")
                
                return True
            else:
                print("❌ Voice cloning request failed in application logic")
                return False
        else:
            print(f"❌ Voice cloning request failed with status {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Voice cloning test failed: {e}")
        return False

def test_simple_tts_with_reference():
    """Test simple TTS endpoint with reference audio"""
    
    test_audio_file = "test_output.wav"
    if not os.path.exists(test_audio_file):
        print(f"❌ Test audio file not found: {test_audio_file}")
        return False
    
    try:
        print("\n=== Simple TTS with Reference Test ===")
        
        # 读取参考音频并转换为base64
        with open(test_audio_file, 'rb') as audio_file:
            audio_data = audio_file.read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # TTS请求
        tts_request = {
            "text": "This is a test using the simple TTS endpoint with reference audio.",
            "referenceAudio": audio_base64,
            "referenceText": "Hello, this is a test of Fish Speech text to speech."
        }
        
        print("Sending TTS request with reference audio...")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:3002/api/tts",
            json=tts_request,
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Response status: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ TTS with reference successful!")
            print(f"Used voice cloning: {result.get('usedVoiceCloning', False)}")
            
            audio_url = result.get('audioUrl')
            if audio_url:
                print(f"🎵 Audio generated: {audio_url}")
                
                # 下载并保存音频
                audio_response = requests.get(f"http://localhost:3002{audio_url}")
                if audio_response.status_code == 200:
                    simple_cloned_filename = f"simple_cloned_{int(time.time())}.wav"
                    with open(simple_cloned_filename, 'wb') as f:
                        f.write(audio_response.content)
                    print(f"💾 Audio saved as: {simple_cloned_filename}")
            
            return True
        else:
            print(f"❌ TTS with reference failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ TTS with reference test failed: {e}")
        return False

def main():
    print("=== Fish Speech Voice Cloning Test Suite ===")
    print()
    
    # 测试1: 文件上传方式的声音克隆
    print("1. Testing voice cloning with file upload...")
    voice_clone_ok = test_voice_cloning_with_file()
    
    # 测试2: 简单TTS端点的参考音频功能
    print("\n2. Testing simple TTS with reference audio...")
    simple_tts_ok = test_simple_tts_with_reference()
    
    print("\n" + "="*50)
    if voice_clone_ok and simple_tts_ok:
        print("🎉 All voice cloning tests passed!")
        print()
        print("Voice cloning is working correctly. You can now:")
        print("1. Use the /api/voice-clone endpoint with file upload")
        print("2. Use the /api/tts endpoint with base64 reference audio")
        print("3. Compare the generated audio with the reference audio")
        print()
        print("Tips for better voice cloning:")
        print("- Use 5-10 seconds of clear reference audio")
        print("- Make sure reference text matches the reference audio exactly")
        print("- Use high-quality audio files (WAV format recommended)")
    else:
        print("❌ Some voice cloning tests failed.")
        if not voice_clone_ok:
            print("- File upload voice cloning failed")
        if not simple_tts_ok:
            print("- Simple TTS with reference failed")

if __name__ == "__main__":
    main()
