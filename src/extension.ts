import * as vscode from 'vscode';
const Octokit = require('@octokit/rest').Octokit;

export function activate(context: vscode.ExtensionContext) {
  const showCodeSections = vscode.commands.registerCommand(
    'extension.showCodeSections',
    async () => {
      // Fetch settings from the extension's configuration
      const config = vscode.workspace.getConfiguration('githubCodeSections');
      const owner = config.get<string>('owner');
      const repo = config.get<string>('repo');
      const path = config.get<string>('path');
      const token = config.get<string>('token');

      // Validate configuration
      if (!owner || !repo || !path || !token) {
        vscode.window.showErrorMessage(
          'Please configure the GitHub repository, folder path, and token in the extension settings.'
        );
        return;
      }

      // Initialize Octokit with the token
      const octokit = new Octokit({ auth: token });

      try {
        // Fetch files from the GitHub folder
        const files = await octokit.repos.getContent({
          owner,
          repo,
          path,
        });

        const fileNames = (Array.isArray(files.data)
          ? files.data
          : []
        ).map((file: { name: any; }) => file.name);

        const selectedFile = await vscode.window.showQuickPick(fileNames, {
          placeHolder: 'Select a code section',
        });

        if (selectedFile) {
          const fileContent = await octokit.repos.getContent({
            owner,
            repo,
            path: `${path}/${selectedFile}`,
          });

          const content = Buffer.from(
            (fileContent.data as any).content,
            'base64'
          ).toString('utf-8');

          // Copy to clipboard
          await vscode.env.clipboard.writeText(content);
          vscode.window.showInformationMessage(
            `${selectedFile} content copied to clipboard!`
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(
            `Failed to fetch code sections: ${error.message}`
          );
        } else {
          vscode.window.showErrorMessage('Failed to fetch code sections: Unknown error');
        }
      }
    }
  );

  context.subscriptions.push(showCodeSections);
}

export function deactivate() {}
