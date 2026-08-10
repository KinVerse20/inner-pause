import type { ChakraId } from "@/lib/types";

export const chakraFrequencies = {
  root: 396,
  sacral: 417,
  "solar-plexus": 528,
  heart: 639,
  throat: 741,
  "third-eye": 852,
  crown: 963,
} as const satisfies Record<ChakraId, number>;

export const chakraSoundStyles = [
  { id: "rain", label: "Rain", fileName: "rain" },
  { id: "forest", label: "Forest", fileName: "forest" },
  { id: "piano", label: "Piano", fileName: "piano" },
  { id: "ambient", label: "Deep Ambient", fileName: "ambient" },
] as const;

export type ChakraSoundStyle = (typeof chakraSoundStyles)[number]["id"];

export function getChakraFrequency(chakraId: ChakraId) {
  return chakraFrequencies[chakraId];
}

export function getChakraFrequencyLabel(chakraId: ChakraId) {
  return `${getChakraFrequency(chakraId)} Hz`;
}

export function getChakraSoundStyleLabel(style: ChakraSoundStyle) {
  return chakraSoundStyles.find((item) => item.id === style)?.label ?? style;
}

export function getChakraAudioPath(chakraId: ChakraId, style: ChakraSoundStyle) {
  const frequency = getChakraFrequency(chakraId);
  const sound = chakraSoundStyles.find((item) => item.id === style);

  if (!sound) {
    throw new Error(`Unsupported chakra sound style: ${style}`);
  }

  return `/audio/chakras/${frequency}/${sound.fileName}_${frequency}Hz.mp3`;
}
