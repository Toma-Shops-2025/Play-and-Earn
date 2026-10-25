# Push this project to your GitHub repo

Target: **https://github.com/Toma-Shops-2025/Play-and-Earn.git**

## If you cloned from Cursor / another remote

```bash
cd /path/to/Play-and-Earn
git remote add github https://github.com/Toma-Shops-2025/Play-and-Earn.git
git push -u github main
```

## If `github` remote already exists

```bash
git push github main
```

## Make GitHub the default `origin` (optional)

```bash
git remote rename origin cursor-temp
git remote add origin https://github.com/Toma-Shops-2025/Play-and-Earn.git
git push -u origin main
```

After the first push, open **Actions** on GitHub and confirm **Deploy web (GitHub Pages)** succeeds.
