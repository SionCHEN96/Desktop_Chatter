#!/usr/bin/env python3
"""
Test script for Fish Speech API
"""

import requests
import json
import os

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:8080/v1/health")
        print(f"Health check status: {response.status_code}")
        print(f"Health check response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_tts():
    """Test the TTS endpoint"""
    try:
        # Simple TTS request
        tts_request = {
            "text": "Hello, this is a test of Fish Speech text to speech.",
            "format": "wav",
            "chunk_length": 200,
            "normalize": True,
            "temperature": 0.8,
            "top_p": 0.8,
            "repetition_penalty": 1.1
        }
        
        print("Sending TTS request...")
        print(f"Request: {json.dumps(tts_request, indent=2)}")
        
        response = requests.post(
            "http://localhost:8080/v1/tts",
            json=tts_request,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"TTS response status: {response.status_code}")
        print(f"TTS response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            # Save the audio file
            output_file = "test_output.wav"
            with open(output_file, "wb") as f:
                f.write(response.content)
            print(f"Audio saved to: {output_file}")
            print(f"Audio file size: {len(response.content)} bytes")
            return True
        else:
            print(f"TTS failed with status {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"TTS test failed: {e}")
        return False

def main():
    print("=== Fish Speech API Test ===")
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    health_ok = test_health()
    
    if not health_ok:
        print("Health check failed. Make sure Fish Speech server is running.")
        return
    
    # Test TTS endpoint
    print("\n2. Testing TTS endpoint...")
    tts_ok = test_tts()
    
    if tts_ok:
        print("\n✅ All tests passed! Fish Speech API is working correctly.")
    else:
        print("\n❌ TTS test failed.")

if __name__ == "__main__":
    main()
