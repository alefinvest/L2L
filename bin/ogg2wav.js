    // Start Generation Here
    const fs = require('fs');
    const path = require('path');
    const { exec } = require('child_process');

    // Define input and output directories
    const inputDir = path.resolve(__dirname, '../drush/audio.input_ogg');
    const outputDir = path.resolve(__dirname, '../drush/audio/output.wav');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read all files from input directory
    fs.readdir(inputDir, (err, files) => {
      if (err) {
        console.error('Error reading input directory:', err);
        return;
      }

      files.forEach(file => {
        const inputPath = path.join(inputDir, file);
        const fileName = path.parse(file).name;
        const timestamp = Date.now();
        const outputFileName = `${fileName}_${timestamp}.wav`;
        const outputPath = path.join(outputDir, outputFileName);

        // Convert OGG to WAV using ffmpeg
        const command = `ffmpeg -i "${inputPath}" "${outputPath}"`;

        exec(command, (err, stdout, stderr) => {
          if (err) {
            console.error(`Error converting ${file}:`, err);
            return;
          }
          console.log(`Converted ${file} to ${outputFileName}`);
        });
      });
    });
