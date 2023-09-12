const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


async function newProjectIntro(disposable) {
    // Get the description of the project from the user.
    let project_description = await vscode.window.showInputBox({ prompt: "Enter the description of the project:" });
    if (!project_description) return

    let apiKey = await vscode.window.showInputBox({ prompt: "Enter the OpenAI API key:" });
    if (!apiKey) return

    let workspace = await vscode.window.showInputBox({ prompt: "Enter the full path of where you want to create the project:" });
    if (!workspace) return

    project_description = "Please propose an initial default file structure for a project with the following description: \"" + project_description + "\". Specify in lines where each file and folder should be, separating subfolders and files with a slash(/) and with the least amount of comments possible. Include the file extension where applicable.";

    // Send the description to Google Bard to get the file structure and basic code.
    const response = await getSuggestion(apiKey, project_description, "", "")

    // Recognize the folder/file structure in the response from Bard.
    const lines = response.split('\n');

    let regex = /`([^`]+)`/;

    // Create the files and folders based on the response from Google Bard.
    for (const line of lines) {
        if (line.trim() === '' || line.includes(" ")) continue; // skip empty lines
        const isDirectory = line.endsWith('/');

        fullpath = path.join(workspace, line);
        console.log(fullpath)
        if (isDirectory) {
            // Creates directory. Be sure to handle case if directory already exists.
            console.log("folder: " + fullpath)
            fs.mkdirSync(fullpath, { recursive: true }); // Recursive allows nested directories to be created as well
        } else {
            // Creates file. Be sure to handle case if file already exists.
            // Send the description to Google Bard to get the file structure and basic code.
            let code = await getSuggestion(apiKey, project_description, response, fullpath)
            let matchedCode = code.match(regex)[1];
            console.log("file: " + fullpath)
            fs.writeFileSync(fullpath, matchedCode, 'utf8'); // Write a blank file
        }
    }
}

async function getSuggestion(apiKey, project_description, file_structure, file) {
    if (file_structure != "") {
        message = "Consider I have a project with the following description: \"" + project_description + "\" and I have asked for chatGpt's help to create this project's basic file structure and your answer was: \"" + file_structure + "\"\n. Give me the basic code for the \"" + file + "\" file with comments. Print it out in just one code message and use backticks to denote code.";
    } else {
        message = project_description;
    }
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
            })
        });

        let data = await response.json();

        /*
        if (response.status !== 200) {
            return data.error.message;
        }
        */


        return JSON.stringify(data);

    } catch (err) {
        console.error(err);
        return '';
    }
}

vscode.commands.registerCommand("example.helloWorld", newProjectIntro);