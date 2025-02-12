
export function codeBlock(content: string, language?: string) {
    return `\`\`\`${language}\n${content}\`\`\``;
}
