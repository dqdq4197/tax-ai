let stored: string | undefined;

export function setPendingPrompt(prompt: string) {
  stored = prompt;
}

export function takePendingPrompt(): string | undefined {
  const prompt = stored;
  stored = undefined;
  return prompt;
}
