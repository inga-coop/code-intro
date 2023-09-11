const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


async function newProjectIntro(disposable) {
    // Get the description of the project from the user.
    let description = await vscode.window.showInputBox({ prompt: "Enter the description of the project:" });
    if (!description) return

    let apiKey = await vscode.window.showInputBox({ prompt: "Enter the OpenAI API key:" });
    if (!apiKey) return

    let workspace = await vscode.window.showInputBox({ prompt: "Enter the full path of where you want to create the project:" });
    if (!workspace) return

    description = "Please propose an initial default file structure for a project with the following description: \"" + description + "\". Specify in lines where each file and folder should be, separating subfolders and files with a slash(/). Include the file extension where applicable.";

    // Send the description to Google Bard to get the file structure and basic code.
    const response = await getSuggestion(apiKey, description)

    // Recognize the folder/file structure in the response from Bard.
    const lines = response.split('\n');

    // Create the files and folders based on the response from Google Bard.
    for (const line of lines) {
        if (line.trim() === '') continue; // skip empty lines
        const isDirectory = line.endsWith('/');
        fullpath = path.join(workspace, line);
        console.log(fullpath)
        if (isDirectory) {
            // Creates directory. Be sure to handle case if directory already exists.
            console.log("folder: " + fullpath)
            fs.mkdirSync(fullpath, { recursive: true }); // Recursive allows nested directories to be created as well
        } else {
            // Creates file. Be sure to handle case if file already exists.
            console.log("file: " + fullpath)
            fs.writeFileSync(fullpath, '', 'utf8'); // Write a blank file
        }
    }
}

async function getSuggestion(apiKey, message) {
    // API details
    const API_ENDPOINT = 'https://api.openai.com/v1/engines/gpt-3.5-turbo-16k/completions';
    const API_HEADERS = { 'content-type': 'application/json' };

    if (apiKey === '') {
        return '';
    }
    try {
        let response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                ...API_HEADERS,
                'authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: message,
                temperature: 0.5,
            })
        });

        let data = await response.json();

        if (response.status !== 200) {
            return data.error.message;
        }



        return JSON.stringify(data);

    } catch (err) {
        console.error(err);
        return '';
    }
}

vscode.commands.registerCommand("example.helloWorld", newProjectIntro);