export const CONTROL_TEXTS = {
  drawing: {
    saveButton: "save",
    customDrawingLabel: "custom drawing",
    tools: {
      pencilAlt: "pencil",
      eraserAlt: "eraser",
    },
  },
  userCustomSelector: {
    prompt: {
      title: "enter a filename",
      confirmButtonText: "save",
      filenameRequired: "filename required",
    },
    toast: {
      savedSuccessfully: (filename: string) => `${filename} saved successfully`,
    },
  },
} as const;
