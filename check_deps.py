import importlib.util
import sys

def check_module(module_name):
    spec = importlib.util.find_spec(module_name)
    if spec is None:
        print(f"❌ {module_name} is not installed")
        return False
    print(f"✅ {module_name} is installed")
    return True

def main():
    required_modules = [
        'pyaudio',
        'pyttsx3',
        'whisper',
        'torch',
        'pygame',
        'numpy'
    ]

    all_installed = True
    print("\nChecking Python dependencies...\n")
    
    for module in required_modules:
        if not check_module(module):
            all_installed = False
    
    print("\nInstallation instructions:")
    if not all_installed:
        print("""
Windows:
    pip install pipwin
    pipwin install pyaudio
    pip install pyttsx3 whisper torch pygame numpy

Linux:
    sudo apt-get install portaudio19-dev python3-pyaudio
    pip install pyaudio pyttsx3 whisper torch pygame numpy

macOS:
    brew install portaudio
    pip install pyaudio pyttsx3 whisper torch pygame numpy
""")
    else:
        print("All required dependencies are installed! 🎉")

    sys.exit(0 if all_installed else 1)

if __name__ == "__main__":
    main()