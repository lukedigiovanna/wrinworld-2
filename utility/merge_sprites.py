"""
Merges the two given images using the mask.
The dimensions of the images must match.

Usage: python merge_sprites.py <mask> <img1> <img2>
"""

from PIL import Image
import sys

if len(sys.argv) < 4:
    print("Usage: python merge_sprites.py <mask> <img1> <img2>")
    exit()

_, mask_path, img1_path, img2_path = sys.argv

mask = Image.open(mask_path)
img1 = Image.open(img1_path)
img2 = Image.open(img2_path)

width, height = mask.size

width_1, height_1 = img1.size
width_2, height_2 = img2.size

if width != width_1 or width != width_2 or height != height_1 or height != height_2:
    print("All image dimensions must match exactly")
    exit()

print(f"Loaded images with dimension: {width} x {height}")

mask_pixels = mask.load()
img1_pixels = img1.load()
img2_pixels = img2.load()

output_image = Image.new("RGB", (width, height), (0, 0, 0))

for x in range(width):
    for y in range(height):
        mask_value = mask_pixels[x, y]
        if mask_value[0] == 0: # then use image 1
            value = img1_pixels[x, y]
        else:
            value = img2_pixels[x, y]
        output_image.putpixel((x, y), value)

output_image.save("out.png")

print("Finished.")
