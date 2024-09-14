    const fs = require('fs');
    const path = require('path');
    const openpgp = require('openpgp');
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    async function decryptMessage(encryptedMessage, privateKeyArmored, passphrase) {
        try {
            if (typeof encryptedMessage !== 'string') {
                throw new Error('Encrypted message must be a string.');
            }
            const { data: decryptedData } = await openpgp.decrypt({
                message: await openpgp.readMessage({ armoredMessage: encryptedMessage }),
                decryptionKeys: [await openpgp.decryptKey({
                    privateKey: await openpgp.readKey({ armoredKey: privateKeyArmored }),
                    passphrase
                })],
            });
            return decryptedData;
        } catch (error) {
            console.error('Error decrypting message:', error.message);
            return null;
        }
    }
    
    async function main() {
        const mode = await askQuestion('Enter mode (encode/decode): ');
        const privateKeyPath = await askQuestion('Enter private key path (for decode), or press Enter for default: ');
        const publicKeyPath = await askQuestion('Enter public key path (for encode), or press Enter for default: ');
        const passphrase = await askHiddenQuestion('Enter passphrase (for decode): ');
    
        // Get the directory of the app.js file
        const appDir = path.dirname(__filename);
    
        // Provide default paths if not specified
        const defaultPrivateKeyPath = path.join(appDir, './openpgp/private_key.asc');
        const defaultPublicKeyPath = path.join(appDir, './openpgp/public_key.asc');
        const privateKeyArmored = fs.readFileSync(privateKeyPath || defaultPrivateKeyPath, 'utf8');
        const publicKeyArmored = fs.readFileSync(publicKeyPath || defaultPublicKeyPath, 'utf8');
    
        const imageDir = path.join(appDir, '../drush/screenshots');
    
        if (mode === 'encode') {
            const imageFiles = fs.readdirSync(imageDir);
            for (const imageFile of imageFiles) {
                const imagePath = path.join(imageDir, imageFile);
                const imageData = fs.readFileSync(imagePath);
                try {
                    const { data: encryptedData } = await openpgp.encrypt({
                        message: await openpgp.createMessage({ binary: imageData }),
                        encryptionKeys: [await openpgp.readKey({ armoredKey: publicKeyArmored })],
                    });
                    if (encryptedData) {
                        fs.writeFileSync(imagePath, encryptedData);
                        console.log(`Encrypted: ${imagePath}`);
                    } else {
                        console.error(`Failed to encrypt: ${imagePath} - No encrypted data returned`);
                    }
                } catch (error) {
                    console.error(`Error encrypting ${imagePath}: ${error.message}`);
                }
            }
        } else if (mode === 'decode') {
            const imageFiles = fs.readdirSync(imageDir);
            for (const imageFile of imageFiles) {
                const imagePath = path.join(imageDir, imageFile);
                const encryptedData = fs.readFileSync(imagePath, 'utf8');
                try {
                    const { data: decryptedData } = await openpgp.decrypt({
                        message: await openpgp.readMessage({ armoredMessage: encryptedData }),
                        decryptionKeys: [await openpgp.decryptKey({
                            privateKey: await openpgp.readKey({ armoredKey: privateKeyArmored }),
                            passphrase: passphrase
                        })],
                    });
                    if (decryptedData) {
                        fs.writeFileSync(imagePath, Buffer.from(decryptedData));
                        console.log(`Decrypted: ${imagePath}`);
                    } else {
                        console.error(`Failed to decrypt: ${imagePath}`);
                    }
                } catch (error) {
                    console.error(`Error decrypting ${imagePath}: ${error.message}`);
                }
            }
        } else if (mode === 'decode_message') {
            const messageDir = path.join(appDir, './gpg_messages');
            const messageFiles = fs.readdirSync(messageDir);
            console.log('Available message files:');
            messageFiles.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
            });
            const fileIndex = await askQuestion('Enter the number of the file to decode: ');
            const selectedFile = messageFiles[fileIndex - 1];
            const encryptedMessage = fs.readFileSync(path.join(messageDir, selectedFile), 'utf8');
            let decryptedMessage = await decryptMessage(encryptedMessage, privateKeyArmored, passphrase);
            if (!decryptedMessage) {
                console.log('Attempting to decode as binary...');
                const encryptedMessageBinary = fs.readFileSync(path.join(messageDir, selectedFile));
                decryptedMessage = await decryptMessage(encryptedMessageBinary, privateKeyArmored, passphrase);
            }
            if (decryptedMessage) {
                console.log('Decrypted message:');
                console.log(decryptedMessage);
            } else {
                console.log('Failed to decrypt the message.');
            }
        } else {
            console.log('Invalid mode. Please enter "encode", "decode", or "decode_message".');
        }
    }
    
    async function askQuestion(question) {
        return new Promise((resolve, reject) => {
            readline.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
    
    async function askHiddenQuestion(question) {
        return new Promise((resolve, reject) => {
            const stdin = process.stdin;
            const stdout = process.stdout;
            stdin.setRawMode(true);
            stdout.write(question);
            let input = '';
            const onData = (data) => {
                const char = data.toString();
                if (char === '\r' || char === '\n') {
                    stdin.setRawMode(false);
                    stdout.write('\n');
                    stdin.removeListener('data', onData);
                    resolve(input);
                } else if (char === '\x03') {
                    process.exit();
                } else if (char === '\x7f') { // handle backspace
                    if (input.length > 0) {
                        input = input.slice(0, -1);
                        stdout.write('\b \b');
                    }
                } else {
                    input += char;
                    stdout.write('*');
                }
            };
            stdin.on('data', onData);
        });
    }
    
    main().then(() => {
        readline.close();
    }).catch((error) => {
        console.error('Error:', error);
        readline.close();
    });