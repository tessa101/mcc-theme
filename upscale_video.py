#!/usr/bin/env python3
"""
Upscale video using Real-ESRGAN
Extracts frames, upscales each frame, then reassembles video
"""

import os
import sys
import subprocess
from pathlib import Path
from realesrgan_ncnn_py import Realesrgan

def extract_frames(video_path, output_dir):
    """Extract frames from video using FFmpeg"""
    print(f"Extracting frames from {video_path}...")
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract frames as PNG
    cmd = [
        'ffmpeg', '-i', video_path,
        '-vf', 'fps=30',  # 30 fps
        f'{output_dir}/frame_%06d.png'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error extracting frames: {result.stderr}")
        return False
    
    frame_count = len(list(Path(output_dir).glob('frame_*.png')))
    print(f"Extracted {frame_count} frames")
    return True

def upscale_frames(input_dir, output_dir, scale=2):
    """Upscale frames using Real-ESRGAN"""
    print(f"Upscaling frames (scale={scale}x)...")
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize Real-ESRGAN
    # Model parameter: integer (0=default/x4plus, 1=x4plus-anime, etc.)
    # For 2x upscaling, we'll use the default model (0) which works well
    # Note: realesrgan-ncnn-py uses integer model IDs, not string names
    model_id = 0  # Default model (x4plus) works for both 2x and 4x
    upsampler = Realesrgan(gpuid=0, model=model_id)
    
    frames = sorted(Path(input_dir).glob('frame_*.png'))
    total = len(frames)
    
    for i, frame_path in enumerate(frames, 1):
        print(f"Processing frame {i}/{total}: {frame_path.name}")
        
        # Upscale frame
        from PIL import Image
        img = Image.open(frame_path)
        # Use process_pil for PIL Images
        output = upsampler.process_pil(img)
        
        # Save upscaled frame
        output_path = Path(output_dir) / frame_path.name
        output.save(output_path)
    
    print(f"Upscaled {total} frames")
    return True

def reassemble_video(frames_dir, output_path, fps=30):
    """Reassemble frames into video using FFmpeg"""
    print(f"Reassembling video to {output_path}...")
    
    cmd = [
        'ffmpeg', '-y',  # Overwrite output
        '-framerate', str(fps),
        '-i', f'{frames_dir}/frame_%06d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '18',  # High quality
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error reassembling video: {result.stderr}")
        return False
    
    print(f"Video saved to {output_path}")
    return True

def cleanup(temp_dirs):
    """Clean up temporary directories"""
    print("Cleaning up temporary files...")
    for dir_path in temp_dirs:
        import shutil
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 upscale_video.py <input_video> [scale] [output_video]")
        print("  scale: 2 or 4 (default: 2)")
        sys.exit(1)
    
    input_video = sys.argv[1]
    scale = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    output_video = sys.argv[3] if len(sys.argv) > 3 else input_video.replace('.mp4', f'_upscaled_{scale}x.mp4')
    
    if not os.path.exists(input_video):
        print(f"Error: Input video not found: {input_video}")
        sys.exit(1)
    
    # Create temporary directories
    base_dir = Path(input_video).parent
    frames_dir = base_dir / 'temp_frames'
    upscaled_frames_dir = base_dir / 'temp_upscaled_frames'
    
    try:
        # Step 1: Extract frames
        if not extract_frames(input_video, str(frames_dir)):
            sys.exit(1)
        
        # Step 2: Upscale frames
        if not upscale_frames(str(frames_dir), str(upscaled_frames_dir), scale):
            sys.exit(1)
        
        # Step 3: Reassemble video
        if not reassemble_video(str(upscaled_frames_dir), output_video):
            sys.exit(1)
        
        print(f"\n✅ Success! Upscaled video saved to: {output_video}")
        
    finally:
        # Cleanup
        cleanup([frames_dir, upscaled_frames_dir])

if __name__ == '__main__':
    main()

