#!/usr/bin/env python3
"""
Test script for Chat Application TTS functionality
"""

import requests
import json
import time

def test_chat_tts():
    """Test the chat application's TTS endpoint"""
    try:
        # Test message
        test_text = "Hello! This is a test of the chat application's text-to-speech functionality using Fish Speech."
        
        print("=== Chat Application TTS Test ===")
        print(f"Testing text: {test_text}")
        print()
        
        # Make TTS request to our chat application
        tts_request = {
            "text": test_text
        }
        
        print("Sending TTS request to chat application...")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:3001/api/tts",
            json=tts_request,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Response status: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ TTS request successful!")
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if result.get('success'):
                audio_url = result.get('audioUrl')
                audio_size = result.get('audioSize')
                print(f"🎵 Audio generated: {audio_url}")
                print(f"📊 Audio size: {audio_size} bytes")
                
                # Test if we can access the audio file
                if audio_url:
                    audio_response = requests.get(f"http://localhost:3001{audio_url}")
                    if audio_response.status_code == 200:
                        print(f"✅ Audio file accessible: {len(audio_response.content)} bytes")
                    else:
                        print(f"❌ Audio file not accessible: {audio_response.status_code}")
                
                return True
            else:
                print("❌ TTS request failed in application logic")
                return False
        else:
            print(f"❌ TTS request failed with status {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ TTS test failed: {e}")
        return False

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:3001/api/health")
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            print(f"Health response: {response.json()}")
            return True
        return False
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def main():
    print("=== Chat Application Integration Test ===")
    print()
    
    # Test health endpoint
    print("1. Testing health endpoint...")
    health_ok = test_health()
    print()
    
    if not health_ok:
        print("❌ Health check failed. Make sure the chat application is running.")
        return
    
    # Test TTS functionality
    print("2. Testing TTS functionality...")
    tts_ok = test_chat_tts()
    print()
    
    if tts_ok:
        print("🎉 All tests passed! Chat application TTS is working correctly.")
        print()
        print("Next steps:")
        print("1. Open http://localhost:3001/index.html in your browser")
        print("2. Type a message and click the TTS button")
        print("3. Listen to the generated speech!")
    else:
        print("❌ TTS test failed.")

if __name__ == "__main__":
    main()
