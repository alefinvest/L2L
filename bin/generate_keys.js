const fs = require('fs');
const openpgp = require('openpgp');

async function generateKeyPair() {
    const { generateKey } = openpgp;
    const key = await generateKey({
        type: 'rsa', // Type of the key
        rsaBits: 2048, // RSA key size (defaults to 2048 bits)
        userIDs: [{ name: 'Alef Invest', email: 'bunnag.co@gmail.com' }], // you can pass multiple user IDs
        passphrase: '12345678', // protects the private key
    });

    fs.writeFileSync('./openpgp/private_key.asc', key.privateKey);
    fs.writeFileSync('./openpgp/public_key.asc', key.publicKey);
    console.log('New key pair generated and saved.');
}

generateKeyPair().catch(console.error);