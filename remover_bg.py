import sys
from rembg import remove

def main():
    if len(sys.argv) != 3:
        print("Usage: python remover_bg.py <input_image> <output_image>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        # Read input image
        with open(input_path, "rb") as i:
            input_data = i.read()

        # Remove background
        output_data = remove(input_data)

        # Save output image
        with open(output_path, "wb") as o:
            o.write(output_data)

        # Success message (plain text, safe for servers)
        print(f"Background removed successfully. Output saved at: {output_path}")

    except FileNotFoundError:
        print(f"Error: File not found -> {input_path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Python error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
