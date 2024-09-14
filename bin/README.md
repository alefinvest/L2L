# PGP Keys

1. Create public_key and private_key files

```
cd openpgp
gpg --armor --export admini@alefinvest.xyz > public_key.asc
gpg --armor --export-secret-keys admini@alefinvest.xyz > private_key.asc
```

2. Use software to encode or decode sreenshots

```
pnpm install
node bin/app.js
```