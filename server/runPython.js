const { spawn } = require('child_process');
const path = require('path');

/**
 * Utility to run a Python agent script with stdin JSON payload and return parsed stdout JSON.
 * @param {string} scriptName Name of the python script (e.g. 'scheduler_agent.py')
 * @param {object} payload JSON payload to send to stdin
 * @returns {Promise<object>} Parsed JSON output from python script
 */
function runPython(scriptName, payload = {}) {
    return new Promise((resolve, reject) => {
        // On Linux (Railway/Render) the binary is 'python3'. On Windows it's 'python'.
        const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
        const scriptPath = path.join(__dirname, '..', 'python', scriptName);
        
        const child = spawn(pythonPath, [scriptPath]);
        
        let stdoutData = '';
        let stderrData = '';
        
        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderrData += data.toString();
        });
        
        child.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python script ${scriptName} exited with code ${code}. Stderr: ${stderrData}`));
            }
            try {
                const parsed = JSON.parse(stdoutData.trim());
                resolve(parsed);
            } catch (err) {
                reject(new Error(`Failed to parse Python script output as JSON. Raw output: ${stdoutData}. Error: ${err.message}`));
            }
        });
        
        child.on('error', (err) => {
            reject(new Error(`Failed to spawn Python process: ${err.message}`));
        });
        
        // Write the JSON payload to stdin and close the input stream
        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
    });
}

module.exports = runPython;
