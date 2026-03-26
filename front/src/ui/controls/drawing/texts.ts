export const CONTROL_TEXTS = {
  drawing: {
    saveButton: "Save Drawing",
    customDrawingLabel: "Custom Drawing",
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
