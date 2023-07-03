declare module 'tokml' {
  type KMLData = {
    readonly type: string;
    readonly features: readonly KMLFeature[];
  };

  type KMLFeature = {
    readonly type: string;
    readonly properties: Record<string, any>;
    readonly geometry: {
      readonly type: string;
      readonly coordinates: readonly number[];
    };
  };

  export function toKML(data: KMLData): string;
}
