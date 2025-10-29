# Wake Word Models Directory

This directory contains Porcupine wake word detection models (.ppn files).

## Required File

Place your custom "Hey Piatto" wake word model here:
- **File name**: `hey-piatto.ppn`
- **Source**: Download from [Picovoice Console](https://console.picovoice.ai/)

## How to Get the Model

1. Sign up at https://console.picovoice.ai/ (free)
2. Navigate to Porcupine section
3. Create a new wake word with phrase: **"Hey Piatto"**
4. Select language: **English**
5. Select platform: **Web (WASM)**
6. Train the model (takes a few seconds)
7. Download the `.ppn` file
8. Rename it to `hey-piatto.ppn`
9. Place it in this directory

## Important

- Do NOT commit `.ppn` files to git if they contain proprietary data
- The model file should be publicly accessible in the `public/` directory
- File size is typically 100-300 KB

For detailed instructions, see: `PORCUPINE_SETUP_GUIDE.md` in the project root.
