import sys
import os
from rembg import remove

def main():
    if len(sys.argv) != 3:
        print("Usage: python remover_bg.py <input_image> <output_image>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        # Validate input file
        if not os.path.exists(input_path):
            print(f"Error: File not found -> {input_path}", file=sys.stderr)
            sys.exit(1)

        # Read input image
        with open(input_path, "rb") as i:
            input_data = i.read()

        # Remove background
        output_data = remove(input_data)

        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Save output image
        with open(output_path, "wb") as o:
            o.write(output_data)

        # Success (stdout only)
        print(f"{output_path}")

        sys.exit(0)

    except Exception as e:
        print(f"Python error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
