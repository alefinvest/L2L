# PGP Keys

1. Create public_key and private_key files

```
cd openpgp
gpg --armor --export admini@alefinvest.xyz > public_key.asc
gpg --armor --export-secret-keys admini@alefinvest.xyz > private_key.asc
```

2. #TODO:Use software to encode or decode sreenshots

```
pnpm install
cd ../
node bin/app.js
```

3. TODO: Now you can use this script to decrypt the PGP message. 

Here's how to use it:

Run the script: node bin/app.js
When prompted for the mode, enter `decode_message`
The script will then attempt to decrypt the message stored in `bin/gpg_messages/01.launchpad.msg` or other files in the same directory using your private key and display the decrypted content.
Remember to keep your private key and passphrase secure, as they are used to decrypt sensitive information.

```
As an alternate method you can read the message from the terminal. Copy and paste the message from "-----BEGIN PGP MESSAGE-----" till "-----END PGP MESSAGE-----" including those two lines in a text file. From the terminal run "gpg -d opgpm.txt" excluding the quotes where "opgpm" is the name you gave the text file. You will be asked to enter your passphrase and you get the decrypted message. 
```
```
Check MTA Configuration: If the file was sent via email, check the Mail Transfer Agent (MTA) settings to ensure it is not altering the file during transmission. (solution: export origin eml file and open it using a different email client or software)
```