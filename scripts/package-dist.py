#!/usr/bin/env python3
import os
import shutil
import zipfile

dist_dir = 'dist'
zip_name = 'dist.zip'
public_zip = os.path.join('public', 'dist.zip')

if not os.path.exists(dist_dir):
    print("Error: dist directory does not exist. Run vite build first.")
    exit(1)

# Clean any existing zip files inside dist first
for f in os.listdir(dist_dir):
    if f.endswith('.zip'):
        os.remove(os.path.join(dist_dir, f))

# Ensure .htaccess exists in dist
htaccess_src = os.path.join('public', '.htaccess')
htaccess_dest = os.path.join(dist_dir, '.htaccess')
if os.path.exists(htaccess_src) and not os.path.exists(htaccess_dest):
    shutil.copy(htaccess_src, htaccess_dest)

# Create zip file of dist directory contents
with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            if file.endswith('.zip'):
                continue
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, dist_dir)
            zipf.write(file_path, arcname)

size_kb = round(os.path.getsize(zip_name) / 1024, 1)
print(f"Successfully packaged {dist_dir} into {zip_name} ({size_kb} KB)")

# Clean any existing zip in dist again to guarantee 100% clean dist directory
for f in os.listdir(dist_dir):
    if f.endswith('.zip'):
        os.remove(os.path.join(dist_dir, f))

# Also copy to public directory for direct browser download
os.makedirs('public', exist_ok=True)
shutil.copy(zip_name, public_zip)
print(f"Copied {zip_name} to {public_zip}")
