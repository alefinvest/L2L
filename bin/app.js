const fs = require('fs');
const path = require('path');
const openpgp = require('openpgp');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

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
            const { data: encryptedData } = await openpgp.encrypt({
                message: await openpgp.createMessage({ binary: imageData }),
                publicKeys: (await openpgp.readKey({ armoredKey: publicKeyArmored })),
            });
            fs.writeFileSync(imagePath, encryptedData);
            console.log(`Encrypted: ${imagePath}`);
        }
    } else if (mode === 'decode') {
        const imageFiles = fs.readdirSync(imageDir);
        for (const imageFile of imageFiles) {
            const imagePath = path.join(imageDir, imageFile);
            const encryptedData = fs.readFileSync(imagePath, 'utf8');
            const { data: decryptedData } = await openpgp.decrypt({
                message: await openpgp.readMessage({ armoredMessage: encryptedData }),
                privateKeys: [await openpgp.decryptKey({ privateKey: await openpgp.readKey({ armoredKey: privateKeyArmored }), passphrase: passphrase })],
            });
            fs.writeFileSync(imagePath, decryptedData);
            console.log(`Decrypted: ${imagePath}`);
        }
    } else {
        console.log('Invalid mode. Please enter "encode" or "decode".');
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
        stdin.on('data', (data) => {
            if (data.toString() === '\r\n' || data.toString() === '\n') {
                stdin.setRawMode(false);
                resolve(input);
            } else if (data.toString() === '\x03') {
                process.exit();
            } else {
                input += data.toString();
                stdout.write('\x08*');
            }
        });
    });
}

main().then(() => {
    readline.close();
}).catch((error) => {
    console.error('Error:', error);
    readline.close();
});