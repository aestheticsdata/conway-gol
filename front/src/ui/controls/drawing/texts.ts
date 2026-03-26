export const CONTROL_TEXTS = {
  drawing: {
    saveButton: "Save Drawing",
    clearCanvasButton: "Clear canvas",
    restoreButton: "Restore",
    restoreDisabledHint: "Restore initial drawing after playing",
    savedPatternsLabel: "Saved patterns",
    brushSizeLabel: "Brush Size",
    brushShapeLabel: "Brush Shape",
    tools: {
      pencilAlt: "pencil",
      eraserAlt: "eraser",
    },
    shapes: {
      square: "Square",
      cross: "Cross",
      frame: "Hollow Square",
      circle: "Circle",
      hollowCircle: "Hollow Circle",
      diamond: "Diamond",
      hollowDiamond: "Hollow Diamond",
      hline: "H-Line",
      vline: "V-Line",
      x: "X-Shape",
    },
  },
  userCustomSelector: {
    placeholder: "select custom pattern",
    prompt: {
      title: "save custom preset",
      inputPlaceholder: "preset name",
      confirmButtonText: "save",
      cancelButtonText: "cancel",
      closeButtonLabel: "close modal",
      filenameRequired: "filename required",
    },
  },
} as const;
