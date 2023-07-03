declare module 'tokml' {
  interface KMLData {
    type: string;
    features: KMLFeature[];
  }

  interface KMLFeature {
    type: string;
    properties: Record<string, any>;
    geometry: {
      type: string;
      coordinates: number[];
    };
  }

  export function toKML(data: KMLData): string;
}
