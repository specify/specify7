import React from 'react';

import { Button } from '../../Atoms/Button';

const GBIF_EML_GENERATOR = 'https://gbif-norway.github.io/eml-generator-js';

export function EmlEditor({
  onImport,
}: {
  readonly onImport: (xmlContent: string) => void;
}): JSX.Element {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Basic XML validation
      try {
        new DOMParser().parseFromString(content, 'text/xml');
        onImport(content);
      } catch {
        alert('Invalid XML file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button.Small onClick={() => fileInputRef.current?.click()}>
          Import EML File
        </Button.Small>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          className="hidden"
          onChange={handleFileImport}
        />
        <Button.Small
          onClick={() => window.open(GBIF_EML_GENERATOR, '_blank')}
        >
          Generate EML on GBIF
        </Button.Small>
      </div>
    </div>
  );
}
